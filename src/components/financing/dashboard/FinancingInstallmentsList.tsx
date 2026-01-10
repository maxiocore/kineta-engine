import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Currency, BidiNumber, DateDisplay } from "@/components/ui/rtl-utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue";
  paid_at?: string | null;
}

interface FinancingInstallmentsListProps {
  installments: Installment[];
  totalAmount: number;
  showAll?: boolean;
}

const statusConfig = {
  pending: { 
    label: "قيد الانتظار", 
    color: "text-yellow-400", 
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    icon: Clock 
  },
  paid: { 
    label: "مدفوع", 
    color: "text-emerald-400", 
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    icon: CheckCircle2 
  },
  overdue: { 
    label: "متأخر", 
    color: "text-red-400", 
    bgColor: "bg-red-500/10 border-red-500/30",
    icon: AlertTriangle 
  },
};

export default function FinancingInstallmentsList({ 
  installments, 
  totalAmount,
  showAll: initialShowAll = false
}: FinancingInstallmentsListProps) {
  const [showAll, setShowAll] = useState(initialShowAll);
  
  const paidCount = installments.filter(i => i.status === "paid").length;
  const totalPaid = installments.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const remainingAmount = totalAmount - totalPaid;
  const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  
  const displayedInstallments = showAll ? installments : installments.slice(0, 4);
  const hasMore = installments.length > 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base sm:text-lg">جدول الأقساط</CardTitle>
                <p className="text-slate-400 text-xs sm:text-sm">
                  <BidiNumber value={paidCount} /> من <BidiNumber value={installments.length} /> أقساط مدفوعة
                </p>
              </div>
            </div>
            <div className="text-right sm:text-left self-end sm:self-auto">
              <p className="text-slate-400 text-[10px] sm:text-xs">نسبة السداد</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                <BidiNumber value={Math.round(progress)} />%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4" dir="ltr">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-l from-teal-500 to-emerald-400 rounded-full"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Summary Stats - Always Visible */}
          <div className="grid grid-cols-3 border-b divide-x divide-border" dir="rtl">
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">إجمالي المبلغ</p>
              <p className="font-bold text-sm sm:text-lg">
                <Currency amount={totalAmount} />
              </p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">المدفوع</p>
              <p className="font-bold text-sm sm:text-lg text-emerald-500">
                <Currency amount={totalPaid} />
              </p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">المتبقي</p>
              <p className="font-bold text-sm sm:text-lg text-amber-500">
                <Currency amount={remainingAmount} />
              </p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto" dir="rtl">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">القسط</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">تاريخ الاستحقاق</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">المبلغ</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">الحالة</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {displayedInstallments.map((installment, index) => {
                    const config = statusConfig[installment.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    const isNext = installment.status === "pending" && 
                      !installments.slice(0, index).some(i => i.status === "pending");
                    
                    return (
                      <motion.tr
                        key={installment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b hover:bg-muted/30 transition-colors ${
                          isNext ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              installment.status === "paid" 
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                                : isNext
                                  ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              <bdi dir="ltr">{installment.installment_number}</bdi>
                            </div>
                            <span className="font-medium">
                              القسط <BidiNumber value={installment.installment_number} />
                            </span>
                            {isNext && (
                              <Badge className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5">
                                القادم
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {format(new Date(installment.due_date), "dd MMMM yyyy", { locale: ar })}
                        </td>
                        <td className="p-3">
                          <span className="font-bold">
                            <Currency amount={installment.amount} />
                          </span>
                        </td>
                        <td className="p-3">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bgColor}`}>
                            <StatusIcon className={`h-3.5 w-3.5 ${config.color}`} />
                            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border" dir="rtl">
            <AnimatePresence mode="popLayout">
              {displayedInstallments.map((installment, index) => {
                const config = statusConfig[installment.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const isNext = installment.status === "pending" && 
                  !installments.slice(0, index).some(i => i.status === "pending");
                
                return (
                  <motion.div
                    key={installment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 ${isNext ? "bg-amber-500/5" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Number & Info */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          installment.status === "paid" 
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                            : isNext
                              ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 animate-pulse"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          <bdi dir="ltr">{installment.installment_number}</bdi>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">
                              القسط <BidiNumber value={installment.installment_number} />
                            </span>
                            {isNext && (
                              <Badge className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5">
                                <TrendingUp className="h-2.5 w-2.5 ms-0.5" />
                                القادم
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(installment.due_date), "dd MMMM yyyy", { locale: ar })}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount & Status */}
                      <div className="text-left flex flex-col items-end gap-1.5">
                        <span className="font-bold text-base">
                          <Currency amount={installment.amount} />
                        </span>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${config.bgColor}`}>
                          <StatusIcon className={`h-3 w-3 ${config.color}`} />
                          <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Show More Button */}
          {hasMore && (
            <div className="p-3 sm:p-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 ms-2" />
                    عرض أقل
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 ms-2" />
                    عرض الكل ({installments.length} قسط)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Footer Note */}
          <div className="p-3 sm:p-4 bg-muted/30 text-center border-t">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              موعد سداد الأقساط: يوم 30 من كل شهر ميلادي
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
