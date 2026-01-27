/**
 * MaxioCore Financing System v3 - Activity Log Component
 * سجل النشاط بأسلوب بنكي احترافي
 */

import { motion } from 'framer-motion';
import { 
  Check, 
  Clock, 
  Circle,
  Send,
  Search,
  FileCheck,
  FileText,
  Stamp,
  Wallet,
  ShoppingCart,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineStep } from '../types';

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
  AlertCircle,
};

interface ActivityLogProps {
  steps: TimelineStep[];
  className?: string;
}

export function ActivityLog({ steps, className }: ActivityLogProps) {
  // Filter to show only relevant steps (completed + current)
  const visibleSteps = steps.filter(s => s.isCompleted || s.isCurrent);

  if (visibleSteps.length === 0) {
    return (
      <div className={cn('p-6 rounded-2xl bg-muted/50 border border-border text-center', className)}>
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          لا يوجد نشاط بعد
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl bg-card border border-border overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">سجل النشاط</h3>
      </div>
      
      <div className="divide-y divide-border">
        {visibleSteps.map((step, index) => {
          const Icon = iconMap[step.icon as keyof typeof iconMap] || Circle;
          
          return (
            <motion.div
              key={step.id}
              className={cn(
                'flex items-start gap-4 p-4',
                step.isCurrent && 'bg-primary/5'
              )}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Status Icon */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                step.isCompleted && 'bg-success/10 text-success',
                step.isCurrent && 'bg-primary/10 text-primary'
              )}>
                {step.isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4 animate-pulse" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={cn(
                    'font-medium',
                    step.isCompleted && 'text-foreground',
                    step.isCurrent && 'text-primary'
                  )}>
                    {step.label}
                  </h4>
                  {step.date && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(step.date).toLocaleDateString('ar-SA', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Activity Item (standalone)
// ═══════════════════════════════════════════════════════════════════

interface ActivityItemProps {
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
  icon?: keyof typeof iconMap;
}

export function ActivityItem({ title, description, timestamp, status, icon = 'Check' }: ActivityItemProps) {
  const Icon = iconMap[icon] || Check;

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-xl',
      status === 'current' && 'bg-primary/5'
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        status === 'completed' && 'bg-success/10 text-success',
        status === 'current' && 'bg-primary/10 text-primary',
        status === 'pending' && 'bg-muted text-muted-foreground'
      )}>
        {status === 'completed' ? (
          <Check className="w-4 h-4" />
        ) : status === 'current' ? (
          <Clock className="w-4 h-4" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'text-sm font-medium',
            status === 'completed' && 'text-foreground',
            status === 'current' && 'text-primary',
            status === 'pending' && 'text-muted-foreground'
          )}>
            {title}
          </span>
          <span className="text-xs text-muted-foreground">
            {timestamp}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );
}
