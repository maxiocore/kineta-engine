import { ReactNode, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/components/cloud/cloudShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export { db };
export type T = (ar: string, en: string) => string;

export const useTable = (table: string, order = "created_at", asc = false, select = "*") =>
  useQuery({
    queryKey: ["admin-cloud", table, select],
    queryFn: async () => {
      // cloud_orders cost/margin columns are not readable via the table API; admins use a checked RPC
      const { data, error } = table === "cloud_orders"
        ? await (db as any).rpc("admin_list_cloud_orders")
        : await db.from(table).select(select).order(order, { ascending: asc }).limit(1000);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useInvalidate = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin-cloud"] });
};

export async function cloudApi(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("cloud-api", { body });
  if (error) return { ok: false, error: "request_failed" } as any;
  return data as any;
}

export const money = (n: number | null | undefined, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(Number(n ?? 0));

export const dt = (d: string | null | undefined, lang: string) => (d ? new Date(d).toLocaleString(lang === "ar" ? "ar-SA" : "en-US") : "—");

export const Stat = ({ label, value, tone }: { label: string; value: ReactNode; tone?: "warn" | "bad" | "good" }) => (
  <div className="rounded-xl border bg-card p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={cn("mt-1 text-xl font-bold tabular-nums", tone === "bad" && "text-destructive", tone === "warn" && "text-amber-600 dark:text-amber-400", tone === "good" && "text-emerald-600 dark:text-emerald-400")}>{value}</p>
  </div>
);

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">{children}</div>
);

export const Pill = ({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "good" | "warn" | "bad" | "info" }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
    tone === "muted" && "bg-muted text-muted-foreground",
    tone === "good" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    tone === "warn" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    tone === "bad" && "border-destructive/30 bg-destructive/10 text-destructive",
    tone === "info" && "border-primary/30 bg-primary/10 text-primary")}>{children}</span>
);

export const toneOf = (s: string): "muted" | "good" | "warn" | "bad" | "info" =>
  ["running", "active", "completed", "connected", "enabled", "paid"].includes(s) ? "good"
  : ["failed", "provisioning_failed", "suspended", "auth_failed", "unavailable", "refunded"].includes(s) ? "bad"
  : ["pending", "queued", "provisioning", "requested", "pending_payment", "maintenance", "config_missing"].includes(s) ? "warn" : "muted";

/** Responsive data table: horizontal scroll inside its card on small screens. */
export const DataTable = ({ cols, rows, empty }: { cols: string[]; rows: ReactNode[][]; empty: string }) =>
  rows.length ? (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{cols.map((c) => <th key={c} className="px-3 py-2 text-start font-medium whitespace-nowrap">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t hover:bg-muted/30">{r.map((c, j) => <td key={j} className="px-3 py-2 align-middle whitespace-nowrap">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  ) : <Empty>{empty}</Empty>;

export type Field = { k: string; label: string; type?: "text" | "number" | "bool" | "select" | "list"; options?: { v: string; l: string }[]; ltr?: boolean; required?: boolean };

/** Generic editor dialog for admin-managed catalogue rows. */
export function EditDialog({ open, onOpenChange, title, fields, initial, onSave, t }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; fields: Field[]; initial: Record<string, any>;
  onSave: (v: Record<string, any>) => Promise<boolean>; t: T;
}) {
  const [v, setV] = useState<Record<string, any>>(initial);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(initial);
  if (key !== initial) { setKey(initial); setV(initial); }
  const save = async () => {
    for (const f of fields) if (f.required && (v[f.k] === undefined || v[f.k] === "" || v[f.k] === null)) return toast.error(t(`الحقل مطلوب: ${f.label}`, `Required: ${f.label}`));
    setBusy(true); const ok = await onSave(v); setBusy(false); if (ok) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          {fields.map((f) => (
            <label key={f.k} className={cn("space-y-1 text-xs", f.type === "bool" && "flex items-center justify-between rounded-lg border p-2.5 space-y-0")}>
              <span className="text-muted-foreground">{f.label}{f.required && " *"}</span>
              {f.type === "bool" ? <Switch checked={!!v[f.k]} onCheckedChange={(c) => setV({ ...v, [f.k]: c })} />
                : f.type === "select" ? (
                  <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={v[f.k] ?? ""} onChange={(e) => setV({ ...v, [f.k]: e.target.value || null })}>
                    <option value="">—</option>{f.options?.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>)
                : <Input dir={f.ltr || f.type === "number" ? "ltr" : undefined} type={f.type === "number" ? "number" : "text"} step="any"
                    value={f.type === "list" ? (v[f.k] ?? []).join(", ") : (v[f.k] ?? "")}
                    onChange={(e) => setV({ ...v, [f.k]: f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : f.type === "list" ? e.target.value.split(",").map((x) => x.trim()).filter(Boolean) : e.target.value })} />}
            </label>
          ))}
        </div>
        <DialogFooter><Button onClick={save} disabled={busy}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{t("حفظ", "Save")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** CRUD section for a simple catalogue table. */
export function CrudSection({ table, fields, cols, render, defaults, t, title, order = "sort_order", filter }: {
  table: string; fields: Field[]; cols: string[]; render: (r: any) => ReactNode[]; defaults: Record<string, any>; t: T; title: string; order?: string; filter?: (r: any) => boolean;
}) {
  const { data = [] } = useTable(table, order, true);
  const inv = useInvalidate();
  const [edit, setEdit] = useState<Record<string, any> | null>(null);
  const rows = filter ? data.filter(filter) : data;
  const save = async (v: Record<string, any>) => {
    const clean = Object.fromEntries(fields.map((f) => [f.k, v[f.k] ?? (f.type === "bool" ? false : null)]));
    const { error } = v.id ? await db.from(table).update(clean).eq("id", v.id) : await db.from(table).insert({ ...defaults, ...clean });
    if (error) { toast.error(error.message); return false; }
    toast.success(t("تم الحفظ", "Saved")); inv(); return true;
  };
  const del = async (id: string) => {
    if (!confirm(t("تأكيد الحذف؟", "Confirm delete?"))) return;
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) toast.error(t("لا يمكن الحذف لارتباطه ببيانات أخرى", "Cannot delete: in use")); else inv();
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{title} <span className="text-muted-foreground text-sm">({rows.length})</span></h3>
        <Button size="sm" onClick={() => setEdit({ ...defaults })}><Plus className="w-4 h-4" />{t("إضافة", "Add")}</Button></div>
      <DataTable cols={[...cols, ""]} empty={t("لا توجد عناصر بعد", "No items yet")}
        rows={rows.map((r) => [...render(r), <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => setEdit(r)} aria-label="edit"><Pencil className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={() => del(r.id)} aria-label="delete"><Trash2 className="w-4 h-4 text-destructive" /></Button></div>])} />
      <EditDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={title} fields={fields} initial={edit ?? {}} onSave={save} t={t} />
    </div>
  );
}
