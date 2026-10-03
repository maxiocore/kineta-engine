// Cloud Services email templates (Arabic RTL / English LTR) and sender routing.
// Operational mail comes from cloud@, money mail from billing@. Never include provider names, provider IDs,
// passwords, keys, tokens or raw errors. Every link goes to the authenticated platform (no privileged action links).
import { escapeEmailHtml as e } from "./email-template.ts";

export type Locale = "ar" | "en";
export type Tone = "active" | "pending" | "suspended" | "action";
export const PLATFORM = "https://ash-holding.sa";

export const SENDERS = {
  cloud: { ar: "ASH HOLDING | الخوادم والسحابة <cloud@ash-holding.sa>", en: "ASH HOLDING | Cloud Services <cloud@ash-holding.sa>", reply: "cloud@ash-holding.sa" },
  billing: { ar: "ASH HOLDING | الشؤون المالية <billing@ash-holding.sa>", en: "ASH HOLDING | Billing <billing@ash-holding.sa>", reply: "billing@ash-holding.sa" },
} as const;

export interface CloudEmailData {
  server_name?: string; service_id?: string; location?: string; os?: string; vcpu?: number | string; ram_gb?: number | string; disk_gb?: number | string;
  ipv4?: string | null; ipv6?: string | null; ssh_key_name?: string | null; renewal_date?: string | null; due_date?: string | null; deletion_date?: string | null;
  invoice_number?: string | null; subtotal?: string | null; vat?: string | null; total?: string | null; amount_due?: string | null; payment_status?: string | null;
  server_url?: string; billing_url?: string;
  maintenance?: { service?: string; start?: string; duration?: string | null; impact?: string } | null;
}

const T = {
  status: { active: ["نشط", "Active"], pending: ["قيد التجهيز", "Pending"], suspended: ["معلّق", "Suspended"], action: ["إجراء مطلوب", "Action required"] },
  colors: { active: ["#e9f7f2", "#14866d"], pending: ["#eaf4fc", "#1677c8"], suspended: ["#fff0f0", "#c24141"], action: ["#fff8e7", "#b7791f"] },
} as const;
const L = (l: Locale, ar: string, en: string) => (l === "ar" ? ar : en);

type Row = [string, string | null | undefined, string?]; // label, value, kind(ltr)
interface Built { subject: string; preheader: string; title: string; tone: Tone; intro: string[]; rows: Row[]; cta?: { label: string; url: string }; note?: string }

