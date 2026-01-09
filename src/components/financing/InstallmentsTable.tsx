import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at?: string | null;
}

interface InstallmentsTableProps {
  installments: Installment[];
  totalAmount: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  pending: { 
    label: "قيد الانتظار", 
    color: "text-yellow-400", 
    icon: <Clock className="h-4 w-4" />,
    bg: "bg-yellow-500/10 border-yellow-500/30"
  },
  paid: { 
    label: "مدفوع", 
    color: "text-emerald-400", 
    icon: <CheckCircle2 className="h-4 w-4" />,
    bg: "bg-emerald-500/10 border-emerald-500/30"
  },
  overdue: { 
    label: "متأخر", 
    color: "text-red-400", 
    icon: <AlertTriangle className="h-4 w-4" />,
    bg: "bg-red-500/10 border-red-500/30"
  },
};

export default function InstallmentsTable({ installments, totalAmount }: InstallmentsTableProps) {
  const paidCount = installments.filter(i => i.status === "paid").length;
  const totalPaid = installments.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const remainingAmount = totalAmount - totalPaid;
  const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">جدول الأقساط</CardTitle>
              <p className="text-slate-400 text-sm">{paidCount} من {installments.length} أقساط مدفوعة</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-slate-400 text-xs">نسبة السداد</p>
            <p className="text-2xl font-bold text-white">{progress.toFixed(0)}%</p>
          </div>
        </div>

        {/* Progress Bar - RTL: يبدأ من اليمين */}
        <div className="mt-4" dir="ltr">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-l from-teal-500 to-emerald-400 rounded-full"
              style={{ marginInlineStart: "auto", marginInlineEnd: 0 }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 divide-x divide-border border-b" dir="rtl">
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">إجمالي المبلغ</p>
            <p className="font-bold text-lg">{totalAmount.toLocaleString()} ر.س</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">المدفوع</p>
            <p className="font-bold text-lg text-emerald-500">{totalPaid.toLocaleString()} ر.س</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">المتبقي</p>
            <p className="font-bold text-lg text-amber-500">{remainingAmount.toLocaleString()} ر.س</p>
          </div>
        </div>

        {/* Installments List */}
        <div className="divide-y divide-border" dir="rtl">
          {installments.map((installment, index) => {
            const config = statusConfig[installment.status] || statusConfig.pending;
            const isNext = installment.status === "pending" && 
              !installments.slice(0, index).some(i => i.status === "pending");
            
            return (
              <motion.div
                key={installment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 flex items-center justify-between hover:bg-muted/30 transition-colors ${
                  isNext ? "bg-amber-500/5" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Number Badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    installment.status === "paid" 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                      : isNext
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 animate-pulse"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    <bdi dir="ltr">{installment.installment_number}</bdi>
                  </div>

                  {/* Info */}
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">القسط <bdi dir="ltr">{installment.installment_number}</bdi></p>
                      {isNext && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                          <TrendingUp className="h-3 w-3 ms-1" />
                          القادم
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(installment.due_date), "dd MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Amount */}
                  <div className="text-start">
                    <p className="font-bold text-lg"><bdi dir="ltr">{installment.amount.toFixed(2)}</bdi></p>
                    <p className="text-xs text-muted-foreground">ر.س</p>
                  </div>

                  {/* Status Badge */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg}`}>
                    <span className={config.color}>{config.icon}</span>
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            موعد سداد الأقساط: يوم 30 من كل شهر ميلادي
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
