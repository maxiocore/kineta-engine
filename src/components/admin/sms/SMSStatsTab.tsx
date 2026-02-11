import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

const SMSStatsTab = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["sms-stats"],
    queryFn: async () => {
      const [totalRes, sentRes, failedRes, todayRes, weekRes] = await Promise.all([
        supabase.from("sms_logs").select("*", { count: "exact", head: true }),
        supabase.from("sms_logs").select("*", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("sms_logs").select("*", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("sms_logs").select("*", { count: "exact", head: true }).gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from("sms_logs").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const total = totalRes.count || 0;
      const sent = sentRes.count || 0;
      const failed = failedRes.count || 0;
      const today = todayRes.count || 0;
      const week = weekRes.count || 0;
      const deliveryRate = total > 0 ? ((sent / total) * 100).toFixed(1) : "0";

      return { total, sent, failed, today, week, deliveryRate };
    },
  });

  const { data: byType } = useQuery({
    queryKey: ["sms-stats-by-type"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_logs")
        .select("type, status");
      if (error) throw error;

      const grouped: Record<string, { total: number; sent: number; failed: number }> = {};
      data?.forEach((log) => {
        const t = log.type || "غير محدد";
        if (!grouped[t]) grouped[t] = { total: 0, sent: 0, failed: 0 };
        grouped[t].total++;
        if (log.status === "sent") grouped[t].sent++;
        if (log.status === "failed") grouped[t].failed++;
      });
      return grouped;
    },
  });

  const { data: templateStats } = useQuery({
    queryKey: ["sms-template-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .order("category");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "إجمالي الرسائل", value: stats?.total || 0, icon: MessageSquare, color: "text-primary" },
    { label: "تم الإرسال", value: stats?.sent || 0, icon: CheckCircle, color: "text-emerald-500" },
    { label: "فشل الإرسال", value: stats?.failed || 0, icon: XCircle, color: "text-destructive" },
    { label: "اليوم", value: stats?.today || 0, icon: Clock, color: "text-amber-500" },
    { label: "هذا الأسبوع", value: stats?.week || 0, icon: TrendingUp, color: "text-blue-500" },
    { label: "نسبة التسليم", value: `${stats?.deliveryRate}%`, icon: CheckCircle, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الرسائل حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            {byType && Object.keys(byType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(byType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{type}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{data.total} إجمالي</span>
                      <span className="text-emerald-500">{data.sent} ✓</span>
                      {data.failed > 0 && <span className="text-destructive">{data.failed} ✗</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات بعد</p>
            )}
          </CardContent>
        </Card>

        {/* Templates Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">القوالب المسجلة</CardTitle>
          </CardHeader>
          <CardContent>
            {templateStats && templateStats.length > 0 ? (
              <div className="space-y-2">
                {templateStats.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.is_active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                      <span className="text-sm">{t.name_ar}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{t.template_key}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد قوالب</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SMSStatsTab;
