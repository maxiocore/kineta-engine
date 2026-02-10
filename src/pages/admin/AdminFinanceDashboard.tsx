import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Search,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface FinanceApplication {
  id: string;
  application_number: string;
  full_name: string;
  status: string;
  requested_amount: number | null;
  approved_amount: number | null;
  service_description: string | null;
  updated_at: string;
  created_at: string;
  phone: string | null;
  email: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "قيد المراجعة", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: Clock },
  PENDING: { label: "قيد المراجعة", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: Clock },
  approved: { label: "موافق عليه", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  APPROVED: { label: "موافق عليه", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: XCircle },
  REJECTED: { label: "مرفوض", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: XCircle },
  CREDIT_DEPOSITED: { label: "تم الإيداع", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: Banknote },
  CONTRACT_FINALIZED: { label: "عقد نهائي", color: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: CheckCircle2 },
  FIN_CONTRACT_FINALIZED: { label: "عقد نهائي", color: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: CheckCircle2 },
  cancelled: { label: "ملغي", color: "bg-muted text-muted-foreground border-border", icon: XCircle },
};

const getStatusInfo = (status: string) =>
  statusConfig[status] || { label: status, color: "bg-muted text-muted-foreground border-border", icon: AlertCircle };

// Finance Dashboard - Real-time monitoring
const AdminFinanceDashboard = () => {
  const [applications, setApplications] = useState<FinanceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from("financing_applications")
      .select("id, application_number, full_name, status, requested_amount, approved_amount, service_description, updated_at, created_at, phone, email")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setApplications(data as FinanceApplication[]);
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchApplications();

    // Real-time subscription
    const channel = supabase
      .channel("finance-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "financing_applications" },
        () => fetchApplications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApplications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const filtered = applications.filter((app) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      app.full_name?.toLowerCase().includes(q) ||
      app.application_number?.toLowerCase().includes(q) ||
      app.service_description?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.status?.toLowerCase().includes(q)
    );
  });

  // Stats
  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => ["pending", "PENDING"].includes(a.status)).length;
  const approvedCount = applications.filter((a) => ["approved", "APPROVED", "CREDIT_DEPOSITED", "CONTRACT_FINALIZED", "FIN_CONTRACT_FINALIZED"].includes(a.status)).length;
  const rejectedCount = applications.filter((a) => ["rejected", "REJECTED", "cancelled"].includes(a.status)).length;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Banknote className="h-7 w-7 text-primary" />
              لوحة متابعة التمويل
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              آخر تحديث: {format(lastRefresh, "hh:mm:ss a", { locale: ar })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="إجمالي الطلبات" value={totalCount} icon={TrendingUp} color="text-primary" />
          <StatCard label="قيد المراجعة" value={pendingCount} icon={Clock} color="text-amber-500" />
          <StatCard label="موافق عليها" value={approvedCount} icon={CheckCircle2} color="text-emerald-500" />
          <StatCard label="مرفوضة" value={rejectedCount} icon={XCircle} color="text-red-500" />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، رقم الطلب، الخدمة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">طلبات التمويل ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Banknote className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>لا توجد طلبات تمويل</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-right p-3 font-medium text-muted-foreground">رقم الطلب</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">اسم العميل</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">الخدمة</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">المبلغ</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">حالة التمويل</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">آخر تحديث</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((app) => {
                      const statusInfo = getStatusInfo(app.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={app.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">{app.application_number}</td>
                          <td className="p-3 font-medium">{app.full_name || "—"}</td>
                          <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                            {app.service_description || "—"}
                          </td>
                          <td className="p-3 font-medium tabular-nums">
                            {(app.approved_amount || app.requested_amount)
                              ? `${(app.approved_amount || app.requested_amount)?.toLocaleString()} ر.س`
                              : "—"}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className={`gap-1.5 ${statusInfo.color}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {format(new Date(app.updated_at), "dd MMM yyyy - hh:mm a", { locale: ar })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl bg-muted ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default AdminFinanceDashboard;
