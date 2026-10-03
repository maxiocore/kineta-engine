import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, type T } from "./adminCloudShared";

const FILTERS: [string, string, string][] = [
  ["all", "الكل", "All"], ["server_ready", "جاهزية الخادم", "Server Ready"], ["provisioning", "التجهيز", "Provisioning"], ["billing", "الفوترة", "Billing"],
  ["renewal", "التجديد", "Renewal"], ["suspension", "التعليق", "Suspension"], ["termination", "الإنهاء", "Termination"], ["maintenance", "الصيانة", "Maintenance"],
];
const dt = (s?: string | null) => (s ? new Date(s).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

/** Admin view of cloud email jobs. Shows no provider secrets, only job state. */
export default function EmailDeliverySection({ t }: { t: T }) {
  const [cat, setCat] = useState("all");
  const [tests, setTests] = useState(false);
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-cloud", "email-jobs"],
    queryFn: async () => (await db.from("cloud_email_jobs").select("id,user_id,template,category,sender,locale,server_id,recipient,status,attempts,sent_at,delivery_status,last_error,is_test,created_at").order("created_at", { ascending: false }).limit(500)).data ?? [],
    refetchInterval: 30000,
  });
  const rows = useMemo(() => (data as any[]).filter((r) => (cat === "all" || r.category === cat) && (tests || !r.is_test)), [data, cat, tests]);
  const count = (s: string[]) => (data as any[]).filter((r) => (tests || !r.is_test) && s.includes(r.status)).length;
  const stats: [string, string, number][] = [
    [t("في الانتظار", "Queued"), "queued", count(["queued", "sending"])], [t("أُرسلت", "Sent"), "sent", count(["sent"])],
    [t("فشلت", "Failed"), "failed", count(["failed", "manual_review"])], [t("إعادة المحاولة", "Retrying"), "retrying", count(["retrying"])],
  ];
  const variant = (s: string) => (s === "sent" ? "default" : s === "failed" || s === "manual_review" ? "destructive" : "outline") as any;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /><h3 className="font-semibold">{t("تسليم البريد", "Email Delivery")}</h3></div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={tests ? "default" : "outline"} onClick={() => setTests(!tests)}>{t("إظهار رسائل الاختبار", "Show test emails")}</Button>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(([label, k, n]) => <div key={k} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{n}</p></div>)}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(([k, ar, en]) => <Button key={k} size="sm" variant={cat === k ? "default" : "outline"} onClick={() => setCat(k)}>{t(ar, en)}</Button>)}
      </div>
      {isLoading ? <Loader2 className="animate-spin" /> : rows.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">{t("لا توجد رسائل", "No emails")}</p> : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
              {[t("العميل", "Customer"), t("الخدمة", "Service"), t("القالب", "Template"), t("المستلم", "Recipient"), t("الحالة", "Status"), t("المحاولات", "Attempts"), t("وقت الإرسال", "Sent at")].map((h) => <th key={h} className="p-3 text-start font-medium">{h}</th>)}
            </tr></thead>
            <tbody>{rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono text-xs" dir="ltr">{r.user_id?.slice(0, 8) ?? "—"}</td>
                <td className="p-3 font-mono text-xs" dir="ltr">{r.server_id ? `SRV-${r.server_id.slice(0, 8).toUpperCase()}` : "—"}</td>
                <td className="p-3"><span className="font-medium">{r.template}</span><span className="block text-xs text-muted-foreground">{r.sender}@ · {r.locale.toUpperCase()}{r.is_test ? " · TEST" : ""}</span></td>
                <td className="p-3 text-xs" dir="ltr">{r.recipient ?? "—"}</td>
                <td className="p-3"><Badge variant={variant(r.status)}>{r.status}</Badge>{r.delivery_status && <span className="block text-xs mt-1">{r.delivery_status}</span>}{r.last_error && <span className="block text-xs text-destructive mt-1">{r.last_error}</span>}</td>
                <td className="p-3">{r.attempts}</td>
                <td className="p-3 text-xs">{dt(r.sent_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
