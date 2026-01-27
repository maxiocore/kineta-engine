/**
 * MaxioCore Financing System v2 - Action Buttons Component
 * أزرار الإجراءات الذكية للعميل
 */

import { motion } from 'framer-motion';
import { 
  FileCheck, 
  FileText, 
  Stamp, 
  ArrowLeftRight, 
  ShoppingCart,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CustomerAction } from '../types';

interface ActionButtonsV2Props {
  actions: CustomerAction[];
  onAction: (action: CustomerAction) => void;
  isProcessing?: boolean;
  processingActionId?: string;
  className?: string;
}

export function ActionButtonsV2({
  actions,
  onAction,
  isProcessing = false,
  processingActionId,
  className,
}: ActionButtonsV2Props) {
  if (actions.length === 0) {
    return null;
  }

  const primaryAction = actions.find(a => a.isPrimary);
  const secondaryActions = actions.filter(a => !a.isPrimary);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Primary Action */}
      {primaryAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PrimaryActionButton
            action={primaryAction}
            onClick={() => onAction(primaryAction)}
            isProcessing={isProcessing && processingActionId === primaryAction.id}
            disabled={!primaryAction.isEnabled || isProcessing}
          />
        </motion.div>
      )}

      {/* Secondary Actions */}
      {secondaryActions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {secondaryActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <SecondaryActionButton
                action={action}
                onClick={() => onAction(action)}
                isProcessing={isProcessing && processingActionId === action.id}
                disabled={!action.isEnabled || isProcessing}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Primary Action Button
// ═══════════════════════════════════════════════════════════════════

interface ActionButtonProps {
  action: CustomerAction;
  onClick: () => void;
  isProcessing: boolean;
  disabled: boolean;
}

function PrimaryActionButton({ action, onClick, isProcessing, disabled }: ActionButtonProps) {
  const Icon = getActionIcon(action.icon);

  return (
    <Button
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full h-14 text-base font-semibold',
        'bg-gradient-to-l from-primary to-primary/90',
        'hover:from-primary/90 hover:to-primary/80',
        'shadow-lg shadow-primary/20',
        'transition-all duration-300',
        'group'
      )}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 ml-2 animate-spin" />
          جاري المعالجة...
        </>
      ) : (
        <>
          <Icon className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
          {action.label}
          <ArrowLeft className="w-4 h-4 mr-auto opacity-60 group-hover:translate-x-[-4px] transition-transform" />
        </>
      )}
    </Button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Secondary Action Button
// ═══════════════════════════════════════════════════════════════════

function SecondaryActionButton({ action, onClick, isProcessing, disabled }: ActionButtonProps) {
  const Icon = getActionIcon(action.icon);

  return (
    <Button
      variant="outline"
      size="default"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'gap-2',
        'border-muted-foreground/20',
        'hover:bg-muted/50 hover:border-primary/30',
        'transition-all duration-300'
      )}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {action.label}
    </Button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Icon Mapper
// ═══════════════════════════════════════════════════════════════════

function getActionIcon(iconName: string): React.ElementType {
  const icons: Record<string, React.ElementType> = {
    FileCheck,
    FileText,
    Stamp,
    ArrowLeftRight,
    ShoppingCart,
  };
  return icons[iconName] || FileText;
}

// ═══════════════════════════════════════════════════════════════════
// Quick Action Cards (Alternative Layout)
// ═══════════════════════════════════════════════════════════════════

interface QuickActionCardsProps {
  actions: CustomerAction[];
  onAction: (action: CustomerAction) => void;
  className?: string;
}

export function QuickActionCards({ actions, onAction, className }: QuickActionCardsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {actions.map((action, index) => {
        const Icon = getActionIcon(action.icon);
        
        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onAction(action)}
            disabled={!action.isEnabled}
            className={cn(
              'group relative p-5 rounded-2xl text-right',
              'bg-card hover:bg-muted/50 border border-border',
              'transition-all duration-300',
              'hover:shadow-lg hover:border-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              action.isPrimary && 'ring-2 ring-primary/20'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                'p-2.5 rounded-xl transition-colors',
                action.isPrimary 
                  ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground' 
                  : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              {action.isPrimary && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  إجراء مطلوب
                </span>
              )}
            </div>
            
            <h4 className="font-semibold text-foreground mb-1">
              {action.label}
            </h4>
            <p className="text-sm text-muted-foreground">
              {action.description}
            </p>
            
            <ArrowLeft className="absolute bottom-5 left-5 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all" />
          </motion.button>
        );
      })}
    </div>
  );
}
