import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { db, dt, T } from "./adminCloudShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, PlayCircle, UserCheck, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const CONFIRM = "RUN CUSTOMER E2E";
const STAGES = ["ordering", "provisioning", "wait_running", "readiness", "portal", "act_restart", "act_stop", "act_start", "isolation", "billing", "cancel", "delete_verify", "refund", "cleanup_verify", "passed"];
const call = async (action: string, confirm?: string) => {
  const { data, error } = await supabase.functions.invoke("cloud-customer-e2e", { body: { action, confirm } });
  if (error) return { ok: false, error: "request_failed" } as any;
  return data as any;
};
const Row = ({ k, v }: { k: string; v: unknown }) => (
  <div className="flex justify-between gap-3 border-b py-1 text-sm last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium text-end break-all">{typeof v === "boolean" ? (v ? "✓" : "✗") : v === null || v === undefined ? "—" : String(v)}</span></div>
);

export default function CustomerE2ETestSection({ t, lang }: { t: T; lang: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [pf, setPf] = useState<any>(null);
  const [dlg, setDlg] = useState(false);
  const [txt, setTxt] = useState("");
  const { data: test } = useQuery({ queryKey: ["cust-e2e"], queryFn: async () => (await call("status")).test ?? null });
  const { data: events = [] } = useQuery({
    queryKey: ["cust-e2e-events", test?.id], enabled: !!test?.id,
    queryFn: async () => ((await db.from("cloud_e2e_test_events").select("*").eq("test_id", test.id).order("created_at", { ascending: false }).limit(200)).data ?? []) as any[],
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["cust-e2e"] }); qc.invalidateQueries({ queryKey: ["cust-e2e-events"] }); };
  useEffect(() => {
    if (test?.status !== "running_tests") return;
    const id = setInterval(async () => { await call("advance"); refresh(); }, 8000);
    return () => clearInterval(id);
  }, [test?.status]);
  const run = async (k: string, fn: () => Promise<any>) => { setBusy(k); try { const r = await fn(); if (r?.ok === false) toast.error(r.error ?? "failed"); return r; } finally { setBusy(null); refresh(); } };

  const checks = pf ? { ...pf.checks, passed: pf.passed } : test?.preflight ?? null;
  const L = test?.lifecycle ?? {};
  const idx = STAGES.indexOf(test?.stage ?? "");
  const passed = test?.status === "cleaned_up" && test?.stage === "passed";
  const p = L.payment ?? {};

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <UserCheck className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Customer End-to-End Provisioning Test</h2>
          <Badge variant="outline">{t("حسابك فقط", "Your account only")}</Badge>
          {test && <Badge>{test.status}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{t("يمر عبر مسار العميل الحقيقي: الطلب، الضريبة، الدفع من المحفظة، التجهيز التلقائي لهذا الطلب فقط، جاهزية الإقلاع، البوابة، إعادة التشغيل/الإيقاف/التشغيل، العزل، الفوترة، الإلغاء، الحذف، الاسترداد ثم التنظيف. يتوقف عند أي فشل.",
          "Runs the real customer path: order, VAT, wallet payment, auto-provisioning for this order only, first-boot readiness, portal, restart/stop/start, isolation, billing, cancellation, deletion, refund and cleanup. Stops on any failure.")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          {[["Plan", "سحابي S (CX23)"], ["Location", "fsn1"], ["OS", "Ubuntu 24.04 x86"], ["Charge", "49.00 + 7.35 VAT = 56.35 SAR (refunded)"], ["Max VPS", "1"], ["Global provisioning", "Stays OFF"], ["Time cap", "3 h, then auto-delete"], ["Max provider cost", "≈ €0.03"]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">{k}</div><div className="font-medium break-all">{v}</div></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!!busy} onClick={() => run("pf", async () => { const r = await call("preflight"); setPf(r.preflight); return r; })}>
            {busy === "pf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}{t("التحقق من التنظيف والجاهزية", "Verify cleanup & readiness")}</Button>
          <Button disabled={!!busy || test?.status !== "ready" || !checks?.passed} onClick={() => { setTxt(""); setDlg(true); }}><PlayCircle className="w-4 h-4" />Run</Button>
          {test?.status === "failed" && <Button variant="destructive" disabled={!!busy} onClick={() => run("cl", () => call("cleanup"))}><Trash2 className="w-4 h-4" />{t("تنظيف يدوي", "Manual cleanup")}</Button>}
          {(test?.status === "cleaned_up" || (test?.status === "failed" && L.manual_cleanup?.server_gone)) && <Button variant="ghost" disabled={!!busy} onClick={() => run("rs", () => call("reset"))}><RotateCcw className="w-4 h-4" />Reset</Button>}
        </div>
        {checks && (
          <div className="grid sm:grid-cols-2 gap-x-6 rounded-lg border p-3">
            {Object.entries(checks).filter(([k]) => !["at", "passed", "estimated_total_sar"].includes(k)).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-sm py-0.5">{v === true ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-destructive" />}{k}</div>
            ))}
            <div className="sm:col-span-2 pt-2 font-semibold">{checks.passed ? "READY TO RUN CUSTOMER E2E TEST" : t("غير جاهز — راجع البنود", "Not ready — see failing checks")}</div>
          </div>
        )}
      </div>

      {test && test.status !== "ready" && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          {passed && <div className="rounded-lg bg-primary text-primary-foreground p-3 font-bold text-center">CUSTOMER END-TO-END TEST PASSED</div>}
          {test.status === "failed" && <div className="rounded-lg bg-destructive text-destructive-foreground p-3 font-semibold">FAILED AT {test.failed_stage}: {test.error}</div>}
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s, i) => (
              <span key={s} className={`rounded-md border px-2 py-0.5 text-xs ${passed || i < idx ? "bg-primary/15 border-primary/40" : i === idx ? (test.status === "failed" ? "bg-destructive/15 border-destructive" : "bg-accent border-primary") : "bg-muted/40"}`}>{s}</span>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <h3 className="font-semibold mb-2">{t("التقرير", "Report")}</h3>
              <Row k="Wallet balance before" v={p.wallet_before?.toFixed?.(2)} />
              <Row k="Amount charged (excl. VAT)" v={p.retail_price} />
              <Row k="VAT" v={p.vat} />
              <Row k="Total" v={p.total} />
              <Row k="Wallet after payment" v={p.wallet_after?.toFixed?.(2)} />
              <Row k="Order ID" v={L.order_id} />
              <Row k="Internal Server ID" v={L.internal_server_id} />
              <Row k="Provider resource created" v={!!L.provider_resource_created} />
              <Row k="Provisioning duration (s)" v={L.provisioning_duration_s} />
              <Row k="First boot readiness (s)" v={L.first_boot_duration_s} />
              <Row k="Customer portal" v={L.portal ? Object.values(L.portal.checks ?? {}).every(Boolean) : undefined} />
              <Row k="Restart" v={L.act_restart?.result} />
              <Row k="Stop" v={L.act_stop?.result} />
              <Row k="Start" v={L.act_start?.result} />
              <Row k="Cross-customer isolation" v={L.isolation ? L.isolation.anon_read_blocked && L.isolation.anon_api_blocked : undefined} />
              <Row k="Notifications" v={L.notifications?.count} />
              <Row k="Billing / subscription" v={L.billing ? `${L.billing.order} · renews ${L.billing.renewal_date}` : undefined} />
              <Row k="Cancellation" v={L.cancellation?.final_status} />
              <Row k="Provider deletion verified" v={L.provider_deletion_verified} />
              <Row k="Refund amount" v={L.refund?.refund_amount} />
              <Row k="Final wallet balance" v={L.refund?.final_balance?.toFixed?.(2)} />
              <Row k="Duplicate payment protection" v={p.duplicate_returned} />
              <Row k="Duplicate refund protection" v={L.refund?.second_refund_blocked} />
              <Row k="Orphan resources" v={L.final_cleanup?.orphan_resources} />
              {(L.warnings ?? []).map((w: string) => <p key={w} className="text-xs text-destructive pt-1">⚠ {w}</p>)}
            </div>
            <div className="rounded-lg border p-3 max-h-[520px] overflow-auto">
              <h3 className="font-semibold mb-2">{t("السجل", "Events")}</h3>
              {events.map((e: any) => (
                <div key={e.id} className="border-b py-1 text-xs"><span className="text-muted-foreground">{dt(e.created_at, lang)}</span> · <b>{e.stage}</b> · {e.result}</div>
              ))}
            </div>
          </div>
          {test.status === "running_tests" && <p className="text-xs text-muted-foreground">{t("أبقِ هذه الصفحة مفتوحة حتى ينتهي الاختبار.", "Keep this page open until the test finishes.")}</p>}
        </div>
      )}

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("تشغيل اختبار العميل الحقيقي", "Run real customer test")}</DialogTitle>
            <DialogDescription>{t(`سيُخصم 56.35 ر.س من محفظتك ويُنشأ خادم حقيقي واحد ثم يُحذف ويُسترد المبلغ. اكتب ${CONFIRM} للتأكيد.`, `56.35 SAR will be debited from your wallet and one real VPS created, then deleted and refunded. Type ${CONFIRM} to confirm.`)}</DialogDescription>
          </DialogHeader>
          <Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={CONFIRM} dir="ltr" />
          <DialogFooter>
            <Button disabled={txt !== CONFIRM || !!busy} onClick={async () => { setDlg(false); await run("run", () => call("run", CONFIRM)); }}>Run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
