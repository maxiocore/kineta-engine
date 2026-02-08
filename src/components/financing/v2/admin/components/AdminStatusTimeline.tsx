/**
 * ASH HOLDING Financing Admin V2 - Status Timeline
 * خط زمني مرئي لحالة الطلب
 */

import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { TIMELINE_ORDER, STATUS_CONFIG, STATUS_COLORS } from '../../config/statusConfig';
import type { FinancingStatus } from '../../types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AdminStatusTimelineProps {
  currentStatus: FinancingStatus;
  submittedAt: string;
  updatedAt: string;
  phaseUpdatedAt?: string;
  isTerminal?: boolean;
}

export function AdminStatusTimeline({
  currentStatus,
  submittedAt,
  updatedAt,
  phaseUpdatedAt,
  isTerminal,
}: AdminStatusTimelineProps) {
  const currentIndex = TIMELINE_ORDER.indexOf(currentStatus);
  const isDeclinedOrCancelled = ['CANCELLED', 'DECLINED'].includes(currentStatus);

  const displayStatuses = isDeclinedOrCancelled
    ? [...TIMELINE_ORDER.slice(0, Math.max(currentIndex, 2)), currentStatus]
    : TIMELINE_ORDER;

  return (
    <div className="space-y-1" dir="rtl">
      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        مسار الطلب
      </h4>

      <div className="relative">
        {displayStatuses.map((status, index) => {
          const config = STATUS_CONFIG[status];
          const colors = STATUS_COLORS[config?.color || 'gray'];
          const isActive = status === currentStatus;
          const isCompleted = !isDeclinedOrCancelled && currentIndex > index;
          const isFuture = !isDeclinedOrCancelled && currentIndex < index;
          const isLast = index === displayStatuses.length - 1;

          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex items-start gap-3 relative"
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute right-[11px] top-[24px] w-0.5 h-[calc(100%-8px)]',
                    isCompleted ? 'bg-success' : 'bg-border'
                  )}
                />
              )}

              {/* Node */}
              <div className="relative z-10 flex-shrink-0">
                {isCompleted ? (
                  <div className="h-6 w-6 rounded-full bg-success flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                ) : isActive ? (
                  <div className="relative">
                    <div className={cn('h-6 w-6 rounded-full flex items-center justify-center', 
                      isDeclinedOrCancelled ? 'bg-destructive' : colors.bg
                    )}>
                      {isDeclinedOrCancelled ? (
                        <AlertCircle className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <div className={cn('h-2.5 w-2.5 rounded-full', 
                          config?.color === 'green' ? 'bg-success' :
                          config?.color === 'blue' ? 'bg-primary' :
                          config?.color === 'yellow' ? 'bg-warning' :
                          config?.color === 'purple' ? 'bg-accent' :
                          'bg-muted-foreground'
                        )} />
                      )}
                    </div>
                    {!isDeclinedOrCancelled && (
                      <span className="absolute -inset-1 rounded-full animate-ping opacity-20 bg-primary" />
                    )}
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-border bg-background" />
                )}
              </div>

              {/* Content */}
              <div className={cn('pb-6 flex-1 min-w-0', isFuture && 'opacity-40')}>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isActive ? 'text-foreground' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/60'
                  )}>
                    {config?.nameAr || status}
                  </p>
                  {isActive && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(phaseUpdatedAt || updatedAt), 'dd MMM HH:mm', { locale: ar })}
                    </span>
                  )}
                  {isCompleted && index === 0 && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(submittedAt), 'dd MMM', { locale: ar })}
                    </span>
                  )}
                </div>
                {isActive && config?.descriptionAr && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config.descriptionAr}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
