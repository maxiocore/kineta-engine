/**
 * MaxioCore Financing System v2 - Timeline Component
 * الخط الزمني لمراحل التمويل
 */

import { motion } from 'framer-motion';
import { 
  Check, 
  Circle, 
  Clock,
  AlertCircle,
  Trophy,
  XCircle,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineStep, FinancingStatus } from '../types';
import { STATUS_COLORS } from '../config/statusConfig';

interface FinancingTimelineV2Props {
  steps: TimelineStep[];
  currentStatus: FinancingStatus;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function FinancingTimelineV2({
  steps,
  currentStatus,
  orientation = 'horizontal',
  className,
}: FinancingTimelineV2Props) {
  const isTerminal = ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(currentStatus);
  const isNegativeTerminal = ['CANCELLED', 'DECLINED'].includes(currentStatus);

  if (orientation === 'vertical') {
    return (
      <VerticalTimeline 
        steps={steps} 
        isNegativeTerminal={isNegativeTerminal}
        className={className}
      />
    );
  }

  return (
    <HorizontalTimeline 
      steps={steps} 
      isNegativeTerminal={isNegativeTerminal}
      className={className}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// Horizontal Timeline (Desktop)
// ═══════════════════════════════════════════════════════════════════

function HorizontalTimeline({ 
  steps, 
  isNegativeTerminal,
  className,
}: { 
  steps: TimelineStep[]; 
  isNegativeTerminal: boolean;
  className?: string;
}) {
  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressWidth = steps.length > 1 
    ? (completedCount / (steps.length - 1)) * 100 
    : 0;

  return (
    <div className={cn('w-full py-6', className)} dir="rtl">
      <div className="relative flex items-center justify-between">
        {/* Progress Line Background */}
        <div className="absolute top-5 right-5 left-5 h-0.5 bg-muted" />
        
        {/* Progress Line Filled */}
        <motion.div
          className={cn(
            'absolute top-5 right-5 h-0.5 origin-right',
            isNegativeTerminal ? 'bg-destructive' : 'bg-primary'
          )}
          initial={{ width: '0%' }}
          animate={{ width: `${progressWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Steps */}
        {steps.map((step, index) => (
          <TimelineNode
            key={step.id}
            step={step}
            index={index}
            isNegativeTerminal={isNegativeTerminal}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Vertical Timeline (Mobile)
// ═══════════════════════════════════════════════════════════════════

function VerticalTimeline({ 
  steps, 
  isNegativeTerminal,
  className,
}: { 
  steps: TimelineStep[]; 
  isNegativeTerminal: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)} dir="rtl">
      {steps.map((step, index) => (
        <div key={step.id} className="flex gap-4">
          {/* Connector */}
          <div className="flex flex-col items-center">
            <TimelineIcon
              step={step}
              isNegativeTerminal={isNegativeTerminal}
            />
            {index < steps.length - 1 && (
              <motion.div
                className={cn(
                  'w-0.5 flex-1 min-h-[40px]',
                  step.isCompleted 
                    ? (isNegativeTerminal ? 'bg-destructive' : 'bg-primary')
                    : 'bg-muted'
                )}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{ transformOrigin: 'top' }}
              />
            )}
          </div>

          {/* Content */}
          <motion.div
            className={cn(
              'flex-1 pb-6',
              step.isCurrent && 'pb-8'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <h4 className={cn(
              'font-semibold',
              step.isCompleted && 'text-foreground',
              step.isCurrent && (isNegativeTerminal ? 'text-destructive' : 'text-primary'),
              step.isUpcoming && 'text-muted-foreground'
            )}>
              {step.label}
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step.description}
            </p>
            {step.date && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(step.date).toLocaleDateString('ar-SA')}
              </p>
            )}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Timeline Node (for horizontal)
// ═══════════════════════════════════════════════════════════════════

function TimelineNode({
  step,
  index,
  isNegativeTerminal,
}: {
  step: TimelineStep;
  index: number;
  isNegativeTerminal: boolean;
}) {
  return (
    <motion.div
      className="relative flex flex-col items-center z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <TimelineIcon
        step={step}
        isNegativeTerminal={isNegativeTerminal}
      />
      
      {/* Label */}
      <motion.span
        className={cn(
          'mt-3 text-xs font-medium text-center max-w-[80px] leading-tight',
          step.isCompleted && 'text-foreground',
          step.isCurrent && (isNegativeTerminal ? 'text-destructive' : 'text-primary'),
          step.isUpcoming && 'text-muted-foreground'
        )}
      >
        {step.label}
      </motion.span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Timeline Icon
// ═══════════════════════════════════════════════════════════════════

function TimelineIcon({
  step,
  isNegativeTerminal,
}: {
  step: TimelineStep;
  isNegativeTerminal: boolean;
}) {
  const getIcon = () => {
    if (step.isCompleted) {
      return <Check className="w-5 h-5" />;
    }
    if (step.isCurrent) {
      if (step.status === 'COMPLETED') return <Trophy className="w-5 h-5" />;
      if (step.status === 'CANCELLED') return <Ban className="w-5 h-5" />;
      if (step.status === 'DECLINED') return <XCircle className="w-5 h-5" />;
      return <Clock className="w-5 h-5" />;
    }
    return <Circle className="w-4 h-4" />;
  };

  return (
    <motion.div
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
        step.isCompleted && 'bg-primary border-primary text-primary-foreground',
        step.isCurrent && !isNegativeTerminal && 'bg-primary/10 border-primary text-primary',
        step.isCurrent && isNegativeTerminal && 'bg-destructive/10 border-destructive text-destructive',
        step.isUpcoming && 'bg-background border-muted text-muted-foreground'
      )}
      animate={step.isCurrent ? {
        scale: [1, 1.1, 1],
        boxShadow: [
          '0 0 0 0 rgba(var(--primary), 0)',
          '0 0 0 8px rgba(var(--primary), 0.1)',
          '0 0 0 0 rgba(var(--primary), 0)'
        ]
      } : {}}
      transition={{ 
        duration: 2, 
        repeat: step.isCurrent ? Infinity : 0,
        ease: 'easeInOut'
      }}
    >
      {getIcon()}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Compact Timeline (for cards/smaller spaces)
// ═══════════════════════════════════════════════════════════════════

interface CompactTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function CompactTimeline({ steps, className }: CompactTimelineProps) {
  const currentStep = steps.find(s => s.isCurrent);
  const completedCount = steps.filter(s => s.isCompleted).length;
  const totalSteps = steps.length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {completedCount} / {totalSteps}
        </span>
      </div>

      {/* Current Step Info */}
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
