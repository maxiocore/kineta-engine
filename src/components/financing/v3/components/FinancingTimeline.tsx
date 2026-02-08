/**
 * ASH HOLDING Financing System v3 - Timeline
 * خط زمني RTL احترافي - iOS Banking
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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Send, Search, FileCheck, FileText, Stamp, Wallet, ShoppingCart, Check, XCircle, Ban, Trophy,
};

interface FinancingTimelineProps {
  currentStatus: FinancingStatus;
  steps: TimelineStep[];
  className?: string;
}

export function FinancingTimeline({ currentStatus, steps, className }: FinancingTimelineProps) {
  const isMobile = useIsMobile();
  
  const getCurrentJourneyIndex = () => {
    for (let i = 0; i < FINANCING_JOURNEY_STEPS.length; i++) {
      if (FINANCING_JOURNEY_STEPS[i].statuses.includes(currentStatus)) return i;
    }
    return -1;
  };

  const currentJourneyIndex = getCurrentJourneyIndex();
  const isTerminal = ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(currentStatus);
  const isNegativeTerminal = ['CANCELLED', 'DECLINED'].includes(currentStatus);

  if (isNegativeTerminal) {
    return (
      <div className={cn('p-5 rounded-2xl bg-destructive/5 border border-destructive/15', className)}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center">
            {currentStatus === 'CANCELLED' ? <Ban className="w-5 h-5 text-destructive" /> : <XCircle className="w-5 h-5 text-destructive" />}
          </div>
          <div>
            <h3 className="font-bold text-destructive text-[15px]">
              {currentStatus === 'CANCELLED' ? 'تم إلغاء الطلب' : 'تم رفض الطلب'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentStatus === 'CANCELLED' ? 'تم إلغاء طلب التمويل الخاص بك' : 'نعتذر، لم تتم الموافقة على طلبك'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('', className)} dir="rtl">
      {isMobile ? (
        <MobileTimeline currentIndex={currentJourneyIndex} isCompleted={isTerminal} />
      ) : (
        <DesktopTimeline currentIndex={currentJourneyIndex} isCompleted={isTerminal} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Desktop: Horizontal Progress
// ═══════════════════════════════════════════════════════════════════

function DesktopTimeline({ currentIndex, isCompleted }: { currentIndex: number; isCompleted: boolean }) {
  const totalSteps = FINANCING_JOURNEY_STEPS.length;
  const progressWidth = currentIndex >= 0 ? (currentIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="relative py-6">
      {/* Track */}
      <div className="absolute top-[46px] right-6 left-6 h-[3px] bg-muted/80 rounded-full" />
      
      {/* Progress */}
      <motion.div
        className="absolute top-[46px] right-6 h-[3px] bg-primary rounded-full origin-right"
        initial={{ width: '0%' }}
        animate={{ width: `${progressWidth}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      <div className="relative flex justify-between">
        {FINANCING_JOURNEY_STEPS.map((step, index) => {
          const Icon = iconMap[step.icon] || Circle;
          const isDone = index < currentIndex || (isCompleted && index === currentIndex);
          const isCurrent = index === currentIndex && !isCompleted;
          const isUpcoming = index > currentIndex;

          return (
            <motion.div
              key={step.id}
              className="flex flex-col items-center gap-2.5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              {/* Node */}
              <motion.div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all duration-300 z-10',
                  isDone && 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20',
                  isCurrent && 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/15',
                  isUpcoming && 'bg-card border-border text-muted-foreground'
                )}
                animate={isCurrent ? {
                  scale: [1, 1.08, 1],
                } : {}}
                transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
              >
                {isDone ? <Check className="w-4.5 h-4.5" /> : isCurrent ? <Clock className="w-4.5 h-4.5" /> : <Icon className="w-4 h-4" />}
              </motion.div>

              <span className={cn(
                'text-[11px] font-medium text-center max-w-[72px] leading-tight',
                isDone && 'text-foreground',
                isCurrent && 'text-primary font-bold',
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
// Mobile: Vertical Steps
// ═══════════════════════════════════════════════════════════════════

function MobileTimeline({ currentIndex, isCompleted }: { currentIndex: number; isCompleted: boolean }) {
  return (
    <div className="relative">
      {FINANCING_JOURNEY_STEPS.map((step, index) => {
        const Icon = iconMap[step.icon] || Circle;
        const isDone = index < currentIndex || (isCompleted && index === currentIndex);
        const isCurrent = index === currentIndex && !isCompleted;
        const isUpcoming = index > currentIndex;
        const isLast = index === FINANCING_JOURNEY_STEPS.length - 1;

        return (
          <motion.div
            key={step.id}
            className="flex gap-3.5"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all z-10',
                  isDone && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'bg-primary/10 border-primary text-primary',
                  isUpcoming && 'bg-card border-border text-muted-foreground'
                )}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : isCurrent ? <Clock className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </motion.div>
              
              {!isLast && (
                <div className={cn('w-0.5 flex-1 min-h-[28px] rounded-full', isDone ? 'bg-primary' : 'bg-border')} />
              )}
            </div>

            <div className={cn('flex-1 pb-5', isCurrent && 'pb-6')}>
              <h4 className={cn(
                'text-sm font-medium',
                isDone && 'text-foreground',
                isCurrent && 'text-primary font-bold',
                isUpcoming && 'text-muted-foreground'
              )}>
                {step.label}
              </h4>
              {isCurrent && (
                <p className="text-xs text-muted-foreground mt-0.5">جارٍ الآن</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Compact Timeline (Progress Bar)
// ═══════════════════════════════════════════════════════════════════

interface CompactTimelineProps {
  currentStatus: FinancingStatus;
  className?: string;
}

export function CompactTimeline({ currentStatus, className }: CompactTimelineProps) {
  const getCurrentJourneyIndex = () => {
    for (let i = 0; i < FINANCING_JOURNEY_STEPS.length; i++) {
      if (FINANCING_JOURNEY_STEPS[i].statuses.includes(currentStatus)) return i;
    }
    return -1;
  };

  const currentIndex = getCurrentJourneyIndex();
  const totalSteps = FINANCING_JOURNEY_STEPS.length;
  const currentStep = FINANCING_JOURNEY_STEPS[currentIndex];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Step Dots */}
      <div className="flex items-center gap-1.5">
        {FINANCING_JOURNEY_STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full flex-1 transition-all duration-500',
              i <= currentIndex ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Current Step Label */}
      {currentStep && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="font-medium text-foreground">{currentStep.label}</span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1}/{totalSteps}
          </span>
        </div>
      )}
    </div>
  );
}