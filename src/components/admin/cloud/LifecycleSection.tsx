import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/components/cloud/cloudShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type T = (ar: string, en: string) => string;
const q = (key: string, fn: () => Promise<any>) => ({ queryKey: ["cloud-lifecycle", key], queryFn: fn });

const Table = ({ rows, cols, empty }: { rows: any[]; cols: [string, (r: any) => React.ReactNode][]; empty: string }) =>
  rows.length === 0 ? <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-6 text-center">{empty}</p> : (
    <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-muted/50"><tr>{cols.map(([h]) => <th key={h} className="p-2 text-start font-medium">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id ?? r.invoice_id} className="border-t">{cols.map(([h, f]) => <td key={h} className="p-2 align-top">{f(r)}</td>)}</tr>)}</tbody></table></div>);

const dt = (d: string | null) => (d ? new Date(d).toLocaleString() : "—");

export function LifecycleHealth({ t }: { t: T }) {
  const { data } = useQuery(q("health", async () => {
    const [jobs, subs, alerts, findings, sw] = await Promise.all([
      db.from("cloud_jobs").select("status,job_type"), db.from("cloud_subscriptions").select("status").eq("is_simulation", false),
      db.from("cloud_admin_alerts").select("*").is("acknowledged_at", null).order("created_at", { ascending: false }).limit(50),
      db.from("cloud_reconciliation_findings").select("id").eq("status", "open"),
      supabase.functions.invoke("cloud-lifecycle-worker", { body: { action: "status" } }),
    ]);
    return { jobs: jobs.data ?? [], subs: subs.data ?? [], alerts: alerts.data ?? [], findings: findings.data ?? [], switches: sw.data?.switches ?? {} };
  }));
  const qc = useQueryClient();
  if (!data) return <Loader2 className="animate-spin" />;
  const c = (arr: any[], f: (x: any) => boolean) => arr.filter(f).length;
  const tiles: [string, number][] = [
    [t("عمق الطابور", "Queue depth"), c(data.jobs, (j) => j.status === "queued")],
    [t("مهام فاشلة / مراجعة", "Failed / review jobs"), c(data.jobs, (j) => ["failed", "manual_review"].includes(j.status))],
    [t("نجاح Provisioning", "Provisioning succeeded"), c(data.jobs, (j) => j.job_type === "provisioning" && j.status === "succeeded")],
    [t("فشل Provisioning", "Provisioning failed"), c(data.jobs, (j) => j.job_type === "provisioning" && j.status === "manual_review")],
    [t("فشل التجديد (مهلة)", "Renewal failures (grace)"), c(data.subs, (s) => ["payment_failed", "grace_period"].includes(s.status))],
    [t("خدمات معلقة", "Suspended services"), c(data.subs, (s) => s.status === "suspended")],
    [t("بانتظار الإنهاء", "Termination pending"), c(data.subs, (s) => s.status === "termination_pending")],
    [t("فروقات المطابقة", "Reconciliation mismatches"), data.findings.length],
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">{Object.entries(data.switches).map(([k, v]) => <Badge key={k} variant={v ? "destructive" : "outline"} className="font-mono text-[11px]">{k}={String(v)}</Badge>)}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{tiles.map(([k, v]) => <div key={k} className="rounded-xl border bg-card p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-2xl font-bold">{v}</div></div>)}</div>
      <h3 className="font-semibold">{t("تنبيهات الإدارة", "Admin alerts")}</h3>
      <Table rows={data.alerts} empty={t("لا توجد تنبيهات", "No alerts")} cols={[
        [t("النوع", "Kind"), (r) => r.kind], [t("الخطورة", "Severity"), (r) => <Badge variant={r.severity === "critical" ? "destructive" : "outline"}>{r.severity}</Badge>],
        [t("الرسالة", "Message"), (r) => r.message], [t("الوقت", "Time"), (r) => dt(r.created_at)],
        ["", (r) => <Button size="sm" variant="outline" onClick={async () => { await db.from("cloud_admin_alerts").update({ acknowledged_at: new Date().toISOString() }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["cloud-lifecycle"] }); }}>{t("تم", "Ack")}</Button>]]} />
    </div>
  );
}

