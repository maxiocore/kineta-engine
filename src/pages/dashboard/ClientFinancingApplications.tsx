import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Clock, CheckCircle2, XCircle, AlertCircle, 
  Loader2, Plus, ChevronLeft, Banknote, Calendar, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface FinancingApp {
  id: string;
  application_number: string;
  requested_amount: number;
  approved_amount: number | null;
  status: string;
  submitted_at: string;
  service_description: string | null;
  plan_id: string | null;
  current_phase: string | null;
  contract_number: string | null;
  financing_plans?: {
    name_ar: string;
    installments_count: number;
  } | null;
}

interface Installment {
  id: string;
  application_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "قيد المراجعة", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  approved: { label: "تمت الموافقة", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  active: { label: "نشط", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: CreditCard },
  completed: { label: "مكتمل", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  cancelled: { label: "ملغي", color: "bg-muted text-muted-foreground border-border", icon: XCircle },
};

const ClientFinancingApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<FinancingApp[]>([]);
  const [installments, setInstallments] = useState<Record<string, Installment[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`financing-apps-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "financing_applications",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchApplications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("financing_applications")
      .select("id, application_number, requested_amount, approved_amount, status, submitted_at, service_description, plan_id, current_phase, contract_number, financing_plans(name_ar, installments_count)")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (data) setApplications(data as any);
    setLoading(false);
  };

  const fetchInstallments = async (appId: string) => {
    if (installments[appId]) return;
    const { data } = await supabase
      .from("financing_installments")
      .select("*")
      .eq("application_id", appId)
      .order("installment_number");

    if (data) setInstallments(prev => ({ ...prev, [appId]: data }));
  };

  const toggleExpand = (appId: string) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
    } else {
      setExpandedApp(appId);
      fetchInstallments(appId);
    }
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">طلبات التمويل</h1>
            <p className="text-muted-foreground text-sm">تتبع حالة طلباتك وأقساطك</p>
          </div>
          <Button onClick={() => navigate("/dashboard/financing")} className="gap-2">
            <Plus className="h-4 w-4" />
            طلب جديد
          </Button>
        </div>

        {applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 space-y-4"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">لا توجد طلبات تمويل</h3>
            <p className="text-muted-foreground">ابدأ بتقديم طلب تمويل جديد لخدماتك</p>
            <Button onClick={() => navigate("/dashboard/financing")} className="gap-2">
              <Banknote className="h-4 w-4" />
              ابدأ الآن
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {applications.map((app, i) => {
              const status = statusConfig[app.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedApp === app.id;
              const appInstallments = installments[app.id] || [];

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={cn(
                      "border transition-all cursor-pointer hover:border-primary/30",
                      isExpanded && "border-primary/30"
                    )}
                    onClick={() => toggleExpand(app.id)}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", status.color)}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm" dir="ltr">{app.application_number}</span>
                              <Badge variant="outline" className={cn("text-xs", status.color)}>
                                {status.label}
                              </Badge>
                            </div>
                            {app.service_description && (
                              <p className="text-sm text-muted-foreground">{app.service_description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(app.submitted_at), "dd MMM yyyy", { locale: ar })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">المبلغ</p>
                            <p className="font-bold text-primary">{formatPrice(app.approved_amount || app.requested_amount)}</p>
                          </div>
                          {app.financing_plans && (
                            <div className="text-left">
                              <p className="text-xs text-muted-foreground">الخطة</p>
                              <p className="font-bold text-sm">{app.financing_plans.installments_count} قسط</p>
                            </div>
                          )}
                          <ChevronLeft className={cn("h-5 w-5 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                        </div>
                      </div>

                      {/* Installments */}
                      {isExpanded && appInstallments.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-4 border-t border-border"
                        >
                          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            جدول الأقساط
                          </h4>
                          <div className="space-y-2">
                            {appInstallments.map((inst) => (
                              <div
                                key={inst.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg text-sm",
                                  inst.status === "paid" ? "bg-green-500/5 border border-green-500/20" :
                                  inst.status === "overdue" ? "bg-red-500/5 border border-red-500/20" :
                                  "bg-muted/50 border border-border"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                    {inst.installment_number}
                                  </span>
                                  <div>
                                    <p className="font-medium">{formatPrice(inst.amount)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(inst.due_date), "dd MMM yyyy", { locale: ar })}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                  "text-xs",
                                  inst.status === "paid" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                  inst.status === "overdue" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                  "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                )}>
                                  {inst.status === "paid" ? "مدفوع" : inst.status === "overdue" ? "متأخر" : "قادم"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {isExpanded && appInstallments.length === 0 && app.status !== "pending" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 pt-4 border-t border-border text-center text-sm text-muted-foreground"
                        >
                          لم يتم إنشاء جدول الأقساط بعد
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientFinancingApplications;
