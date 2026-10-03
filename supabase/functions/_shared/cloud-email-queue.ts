// Cloud email queue processor: claims cloud_email_jobs, renders the AR/EN template from DB data, sends through
// the existing email gateway, records the result, and polls delivery events (delivered / bounced / complained).
// A failed email never changes server or subscription state.
import { RESEND_GATEWAY_URL, emailGatewayHeaders, sendEmail } from "./email-gateway.ts";
import { type CloudEmailData, type Locale, PLATFORM, SENDERS, buildCloudEmail, fmtDate, leaksForbidden, money, renderCloudEmail } from "./cloud-email.ts";

const PERMANENT = new Set([400, 401, 403, 404, 422]);

export async function loadEmailData(db: any, job: any): Promise<CloudEmailData> {
  const l: Locale = job.locale === "en" ? "en" : "ar";
  const d: CloudEmailData = {};
  const srvId = job.server_id ?? job.data?.server_id;
  if (srvId) {
    const { data: s } = await db.from("cloud_servers").select("id,name,location_code,image_code,primary_ipv4,primary_ipv6,specs,ssh_key_id,renewal_date").eq("id", srvId).maybeSingle();
    if (s) {
      d.server_name = s.name; d.service_id = `SRV-${String(s.id).slice(0, 8).toUpperCase()}`;
      d.ipv4 = s.primary_ipv4; d.ipv6 = s.primary_ipv6;
      d.vcpu = s.specs?.vcpu; d.ram_gb = s.specs?.ram_gb; d.disk_gb = s.specs?.storage_gb;
      d.server_url = `${PLATFORM}/dashboard/cloud/servers/${s.id}`; d.billing_url = d.server_url;
      d.renewal_date = fmtDate(s.renewal_date, l);
      const [{ data: loc }, { data: img }, { data: key }] = await Promise.all([
        db.from("cloud_locations").select("name_ar,name_en").eq("code", s.location_code).maybeSingle(),
        db.from("cloud_images").select("name").eq("code", s.image_code).maybeSingle(),
        s.ssh_key_id ? db.from("cloud_ssh_keys").select("name").eq("id", s.ssh_key_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      d.location = loc ? (l === "ar" ? loc.name_ar : loc.name_en) : undefined; d.os = img?.name; d.ssh_key_name = key?.name ?? null;
    }
  }
  if (job.subscription_id) {
    const { data: sub } = await db.from("cloud_subscriptions").select("next_renewal_at,grace_ends_at,termination_scheduled_at,next_retry_at,renewal_total_minor,renewal_subtotal_minor,renewal_vat_minor,status").eq("id", job.subscription_id).maybeSingle();
    if (sub) {
      d.renewal_date = fmtDate(sub.next_renewal_at, l) ?? d.renewal_date;
      d.total = money(job.data?.amount_minor ?? sub.renewal_total_minor, l); d.amount_due = d.total;
      d.subtotal = money(sub.renewal_subtotal_minor, l); d.vat = money(sub.renewal_vat_minor, l);
      d.due_date = fmtDate(sub.grace_ends_at ?? sub.next_retry_at ?? sub.next_renewal_at, l);
      d.deletion_date = fmtDate(sub.termination_scheduled_at, l);
      const { data: inv } = await db.from("cloud_renewal_invoices").select("invoice_number,subtotal_minor,vat_minor,total_minor,status,created_at").eq("subscription_id", job.subscription_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (inv && ["renewal_successful", "payment_received", "invoice"].includes(job.template)) {
        d.invoice_number = inv.invoice_number; d.subtotal = money(inv.subtotal_minor, l); d.vat = money(inv.vat_minor, l); d.total = money(inv.total_minor, l);
        d.payment_status = inv.status === "paid" ? (l === "ar" ? "مدفوع" : "Paid") : inv.status;
      }
    }
  }
  if (job.order_id && ["payment_receipt", "refund"].includes(job.template)) {
    const { data: o } = await db.from("cloud_orders").select("transaction_reference,subtotal,vat_amount,total,created_at").eq("id", job.order_id).maybeSingle();
    if (o) {
      d.invoice_number = o.transaction_reference; d.subtotal = money(Math.round(Number(o.subtotal) * 100), l);
      d.vat = money(Math.round(Number(o.vat_amount) * 100), l); d.total = money(Math.round(Number(o.total) * 100), l);
      d.payment_status = job.template === "refund" ? (l === "ar" ? "مسترد" : "Refunded") : (l === "ar" ? "مدفوع" : "Paid"); d.due_date = fmtDate(o.created_at, l);
    }
  }
  if (job.data?.preview) Object.assign(d, job.data.preview); // admin test emails only
  if (job.data?.maintenance) d.maintenance = job.data.maintenance;
  return d;
}

export async function renderJob(db: any, job: any) {
  const l: Locale = job.locale === "en" ? "en" : "ar";
  const built = buildCloudEmail(job.template, l, await loadEmailData(db, job));
  if (!built) return null;
  const html = renderCloudEmail(built, l, job.sender);
  const sender = SENDERS[job.sender as "cloud" | "billing"];
  return { from: sender[l], reply_to: sender.reply, subject: built.subject, html };
}

export async function processEmailQueue(db: any, limit = 20) {
  const { data: jobs, error } = await db.rpc("cloud_claim_email_jobs", { p_limit: limit });
  if (error) throw new Error(error.message);
  let ok = 0, fail = 0;
  for (const job of jobs ?? []) {
    try {
      const m = await renderJob(db, job);
      if (!m) { await db.rpc("cloud_finish_email_job", { p_id: job.id, p_ok: false, p_error: "unknown_template", p_permanent: true }); fail++; continue; }
      if (leaksForbidden(m.html, m.subject)) { await db.rpc("cloud_finish_email_job", { p_id: job.id, p_ok: false, p_error: "content_blocked", p_permanent: true }); fail++; continue; }
      const r = await sendEmail({ from: m.from, to: job.recipient, subject: m.subject, html: m.html, reply_to: m.reply_to, tags: [{ name: "category", value: job.category }] });
      if (r.error) { await db.rpc("cloud_finish_email_job", { p_id: job.id, p_ok: false, p_error: `send_${r.error.statusCode ?? "error"}`, p_permanent: PERMANENT.has(r.error.statusCode ?? 0) }); fail++; }
      else { await db.rpc("cloud_finish_email_job", { p_id: job.id, p_ok: true, p_message_id: r.data?.id ?? null }); ok++; }
    } catch (e) {
      await db.rpc("cloud_finish_email_job", { p_id: job.id, p_ok: false, p_error: String((e as Error).message).slice(0, 120) }); fail++;
    }
  }
  return { scanned: jobs?.length ?? 0, processed: ok + fail, ok, fail };
}

/** Delivery events from the provider: delivered / bounced / complained. Bounces never trigger a resend. */
export async function pollDelivery(db: any, limit = 30) {
  const since = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: jobs } = await db.from("cloud_email_jobs").select("id,provider_message_id,template,user_id").eq("status", "sent").is("delivery_status", null)
    .not("provider_message_id", "is", null).gte("sent_at", since).order("sent_at").limit(limit);
  let updated = 0;
  for (const j of jobs ?? []) {
    try {
      const res = await fetch(`${RESEND_GATEWAY_URL}/${encodeURIComponent(j.provider_message_id)}`, { headers: emailGatewayHeaders(), signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const ev = String((await res.json())?.last_event ?? "");
      const st = ev === "delivered" ? "delivered" : ev === "bounced" ? "bounced" : ev === "complained" ? "complained" : ev === "delivery_delayed" ? "delayed" : null;
      await db.from("cloud_email_jobs").update({ delivery_checked_at: new Date().toISOString(), ...(st && st !== "delayed" ? { delivery_status: st } : {}) }).eq("id", j.id);
      if (st === "bounced" || st === "complained") {
        updated++;
        await db.from("cloud_admin_alerts").upsert({ kind: "email_address_invalid", severity: "warning", message: st === "bounced" ? "Customer email bounced" : "Customer marked email as spam",
          dedupe_key: `email_${st}:${j.id}`, details: { email_job: j.id, template: j.template, user_id: j.user_id } }, { onConflict: "dedupe_key", ignoreDuplicates: true });
      } else if (st) updated++;
    } catch { /* next tick */ }
  }
  return { scanned: jobs?.length ?? 0, processed: updated, ok: updated, fail: 0 };
}
