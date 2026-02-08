/**
 * ASH HOLDING Financing System v3 - Empty State
 * حالة عدم وجود طلب - iOS Banking Welcome
 */

import { motion } from 'framer-motion';
import { 
  Wallet,
  CreditCard,
  Clock,
  Shield,
  Percent,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMPTY_STATE_FEATURES } from '../config';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CreditCard, Clock, Shield, Percent,
};

interface FinancingEmptyStateProps {
  onApply: () => void;
}

export function FinancingEmptyState({ onApply }: FinancingEmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative py-6">
      {/* Hero */}
      <div className="text-center mb-10">
        <motion.div
          className="relative inline-flex items-center justify-center mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="absolute inset-0 bg-primary/15 rounded-full blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-[22px] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
        </motion.div>

        <motion.h2
          className="text-2xl lg:text-3xl font-extrabold text-foreground mb-2.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          ابدأ رحلة التمويل
        </motion.h2>

        <motion.p
          className="text-muted-foreground max-w-md mx-auto mb-7 text-base leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          احصل على تمويل الخدمات بسهولة وأمان. رصيد غير نقدي لاستخدامه في شراء الخدمات فقط.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            onClick={onApply}
            className="gap-2 px-8 h-14 text-base rounded-2xl shadow-xl shadow-primary/15"
          >
            طلب تمويل خدمات
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Features */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {EMPTY_STATE_FEATURES.map((feature, index) => {
          const Icon = iconMap[feature.icon as keyof typeof iconMap];
          return (
            <motion.div
              key={feature.title}
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200 group"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-[13px] text-foreground mb-0.5">{feature.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        className="mt-8 p-3.5 rounded-xl bg-muted/40 border border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          <strong>تنبيه:</strong> التمويل المقدم هو رصيد خدمات غير نقدي يُستخدم حصرياً لشراء الخدمات داخل المنصة. لا يمكن تحويله أو سحبه نقداً.
        </p>
      </motion.div>
    </motion.div>
  );
}