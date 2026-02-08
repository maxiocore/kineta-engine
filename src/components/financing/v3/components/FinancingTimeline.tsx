/**
 * ASH HOLDING Financing System v3 - Timeline Component
 * الخط الزمني RTL بأسلوب بنكي احترافي
 */

import { motion } from 'framer-motion';
import { 
  Check, 
  Circle, 
  Clock,
  Send,
  Search,
  FileCheck,
  FileText,
  Stamp,
  Wallet,
  ShoppingCart,
  XCircle,
  Ban,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FinancingStatus, TimelineStep } from '../types';
import { FINANCING_JOURNEY_STEPS } from '../config';
import { useIsMobile } from '@/hooks/use-mobile';

const iconMap = {
  Send,
  Search,
  FileCheck,
  FileText,
  Stamp,
  Wallet,
  ShoppingCart,
  Check,
  XCircle,
  Ban,
  Trophy,
};

interface FinancingTimelineProps {
  currentStatus: FinancingStatus;
  steps: TimelineStep[];
  className?: string;
}

export function FinancingTimeline({ currentStatus, steps, className }: FinancingTimelineProps) {
  const isMobile = useIsMobile();
  
  // Find current step index in journey
  const getCurrentJourneyIndex = () => {
    for (let i = 0; i < FINANCING_JOURNEY_STEPS.length; i++) {
      if (FINANCING_JOURNEY_STEPS[i].statuses.includes(currentStatus)) {
        return i;
      }
    }
    return -1;
  };

  const currentJourneyIndex = getCurrentJourneyIndex();
  const isTerminal = ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(currentStatus);
  const isNegativeTerminal = ['CANCELLED', 'DECLINED'].includes(currentStatus);

  // For negative terminal, show abbreviated view
  if (isNegativeTerminal) {
    return (
      <div className={cn('p-6 rounded-2xl bg-destructive/5 border border-destructive/20', className)}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            {currentStatus === 'CANCELLED' ? (
              <Ban className="w-6 h-6 text-destructive" />
            ) : (
              <XCircle className="w-6 h-6 text-destructive" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-destructive">
              {currentStatus === 'CANCELLED' ? 'تم إلغاء الطلب' : 'تم رفض الطلب'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentStatus === 'CANCELLED' 
                ? 'تم إلغاء طلب التمويل الخاص بك'
                : 'نعتذر، لم تتم الموافقة على طلبك'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('', className)} dir="rtl">
      {isMobile ? (
        <VerticalTimeline
          currentIndex={currentJourneyIndex}
          isCompleted={isTerminal}
        />
      ) : (
        <HorizontalTimeline
          currentIndex={currentJourneyIndex}
          isCompleted={isTerminal}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Horizontal Timeline (Desktop)
// ═══════════════════════════════════════════════════════════════════

function HorizontalTimeline({ 
  currentIndex, 
  isCompleted 
}: { 
  currentIndex: number; 
  isCompleted: boolean;
}) {
  const progressWidth = currentIndex >= 0 
    ? ((currentIndex) / (FINANCING_JOURNEY_STEPS.length - 1)) * 100 
    : 0;

  return (
    <div className="relative py-8">
      {/* Background Line */}
      <div className="absolute top-[50px] right-8 left-8 h-1 bg-muted rounded-full" />
      
      {/* Progress Line */}
      <motion.div
        className="absolute top-[50px] right-8 h-1 bg-primary rounded-full origin-right"
        initial={{ width: '0%' }}
        animate={{ width: `${progressWidth}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {FINANCING_JOURNEY_STEPS.map((step, index) => {
          const Icon = iconMap[step.icon as keyof typeof iconMap] || Circle;
          const isStepCompleted = index < currentIndex || (isCompleted && index === currentIndex);
          const isCurrent = index === currentIndex && !isCompleted;
          const isUpcoming = index > currentIndex;

          return (
            <motion.div
              key={step.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Icon Circle */}
              <motion.div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10',
                  isStepCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'bg-primary/10 border-primary text-primary',
                  isUpcoming && 'bg-background border-muted text-muted-foreground'
                )}
                animate={isCurrent ? {
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(var(--primary-rgb), 0)',
                    '0 0 0 8px rgba(var(--primary-rgb), 0.15)',
                    '0 0 0 0 rgba(var(--primary-rgb), 0)'
                  ]
                } : {}}
                transition={{ 
                  duration: 2, 
                  repeat: isCurrent ? Infinity : 0,
                }}
              >
                {isStepCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>

              {/* Label */}
              <span className={cn(
                'mt-3 text-xs font-medium text-center max-w-[80px] leading-tight',
                isStepCompleted && 'text-foreground',
                isCurrent && 'text-primary font-semibold',
                isUpcoming && 'text-muted-foreground'
              )}>
                {step.shortLabel}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Vertical Timeline (Mobile)
// ═══════════════════════════════════════════════════════════════════

function VerticalTimeline({ 
  currentIndex, 
  isCompleted 
}: { 
  currentIndex: number;
  isCompleted: boolean;
}) {
  return (
    <div className="relative">
      {FINANCING_JOURNEY_STEPS.map((step, index) => {
        const Icon = iconMap[step.icon as keyof typeof iconMap] || Circle;
        const isStepCompleted = index < currentIndex || (isCompleted && index === currentIndex);
        const isCurrent = index === currentIndex && !isCompleted;
        const isUpcoming = index > currentIndex;
        const isLast = index === FINANCING_JOURNEY_STEPS.length - 1;

        return (
          <motion.div
            key={step.id}
            className="flex gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Connector Line */}
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10',
                  isStepCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'bg-primary/10 border-primary text-primary',
                  isUpcoming && 'bg-background border-muted text-muted-foreground'
                )}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
              >
                {isStepCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </motion.div>
              
              {!isLast && (
                <div className={cn(
                  'w-0.5 flex-1 min-h-[32px]',
                  isStepCompleted ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-6', isCurrent && 'pb-8')}>
              <h4 className={cn(
                'font-medium',
                isStepCompleted && 'text-foreground',
                isCurrent && 'text-primary font-semibold',
                isUpcoming && 'text-muted-foreground'
              )}>
                {step.label}
              </h4>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Compact Timeline (for cards)
// ═══════════════════════════════════════════════════════════════════

interface CompactTimelineProps {
  currentStatus: FinancingStatus;
  className?: string;
}

export function CompactTimeline({ currentStatus, className }: CompactTimelineProps) {
  const getCurrentJourneyIndex = () => {
    for (let i = 0; i < FINANCING_JOURNEY_STEPS.length; i++) {
      if (FINANCING_JOURNEY_STEPS[i].statuses.includes(currentStatus)) {
        return i;
      }
    }
    return -1;
  };

  const currentIndex = getCurrentJourneyIndex();
  const totalSteps = FINANCING_JOURNEY_STEPS.length;
  const currentStep = FINANCING_JOURNEY_STEPS[currentIndex];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentIndex + 1}/{totalSteps}
        </span>
      </div>

      {/* Current Step */}
      {currentStep && (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground">الحالة الحالية:</span>
          <span className="font-medium text-foreground">{currentStep.label}</span>
        </div>
      )}
    </div>
  );
}