export function SubscriptionsByStatus({ t, statuses, withProtect }: { t: T; statuses: string[]; withProtect?: boolean }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(q("subs:" + statuses.join(","), async () =>
    (await db.from("cloud_subscriptions").select("*").in("status", statuses).eq("is_simulation", false).order("updated_at", { ascending: false }).limit(500)).data ?? []));
  return <Table rows={data} empty={t("لا توجد بيانات", "No data")} cols={[
    ["ID", (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>], [t("الحالة", "Status"), (r) => <Badge variant="outline">{r.status}</Badge>],
    [t("التجديد القادم", "Next renewal"), (r) => dt(r.next_renewal_at)], [t("المبلغ", "Amount"), (r) => r.renewal_total_minor != null ? (r.renewal_total_minor / 100).toFixed(2) + " SAR" : "—"],
    [t("المحاولات", "Attempts"), (r) => r.attempt_count], [t("نهاية المهلة", "Grace ends"), (r) => dt(r.grace_ends_at)], [t("موعد الحذف", "Deletion date"), (r) => dt(r.termination_scheduled_at)],
    ...(withProtect ? [[t("الحماية", "Protection"), (r: any) => <Button size="sm" variant={r.protect_from_termination ? "default" : "outline"} onClick={async () => {
      const { error } = await db.rpc("cloud_admin_set_protection", { p_sub: r.id, p_protect: !r.protect_from_termination, p_hold: r.on_hold });
      error ? toast.error(error.message) : qc.invalidateQueries({ queryKey: ["cloud-lifecycle"] });
    }}>{r.protect_from_termination ? t("محمي", "Protected") : t("حماية", "Protect")}</Button>] as [string, (r: any) => React.ReactNode]] : []),
  ]} />;
}

export function RenewalsSection({ t }: { t: T }) {
  const { data = [] } = useQuery(q("renewals", async () =>
    (await db.from("cloud_renewal_invoices").select("*, cost:cloud_renewal_costs(provider_cost_sar,margin_pct,margin_alert)").eq("is_simulation", false).order("created_at", { ascending: false }).limit(500)).data ?? []));
  return <div className="space-y-5">
    <SubscriptionsByStatus t={t} statuses={["active", "renewal_due", "payment_failed", "grace_period"]} />
    <h3 className="font-semibold">{t("فواتير التجديد", "Renewal invoices")}</h3>
    <Table rows={data} empty={t("لا توجد تجديدات بعد", "No renewals yet")} cols={[
      [t("الفاتورة", "Invoice"), (r) => r.invoice_number], [t("الفترة", "Period"), (r) => `${dt(r.period_start)} → ${dt(r.period_end)}`],
      [t("قبل الضريبة", "Subtotal"), (r) => ((r.subtotal_minor + r.backup_minor) / 100).toFixed(2)], [t("الضريبة", "VAT"), (r) => `${(r.vat_minor / 100).toFixed(2)} (${Math.round(r.vat_rate * 100)}%)`],
      [t("الإجمالي", "Total"), (r) => (r.total_minor / 100).toFixed(2)], [t("الهامش", "Margin"), (r) => r.cost?.margin_pct != null ? <span className={r.cost.margin_alert ? "text-destructive font-semibold" : ""}>{r.cost.margin_pct}%</span> : "—"]]} />
  </div>;
}

export function FailedJobsSection({ t }: { t: T }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(q("jobs", async () => (await db.from("cloud_jobs").select("*").in("status", ["failed", "manual_review", "queued", "running"]).order("created_at", { ascending: false }).limit(500)).data ?? []));
  const act = async (id: string, a: string) => { const { error } = await db.rpc("cloud_admin_job_action", { p_job: id, p_action: a }); error ? toast.error(error.message) : (toast.success("OK"), qc.invalidateQueries({ queryKey: ["cloud-lifecycle"] })); };
  return <Table rows={data} empty={t("لا توجد مهام معلقة أو فاشلة", "No pending or failed jobs")} cols={[
    [t("النوع", "Type"), (r) => r.job_type], [t("الحالة", "Status"), (r) => <Badge variant={r.status === "manual_review" ? "destructive" : "outline"}>{r.status}</Badge>],
    [t("المحاولات", "Attempts"), (r) => `${r.attempts}/${r.max_attempts}`], [t("الخطأ", "Error"), (r) => <span className="text-xs">{r.error_class} {r.last_error}</span>], [t("موعد", "Scheduled"), (r) => dt(r.scheduled_at)],
    ["", (r) => ["manual_review", "failed"].includes(r.status) && <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => act(r.id, "retry")}>{t("إعادة", "Retry")}</Button>
      <Button size="sm" variant="outline" onClick={() => act(r.id, "resolve")}>{t("حل", "Resolve")}</Button>
      <Button size="sm" variant="destructive" onClick={() => act(r.id, "cancel")}>{t("إلغاء", "Cancel")}</Button></div>]]} />;
}

export function ReconciliationSection({ t }: { t: T }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(q("recon", async () => (await db.from("cloud_reconciliation_findings").select("*").eq("is_simulation", false).order("created_at", { ascending: false }).limit(500)).data ?? []));
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">{t("المطابقة تنبّه فقط ولا تحذف أو تصلح أي مورد تلقائياً.", "Reconciliation only alerts; it never deletes or auto-fixes resources.")}</p>
    <Table rows={data} empty={t("لا توجد فروقات", "No mismatches")} cols={[
      [t("النوع", "Kind"), (r) => <Badge variant={r.kind === "orphan" ? "destructive" : "outline"}>{r.kind === "orphan" ? "ORPHAN DETECTED" : r.kind}</Badge>],
      [t("مرجع المزود", "Provider ref"), (r) => <span className="font-mono text-xs">{r.provider_ref ?? "—"}</span>], [t("الحالة", "Status"), (r) => r.status], [t("الوقت", "Time"), (r) => dt(r.created_at)],
      ["", (r) => r.status === "open" && <Button size="sm" variant="outline" onClick={async () => { await db.from("cloud_reconciliation_findings").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["cloud-lifecycle"] }); }}>{t("تمت المراجعة", "Reviewed")}</Button>]]} />
  </div>;
}

