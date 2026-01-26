import { motion } from "framer-motion";
import { 
  Landmark, 
  Shield, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BidiNumber, Currency } from "@/components/ui/rtl-utils";

interface FinancingHeroCardProps {
  status: "active" | "completed" | "overdue" | "pending";
  contractNumber: string;
  applicationNumber: string;
  serviceBalance: number;
  isBalanceLoading?: boolean;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentsCount: number;
  paidInstallments: number;
  userName: string;
  planName?: string;
}

const statusConfig = {
  active: {
    label: "تمويل نشط",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    icon: <TrendingUp className="h-4 w-4" />,
    gradient: "from-emerald-500 to-teal-600"
  },
  completed: {
    label: "مكتمل",
    color: "bg-primary/20 text-primary border-primary/40",
    icon: <CheckCircle2 className="h-4 w-4" />,
    gradient: "from-primary to-primary/80"
  },
  overdue: {
    label: "متأخر",
    color: "bg-red-500/20 text-red-400 border-red-500/40",
    icon: <AlertTriangle className="h-4 w-4" />,
    gradient: "from-red-500 to-rose-600"
  },
  pending: {
    label: "قيد المراجعة",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    icon: <Clock className="h-4 w-4" />,
    gradient: "from-yellow-500 to-orange-600"
  }
};

export default function FinancingHeroCard({
  status,
  contractNumber,
  applicationNumber,
  serviceBalance,
  isBalanceLoading = false,
  totalAmount,
  paidAmount,
  remainingAmount,
  installmentsCount,
  paidInstallments,
  userName,
  planName
}: FinancingHeroCardProps) {
  const config = statusConfig[status];
  const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
      dir="rtl"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-amber-500/10 to-transparent rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      
      <div className="relative z-10">
        {/* Gold Top Strip */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
        
        {/* Main Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Brand & Status */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                <Landmark className="h-6 w-6 sm:h-7 sm:w-7 text-slate-900" />
              </div>
              <div>
                <p className="text-amber-400 font-bold text-base sm:text-lg tracking-wide">MaxioCore</p>
                <p className="text-slate-400 text-xs sm:text-sm">{planName || "التمويل المرن"}</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <Badge className={`${config.color} border px-3 py-1.5 flex items-center gap-1.5`}>
              {config.icon}
              <span className="font-medium">{config.label}</span>
            </Badge>
          </div>

          {/* Service Balance - Most Important */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-500/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                <p className="text-emerald-300 text-sm font-medium">رصيد الخدمات المتاح</p>
              </div>
              <div className="flex items-baseline gap-1 sm:gap-2">
                {isBalanceLoading ? (
                  <div className="h-12 sm:h-14 lg:h-16 w-32 sm:w-40 lg:w-48 bg-white/10 animate-pulse rounded-lg" />
                ) : (
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                    <BidiNumber value={serviceBalance ?? 0} locale="ar-SA" />
                  </span>
                )}
                <span className="text-amber-400 text-lg sm:text-xl lg:text-2xl font-bold">ر.س</span>
              </div>
            </div>
          </div>

          {/* Contract & Application Numbers */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
              <p className="text-slate-400 text-[10px] sm:text-xs mb-1">رقم العقد</p>
              <p className="text-amber-400 font-mono text-xs sm:text-sm font-bold truncate">
                <bdi dir="ltr">{contractNumber || "—"}</bdi>
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
              <p className="text-slate-400 text-[10px] sm:text-xs mb-1">رقم الطلب</p>
              <p className="text-white font-mono text-xs sm:text-sm font-bold truncate">
                <bdi dir="ltr">#{applicationNumber}</bdi>
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-700/50 space-y-3 sm:space-y-4">
            {/* Progress Labels */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                المدفوع: <Currency amount={paidAmount} className="text-emerald-400 font-bold" />
              </span>
              <span>
                الإجمالي: <Currency amount={totalAmount} className="text-white font-medium" />
              </span>
            </div>
            
            {/* Progress Bar - RTL */}
            <div className="h-2.5 sm:h-3 bg-slate-700/50 rounded-full overflow-hidden shadow-inner" dir="ltr">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-l from-emerald-400 via-emerald-500 to-teal-500 rounded-full relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              </motion.div>
            </div>

            {/* Installments Visual */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
              {Array.from({ length: installmentsCount }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                    i < paidInstallments
                      ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                      : i === paidInstallments
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/30 animate-pulse"
                        : "bg-slate-700/50 text-slate-500 border border-slate-600"
                  }`}
                >
                  <bdi dir="ltr">{i + 1}</bdi>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400">
              <BidiNumber value={paidInstallments} /> من <BidiNumber value={installmentsCount} /> أقساط مدفوعة
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-700/50">
            <div>
              <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5">حامل البطاقة</p>
              <p className="text-white font-bold text-sm sm:text-base tracking-wide uppercase truncate max-w-[150px] sm:max-w-none">{userName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400/60" />
              <div className="flex">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 opacity-70" />
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-500 opacity-70 -mr-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Company Strip */}
        <div className="h-10 sm:h-12 bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-400 text-[10px] sm:text-xs tracking-widest">شركة علي صالح الشهري القابضة</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
