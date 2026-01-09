/**
 * Service Financing Notice Banner
 * التنويه الثابت الذي يظهر في شاشات التمويل
 * بدون تغيير في التصميم - فقط إضافة عنصر
 */

import { motion } from "framer-motion";
import { Building2, Info } from "lucide-react";
import { SERVICE_FINANCING_NOTICE, COMPANY_INFO } from "@/lib/financing/serviceFinancingPolicy";

interface ServiceFinancingNoticeProps {
  variant?: "compact" | "full";
  className?: string;
}

export function ServiceFinancingNotice({ 
  variant = "compact",
  className = ""
}: ServiceFinancingNoticeProps) {
  if (variant === "compact") {
    return (
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm ${className}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-blue-600 dark:text-blue-400">
          {SERVICE_FINANCING_NOTICE.shortMessage}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-xl ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{SERVICE_FINANCING_NOTICE.titleIcon}</span>
            <h4 className="font-semibold text-blue-600 dark:text-blue-400">
              {SERVICE_FINANCING_NOTICE.title}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {SERVICE_FINANCING_NOTICE.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Payment Flow Indicator
 * يوضح مسار الدفع (للمزود وليس للعميل)
 */
export function PaymentFlowIndicator({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`flex items-center justify-center gap-2 py-2 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>قيمة الخدمات</span>
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          →
        </motion.span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          {COMPANY_INFO.shortName}
        </span>
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        >
          →
        </motion.span>
        <span>تفعيل خدماتك</span>
      </div>
    </motion.div>
  );
}

/**
 * Non-Cash Financing Badge
 * شارة صغيرة تؤكد أن التمويل غير نقدي
 */
export function NonCashBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs rounded-full border border-amber-500/20 ${className}`}>
      <Info className="w-3 h-3" />
      <span>بدون صرف نقدي</span>
    </span>
  );
}