export function LifecycleSettingsSection({ t }: { t: T }) {
  const qc = useQueryClient();
  const { data } = useQuery(q("settings", async () => (await db.from("cloud_lifecycle_settings").select("*").single()).data));
  const [f, setF] = useState<any>(null);
  const v = f ?? data;
  if (!v) return <Loader2 className="animate-spin" />;
  const set = (k: string, val: any) => setF({ ...v, [k]: val });
  const num = (k: string, ar: string, en: string) => <label className="space-y-1 text-sm"><span>{t(ar, en)}</span><Input type="number" value={v[k]} onChange={(e) => set(k, Number(e.target.value))} /></label>;
  const arr = (k: string, ar: string, en: string) => <label className="space-y-1 text-sm"><span>{t(ar, en)}</span><Input value={(v[k] ?? []).join(",")} onChange={(e) => set(k, e.target.value.split(",").map((x) => Number(x.trim())).filter((x) => x > 0))} /></label>;
  const save = async () => {
    const { id, updated_at, ...rest } = v;
    const { error } = await db.from("cloud_lifecycle_settings").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", true);
    error ? toast.error(error.message) : (toast.success(t("تم الحفظ", "Saved")), setF(null), qc.invalidateQueries({ queryKey: ["cloud-lifecycle"] }));
  };
  return <div className="space-y-4 max-w-3xl">
    {!v.values_decided && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">{t("القيم الحالية افتراضية مؤقتة ولم تُعتمد بعد من الإدارة.", "Current values are temporary defaults, not yet decided by management.")}</p>}
    <div className="grid sm:grid-cols-2 gap-3">
      {num("grace_period_days", "أيام مهلة السداد", "Grace period days")}
      <label className="space-y-1 text-sm"><span>{t("سياسة الخادم خلال المهلة", "Server policy during grace")}</span>
        <select className="w-full rounded-md border bg-background p-2" value={v.grace_server_policy} onChange={(e) => set("grace_server_policy", e.target.value)}>
          <option value="keep_running">{t("يبقى يعمل", "Keep running")}</option><option value="suspend_immediately">{t("تعليق فوري", "Suspend immediately")}</option></select></label>
      {arr("renewal_retry_hours", "جدول إعادة محاولة التجديد (ساعات)", "Renewal retry schedule (hours)")}
      {num("termination_delay_days", "مدة الحذف بعد التعليق (أيام)", "Termination delay after suspension (days)")}
      {arr("notify_before_days", "إشعارات قبل التجديد (أيام)", "Notify before renewal (days)")}
      {num("min_margin_warning_pct", "حد تنبيه الهامش %", "Minimum margin warning %")}
      {num("provider_max_attempts", "محاولات المزود القصوى", "Provider max attempts")}
      {num("provider_backoff_seconds", "مهلة التراجع الأساسية (ثوانٍ)", "Provider base backoff (seconds)")}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.auto_renew_default} onChange={(e) => set("auto_renew_default", e.target.checked)} />{t("التجديد التلقائي افتراضياً", "Auto-renew by default")}</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.values_decided} onChange={(e) => set("values_decided", e.target.checked)} />{t("القيم معتمدة نهائياً", "Values approved")}</label>
    </div>
    <Button onClick={save} disabled={!f}>{t("حفظ", "Save")}</Button>
  </div>;
}

export function SimulationSection({ t }: { t: T }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<any>(null);
  const run = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("cloud-lifecycle-worker", { body: { action: "simulate" } });
    setBusy(false);
    error ? toast.error(error.message) : setRes(data);
  };
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">{t("محاكاة كاملة بمزود وهمي ومحفظة وهمية: لا خوادم حقيقية ولا أموال حقيقية، وتُحذف بيانات الاختبار بعد التشغيل.", "Full simulation with a mock provider and mock wallet: no real servers, no real money; test data is removed afterwards.")}</p>
    <Button onClick={run} disabled={busy}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{t("تشغيل اختبارات A–R", "Run tests A–R")}</Button>
    {res && <>
      <p className="font-semibold">{res.passed}/{res.total} {t("ناجح", "passed")}</p>
      <Table rows={res.results.map((r: any) => ({ ...r, id: r.id }))} empty="" cols={[["#", (r) => r.id], [t("الاختبار", "Test"), (r) => r.name],
        [t("النتيجة", "Result"), (r) => <Badge variant={r.pass ? "outline" : "destructive"}>{r.pass ? "PASS" : "FAIL"}</Badge>], [t("التفاصيل", "Detail"), (r) => <span className="font-mono text-[11px] break-all">{r.detail}</span>]]} />
    </>}
  </div>;
}
