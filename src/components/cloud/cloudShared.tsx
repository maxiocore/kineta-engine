import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// New cloud tables may not yet be in generated types; keep a loose client handle here.
export const db = supabase as any;

export interface CloudServer {
  id: string; user_id: string; name: string; hostname: string | null; server_type: "vps" | "dedicated";
  status: string; location_code: string | null; image_code: string | null; primary_ipv4: string | null;
  primary_ipv6: string | null; backups_enabled: boolean; monthly_price: number; renewal_date: string | null;
  specs: Record<string, any>; created_at: string;
}

export const STATUS: Record<string, { ar: string; en: string; cls: string }> = {
  pending: { ar: "قيد التجهيز", en: "Provisioning", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  running: { ar: "يعمل", en: "Running", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  stopped: { ar: "متوقف", en: "Stopped", cls: "bg-muted text-muted-foreground border-border" },
  suspended: { ar: "معلّق", en: "Suspended", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  failed: { ar: "فشل", en: "Failed", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelled: { ar: "ملغي", en: "Cancelled", cls: "bg-muted text-muted-foreground border-border" },
  requested: { ar: "مطلوب", en: "Requested", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  completed: { ar: "مكتمل", en: "Completed", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
};

export const StatusBadge = ({ status, t }: { status: string; t: (a: string, e: string) => string }) => {
  const s = STATUS[status] ?? { ar: status, en: status, cls: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", s.cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full bg-current", status === "running" && "animate-pulse")} />
      {t(s.ar, s.en)}
    </Badge>
  );
};

export const useCloudServers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cloud-servers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("cloud_servers").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CloudServer[];
    },
  });
};

export const useCloudTable = (table: string, key: string, order = "created_at") => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [table, key, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from(table).select("*").eq("user_id", user!.id).order(order, { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
};

export const useCatalog = (table: "cloud_plans" | "cloud_locations" | "cloud_images") =>
  useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await db.from(table).select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const EmptyState = ({ icon: Icon, title, desc, action }: { icon: LucideIcon; title: string; desc?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl border border-dashed border-border bg-muted/20 animate-fade-in">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4"><Icon className="w-7 h-7" /></div>
    <h3 className="font-semibold text-base mb-1">{title}</h3>
    {desc && <p className="text-sm text-muted-foreground max-w-md mb-4">{desc}</p>}
    {action}
  </div>
);

export const sar = (n: number, lang: string) =>
  `${Number(n || 0).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", { maximumFractionDigits: 2 })} ${lang === "ar" ? "ر.س" : "SAR"}`;

// Billing dates are always Gregorian (never Hijri) so due/renewal dates are unambiguous.
export const fmtDate = (d: string | null, lang: string) =>
  d ? new Date(d).toLocaleDateString(lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { year: "numeric", month: "long", day: "numeric", calendar: "gregory" } as Intl.DateTimeFormatOptions) : "—";
