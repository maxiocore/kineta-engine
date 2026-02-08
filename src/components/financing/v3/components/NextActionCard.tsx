/**
 * ASH HOLDING Financing System v3 - Next Action Card
 * بطاقة الإجراء التالي - توجيه بنكي واضح
 */

import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  FileSignature,
  FileText,
  Stamp,
  Wallet,
  ShoppingCart,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CustomerAction } from '../types';

interface NextActionCardProps {
  action: CustomerAction;
  onAction: (action: CustomerAction) => void;
  isProcessing?: boolean;
  className?: string;
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  sign_acknowledgment: FileSignature,
  sign_contract: FileText,
  confirm_bond: Stamp,
  transfer_credit: Wallet,
  use_credit: ShoppingCart,
};

const actionColors: Record<string, {
  bg: string;
  border: string;
  icon: string;
  glow: string;
}> = {
  sign_acknowledgment: {
    bg: 'from-amber-500/10 to-orange-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-600',
    glow: 'shadow-amber-500/20',
  },
  sign_contract: {
    bg: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-600',
    glow: 'shadow-blue-500/20',
  },
  confirm_bond: {
    bg: 'from-purple-500/10 to-pink-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-600',
    glow: 'shadow-purple-500/20',
  },
  transfer_credit: {
    bg: 'from-emerald-500/10 to-green-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-600',
    glow: 'shadow-emerald-500/20',
  },
  use_credit: {
    bg: 'from-primary/10 to-primary/5',
    border: 'border-primary/30',
    icon: 'text-primary',
    glow: 'shadow-primary/20',
  },
};

export function NextActionCard({ 
  action, 
  onAction, 
  isProcessing,
  className,
}: NextActionCardProps) {
  const Icon = actionIcons[action.type] || Sparkles;
  const colors = actionColors[action.type] || actionColors.use_credit;

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 p-5 lg:p-6',
        `bg-gradient-to-br ${colors.bg}`,
        colors.border,
        `shadow-xl ${colors.glow}`,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Urgency Badge */}
      {action.isPrimary && (
        <motion.div
          className="absolute -top-1 -left-1"
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-br-xl rounded-tl-xl shadow-lg">
            إجراء مطلوب
          </div>
        </motion.div>
      )}

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon */}
        <motion.div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center',
            'bg-background/80 backdrop-blur-sm shadow-inner',
            colors.icon
          )}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Icon className="w-7 h-7" />
        </motion.div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">
              إجراءك التالي
            </h3>
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">
            {action.label}
          </p>
          {action.description && (
            <p className="text-sm text-muted-foreground">
              {action.description}
            </p>
          )}
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={() => onAction(action)}
          disabled={isProcessing}
          className={cn(
            'gap-2 px-6 py-5 rounded-xl shadow-lg transition-all',
            'hover:shadow-xl hover:scale-[1.02]',
            isProcessing && 'opacity-70'
          )}
        >
          <span>{action.label}</span>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress Hint */}
      <motion.div
        className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span>أكمل هذه الخطوة للمتابعة في رحلة التمويل</span>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Onboarding Welcome Card (First Visit)
// ═══════════════════════════════════════════════════════════════════

interface OnboardingCardProps {
  onStart: () => void;
  className?: string;
}

export function OnboardingCard({ onStart, className }: OnboardingCardProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 lg:p-8',
        'shadow-2xl shadow-primary/30',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="w-4 h-4" />
          <span>ابدأ من هنا</span>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-2xl lg:text-3xl font-bold mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          مرحباً بك في تمويل الخدمات
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-primary-foreground/80 text-lg mb-6 max-w-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          احصل على رصيد خدمات لاستخدامه في شراء الخدمات داخل المنصة. 
          تمويل غير نقدي، سريع وآمن.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            variant="secondary"
            onClick={onStart}
            className="gap-2 px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
          >
            <span>طلب تمويل خدمات</span>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="mt-6 flex flex-wrap gap-4 text-sm text-primary-foreground/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            موافقة خلال 24 ساعة
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            بدون كفيل
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            أقساط مرنة
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
