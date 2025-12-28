import { motion } from "framer-motion";
import { CreditCard, Calendar, Wallet, Landmark, Shield, CheckCircle2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ar } from "date-fns/locale";

interface EnhancedFinancingCardProps {
  userName: string;
  totalBalance: number;
  paidAmount: number;
  remainingAmount: number;
  nextInstallmentAmount?: number;
  nextInstallmentDate?: Date;
  planName?: string;
  contractNumber?: string;
  installmentsCount?: number;
  paidInstallments?: number;
}

export default function EnhancedFinancingCard({
  userName,
  totalBalance,
  paidAmount,
  remainingAmount,
  nextInstallmentAmount,
  nextInstallmentDate,
  planName,
  contractNumber,
  installmentsCount = 6,
  paidInstallments = 0,
}: EnhancedFinancingCardProps) {
  const getNextPaymentDate = () => {
    if (nextInstallmentDate) return nextInstallmentDate;
    const now = new Date();
    const currentDay = now.getDate();
    if (currentDay <= 30) {
      return new Date(now.getFullYear(), now.getMonth(), 30);
    }
    return new Date(now.getFullYear(), now.getMonth() + 1, 30);
  };

  const paymentDate = getNextPaymentDate();
  const progressPercentage = totalBalance > 0 ? (paidAmount / totalBalance) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="perspective-1000"
    >
      <div className="relative w-full max-w-lg mx-auto" dir="rtl">
        {/* Card Shadow */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 blur-2xl transform translate-y-6 scale-95 rounded-3xl" />
        
        {/* Main Card - Premium Dark Theme */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-0 shadow-2xl border border-slate-700/50">
          {/* Metallic Top Strip */}
          <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
          
          {/* Card Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Landmark className="h-7 w-7 text-slate-900" />
                </div>
                <div>
                  <p className="text-amber-400 font-bold text-lg tracking-wide">MaxioCore</p>
                  <p className="text-slate-400 text-xs">التمويل المرن</p>
                </div>
              </div>
              
              {/* Chip */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-inner">
                  <div className="w-full h-full grid grid-cols-3 gap-px p-1.5">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-amber-600/40 rounded-sm" />
                    ))}
                  </div>
                </div>
                <Shield className="h-5 w-5 text-amber-400/60" />
              </div>
            </div>

            {/* Balance Display */}
            <div className="mb-6">
              <p className="text-slate-400 text-sm mb-1">الرصيد المتاح</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tight font-mono">
                  {remainingAmount.toLocaleString("ar-SA")}
                </span>
                <span className="text-amber-400 text-xl font-bold">ر.س</span>
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  المدفوع: {paidAmount.toLocaleString("ar-SA")} ر.س
                </span>
                <span>الإجمالي: {totalBalance.toLocaleString("ar-SA")} ر.س</span>
              </div>
              
              {/* Premium Progress Bar */}
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-l from-emerald-400 via-emerald-500 to-teal-500 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                </motion.div>
              </div>

              {/* Installments Progress */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[...Array(installmentsCount)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < paidInstallments
                        ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                        : i === paidInstallments
                          ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/30 animate-pulse"
                          : "bg-slate-700/50 text-slate-500 border border-slate-600"
                    }`}
                  >
                    {i + 1}
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">
                {paidInstallments} من {installmentsCount} أقساط مدفوعة
              </p>
            </div>
          </div>

          {/* Next Installment Section */}
          {nextInstallmentAmount && (
            <div className="mx-6 mb-4">
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl p-4 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                      <Calendar className="h-6 w-6 text-slate-900" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">القسط القادم</p>
                      <p className="text-white font-bold text-xl">
                        {nextInstallmentAmount.toLocaleString("ar-SA")} <span className="text-amber-400 text-sm">ر.س</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-slate-400 text-xs">تاريخ الاستحقاق</p>
                    <p className="text-amber-400 font-bold text-sm">
                      يوم 30 من كل شهر
                    </p>
                    <p className="text-slate-300 text-xs">
                      {format(paymentDate, "dd MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Section */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <div>
                <p className="text-slate-500 text-xs mb-1">حامل البطاقة</p>
                <p className="text-white font-bold text-lg tracking-wide uppercase">{userName}</p>
              </div>
              {contractNumber && (
                <div className="text-left">
                  <p className="text-slate-500 text-xs mb-1">رقم العقد</p>
                  <p className="text-amber-400 font-mono text-sm font-bold">{contractNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Holographic Strip */}
          <div className="h-12 bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-shimmer" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-400 text-xs tracking-widest">شركة علي صالح الشهري القابضة</p>
            </div>
          </div>

          {/* Bottom Brand */}
          <div className="bg-slate-900 px-6 py-3 flex items-center justify-between">
            <p className="text-slate-500 text-xs">تمويل بدون فوائد</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500 opacity-70" />
              <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-70 -mr-3" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