export function money(minor: number | null | undefined, l: Locale) {
  if (minor == null || !Number.isFinite(Number(minor))) return null;
  const v = (Number(minor) / 100).toFixed(2);
  return l === "ar" ? `${v} ر.س` : `${v} SAR`;
}
export function fmtDate(iso: string | null | undefined, l: Locale) {
  if (!iso) return null;
  const d = new Date(iso); if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(l === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh" }).format(d);
}

function serverRows(l: Locale, d: CloudEmailData): Row[] {
  return [[L(l, "اسم الخادم", "Server name"), d.server_name, "ltr"], [L(l, "رقم الخدمة", "Service ID"), d.service_id, "ltr"]];
}

/** Builds subject + content for one template. Unknown template -> null (caller marks the job failed). */
export function buildCloudEmail(template: string, l: Locale, d: CloudEmailData): Built | null {
  const srv = d.server_name ?? L(l, "خادمك", "your server");
  const manage = { label: L(l, "إدارة الخادم", "Manage server"), url: d.server_url ?? `${PLATFORM}/dashboard/cloud` };
  const pay = { label: L(l, "سداد وإعادة تفعيل الخدمة", "Pay and reactivate service"), url: d.billing_url ?? `${PLATFORM}/dashboard/cloud` };
  const payNow = { label: L(l, "سداد المستحقات", "Pay now"), url: d.billing_url ?? `${PLATFORM}/dashboard/cloud` };
  const billRows = (): Row[] => [
    [L(l, "رقم الفاتورة", "Invoice number"), d.invoice_number, "ltr"], ...serverRows(l, d),
    [L(l, "المبلغ قبل الضريبة", "Subtotal"), d.subtotal, "ltr"], [L(l, "ضريبة القيمة المضافة", "VAT"), d.vat, "ltr"],
    [L(l, "الإجمالي", "Total"), d.total, "ltr"], [L(l, "حالة الدفع", "Payment status"), d.payment_status], [L(l, "تاريخ الاستحقاق", "Due date"), d.due_date, "ltr"],
  ];
  switch (template) {
    case "provisioning_started": return {
      subject: L(l, "جاري تجهيز خادمك السحابي", "Your cloud server is being prepared"), title: L(l, "جاري تجهيز خادمك السحابي", "Your cloud server is being prepared"),
      preheader: L(l, "تم استلام طلبك والدفع بنجاح وبدأ تجهيز الخادم.", "We received your order and payment and started preparing your server."), tone: "pending",
      intro: [L(l, "تم استلام الطلب والدفع بنجاح وبدأ تجهيز الخادم. سنرسل لك رسالة أخرى فور اكتمال التجهيز والتحقق من جاهزية الخادم.", "Your order and payment were received successfully and we have started preparing your server. We will email you again as soon as setup is complete and the server has passed its readiness checks.")],
      rows: [...serverRows(l, d), [L(l, "الموقع", "Location"), d.location], [L(l, "نظام التشغيل", "Operating system"), d.os, "ltr"]], cta: manage };
    case "server_ready": return {
      subject: L(l, `خادمك السحابي جاهز للاستخدام — ${srv}`, `Your cloud server is ready — ${srv}`), title: L(l, "خادمك السحابي جاهز للاستخدام", "Your cloud server is ready"),
      preheader: L(l, "تم تجهيز خادمك بنجاح وأصبح جاهزاً للاستخدام.", "Your server has been set up and is ready to use."), tone: "active",
      intro: [L(l, "تم تجهيز خادمك السحابي بنجاح وأصبح جاهزاً للاستخدام.", "Your cloud server has been set up successfully and is ready to use.")],
      rows: [...serverRows(l, d), [L(l, "الحالة", "Status"), L(l, "نشط", "Active")], [L(l, "الموقع", "Location"), d.location], [L(l, "نظام التشغيل", "Operating system"), d.os, "ltr"],
        [L(l, "المواصفات", "Specs"), d.vcpu ? `${d.vcpu} vCPU · ${d.ram_gb} GB RAM · ${d.disk_gb} GB NVMe` : null, "ltr"],
        ["IPv4", d.ipv4, "ltr"], ["IPv6", d.ipv6, "ltr"], [L(l, "اسم مستخدم SSH", "SSH username"), "root", "ltr"],
        [L(l, "مفتاح SSH", "SSH key"), d.ssh_key_name ? L(l, `تم استخدام المفتاح المحدد أثناء الطلب (${d.ssh_key_name})`, `The key selected during your order was used (${d.ssh_key_name})`) : L(l, "تم استخدام مفتاح SSH المحدد أثناء الطلب", "The SSH key selected during your order was used")],
        [L(l, "تاريخ التجديد", "Renewal date"), d.renewal_date, "ltr"]],
      cta: manage, note: L(l, "الدخول إلى الخادم يتم بمفتاح SSH الخاص بك فقط. لن نطلب منك كلمة مرور أو مفتاحاً خاصاً عبر البريد أبداً.", "Server access uses your own SSH key only. We will never ask you for a password or private key by email.") };
    case "provisioning_delayed": return {
      subject: L(l, "تحديث حول تجهيز خادمك", "An update on your server setup"), title: L(l, "تحديث حول تجهيز خادمك", "An update on your server setup"),
      preheader: L(l, "يستغرق تجهيز خادمك وقتاً أطول من المعتاد.", "Your server setup is taking longer than usual."), tone: "pending",
      intro: [L(l, "يستغرق تجهيز خادمك وقتاً أطول من المعتاد، ويجري التحقق منه حالياً من قبل فريقنا.", "Your server setup is taking longer than usual and our team is currently checking it."),
        L(l, "لا تحتاج إلى إعادة الطلب أو الدفع مرة أخرى. سنبلغك فور اكتمال التجهيز.", "You do not need to order or pay again. We will let you know as soon as setup is complete.")],
      rows: serverRows(l, d), cta: manage };
    case "payment_receipt": case "payment_received": return {
      subject: L(l, `تأكيد الدفع — ${srv}`, `Payment confirmation — ${srv}`), title: L(l, "تم استلام دفعتك بنجاح", "Your payment was received"),
      preheader: L(l, "إيصال دفع خدمة الخادم السحابي.", "Cloud server payment receipt."), tone: "active",
      intro: [L(l, "شكراً لك. تم استلام الدفعة التالية وتسجيلها في حسابك.", "Thank you. The following payment was received and recorded in your account.")],
      rows: billRows(), cta: { label: L(l, "عرض الفواتير", "View billing"), url: d.billing_url ?? `${PLATFORM}/dashboard/cloud` } };
    case "invoice": return {
      subject: L(l, `فاتورة جديدة — ${srv}`, `New invoice — ${srv}`), title: L(l, "فاتورة جديدة", "New invoice"), preheader: L(l, "فاتورة خدمة الخادم السحابي.", "Cloud server invoice."), tone: "pending",
      intro: [L(l, "صدرت فاتورة جديدة لخدمتك السحابية.", "A new invoice was issued for your cloud service.")], rows: billRows(), cta: payNow };
    case "renewal_reminder": return {
      subject: L(l, `تذكير بتجديد خادمك — ${srv}`, `Server renewal reminder — ${srv}`), title: L(l, "تذكير بموعد التجديد", "Upcoming renewal"),
      preheader: L(l, "يقترب موعد تجديد خدمتك السحابية.", "Your cloud service renewal is coming up."), tone: "pending",
      intro: [L(l, "يقترب موعد تجديد خدمتك. سيتم خصم مبلغ التجديد من رصيد محفظتك تلقائياً في تاريخ التجديد، يرجى التأكد من كفاية الرصيد.", "Your service renewal is coming up. The renewal amount will be charged to your wallet automatically on the renewal date; please make sure your balance is sufficient.")],
      rows: [...serverRows(l, d), [L(l, "تاريخ التجديد", "Renewal date"), d.renewal_date, "ltr"], [L(l, "مبلغ التجديد (شامل الضريبة)", "Renewal amount (incl. VAT)"), d.total, "ltr"]], cta: payNow };
    case "renewal_successful": return {
      subject: L(l, `تم تجديد خادمك — ${srv}`, `Server renewed — ${srv}`), title: L(l, "تم التجديد بنجاح", "Renewal successful"),
      preheader: L(l, "تم تجديد خدمتك السحابية.", "Your cloud service was renewed."), tone: "active",
      intro: [L(l, "تم تجديد خدمتك بنجاح لفترة جديدة.", "Your service was renewed successfully for a new period.")],
      rows: [...billRows(), [L(l, "التجديد القادم", "Next renewal"), d.renewal_date, "ltr"]], cta: manage };
    case "renewal_failed": return {
      subject: L(l, `تعذر تجديد خادمك — ${srv}`, `Server renewal failed — ${srv}`), title: L(l, "تعذر إتمام التجديد", "Renewal could not be completed"),
      preheader: L(l, "لم يكتمل تجديد خدمتك السحابية.", "Your cloud service renewal was not completed."), tone: "action",
      intro: [L(l, "تعذر خصم مبلغ التجديد من محفظتك. خادمك يعمل حالياً، وسنعيد المحاولة تلقائياً. يرجى شحن الرصيد لتجنب تعليق الخدمة.", "We could not charge the renewal amount to your wallet. Your server is still running and we will retry automatically. Please top up your balance to avoid suspension.")],
      rows: [...serverRows(l, d), [L(l, "المبلغ المستحق", "Amount due"), d.amount_due ?? d.total, "ltr"], [L(l, "آخر موعد للسداد", "Payment deadline"), d.due_date, "ltr"]], cta: payNow };
    case "grace_started": return {
      subject: L(l, `بدأت مهلة السداد — ${srv}`, `Grace period started — ${srv}`), title: L(l, "بدأت مهلة السداد", "Grace period started"),
      preheader: L(l, "لديك مهلة لسداد مبلغ التجديد.", "You have a grace period to pay your renewal."), tone: "action",
      intro: [L(l, "لم يكتمل تجديد خدمتك، وبدأت مهلة السداد. يبقى خادمك يعمل خلال المهلة.", "Your renewal was not completed and the grace period has started. Your server keeps running during the grace period.")],
      rows: [...serverRows(l, d), [L(l, "المبلغ المستحق", "Amount due"), d.amount_due ?? d.total, "ltr"], [L(l, "نهاية المهلة", "Grace period ends"), d.due_date, "ltr"]], cta: payNow };
    case "suspension_warning": return {
      subject: L(l, `تنبيه قبل تعليق الخدمة — ${srv}`, `Notice before suspension — ${srv}`), title: L(l, "تنبيه قبل تعليق الخدمة", "Notice before suspension"),
      preheader: L(l, "يرجى سداد المستحقات لتجنب تعليق الخادم.", "Please pay to avoid server suspension."), tone: "action",
      intro: [L(l, "لم يتم سداد مبلغ التجديد حتى الآن. إذا لم يكتمل السداد قبل الموعد التالي سيتم إيقاف تشغيل الخادم مؤقتاً.", "The renewal amount has not been paid yet. If payment is not completed by the date below, the server will be powered off temporarily."),
        L(l, "التعليق لا يحذف بياناتك؛ يمكنك إعادة التفعيل بعد السداد.", "Suspension does not delete your data; you can reactivate after payment.")],
      rows: [...serverRows(l, d), [L(l, "المبلغ المستحق", "Amount due"), d.amount_due ?? d.total, "ltr"], [L(l, "آخر موعد", "Deadline"), d.due_date, "ltr"]], cta: payNow };
    case "service_suspended": return {
      subject: L(l, `تم تعليق خادمك مؤقتاً — ${srv}`, `Your server is temporarily suspended — ${srv}`), title: L(l, "تم تعليق الخدمة مؤقتاً", "Service temporarily suspended"),
      preheader: L(l, "تم إيقاف تشغيل الخادم مؤقتاً بسبب عدم اكتمال التجديد.", "The server was powered off because the renewal was not completed."), tone: "suspended",
      intro: [L(l, "تم تعليق تشغيل الخادم مؤقتاً بسبب عدم اكتمال التجديد.", "Your server has been temporarily suspended because the renewal was not completed.")],
      rows: [...serverRows(l, d), [L(l, "الخادم", "Server"), L(l, "متوقف عن التشغيل", "Powered off")], [L(l, "البيانات", "Data"), L(l, "لم يتم حذفها", "Not deleted")],
        [L(l, "المبلغ المستحق", "Amount due"), d.amount_due ?? d.total, "ltr"], [L(l, "موعد الحذف المجدول", "Scheduled deletion date"), d.deletion_date, "ltr"]], cta: pay };
    case "service_reactivated": return {
      subject: L(l, `تمت إعادة تفعيل خادمك — ${srv}`, `Your server has been reactivated — ${srv}`), title: L(l, "تمت إعادة تفعيل خادمك", "Your server has been reactivated"),
      preheader: L(l, "خادمك يعمل الآن من جديد.", "Your server is running again."), tone: "active",
      intro: [L(l, "تم استلام السداد وإعادة تشغيل الخادم والتحقق من أنه يعمل.", "Your payment was received, the server was powered on, and we verified that it is running.")],
      rows: [...serverRows(l, d), [L(l, "الحالة", "Status"), L(l, "نشط", "Active")], [L(l, "التجديد القادم", "Next renewal"), d.renewal_date, "ltr"]], cta: manage };
    case "termination_warning": case "final_termination_warning": return {
      subject: L(l, "تنبيه نهائي قبل حذف الخادم", "Final notice before server deletion"), title: L(l, "تنبيه نهائي قبل حذف الخادم", "Final notice before server deletion"),
      preheader: L(l, "يرجى السداد قبل تاريخ الحذف المجدول.", "Please pay before the scheduled deletion date."), tone: "action",
      intro: [L(l, "ما زال مبلغ التجديد غير مسدد. إذا لم يتم السداد قبل التاريخ المحدد سيتم حذف الخادم.", "The renewal amount is still unpaid. If it is not paid before the date below, the server will be deleted."),
        L(l, "بعد تاريخ الحذف قد لا يمكن استعادة بيانات الخادم.", "After the deletion date, the server data may not be recoverable.")],
      rows: [...serverRows(l, d), [L(l, "المبلغ المستحق", "Outstanding amount"), d.amount_due ?? d.total, "ltr"], [L(l, "تاريخ الحذف المجدول", "Scheduled deletion date"), d.deletion_date, "ltr"]], cta: pay };
    case "service_terminated": return {
      subject: L(l, `تم إنهاء الخدمة — ${srv}`, `Service terminated — ${srv}`), title: L(l, "تم إنهاء الخدمة", "Service terminated"),
      preheader: L(l, "تم إنهاء خدمة الخادم السحابي.", "Your cloud server service has ended."), tone: "suspended",
      intro: [L(l, "تم إنهاء خدمة الخادم وحذفه. شكراً لاستخدامك خدماتنا.", "Your server service has ended and the server was deleted. Thank you for using our services.")], rows: serverRows(l, d) };
    case "cancellation_scheduled": return {
      subject: L(l, `تمت جدولة إلغاء الخدمة — ${srv}`, `Cancellation scheduled — ${srv}`), title: L(l, "تمت جدولة الإلغاء", "Cancellation scheduled"),
      preheader: L(l, "ستتوقف خدمتك في التاريخ المحدد.", "Your service will end on the scheduled date."), tone: "pending",
      intro: [L(l, "تمت جدولة إلغاء خدمتك. يمكنك التراجع عن الإلغاء من صفحة الخادم قبل التاريخ المحدد.", "Your service cancellation is scheduled. You can undo it from the server page before the date below.")],
      rows: [...serverRows(l, d), [L(l, "تاريخ الإيقاف", "End date"), d.deletion_date, "ltr"]], cta: manage };
    case "refund": return {
      subject: L(l, `تأكيد الاسترداد — ${srv}`, `Refund confirmation — ${srv}`), title: L(l, "تم استرداد المبلغ", "Refund issued"),
      preheader: L(l, "تمت إعادة المبلغ إلى محفظتك.", "The amount was returned to your wallet."), tone: "active",
      intro: [L(l, "تمت إعادة المبلغ التالي إلى رصيد محفظتك.", "The following amount was returned to your wallet balance.")], rows: billRows() };
    case "maintenance": {
      const m = d.maintenance ?? {};
      return {
        subject: L(l, "صيانة مجدولة للبنية السحابية", "Scheduled cloud infrastructure maintenance"), title: L(l, "صيانة مجدولة", "Scheduled maintenance"),
        preheader: L(l, "إشعار صيانة مجدولة لخدماتك السحابية.", "Scheduled maintenance notice for your cloud services."), tone: "pending",
        intro: [L(l, "نود إبلاغك بأعمال صيانة مجدولة قد تؤثر على خدمتك.", "We would like to inform you of scheduled maintenance that may affect your service.")],
        rows: [[L(l, "الخدمة المتأثرة", "Affected service"), m.service ?? d.server_name, "ltr"], [L(l, "وقت البدء", "Start time"), m.start, "ltr"],
          [L(l, "المدة المتوقعة", "Expected duration"), m.duration ?? L(l, "سيتم الإبلاغ عند التأكيد", "To be confirmed")], [L(l, "التأثير", "Impact"), m.impact]],
        cta: manage };
    }
  }
  return null;
}

export function renderCloudEmail(b: Built, l: Locale, sender: "cloud" | "billing") {
  const rtl = l === "ar"; const dir = rtl ? "rtl" : "ltr"; const align = rtl ? "right" : "left";
  const [soft, accent] = T.colors[b.tone]; const status = T.status[b.tone][rtl ? 0 : 1];
  const category = sender === "billing" ? L(l, "الشؤون المالية · الخوادم والسحابة", "Billing · Cloud Services") : L(l, "الخوادم والسحابة", "Cloud Services");
  const font = rtl ? "'IBM Plex Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif" : "'Segoe UI',Helvetica,Arial,sans-serif";
  const rows = b.rows.filter((r) => r[1] != null && String(r[1]).trim() !== "");
  const table = rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border:1px solid #dbe4ea;border-radius:10px;border-collapse:separate;">${rows.map((r, i) =>
    `<tr><td style="width:40%;padding:12px 16px;${i ? "border-top:1px solid #e6edf1;" : ""}background:#f7f9fb;color:#64748b;font-size:13px;text-align:${align};">${e(r[0])}</td><td style="padding:12px 16px;${i ? "border-top:1px solid #e6edf1;" : ""}color:#102a43;font-size:14px;font-weight:600;text-align:${align};overflow-wrap:anywhere;word-break:normal;"${r[2] === "ltr" ? ` dir="ltr"` : ""}>${e(r[1])}</td></tr>`).join("")}</table>` : "";
  const cta = b.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 6px;"><tr><td style="background:#0f9ea8;border-radius:8px;"><a href="${e(b.cta.url)}" style="display:inline-block;padding:14px 30px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${e(b.cta.label)}</a></td></tr></table><p style="margin:8px 0 0;text-align:center;color:#94a3b8;font-size:11px;">${e(L(l, "يتطلب الرابط تسجيل الدخول إلى حسابك.", "This link requires you to sign in to your account."))}</p>` : "";
  const note = b.note ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;background:#f4f8fa;border-${rtl ? "right" : "left"}:4px solid #0f9ea8;border-radius:6px;"><tr><td style="padding:14px 16px;color:#334155;font-size:12px;line-height:1.8;text-align:${align};">${e(b.note)}</td></tr></table>` : "";
  const reply = SENDERS[sender].reply;
  return `<!doctype html><html lang="${l}" dir="${dir}" data-ash-email="v2"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${e(b.subject)}</title></head>
<body style="margin:0;padding:0;background:#f2f6f8;font-family:${font};color:#102a43;" dir="${dir}"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(b.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f6f8;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;" dir="${dir}">
<tr><td style="background:#083344;border-radius:14px 14px 0 0;padding:22px 26px;text-align:${align};"><span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:1px;" dir="ltr">ASH <span style="color:#2dd4bf;">HOLDING</span></span><br><span style="color:#b8dfe1;font-size:12px;">${e(category)}</span></td></tr>
<tr><td style="padding:28px 26px 8px;text-align:${align};"><span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${soft};color:${accent};border:1px solid ${accent};font-size:12px;font-weight:700;">${e(status)}</span>
<h1 style="margin:16px 0 12px;font-size:22px;line-height:1.5;color:#083344;">${e(b.title)}</h1>
${b.intro.map((p) => `<p style="margin:0 0 12px;color:#43546a;font-size:15px;line-height:1.9;">${e(p)}</p>`).join("")}
${table}${cta}${note}</td></tr>
<tr><td style="padding:22px 26px 26px;border-top:1px solid #eef2f6;text-align:${align};color:#64748b;font-size:12px;line-height:1.8;">
${e(L(l, "للاستفسار يمكنك الرد على هذه الرسالة أو مراسلتنا على", "For questions, reply to this email or contact"))} <a href="mailto:${reply}" style="color:#0f9ea8;" dir="ltr">${reply}</a><br>
${e(L(l, "هذه رسالة خدمية مرتبطة بخدمتك السحابية. التفاصيل المعتمدة هي الظاهرة داخل حسابك على المنصة.", "This is a service message about your cloud service. Your account on the platform shows the authoritative details."))}<br>
<strong style="color:#083344;">ASH HOLDING</strong> · <a href="${PLATFORM}" style="color:#0f9ea8;" dir="ltr">ash-holding.sa</a> · <a href="${PLATFORM}/privacy-policy" style="color:#64748b;">${e(L(l, "الخصوصية", "Privacy"))}</a> · <a href="${PLATFORM}/terms-of-service" style="color:#64748b;">${e(L(l, "الشروط", "Terms"))}</a>
</td></tr></table></td></tr></table></body></html>`;
}

/** Defence in depth: refuse to send anything that mentions infrastructure/payment processors or looks like a secret. */
export function leaksForbidden(html: string, subject: string) {
  const s = (subject + " " + html).toLowerCase();
  return /hetzner|moyasar|paylink|api[_ -]?key|-----begin|stack trace|postgres|supabase|sk_live_|pk_live_/.test(s);
}
