import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  FileText, 
  Upload, 
  Eye, 
  XCircle, 
  ShoppingBag,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  FinancingApplicationStatus, 
  getStateContent,
  STATE_DEFINITIONS,
  canCustomerCancel 
} from '@/lib/financing/stateMachine';

interface FinancingStatusCardProps {
  applicationNumber: string;
  status: FinancingApplicationStatus;
  updatedAt: string;
  approvedAmount?: number;
  onAction?: (action: string) => void;
  className?: string;
}

// ألوان الـ Badge حسب الحالة
const STATUS_BADGE_VARIANTS: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  DRAFT: { variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  SUBMITTED: { variant: 'default', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  UNDER_REVIEW: { variant: 'default', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ADDITIONAL_INFO_REQUIRED: { variant: 'default', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  RISK_CHECK: { variant: 'default', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  APPROVED: { variant: 'default', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  APPROVED_WITH_LIMITS: { variant: 'default', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  DECLINED: { variant: 'destructive', className: '' },
  CONTRACT_PRESENTED: { variant: 'default', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  CONTRACT_ACCEPTED: { variant: 'default', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CONTRACT_FINALIZED: { variant: 'default', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CREDIT_DEPOSIT_PENDING: { variant: 'default', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  CREDIT_DEPOSITED: { variant: 'default', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ORDER_PAYMENT_IN_PROGRESS: { variant: 'default', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  COMPLETED: { variant: 'default', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  EXPIRED: { variant: 'default', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CANCELLED: { variant: 'secondary', className: 'bg-muted text-muted-foreground' }
};

// أيقونات الحالات
const STATUS_ICONS: Record<FinancingApplicationStatus, React.ElementType> = {
  DRAFT: FileText,
  SUBMITTED: Clock,
  UNDER_REVIEW: RefreshCw,
  ADDITIONAL_INFO_REQUIRED: AlertTriangle,
  RISK_CHECK: RefreshCw,
  APPROVED: CheckCircle,
  APPROVED_WITH_LIMITS: CheckCircle,
  DECLINED: XCircle,
  CONTRACT_PRESENTED: FileText,
  CONTRACT_ACCEPTED: CheckCircle,
  CONTRACT_FINALIZED: CheckCircle,
  CREDIT_DEPOSIT_PENDING: Clock,
  CREDIT_DEPOSITED: ShoppingBag,
  ORDER_PAYMENT_IN_PROGRESS: RefreshCw,
  COMPLETED: CheckCircle,
  EXPIRED: Clock,
  CANCELLED: Ban
};

// أزرار الإجراءات حسب الحالة
function getActionButton(status: FinancingApplicationStatus): { label: string; action: string; icon: React.ElementType } | null {
  const actions: Partial<Record<FinancingApplicationStatus, { label: string; action: string; icon: React.ElementType }>> = {
    DRAFT: { label: 'متابعة الطلب', action: 'continue', icon: FileText },
    ADDITIONAL_INFO_REQUIRED: { label: 'رفع المستندات', action: 'upload_documents', icon: Upload },
    CONTRACT_PRESENTED: { label: 'عرض العقد', action: 'view_contract', icon: Eye },
    CREDIT_DEPOSITED: { label: 'استخدام الرصيد', action: 'use_credit', icon: ShoppingBag },
    DECLINED: { label: 'تقديم طلب جديد', action: 'new_application', icon: RefreshCw },
    EXPIRED: { label: 'تقديم طلب جديد', action: 'new_application', icon: RefreshCw },
    CANCELLED: { label: 'تقديم طلب جديد', action: 'new_application', icon: RefreshCw }
  };
  return actions[status] || null;
}

export function FinancingStatusCard({
  applicationNumber,
  status,
  updatedAt,
  approvedAmount,
  onAction,
  className
}: FinancingStatusCardProps) {
  const content = getStateContent(status);
  const definition = STATE_DEFINITIONS[status];
  const badgeStyle = STATUS_BADGE_VARIANTS[status] || STATUS_BADGE_VARIANTS.DRAFT;
  const StatusIcon = STATUS_ICONS[status];
  const actionButton = getActionButton(status);
  const showCancelButton = canCustomerCancel(status);

  const formattedDate = format(new Date(updatedAt), 'dd MMMM yyyy - HH:mm', { locale: ar });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className={cn('overflow-hidden', className)} dir="rtl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  definition.color === 'green' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                  definition.color === 'blue' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                  definition.color === 'yellow' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
                  definition.color === 'red' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                  definition.color === 'purple' && 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                  definition.color === 'orange' && 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
                  definition.color === 'gray' && 'bg-muted text-muted-foreground'
                )}
                animate={['UNDER_REVIEW', 'RISK_CHECK', 'CREDIT_DEPOSIT_PENDING', 'ORDER_PAYMENT_IN_PROGRESS'].includes(status) ? {
                  rotate: [0, 360]
                } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <StatusIcon className="w-6 h-6" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg">{content.title}</h3>
                <p className="text-sm text-muted-foreground">
                  رقم الطلب: <span className="font-mono font-medium">{applicationNumber}</span>
                </p>
              </div>
            </div>
            <Badge 
              variant={badgeStyle.variant}
              className={cn('shrink-0', badgeStyle.className)}
            >
              {definition.nameAr}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* الوصف */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {content.description}
          </p>

          {/* المبلغ المعتمد */}
          {approvedAmount && ['APPROVED', 'APPROVED_WITH_LIMITS', 'CONTRACT_PRESENTED', 'CONTRACT_ACCEPTED', 'CONTRACT_FINALIZED', 'CREDIT_DEPOSIT_PENDING', 'CREDIT_DEPOSITED'].includes(status) && (
            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg p-3"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs text-muted-foreground mb-1">رصيد الخدمات المعتمد</p>
              <p className="text-2xl font-bold text-primary">
                {approvedAmount.toLocaleString('ar-SA')} <span className="text-sm font-normal">ر.س</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                رصيد خدمات داخل المنصة - غير قابل للسحب أو التحويل
              </p>
            </motion.div>
          )}

          {/* ملاحظة التمويل */}
          {content.financingNote && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {content.financingNote}
              </p>
            </div>
          )}

          {/* الخطوة التالية */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">الخطوة التالية:</span>
            <span className="font-medium text-primary">{content.nextAction}</span>
          </div>

          {/* تاريخ آخر تحديث */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="w-3.5 h-3.5" />
            <span>آخر تحديث: {formattedDate}</span>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2 pt-2">
            {actionButton && (
              <Button
                onClick={() => onAction?.(actionButton.action)}
                className="flex-1 gap-2"
              >
                <actionButton.icon className="w-4 h-4" />
                {actionButton.label}
              </Button>
            )}
            {showCancelButton && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onAction?.('cancel')}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
