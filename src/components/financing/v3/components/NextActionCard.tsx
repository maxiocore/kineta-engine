/**
 * ASH HOLDING Financing System v3 - Next Action Card
 * بطاقة الإجراء التالي - iOS Banking Style
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
  AlertTriangle,
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

const actionThemes: Record<string, { gradient: string; iconBg: string; ring: string }> = {
  sign_acknowledgment: {
    gradient: 'from-amber-500/8 via-orange-500/5 to-transparent',
    iconBg: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/20',
  },
  sign_contract: {
    gradient: 'from-blue-500/8 via-cyan-500/5 to-transparent',
    iconBg: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/20',
  },
  confirm_bond: {
    gradient: 'from-purple-500/8 via-pink-500/5 to-transparent',
    iconBg: 'bg-purple-500/12 text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-500/20',
  },
  transfer_credit: {
    gradient: 'from-emerald-500/8 via-green-500/5 to-transparent',
    iconBg: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
  },
  use_credit: {
    gradient: 'from-primary/8 via-primary/4 to-transparent',
    iconBg: 'bg-primary/12 text-primary',
    ring: 'ring-primary/20',
  },
};

export function NextActionCard({ 
  action, 
  onAction, 
  isProcessing,
  className,
}: NextActionCardProps) {
  const Icon = actionIcons[action.type] || Sparkles;
  const theme = actionThemes[action.type] || actionThemes.use_credit;

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card',
        `ring-1 ${theme.ring}`,
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Gradient Background */}
      <div className={cn('absolute inset-0 bg-gradient-to-l', theme.gradient)} />

      {/* Urgency Indicator */}
      {action.isPrimary && (
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-l from-destructive via-destructive/80 to-transparent" />
      )}

      <div className="relative p-5">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <motion.div
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', theme.iconBg)}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Icon className="w-6 h-6" />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {action.isPrimary && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  مطلوب
                </span>
              )}
            </div>
            <h3 className="font-bold text-foreground text-[15px]">{action.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{action.description}</p>
          </div>

          {/* CTA */}
          <Button
            size="sm"
            onClick={() => onAction(action)}
            disabled={isProcessing}
            className="shrink-0 gap-1.5 rounded-xl h-10 px-4 shadow-sm"
          >
            <span className="text-sm">تنفيذ</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Onboarding Welcome Card
// ═══════════════════════════════════════════════════════════════════

interface OnboardingCardProps {
  onStart: () => void;
  className?: string;
}

export function OnboardingCard({ onStart, className }: OnboardingCardProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-primary via-primary/95 to-primary/80 text-primary-foreground',
        'shadow-2xl shadow-primary/25',
        className
      )}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 p-6 lg:p-8">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium mb-5 border border-white/10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="w-4 h-4" />
          ابدأ من هنا
        </motion.div>

        <motion.h2
          className="text-2xl lg:text-3xl font-extrabold mb-3 leading-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          مرحباً بك في تمويل الخدمات
        </motion.h2>

        <motion.p
          className="text-primary-foreground/75 text-base mb-7 max-w-lg leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          احصل على رصيد خدمات لاستخدامه في شراء الخدمات داخل المنصة. تمويل غير نقدي، سريع وآمن.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            variant="secondary"
            onClick={onStart}
            className="gap-2 px-8 h-14 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
          >
            طلب تمويل خدمات
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {['موافقة خلال 24 ساعة', 'بدون كفيل', 'أقساط مرنة'].map((text) => (
            <span key={text} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {text}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}