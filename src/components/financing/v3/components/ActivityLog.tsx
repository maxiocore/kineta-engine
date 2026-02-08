/**
 * ASH HOLDING Financing System v3 - Activity Log
 * سجل النشاط - iOS Banking
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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Send, Search, FileCheck, FileText, Stamp, Wallet, ShoppingCart, Check, XCircle, AlertCircle,
};

interface ActivityLogProps {
  steps: TimelineStep[];
  className?: string;
}

export function ActivityLog({ steps, className }: ActivityLogProps) {
  const visibleSteps = steps.filter(s => s.isCompleted || s.isCurrent);

  if (visibleSteps.length === 0) {
    return (
      <div className={cn('p-8 rounded-2xl bg-muted/30 border border-border text-center', className)}>
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">لا يوجد نشاط بعد</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl bg-card border border-border overflow-hidden', className)}>
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="font-bold text-[15px] text-foreground">سجل النشاط</h3>
      </div>
      
      <div className="divide-y divide-border">
        {visibleSteps.map((step, index) => (
          <motion.div
            key={step.id}
            className={cn(
              'flex items-start gap-3.5 p-4',
              step.isCurrent && 'bg-primary/[0.03]'
            )}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
              step.isCompleted && 'bg-emerald-500/10 text-emerald-500',
              step.isCurrent && 'bg-primary/10 text-primary'
            )}>
              {step.isCompleted ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 animate-pulse" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={cn(
                  'text-sm font-medium',
                  step.isCompleted && 'text-foreground',
                  step.isCurrent && 'text-primary font-bold'
                )}>
                  {step.label}
                </h4>
                {step.date && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                    {new Date(step.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{step.description}</p>
            </div>
          </motion.div>
        ))}
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
  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-xl',
      status === 'current' && 'bg-primary/[0.03]'
    )}>
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
        status === 'completed' && 'bg-emerald-500/10 text-emerald-500',
        status === 'current' && 'bg-primary/10 text-primary',
        status === 'pending' && 'bg-muted text-muted-foreground'
      )}>
        {status === 'completed' ? <Check className="w-3.5 h-3.5" /> :
         status === 'current' ? <Clock className="w-3.5 h-3.5" /> :
         <Circle className="w-3.5 h-3.5" />}
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
          <span className="text-[10px] text-muted-foreground">{timestamp}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}