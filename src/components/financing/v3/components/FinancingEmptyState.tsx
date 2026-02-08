/**
 * ASH HOLDING Financing System v3 - Empty State Component
 * حالة عدم وجود طلب تمويل - بأسلوب بنكي احترافي
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

const iconMap = {
  CreditCard,
  Clock,
  Shield,
  Percent,
};

interface FinancingEmptyStateProps {
  onApply: () => void;
}

export function FinancingEmptyState({ onApply }: FinancingEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative py-8"
    >
      {/* Hero Section */}
      <div className="text-center mb-12">
        {/* Animated Icon */}
        <motion.div
          className="relative inline-flex items-center justify-center mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30">
            <Wallet className="w-12 h-12 text-primary-foreground" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-2xl lg:text-3xl font-bold text-foreground mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          ابدأ رحلة التمويل
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-muted-foreground max-w-md mx-auto mb-8 text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          احصل على تمويل الخدمات بسهولة وأمان. رصيد غير نقدي لاستخدامه في شراء الخدمات فقط.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            onClick={onApply}
            className="gap-2 px-8 py-6 text-lg rounded-2xl shadow-xl shadow-primary/20"
          >
            <span>طلب تمويل خدمات</span>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {EMPTY_STATE_FEATURES.map((feature, index) => {
          const Icon = iconMap[feature.icon as keyof typeof iconMap];
          return (
            <motion.div
              key={feature.title}
              className="relative p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        className="mt-8 p-4 rounded-xl bg-muted/50 border border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-xs text-muted-foreground text-center">
          <strong>تنبيه:</strong> التمويل المقدم هو رصيد خدمات غير نقدي يُستخدم حصرياً لشراء الخدمات داخل المنصة. لا يمكن تحويله أو سحبه نقداً.
        </p>
      </motion.div>
    </motion.div>
  );
}
