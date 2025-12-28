import { motion } from "framer-motion";
import { CreditCard, Calendar, Wallet, Landmark } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ar } from "date-fns/locale";

interface FinancingBankCardProps {
  userName: string;
  totalBalance: number;
  paidAmount: number;
  remainingAmount: number;
  nextInstallmentAmount?: number;
  nextInstallmentDate?: Date;
  planName?: string;
  contractNumber?: string;
}

export default function FinancingBankCard({
  userName,
  totalBalance,
  paidAmount,
  remainingAmount,
  nextInstallmentAmount,
  nextInstallmentDate,
  planName,
  contractNumber,
}: FinancingBankCardProps) {
  // Get next 30th date
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
      <div className="relative w-full max-w-md mx-auto" dir="rtl">
        {/* Card Shadow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 blur-xl transform translate-y-4 scale-95 rounded-3xl" />
        
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 blur-3xl transform translate-x-20 -translate-y-20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-2xl transform -translate-x-10 translate-y-10" />
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Card Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-xs">تمويل ماكسيوكور</p>
                  <p className="text-white font-semibold text-sm">{planName || "التمويل المرن"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-white/30" />
                <div className="w-8 h-8 rounded-full bg-white/20 -mr-4" />
              </div>
            </div>

            {/* Balance Display */}
            <div className="mb-6">
              <p className="text-white/70 text-sm mb-1">الرصيد المتاح</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight">
                  {remainingAmount.toLocaleString("ar-SA")}
                </span>
                <span className="text-white/80 text-lg">ر.س</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                <span>المدفوع: {paidAmount.toLocaleString("ar-SA")} ر.س</span>
                <span>الإجمالي: {totalBalance.toLocaleString("ar-SA")} ر.س</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-l from-white to-white/70 rounded-full"
                />
              </div>
            </div>

            {/* Next Installment */}
            {nextInstallmentAmount && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs">القسط القادم</p>
                      <p className="text-white font-bold">
                        {nextInstallmentAmount.toLocaleString("ar-SA")} ر.س
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-white/70 text-xs">تاريخ الاستحقاق</p>
                    <p className="text-white font-semibold text-sm">
                      يوم 30 من كل شهر
                    </p>
                    <p className="text-white/80 text-xs">
                      {format(paymentDate, "dd MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div>
                <p className="text-white/50 text-xs">حامل البطاقة</p>
                <p className="text-white font-medium">{userName}</p>
              </div>
              {contractNumber && (
                <div className="text-left">
                  <p className="text-white/50 text-xs">رقم العقد</p>
                  <p className="text-white font-mono text-sm">{contractNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chip */}
          <div className="absolute top-6 left-6">
            <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80">
              <div className="w-full h-full grid grid-cols-2 gap-0.5 p-1">
                <div className="bg-yellow-600/30 rounded-sm" />
                <div className="bg-yellow-600/30 rounded-sm" />
                <div className="bg-yellow-600/30 rounded-sm" />
                <div className="bg-yellow-600/30 rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
