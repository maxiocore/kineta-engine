import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  Wallet
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Currency, BidiNumber } from "@/components/ui/rtl-utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface FinancingQuickStatsProps {
  paidAmount: number;
  remainingAmount: number;
  nextInstallmentAmount?: number;
  nextInstallmentDate?: string;
  remainingInstallments: number;
  overdueAmount?: number;
  overdueCount?: number;
}

interface StatItemProps {
  icon: React.ElementType;
  iconGradient: string;
  label: string;
  value: number;
  subValue?: string;
  valueColor?: string;
  delay?: number;
  isAlert?: boolean;
}

function StatItem({ 
  icon: Icon, 
  iconGradient, 
  label, 
  value, 
  subValue,
  valueColor = "text-white",
  delay = 0,
  isAlert = false
}: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.02, y: -3 }}
      className="h-full"
    >
      <Card className={`h-full overflow-hidden border-0 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow ${
        isAlert ? "ring-1 ring-red-500/30" : ""
      }`}>
        <CardContent className="p-4 sm:p-5 h-full flex flex-col">
          <div className="flex items-start justify-between gap-2 flex-1">
            <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${valueColor} break-words`}>
                <Currency amount={value} className="font-bold" />
              </p>
              {subValue && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">{subValue}</p>
              )}
            </div>
            <motion.div 
              className={`p-2.5 sm:p-3 rounded-xl ${iconGradient} shadow-lg flex-shrink-0`}
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function FinancingQuickStats({
  paidAmount,
  remainingAmount,
  nextInstallmentAmount,
  nextInstallmentDate,
  remainingInstallments,
  overdueAmount = 0,
  overdueCount = 0
}: FinancingQuickStatsProps) {
  const hasOverdue = overdueAmount > 0;

  return (
    <div 
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" 
      dir="rtl"
    >
      {/* Paid Amount */}
      <StatItem
        icon={CheckCircle2}
        iconGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        label="المبلغ المدفوع"
        value={paidAmount}
        valueColor="text-emerald-500"
        delay={0}
      />

      {/* Remaining Amount */}
      <StatItem
        icon={Wallet}
        iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
        label="المبلغ المتبقي"
        value={remainingAmount}
        subValue={`${remainingInstallments} قسط متبقي`}
        valueColor="text-amber-500"
        delay={0.1}
      />

      {/* Next Installment */}
      {nextInstallmentAmount && nextInstallmentDate && (
        <StatItem
          icon={Calendar}
          iconGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          label="القسط القادم"
          value={nextInstallmentAmount}
          subValue={format(new Date(nextInstallmentDate), "dd MMMM yyyy", { locale: ar })}
          valueColor="text-blue-500"
          delay={0.2}
        />
      )}

      {/* Overdue or Installments Progress */}
      {hasOverdue ? (
        <StatItem
          icon={AlertTriangle}
          iconGradient="bg-gradient-to-br from-red-500 to-rose-600"
          label="أقساط متأخرة"
          value={overdueAmount}
          subValue={`${overdueCount} قسط متأخر`}
          valueColor="text-red-500"
          delay={0.3}
          isAlert={true}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
          whileHover={{ scale: 1.02, y: -3 }}
          className="h-full"
        >
          <Card className="h-full overflow-hidden border-0 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5 h-full flex flex-col">
              <div className="flex items-start justify-between gap-2 flex-1">
                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">حالة السداد</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                    <span className="text-base sm:text-lg font-bold text-emerald-500">منتظم</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">جميع الأقساط في موعدها</p>
                </div>
                <motion.div 
                  className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg flex-shrink-0"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
