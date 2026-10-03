import { Button } from "@/components/ui/button";
import { Activity, ListOrdered, Plus, Server, Settings, Workflow } from "lucide-react";
import { useTable, Stat, money, dt, Pill, toneOf, Empty, T } from "./adminCloudShared";

export default function OverviewSection({ t, lang, go }: { t: T; lang: string; go: (tab: string) => void }) {
  const { data: servers = [] } = useTable("cloud_servers");
  const { data: orders = [] } = useTable("cloud_orders");
  const { data: jobs = [] } = useTable("cloud_provisioning_jobs");
  const { data: actions = [] } = useTable("cloud_server_actions");
  const { data: costs = [] } = useTable("cloud_plan_costs", "updated_at");
  const { data: providers = [] } = useTable("cloud_providers", "code", true);
  const { data: logs = [] } = useTable("cloud_activity_logs");

  const live = servers.filter((s) => !["cancelled", "failed"].includes(s.status));
  const by = (st: string) => servers.filter((s) => s.status === st).length;
  const revenue = live.reduce((a, s) => a + Number(s.monthly_price || 0), 0);
  const costMap = Object.fromEntries(costs.map((c) => [c.plan_id, Number(c.infra_cost || 0)]));
  const infra = live.reduce((a, s) => a + (costMap[s.plan_id] ?? 0), 0);
  const margin = revenue - infra;
  const in14 = Date.now() + 14 * 864e5;
  const renewals = live.filter((s) => s.renewal_date && new Date(s.renewal_date).getTime() <= in14).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Stat label={t("إجمالي الخوادم", "Total servers")} value={servers.length} />
        <Stat label={t("نشطة", "Active")} value={by("running")} tone="good" />
        <Stat label={t("قيد التجهيز", "Provisioning")} value={by("pending") + by("provisioning")} tone="warn" />
        <Stat label={t("معلّقة", "Suspended")} value={by("suspended")} tone="bad" />
        <Stat label={t("فاشلة", "Failed")} value={by("failed")} tone="bad" />
        <Stat label="Cloud VPS" value={servers.filter((s) => s.server_type === "vps").length} />
        <Stat label="Dedicated" value={servers.filter((s) => s.server_type === "dedicated").length} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label={t("الإيراد الشهري", "Monthly revenue")} value={money(revenue, lang)} />
        <Stat label={t("تكلفة البنية", "Infrastructure cost")} value={money(infra, lang)} />
        <Stat label={t("الهامش الإجمالي التقديري", "Estimated gross margin")} value={`${money(margin, lang)}${revenue ? ` · ${((margin / revenue) * 100).toFixed(1)}%` : ""}`} tone={margin >= 0 ? "good" : "bad"} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label={t("طلبات معلقة", "Pending orders")} value={orders.filter((o) => ["pending_payment", "paid", "queued"].includes(o.status)).length} tone="warn" />
        <Stat label={t("مهام تجهيز فاشلة", "Failed provisioning")} value={jobs.filter((j) => j.status === "provisioning_failed").length} tone="bad" />
        <Stat label={t("إجراءات معلقة", "Pending actions")} value={actions.filter((a) => a.status === "requested").length} tone="warn" />
        <Stat label={t("تجديدات خلال 14 يوماً", "Renewals in 14 days")} value={renewals} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => go("plans")}><Plus className="w-4 h-4" />{t("إضافة باقة", "Add plan")}</Button>
        <Button size="sm" variant="outline" onClick={() => go("servers")}><Server className="w-4 h-4" />{t("الخوادم", "Servers")}</Button>
        <Button size="sm" variant="outline" onClick={() => go("orders")}><ListOrdered className="w-4 h-4" />{t("الطلبات", "Orders")}</Button>
        <Button size="sm" variant="outline" onClick={() => go("provisioning")}><Workflow className="w-4 h-4" />{t("طابور التجهيز", "Provisioning queue")}</Button>
        <Button size="sm" variant="outline" onClick={() => go("providers")}><Settings className="w-4 h-4" />{t("إعدادات المزود", "Provider settings")}</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t("صحة المزودين", "Provider health")}</h3>
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm gap-2">
              <span>{p.name}</span>
              <span className="flex items-center gap-2"><Pill tone={toneOf(p.status)}>{p.status}</Pill>{p.last_error && <Pill tone="bad">{p.last_error}</Pill>}<span className="text-xs text-muted-foreground">{dt(p.last_health_check, lang)}</span></span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Activity className="w-4 h-4" />{t("آخر نشاط", "Recent activity")}</h3>
          {logs.slice(0, 8).map((l) => <div key={l.id} className="flex justify-between text-xs gap-2"><span className="font-mono">{l.event}</span><span className="text-muted-foreground">{dt(l.created_at, lang)}</span></div>)}
          {!logs.length && <Empty>{t("لا يوجد نشاط بعد", "No activity yet")}</Empty>}
        </div>
      </div>
    </div>
  );
}
