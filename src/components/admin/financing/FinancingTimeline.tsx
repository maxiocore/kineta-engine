/**
 * مكون Timeline البنكي للتمويل
 * Banking-style Financing Timeline Component
 */

import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  XCircle,
  FileText,
  Send,
  Search,
  Settings,
  FileCheck,
  Stamp,
  Wallet,
  CreditCard,
  Ban,
  AlertCircle,
  Loader
} from 'lucide-react';
import { TimelineEvent } from '@/lib/financing/stateMachine/v2/timeline';

interface FinancingTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileEdit: FileText,
  Send: Send,
  Search: Search,
  AlertCircle: AlertCircle,
  Settings: Settings,
  CheckCircle: CheckCircle2,
  FileText: FileText,
  FileCheck: FileCheck,
  Stamp: Stamp,
  Loader: Loader,
  Wallet: Wallet,
  CreditCard: CreditCard,
  CheckCircle2: CheckCircle2,
  XCircle: XCircle,
  Ban: Ban,
  Clock: Clock,
  Circle: Circle
};

export function FinancingTimeline({ events, className }: FinancingTimelineProps) {
  return (
    <div className={cn("relative", className)} dir="rtl">
      {/* Vertical line */}
      <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />
      
      <div className="space-y-0">
        {events.map((event, index) => {
          const IconComponent = ICON_MAP[event.icon] || Circle;
          const isLast = index === events.length - 1;
          
          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  event.status === 'completed' && "bg-green-500 border-green-500 text-white",
                  event.status === 'current' && "bg-blue-500 border-blue-500 text-white animate-pulse",
                  event.status === 'pending' && "bg-background border-muted-foreground/30 text-muted-foreground",
                  event.status === 'failed' && "bg-red-500 border-red-500 text-white"
                )}
              >
                <IconComponent className="h-4 w-4" />
              </div>
              
              {/* Content */}
              <div className={cn(
                "flex-1 pb-8",
                isLast && "pb-0"
              )}>
                <div className={cn(
                  "rounded-lg border p-4",
                  event.status === 'current' && "border-blue-200 bg-blue-50/50",
                  event.status === 'pending' && "border-dashed bg-muted/30",
                  event.status === 'failed' && "border-red-200 bg-red-50/50"
                )}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={cn(
                        "font-semibold",
                        event.status === 'pending' && "text-muted-foreground"
                      )}>
                        {event.title}
                      </h4>
                      {event.date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.date} • {event.time}
                        </p>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    {event.status === 'current' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        الحالية
                      </span>
                    )}
                    {event.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        قادمة
                      </span>
                    )}
                  </div>
                  
                  {/* Description */}
                  {event.description && (
                    <p className={cn(
                      "text-sm mt-2",
                      event.status === 'pending' ? "text-muted-foreground" : "text-foreground/80"
                    )}>
                      {event.description}
                    </p>
                  )}
                  
                  {/* Actor */}
                  {event.actor && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      بواسطة: {event.actor.role}
                      {event.actor.name && ` (${event.actor.name})`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * مكون Timeline مصغر للعرض في القوائم
 */
export function FinancingTimelineCompact({ 
  currentStatus,
  className 
}: { 
  currentStatus: string;
  className?: string;
}) {
  const phases = [
    { key: 'application', label: 'الطلب' },
    { key: 'admin_setup', label: 'الإعداد' },
    { key: 'contract', label: 'العقد' },
    { key: 'acknowledgment', label: 'الإقرار' },
    { key: 'bond', label: 'السند' },
    { key: 'usage', label: 'التفعيل' }
  ];
  
  // تحديد المرحلة الحالية
  const statusToPhase: Record<string, string> = {
    'DRAFT': 'application',
    'REQUEST_SUBMITTED': 'application',
    'UNDER_REVIEW': 'application',
    'INFO_REQUIRED': 'application',
    'ADMIN_SETUP': 'admin_setup',
    'OFFER_READY': 'admin_setup',
    'CONTRACT_PHASE': 'contract',
    'ACK_PHASE': 'acknowledgment',
    'BOND_PHASE': 'bond',
    'CREDIT_PENDING': 'usage',
    'CREDIT_ACTIVE': 'usage',
    'IN_USE': 'usage',
    'COMPLETED': 'usage'
  };
  
  const currentPhase = statusToPhase[currentStatus] || 'application';
  const currentPhaseIndex = phases.findIndex(p => p.key === currentPhase);
  
  return (
    <div className={cn("flex items-center gap-1", className)} dir="rtl">
      {phases.map((phase, index) => {
        const isCompleted = index < currentPhaseIndex;
        const isCurrent = index === currentPhaseIndex;
        
        return (
          <div key={phase.key} className="flex items-center">
            {/* Step indicator */}
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isCompleted && "bg-green-500",
                isCurrent && "bg-blue-500",
                !isCompleted && !isCurrent && "bg-gray-200"
              )}
              title={phase.label}
            />
            
            {/* Connector */}
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4",
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
