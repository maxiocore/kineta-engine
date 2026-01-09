import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User,
  Building2,
  Bot
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  actor: 'customer' | 'system' | 'reviewer' | 'admin';
  timestamp: string;
  status?: 'success' | 'warning' | 'info' | 'error';
}

interface FinancingActivityLogProps {
  entries: ActivityLogEntry[];
  className?: string;
  maxHeight?: string;
}

const ACTOR_INFO = {
  customer: { label: 'أنت', icon: User, color: 'text-blue-600' },
  system: { label: 'النظام', icon: Bot, color: 'text-purple-600' },
  reviewer: { label: 'فريق المراجعة', icon: Building2, color: 'text-amber-600' },
  admin: { label: 'الإدارة', icon: Building2, color: 'text-green-600' }
};

const STATUS_STYLES = {
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
};

const STATUS_ICONS = {
  success: CheckCircle,
  warning: AlertCircle,
  info: Clock,
  error: AlertCircle
};

export function FinancingActivityLog({ 
  entries, 
  className,
  maxHeight = '300px'
}: FinancingActivityLogProps) {
  if (entries.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)} dir="rtl">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">لا توجد تحديثات حتى الآن</p>
      </div>
    );
  }

  return (
    <div className={className} dir="rtl">
      <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        سجل التحديثات
      </h4>
      <ScrollArea className="pr-4" style={{ maxHeight }}>
        <div className="relative">
          {/* خط الـ Timeline */}
          <div className="absolute right-[15px] top-2 bottom-2 w-0.5 bg-muted" />

          <div className="space-y-4">
            {entries.map((entry, index) => {
              const actorInfo = ACTOR_INFO[entry.actor];
              const StatusIcon = STATUS_ICONS[entry.status || 'info'];
              const statusStyle = STATUS_STYLES[entry.status || 'info'];

              return (
                <motion.div
                  key={entry.id}
                  className="relative flex gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  {/* أيقونة الحالة */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10',
                    statusStyle
                  )}>
                    <StatusIcon className="w-4 h-4" />
                  </div>

                  {/* المحتوى */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{entry.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className={cn('flex items-center gap-1', actorInfo.color)}>
                        <actorInfo.icon className="w-3 h-3" />
                        {actorInfo.label}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(entry.timestamp), 'dd MMM yyyy - HH:mm', { locale: ar })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// دالة مساعدة لتحويل سجل تغيير الحالة إلى نشاط
export function statusChangeToActivity(
  statusChange: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    notes?: string;
    createdAt: string;
  }
): ActivityLogEntry {
  const statusLabels: Record<string, string> = {
    DRAFT: 'مسودة',
    SUBMITTED: 'تم الاستلام',
    UNDER_REVIEW: 'قيد المراجعة',
    ADDITIONAL_INFO_REQUIRED: 'مطلوب معلومات إضافية',
    RISK_CHECK: 'فحص المخاطر',
    APPROVED: 'موافقة',
    APPROVED_WITH_LIMITS: 'موافقة مع قيود',
    DECLINED: 'مرفوض',
    CONTRACT_PRESENTED: 'عرض العقد',
    CONTRACT_ACCEPTED: 'قبول العقد',
    CONTRACT_FINALIZED: 'اعتماد العقد',
    CREDIT_DEPOSIT_PENDING: 'قيد إضافة الرصيد',
    CREDIT_DEPOSITED: 'تم إضافة الرصيد',
    ORDER_PAYMENT_IN_PROGRESS: 'جاري الاستخدام',
    COMPLETED: 'مكتمل',
    EXPIRED: 'منتهي',
    CANCELLED: 'ملغي'
  };

  const getStatus = (toStatus: string): 'success' | 'warning' | 'info' | 'error' => {
    if (['APPROVED', 'APPROVED_WITH_LIMITS', 'CONTRACT_ACCEPTED', 'CONTRACT_FINALIZED', 'CREDIT_DEPOSITED', 'COMPLETED'].includes(toStatus)) {
      return 'success';
    }
    if (['DECLINED', 'CANCELLED'].includes(toStatus)) {
      return 'error';
    }
    if (['ADDITIONAL_INFO_REQUIRED', 'EXPIRED'].includes(toStatus)) {
      return 'warning';
    }
    return 'info';
  };

  return {
    id: statusChange.id,
    action: `تغيير الحالة إلى: ${statusLabels[statusChange.toStatus] || statusChange.toStatus}`,
    description: statusChange.notes || `تم تحديث حالة الطلب${statusChange.fromStatus ? ` من "${statusLabels[statusChange.fromStatus]}"` : ''}`,
    actor: statusChange.changedBy === 'system' ? 'system' : 'reviewer',
    timestamp: statusChange.createdAt,
    status: getStatus(statusChange.toStatus)
  };
}
