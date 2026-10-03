import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { db, dt, T } from "./adminCloudShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, Trash2, PlayCircle, FlaskConical } from "lucide-react";
import { toast } from "sonner";

const SERVER_NAME = "ash-cloud-e2e-test-01";
const call = async (action: string, confirm?: string) => {
  const { data, error } = await supabase.functions.invoke("cloud-e2e-test", { body: { action, confirm } });
  if (error) return { ok: false, error: "request_failed" } as any;
  return data as any;
};

const STAGES = ["creating", "wait_running", "ssh", "power_off", "verify_off", "verify_on", "verify_reboot", "passed"];

export default function ProvisioningTestsSection({ t, lang }: { t: T; lang: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [pf, setPf] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { data: test } = useQuery({ queryKey: ["e2e-test"], queryFn: async () => (await call("status")).test ?? null });
  const { data: events = [] } = useQuery({
    queryKey: ["e2e-events", test?.id], enabled: !!test?.id,
    queryFn: async () => ((await db.from("cloud_e2e_test_events").select("*").eq("test_id", test.id).order("created_at", { ascending: false }).limit(200)).data ?? []) as any[],
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["e2e-test"] }); qc.invalidateQueries({ queryKey: ["e2e-events"] }); };

  // Drive the backend state machine while a test is running
  useEffect(() => {
    if (test?.status !== "running_tests") return;
    const id = setInterval(async () => { await call("advance"); refresh(); }, 8000);
    return () => clearInterval(id);
  }, [test?.status]);

  const run = async (k: string, fn: () => Promise<any>) => { setBusy(k); try { const r = await fn(); if (r?.ok === false) toast.error(r.error ?? "failed"); return r; } finally { setBusy(null); refresh(); } };

  const checks = pf?.checks ?? test?.preflight ?? null;
  const cost = pf?.cost ?? test?.estimated_cost ?? null;
  const canCreate = test?.status === "ready" && (pf?.passed ?? false);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Hetzner Cloud End-to-End Test</h2>
          <Badge variant="outline">{t("للإدارة فقط", "Admin only")}</Badge>
          {test && <Badge>{test.status}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{t("اختبار داخلي منفصل عن طلبات العملاء والمحفظة. معاملات ثابتة فقط وخادم واحد.", "Internal test, separate from customer orders and wallets. Fixed parameters, one server only.")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          {[["Server type", "CX23"], ["Location", "fsn1"], ["Image", "Ubuntu 24.04 x86"], ["Name", SERVER_NAME], ["IPv4", "Enabled"], ["IPv6", "Enabled"], ["Backups", "Disabled"], ["Volumes / Floating IP / LB", "None"]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">{k}</div><div className="font-medium break-all">{v}</div></div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Preflight</h3>
          <Button size="sm" variant="outline" disabled={!!busy || test?.status !== "ready"} onClick={() => run("pf", async () => { const r = await call("preflight"); setPf(r.preflight); return r; })}>
            {busy === "pf" && <Loader2 className="w-4 h-4 animate-spin" />}{t("تشغيل الفحص", "Run preflight")}
          </Button>
        </div>
        {checks ? (
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {Object.entries(checks).filter(([k]) => !["passed", "at", "error"].includes(k)).map(([k, v]) => (
              <li key={k} className="flex items-center gap-2">{v === true ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-destructive" />}{k.replace(/_/g, " ")}</li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">{t("لم يُشغّل الفحص بعد.", "Preflight not run yet.")}</p>}
        {cost && (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">Server / month</div>€{cost.server_monthly ?? "—"} <span className="text-xs text-muted-foreground">(€{cost.server_hourly}/h)</span></div>
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">IPv4 / month</div>€{cost.ipv4_monthly ?? "—"}</div>
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">Total / month (max)</div>€{cost.total_monthly ?? "—"}</div>
          </div>
        )}
        <Button disabled={!canCreate || !!busy} onClick={() => { setConfirmText(""); setCreateOpen(true); }}>
          <PlayCircle className="w-4 h-4" />{t("إنشاء خادم الاختبار", "Create test server")}
        </Button>
      </div>

      {test && test.status !== "ready" && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          {test.status === "passed" && <div className="rounded-lg border border-primary bg-primary/10 p-3 font-semibold">TEST PASSED — Ready for cleanup</div>}
          {test.status === "failed" && <div className="rounded-lg border border-destructive bg-destructive/10 p-3 font-semibold">FAILED AT: {test.failed_stage} <span className="font-normal text-sm">({test.error})</span></div>}
          {test.status === "cleaned_up" && <div className="rounded-lg bg-muted p-3 font-semibold">Cleaned Up</div>}
          <ol className="flex flex-wrap gap-1.5 text-xs">
            {STAGES.map((s) => {
              const idx = STAGES.indexOf(test.stage), i = STAGES.indexOf(s);
              const done = test.status === "passed" || test.status === "cleaned_up" || (idx > i);
              return <li key={s} className={`rounded-md border px-2 py-1 ${test.stage === s ? "bg-primary text-primary-foreground" : done ? "bg-muted" : ""}`}>{s}</li>;
            })}
          </ol>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {[["Test ID", test.id], ["Provider resource ID", test.provider_resource_id], ["Provider status", test.provider_status], ["IPv4", test.ipv4], ["IPv6", test.ipv6], ["Started", dt(test.started_at, lang)]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted/50 p-2 min-w-0"><div className="text-xs text-muted-foreground">{k}</div><div className="font-mono text-xs break-all">{v ?? "—"}</div></div>
            ))}
          </div>
          {test.connectivity?.output && (
            <details className="text-xs"><summary className="cursor-pointer font-medium">SSH output</summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-muted p-2 whitespace-pre-wrap" dir="ltr">{Object.entries(test.connectivity.output).map(([c, o]) => `$ ${c}\n${o}`).join("\n")}</pre>
            </details>
          )}
          {test.customer_data && <pre className="text-xs rounded-lg bg-muted p-2 overflow-auto" dir="ltr">{JSON.stringify(test.customer_data, null, 2)}</pre>}
          <div className="flex flex-wrap gap-2">
            {(test.provider_resource_id || test.provider_ssh_key_id) && test.status !== "cleaned_up" && (
              <Button variant="destructive" disabled={!!busy || test.status === "creating"} onClick={() => setDelOpen(true)}><Trash2 className="w-4 h-4" />Delete Test Server</Button>
            )}
            {(test.status === "cleaned_up" || (test.status === "failed" && !test.provider_resource_id && !test.provider_ssh_key_id)) && (
              <Button variant="outline" disabled={!!busy} onClick={() => run("reset", () => call("reset"))}>{t("إعادة تهيئة الاختبار", "Reset test")}</Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold mb-2">{t("سجل التدقيق", "Audit log")}</h3>
        {events.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
          <ul className="divide-y text-sm">{events.map((e) => (
            <li key={e.id} className="py-1.5 flex flex-wrap gap-2"><span className="text-muted-foreground text-xs">{dt(e.created_at, lang)}</span><span className="font-medium">{e.stage}</span><Badge variant="outline">{e.result}</Badge></li>
          ))}</ul>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("تأكيد إنشاء مورد مدفوع", "Confirm paid resource creation")}</DialogTitle>
            <DialogDescription>{t("سيُنشأ خادم حقيقي مدفوع واحد لدى Hetzner Cloud. اكتب اسم الخادم للتأكيد.", "This creates ONE real, billable Hetzner Cloud server. Type the server name to confirm.")}</DialogDescription></DialogHeader>
          <Input dir="ltr" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={SERVER_NAME} />
          <DialogFooter>
            <Button disabled={confirmText !== SERVER_NAME || !!busy} onClick={async () => { const r = await run("create", () => call("create", confirmText)); if (r?.ok) setCreateOpen(false); }}>
              {busy === "create" && <Loader2 className="w-4 h-4 animate-spin" />}{t("إنشاء الآن", "Create now")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Test Server</DialogTitle>
            <DialogDescription>This will permanently delete the Hetzner test server.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="destructive" disabled={!!busy} onClick={async () => { const r = await run("del", () => call("cleanup", "DELETE")); if (r?.ok) setDelOpen(false); }}>
              {busy === "del" && <Loader2 className="w-4 h-4 animate-spin" />}Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
