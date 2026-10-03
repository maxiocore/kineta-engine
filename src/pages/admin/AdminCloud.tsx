import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Cloud, Plus, Trash2, Loader2 } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { db, StatusBadge, sar } from "@/components/cloud/cloudShared";

const t = (a: string) => a;
const STATUSES = ["pending", "running", "stopped", "suspended", "failed", "cancelled"];

const AdminCloud = () => {
  const qc = useQueryClient();
  const { data: servers = [] } = useQuery({ queryKey: ["admin-cloud-servers"], queryFn: async () => (await db.from("cloud_servers").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: plans = [] } = useQuery({ queryKey: ["admin-cloud-plans"], queryFn: async () => (await db.from("cloud_plans").select("*").order("sort_order")).data ?? [] });
  const { data: actions = [] } = useQuery({ queryKey: ["admin-cloud-actions"], queryFn: async () => (await db.from("cloud_server_actions").select("*").eq("status", "requested").order("created_at")).data ?? [] });
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [np, setNp] = useState<any>({ server_type: "vps", code: "", name_ar: "", name_en: "", vcpu: 2, ram_gb: 4, storage_gb: 40, traffic_tb: 20, monthly_price: 0, setup_fee: 0, cpu_model: "" });
  const [saving, setSaving] = useState(false);

  const saveServer = async (id: string) => {
    const { error } = await db.from("cloud_servers").update(edits[id]).eq("id", id);
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم التحديث"); setEdits((e) => ({ ...e, [id]: undefined }));
    qc.invalidateQueries({ queryKey: ["admin-cloud-servers"] });
  };
  const doneAction = async (id: string) => {
    await db.from("cloud_server_actions").update({ status: "completed" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-cloud-actions"] });
  };
  const addPlan = async () => {
    if (!np.code || !np.name_ar || !np.name_en) return toast.error("أكمل الحقول المطلوبة");
    setSaving(true);
    const { error } = await db.from("cloud_plans").insert({ ...np, cpu_model: np.cpu_model || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تمت إضافة الباقة"); qc.invalidateQueries({ queryKey: ["admin-cloud-plans"] });
  };
  const togglePlan = async (p: any) => { await db.from("cloud_plans").update({ is_active: !p.is_active }).eq("id", p.id); qc.invalidateQueries({ queryKey: ["admin-cloud-plans"] }); };
  const delPlan = async (id: string) => { const { error } = await db.from("cloud_plans").delete().eq("id", id); if (error) toast.error("لا يمكن الحذف"); qc.invalidateQueries({ queryKey: ["admin-cloud-plans"] }); };
  const set = (id: string, k: string, v: any) => setEdits((e) => ({ ...e, [id]: { ...(e[id] ?? {}), [k]: v } }));

  return (
    <AdminDashboardLayout>
      <div className="space-y-5" dir="rtl">
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><Cloud className="w-5 h-5" /></div><h1 className="text-lg font-bold">الخوادم والبنية السحابية</h1></div>
        <Tabs defaultValue="servers" dir="rtl">
          <TabsList><TabsTrigger value="servers">خوادم العملاء ({servers.length})</TabsTrigger><TabsTrigger value="actions">طلبات معلقة ({actions.length})</TabsTrigger><TabsTrigger value="plans">الباقات</TabsTrigger></TabsList>

          <TabsContent value="servers" className="space-y-2 mt-4">
            {servers.map((s: any) => (
              <div key={s.id} className="p-4 rounded-xl border bg-card space-y-3">
                <div className="flex flex-wrap items-center gap-3"><b dir="ltr">{s.name}</b><StatusBadge status={s.status} t={t} /><span className="text-xs text-muted-foreground">{s.server_type} · {s.location_code} · {s.image_code} · {sar(s.monthly_price, "ar")}</span></div>
                <div className="grid sm:grid-cols-4 gap-2">
                  <select className="h-10 rounded-md border bg-background px-2 text-sm" defaultValue={s.status} onChange={(e) => set(s.id, "status", e.target.value)}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
                  <Input dir="ltr" placeholder="IPv4" defaultValue={s.primary_ipv4 ?? ""} onChange={(e) => set(s.id, "primary_ipv4", e.target.value || null)} />
                  <Input dir="ltr" placeholder="IPv6" defaultValue={s.primary_ipv6 ?? ""} onChange={(e) => set(s.id, "primary_ipv6", e.target.value || null)} />
                  <Button disabled={!edits[s.id]} onClick={() => saveServer(s.id)}>حفظ</Button>
                </div>
              </div>
            ))}
            {!servers.length && <p className="text-sm text-muted-foreground">لا توجد خوادم بعد</p>}
          </TabsContent>

          <TabsContent value="actions" className="space-y-2 mt-4">
            {actions.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border bg-card text-sm">
                <span><b>{a.action}</b> · <span dir="ltr">{servers.find((s: any) => s.id === a.server_id)?.name}</span> · {new Date(a.created_at).toLocaleString("ar-SA")}</span>
                <Button size="sm" onClick={() => doneAction(a.id)}>تم التنفيذ</Button>
              </div>
            ))}
            {!actions.length && <p className="text-sm text-muted-foreground">لا توجد طلبات معلقة</p>}
          </TabsContent>

          <TabsContent value="plans" className="space-y-4 mt-4">
            <div className="p-4 rounded-xl border bg-card grid sm:grid-cols-4 gap-2">
              <select className="h-10 rounded-md border bg-background px-2 text-sm" value={np.server_type} onChange={(e) => setNp({ ...np, server_type: e.target.value })}><option value="vps">VPS</option><option value="dedicated">Dedicated</option></select>
              {[["code", "الرمز"], ["name_ar", "الاسم عربي"], ["name_en", "الاسم إنجليزي"], ["cpu_model", "المعالج (مخصص)"]].map(([k, l]) => <Input key={k} placeholder={l} value={np[k]} onChange={(e) => setNp({ ...np, [k]: e.target.value })} />)}
              {[["vcpu", "vCPU"], ["ram_gb", "RAM GB"], ["storage_gb", "تخزين GB"], ["traffic_tb", "نقل TB"], ["monthly_price", "السعر الشهري"], ["setup_fee", "رسوم التجهيز"]].map(([k, l]) => <Input key={k} type="number" placeholder={l} value={np[k]} onChange={(e) => setNp({ ...np, [k]: Number(e.target.value) })} />)}
              <Button onClick={addPlan} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}إضافة باقة</Button>
            </div>
            {plans.map((p: any) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card text-sm">
                <b className="flex-1">{p.name_ar} <span className="text-muted-foreground font-normal">({p.server_type}) · {p.vcpu ?? p.cpu_model} · {p.ram_gb}GB · {p.storage_gb}GB</span></b>
                <span>{sar(p.monthly_price, "ar")}</span>
                <Switch checked={p.is_active} onCheckedChange={() => togglePlan(p)} />
                <Button size="icon" variant="ghost" onClick={() => delPlan(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCloud;
