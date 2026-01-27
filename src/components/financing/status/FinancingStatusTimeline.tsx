import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FinancingApplicationStatus } from '@/lib/financing/stateMachine';
import { normalizeStatus, isNegativeStatus } from '@/lib/financing/statusNormalizer';

interface TimelineStep {
  status: FinancingApplicationStatus;
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
}

interface FinancingStatusTimelineProps {
  currentStatus: FinancingApplicationStatus | string;
  className?: string;
}

// ترتيب الحالات في المسار الطبيعي
const STATUS_ORDER: FinancingApplicationStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'RISK_CHECK',
  'APPROVED',
  'CONTRACT_PRESENTED',
  'CONTRACT_ACCEPTED',
  'CONTRACT_FINALIZED',
  'CREDIT_DEPOSIT_PENDING',
  'CREDIT_DEPOSITED',
  'COMPLETED'
];

// تسميات مختصرة للـ Timeline
const SHORT_LABELS: Record<FinancingApplicationStatus, string> = {
  DRAFT: 'إعداد الطلب',
  SUBMITTED: 'تم الاستلام',
  UNDER_REVIEW: 'المراجعة',
  ADDITIONAL_INFO_REQUIRED: 'معلومات إضافية',
  RISK_CHECK: 'التحقق',
  APPROVED: 'الموافقة',
  APPROVED_WITH_LIMITS: 'موافقة معدّلة',
  DECLINED: 'مرفوض',
  CONTRACT_PRESENTED: 'عرض العقد',
  CONTRACT_ACCEPTED: 'قبول العقد',
  CONTRACT_FINALIZED: 'اعتماد العقد',
  CREDIT_DEPOSIT_PENDING: 'إضافة الرصيد',
  CREDIT_DEPOSITED: 'الرصيد جاهز',
  ORDER_PAYMENT_IN_PROGRESS: 'جاري الاستخدام',
  COMPLETED: 'مكتمل',
  EXPIRED: 'منتهي',
  CANCELLED: 'ملغي'
};

export function FinancingStatusTimeline({ currentStatus, className }: FinancingStatusTimelineProps) {
  // تحويل الحالة من تنسيق DB إلى تنسيق UI
  const normalizedStatus = normalizeStatus(currentStatus as string);
  const currentIndex = STATUS_ORDER.indexOf(normalizedStatus);
  const isTerminalNegative = isNegativeStatus(normalizedStatus);

  const steps: TimelineStep[] = STATUS_ORDER.map((status, index) => ({
    status,
    label: SHORT_LABELS[status],
    isCompleted: index < currentIndex,
    isCurrent: status === normalizedStatus,
    isUpcoming: index > currentIndex
  }));

  // إذا كانت حالة نهائية سلبية، نعرضها بشكل مختلف
  if (isTerminalNegative) {
    const terminalStep: TimelineStep = {
      status: normalizedStatus,
      label: SHORT_LABELS[normalizedStatus],
      isCompleted: false,
      isCurrent: true,
      isUpcoming: false
    };
    
    // نعرض آخر 3 خطوات + الحالة النهائية
    const displaySteps = steps.slice(0, Math.min(currentIndex, 3));
    displaySteps.push(terminalStep);
    
    return (
      <TimelineContent steps={displaySteps} isTerminalNegative={true} className={className} />
    );
  }

  // نعرض 5 خطوات حول الحالة الحالية
  const startIndex = Math.max(0, currentIndex - 2);
  const endIndex = Math.min(STATUS_ORDER.length, startIndex + 5);
  const displaySteps = steps.slice(startIndex, endIndex);

  return <TimelineContent steps={displaySteps} isTerminalNegative={false} className={className} />;
}

function TimelineContent({ 
  steps, 
  isTerminalNegative,
  className 
}: { 
  steps: TimelineStep[]; 
  isTerminalNegative: boolean;
  className?: string;
}) {
  return (
    <div className={cn('w-full py-6', className)} dir="rtl">
      <div className="relative flex items-center justify-between">
        {/* خط التقدم */}
        <div className="absolute top-5 right-5 left-5 h-0.5 bg-muted">
          <motion.div
            className={cn(
              'h-full',
              isTerminalNegative ? 'bg-destructive' : 'bg-primary'
            )}
            initial={{ width: '0%' }}
            animate={{ 
              width: `${(steps.filter(s => s.isCompleted).length / (steps.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {steps.map((step, index) => (
          <motion.div
            key={step.status}
            className="relative flex flex-col items-center z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            {/* أيقونة الخطوة */}
            <motion.div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                step.isCompleted && 'bg-primary border-primary text-primary-foreground',
                step.isCurrent && !isTerminalNegative && 'bg-primary/10 border-primary text-primary',
                step.isCurrent && isTerminalNegative && 'bg-destructive/10 border-destructive text-destructive',
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
              {step.isCompleted ? (
                <Check className="w-5 h-5" />
              ) : step.isCurrent ? (
                isTerminalNegative ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </motion.div>

            {/* تسمية الخطوة */}
            <motion.span
              className={cn(
                'mt-2 text-xs font-medium text-center max-w-[80px] leading-tight',
                step.isCompleted && 'text-primary',
                step.isCurrent && !isTerminalNegative && 'text-primary font-bold',
                step.isCurrent && isTerminalNegative && 'text-destructive font-bold',
                step.isUpcoming && 'text-muted-foreground'
              )}
            >
              {step.label}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
