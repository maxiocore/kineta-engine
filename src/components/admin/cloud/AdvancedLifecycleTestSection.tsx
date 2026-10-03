import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { db, dt, T } from "./adminCloudShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, Trash2, PlayCircle, Layers, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

const SERVER_NAME = "ash-cloud-advanced-test-01";
const call = async (action: string, confirm?: string) => {
  const { data, error } = await supabase.functions.invoke("cloud-advanced-test", { body: { action, confirm } });
  if (error) return { ok: false, error: "request_failed" } as any;
  return data as any;
};
const STAGES = ["creating", "wait_running", "baseline", "snapshot_request", "snapshot_wait", "modify_file", "restore_request", "restore_wait", "restore_verify",
  "backup_enable", "backup_verify", "await_rebuild_confirm", "rebuild_wait", "rebuild_verify", "rescue_enable", "rescue_reboot", "rescue_verify", "rescue_disable",
  "rescue_exit_wait", "rescue_exit_verify", "rdns", "rdns_restore", "engine", "passed"];

export default function AdvancedLifecycleTestSection({ t, lang }: { t: T; lang: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [pf, setPf] = useState<any>(null);
  const [dlg, setDlg] = useState<null | "create" | "rebuild" | "cleanup">(null);
  const [txt, setTxt] = useState("");

  const { data: test } = useQuery({ queryKey: ["adv-test"], queryFn: async () => (await call("status")).test ?? null });
  const { data: events = [] } = useQuery({
    queryKey: ["adv-events", test?.id], enabled: !!test?.id,
    queryFn: async () => ((await db.from("cloud_e2e_test_events").select("*").eq("test_id", test.id).order("created_at", { ascending: false }).limit(300)).data ?? []) as any[],
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["adv-test"] }); qc.invalidateQueries({ queryKey: ["adv-events"] }); };
  useEffect(() => {
    if (test?.status !== "running_tests") return;
    const id = setInterval(async () => { await call("advance"); refresh(); }, 10000);
    return () => clearInterval(id);
  }, [test?.status]);
  const run = async (k: string, fn: () => Promise<any>) => { setBusy(k); try { const r = await fn(); if (r?.ok === false) toast.error(r.error ?? "failed"); return r; } finally { setBusy(null); refresh(); } };

  const checks = pf?.checks ?? test?.preflight ?? null;
  const cost = pf?.cost ?? test?.estimated_cost ?? null;
  const L = test?.lifecycle ?? {};
  const need = dlg === "create" ? SERVER_NAME : dlg === "rebuild" ? "REBUILD" : "DELETE";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Phase 2 — Advanced Server Lifecycle Test</h2>
          <Badge variant="outline">{t("للإدارة فقط", "Admin only")}</Badge>
          {test && <Badge>{test.status}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{t("خادم واحد فقط: Snapshot ثم Restore ثم Backups ثم Rebuild ثم Rescue ثم Reverse DNS ثم محرك إجراءات العملاء. يتوقف عند أي فشل.", "One server only: Snapshot → Restore → Backups → Rebuild → Rescue → Reverse DNS → Customer Action Engine. Stops on any failure.")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          {[["Server type", "CX23"], ["Location", "fsn1"], ["Image", "Ubuntu 24.04 x86"], ["Name", SERVER_NAME], ["IPv4 / IPv6", "Enabled"], ["Backups", "Disabled initially"], ["SSH", "AES-GCM, new key"], ["PTR test", "test-vps.ash-holding.sa"]].map(([k, v]) => (
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm" dir="ltr">
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">CX23 / month</div>€{cost.cx23_monthly ?? "—"} <span className="text-xs text-muted-foreground">(€{cost.cx23_hourly}/h)</span></div>
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">IPv4 / month</div>€{cost.ipv4_monthly ?? "—"}</div>
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">Snapshot / GB / month</div>€{cost.snapshot_per_gb_month ?? "—"}</div>
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-xs text-muted-foreground">Backup ({cost.backup_percentage}%) / month</div>€{cost.backup_monthly ?? "—"}</div>
          </div>
        )}
        <Button disabled={test?.status !== "ready" || !(pf?.passed ?? false) || !!busy} onClick={() => { setTxt(""); setDlg("create"); }}>
          <PlayCircle className="w-4 h-4" />{t("بدء الاختبار المتقدم", "Start advanced test")}
        </Button>
      </div>

      {test && test.status !== "ready" && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          {test.status === "passed" && <div className="rounded-lg border border-primary bg-primary/10 p-3 font-semibold">ADVANCED TEST PASSED — Ready for cleanup</div>}
          {test.status === "failed" && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">FAILED AT: {test.failed_stage} <span className="font-normal text-sm">({test.error})</span></span>
              {test.failed_stage === "rescue_exit_verify" && test.provider_resource_id && (
                <Button size="sm" disabled={!!busy} onClick={() => run("retry_rescue_exit", () => call("retry_rescue_exit"))}>
                  {busy === "retry_rescue_exit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}Retry Rescue Exit Verify
                </Button>
              )}
            </div>
          )}
          {test.status === "awaiting_confirmation" && (
            <div className="rounded-lg border border-primary bg-primary/10 p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{t("بانتظار تأكيد Rebuild (سيمسح القرص)", "Awaiting Rebuild confirmation (wipes the disk)")}</span>
              <Button size="sm" onClick={() => { setTxt(""); setDlg("rebuild"); }}><RefreshCcw className="w-4 h-4" />Confirm Rebuild</Button>
            </div>
          )}
          {test.status === "cleaned_up" && <div className="rounded-lg bg-muted p-3 font-semibold">Cleaned Up</div>}
          <ol className="flex flex-wrap gap-1.5 text-xs" dir="ltr">
            {STAGES.map((s) => {
              const idx = STAGES.indexOf(test.stage), i = STAGES.indexOf(s);
              const done = ["passed", "cleaned_up"].includes(test.status) || idx > i;
              return <li key={s} className={`rounded-md border px-2 py-1 ${test.stage === s ? "bg-primary text-primary-foreground" : done ? "bg-muted" : ""}`}>{s}</li>;
            })}
          </ol>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {[["Provider resource ID", test.provider_resource_id], ["Provider status", test.provider_status], ["IPv4", test.ipv4], ["IPv6", test.ipv6], ["Snapshot ID", L.snapshot?.provider_id], ["Started", dt(test.started_at, lang)]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted/50 p-2 min-w-0"><div className="text-xs text-muted-foreground">{k}</div><div className="font-mono text-xs break-all">{v ?? "—"}</div></div>
            ))}
          </div>
          {(test.stage?.startsWith("rescue") || L.diagnostics) && test.provider_resource_id && test.status !== "cleaned_up" && (() => {
            const D = L.diagnostics;
            return (
              <div className="rounded-lg border p-3 space-y-2" dir="ltr">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">Rescue Exit Diagnostics <span className="text-xs font-normal text-muted-foreground">(read-only)</span></span>
                  <Button size="sm" variant="outline" disabled={!!busy || test.status === "running_tests"} onClick={() => run("diagnose", () => call("diagnose"))}>
                    {busy === "diagnose" && <Loader2 className="w-4 h-4 animate-spin" />}Run diagnostics
                  </Button>
                </div>
                {D ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[["Checked", dt(D.at, lang)], ["Hetzner status", D.server?.status], ["Rescue enabled", String(D.server?.rescue_enabled)], ["Locked", String(D.server?.locked)],
                        ["Image", D.server?.image?.name], ["ISO", D.server?.iso?.name ?? "none"], ["Stage", D.stage], ["SSH attempts", D.ssh?.attempts],
                        ["Elapsed", D.ssh?.elapsed_ms != null ? `${Math.round(D.ssh.elapsed_ms / 1000)}s` : "—"], ["Last SSH error", D.ssh?.last_error],
                        ...(D.tcp ?? []).map((p: any) => [`TCP ${p.port}`, `${p.state} (${p.ms}ms)${p.banner ? " " + p.banner : ""}`])].map(([k, v]: any) => (
                        <div key={k} className="rounded bg-muted/50 p-2 min-w-0"><div className="text-muted-foreground">{k}</div><div className="font-mono break-all">{v ?? "—"}</div></div>
                      ))}
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-muted-foreground text-start"><th className="text-start p-1">Action ID</th><th className="text-start p-1">Command</th><th className="text-start p-1">Status</th><th className="text-start p-1">Started</th><th className="text-start p-1">Finished</th><th className="text-start p-1">Error</th></tr></thead>
                        <tbody>{(D.actions ?? []).map((a: any) => (
                          <tr key={a.id} className="border-t"><td className="p-1 font-mono">{a.id}</td><td className="p-1">{a.command}</td><td className="p-1">{a.status}</td><td className="p-1">{a.started?.slice(11, 19)}</td><td className="p-1">{a.finished?.slice(11, 19) ?? "—"}</td><td className="p-1">{a.error ?? "—"}</td></tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </>
                ) : <p className="text-xs text-muted-foreground">No diagnostics yet.</p>}
              </div>
            );
          })()}
          {Object.keys(L).length > 0 && <pre className="text-xs rounded-lg bg-muted p-2 overflow-auto max-h-96" dir="ltr">{JSON.stringify({ ...L, diagnostics: undefined, token_snapshot: undefined, token_modified: undefined }, null, 2)}</pre>}
          {test.status === "passed" && (
            <div className="text-sm rounded-lg bg-muted/50 p-3">
              <div className="font-medium mb-1">{t("الموارد التي ستُحذف", "Resources to be deleted")}</div>
              <ul className="list-disc ps-5" dir="ltr">
                <li>Server {test.provider_resource_id}</li>
                <li>Snapshot {L.snapshot?.provider_id}{L.engine_snapshot_id ? `, engine snapshot ${L.engine_snapshot_id}` : ""}</li>
                <li>Temporary SSH key {test.provider_ssh_key_id}</li>
                <li>Backups (deleted with the server), any labelled leftovers</li>
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(test.provider_resource_id || test.provider_ssh_key_id) && test.status !== "cleaned_up" && (
              <Button variant="destructive" disabled={!!busy || test.status === "creating" || test.status === "running_tests"} onClick={() => { setTxt(""); setDlg("cleanup"); }}><Trash2 className="w-4 h-4" />Cleanup Advanced Test</Button>
            )}
            {test.status === "cleaned_up" && <Button variant="outline" disabled={!!busy} onClick={() => run("reset", () => call("reset"))}>{t("إعادة تهيئة", "Reset")}</Button>}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold mb-2">{t("سجل التدقيق", "Audit log")}</h3>
        {events.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
          <ul className="divide-y text-sm max-h-96 overflow-auto">{events.map((e) => (
            <li key={e.id} className="py-1.5 flex flex-wrap gap-2"><span className="text-muted-foreground text-xs">{dt(e.created_at, lang)}</span><span className="font-medium">{e.stage}</span><Badge variant="outline">{e.result}</Badge></li>
          ))}</ul>
        )}
      </div>

      <Dialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dlg === "create" ? t("تأكيد إنشاء مورد مدفوع", "Confirm paid resource creation") : dlg === "rebuild" ? "Confirm Rebuild" : "Cleanup Advanced Test"}</DialogTitle>
            <DialogDescription>{dlg === "create" ? t("سيُنشأ خادم حقيقي مدفوع واحد. اكتب اسم الخادم للتأكيد.", "Creates ONE real billable server. Type the server name to confirm.")
              : dlg === "rebuild" ? t("سيُعاد تثبيت Ubuntu 24.04 ويُمسح القرص. اكتب REBUILD.", "Reinstalls Ubuntu 24.04 and wipes the disk. Type REBUILD.")
              : t("سيحذف الخادم وكل Snapshots ومفتاح SSH المؤقت ويتحقق من حذفها. اكتب DELETE.", "Deletes the server, all snapshots and the temporary SSH key, then verifies. Type DELETE.")}</DialogDescription></DialogHeader>
          <Input dir="ltr" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={need} />
          <DialogFooter>
            <Button variant={dlg === "cleanup" ? "destructive" : "default"} disabled={txt !== need || !!busy} onClick={async () => {
              const a = dlg === "create" ? "create" : dlg === "rebuild" ? "confirm_rebuild" : "cleanup";
              const r = await run(a, () => call(a, txt)); if (r?.ok) setDlg(null);
            }}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{t("تأكيد", "Confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
