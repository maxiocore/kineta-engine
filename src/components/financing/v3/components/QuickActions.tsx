/**
 * ASH HOLDING Financing System v3 - Quick Actions
 * إجراءات سريعة - FinTech iOS Style
 */

import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  FileCheck,
  FileText,
  Stamp,
  ArrowLeftRight,
  ShoppingCart,
  HelpCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CustomerAction } from '../types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileCheck, FileText, Stamp, ArrowLeftRight, ShoppingCart, HelpCircle,
};

interface QuickActionsProps {
  actions: CustomerAction[];
  onAction: (action: CustomerAction) => void;
  isProcessing?: boolean;
  processingActionId?: string;
  className?: string;
}

export function QuickActions({
  actions,
  onAction,
  isProcessing = false,
  processingActionId,
  className,
}: QuickActionsProps) {
  if (actions.length === 0) {
    return (
      <div className={cn('p-6 rounded-2xl bg-muted/30 border border-border text-center', className)}>
        <Clock className="w-7 h-7 text-muted-foreground mx-auto mb-2.5 opacity-50" />
        <p className="text-sm text-muted-foreground">
          لا توجد إجراءات مطلوبة حالياً
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {actions.map((action, index) => {
        const Icon = iconMap[action.icon as keyof typeof iconMap] || FileText;
        const isActionProcessing = isProcessing && processingActionId === action.id;

        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={cn(
              'relative flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200',
              action.isPrimary 
                ? 'bg-primary/[0.04] border-primary/20 hover:border-primary/35 hover:shadow-md hover:shadow-primary/5'
                : 'bg-card border-border hover:border-primary/15 hover:shadow-sm'
            )}
          >
            {/* Icon */}
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
              action.isPrimary ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                'text-[14px] font-bold',
                action.isPrimary ? 'text-primary' : 'text-foreground'
              )}>
                {action.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{action.description}</p>
            </div>

            {/* Button */}
            <Button
              onClick={() => onAction(action)}
              disabled={isActionProcessing || !action.isEnabled}
              variant={action.isPrimary ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 gap-1.5 rounded-xl h-9 px-3"
            >
              {isActionProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span className="text-xs hidden sm:inline">تنفيذ</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </>
              )}
            </Button>

            {/* Primary Badge */}
            {action.isPrimary && (
              <motion.div
                className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold shadow-sm"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                مطلوب
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Primary CTA
// ═══════════════════════════════════════════════════════════════════

interface PrimaryCTAProps {
  label: string;
  description?: string;
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PrimaryCTA({ label, description, onClick, isLoading, className }: PrimaryCTAProps) {
  return (
    <motion.div
      className={cn('', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button
        onClick={onClick}
        disabled={isLoading}
        size="lg"
        className="w-full gap-2 h-14 text-base rounded-2xl shadow-lg shadow-primary/15"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>{label}</span>
            <ArrowLeft className="w-5 h-5" />
          </>
        )}
      </Button>
      {description && (
        <p className="mt-2 text-[11px] text-center text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}