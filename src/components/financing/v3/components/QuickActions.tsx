/**
 * MaxioCore Financing System v3 - Quick Actions Component
 * بطاقات الإجراءات السريعة بأسلوب FinTech
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
import type { QuickAction, CustomerAction } from '../types';

const iconMap = {
  FileCheck,
  FileText,
  Stamp,
  ArrowLeftRight,
  ShoppingCart,
  HelpCircle,
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
      <div className={cn('p-6 rounded-2xl bg-muted/50 border border-border text-center', className)}>
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          لا توجد إجراءات مطلوبة حالياً. يرجى انتظار تحديث من فريق التمويل.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', className)}>
      {actions.map((action, index) => (
        <QuickActionCard
          key={action.id}
          action={action}
          onAction={() => onAction(action)}
          isProcessing={isProcessing && processingActionId === action.id}
          index={index}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Quick Action Card
// ═══════════════════════════════════════════════════════════════════

interface QuickActionCardProps {
  action: CustomerAction;
  onAction: () => void;
  isProcessing?: boolean;
  index: number;
}

function QuickActionCard({ action, onAction, isProcessing, index }: QuickActionCardProps) {
  const Icon = iconMap[action.icon as keyof typeof iconMap] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'relative p-5 rounded-2xl border transition-all duration-300',
        action.isPrimary 
          ? 'bg-primary/5 border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
          : 'bg-card border-border hover:border-primary/20'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          action.isPrimary 
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold mb-1',
            action.isPrimary ? 'text-primary' : 'text-foreground'
          )}>
            {action.label}
          </h3>
          <p className="text-sm text-muted-foreground">
            {action.description}
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={onAction}
          disabled={isProcessing || !action.isEnabled}
          className={cn(
            'shrink-0 gap-2',
            action.isPrimary && 'bg-primary hover:bg-primary/90'
          )}
          variant={action.isPrimary ? 'default' : 'outline'}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">تنفيذ</span>
              <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Primary Badge */}
      {action.isPrimary && (
        <motion.div
          className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          مطلوب
        </motion.div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Primary CTA Button
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button
        onClick={onClick}
        disabled={isLoading}
        size="lg"
        className="w-full gap-2 py-6 text-lg rounded-2xl shadow-lg shadow-primary/20"
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
        <p className="mt-2 text-xs text-center text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}
