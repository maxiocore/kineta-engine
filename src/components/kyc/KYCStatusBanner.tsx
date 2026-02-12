import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface KYCStatusBannerProps {
  status: 'approved' | 'pending' | 'rejected' | 'not_started';
  rejectionReason?: string;
  reviewedAt?: string;
  nextAction?: string;
}

const statusConfig = {
  approved: {
    ar: 'تم التحقق',
    icon: CheckCircle,
    bgClass: 'bg-success/5',
    borderClass: 'border-success/20',
    badgeVariant: 'default' as const,
    actionAr: 'ممتاز! حسابك معتمد وجاهز للاستخدام',
    colorClass: 'text-success',
  },
  pending: {
    ar: 'قيد المراجعة',
    icon: Clock,
    bgClass: 'bg-warning/5',
    borderClass: 'border-warning/20',
    badgeVariant: 'outline' as const,
    actionAr: 'سنراجع طلبك قريباً. يستغرق عادة 24 ساعة',
    colorClass: 'text-warning',
  },
  rejected: {
    ar: 'تم الرفض',
    icon: XCircle,
    bgClass: 'bg-destructive/5',
    borderClass: 'border-destructive/20',
    badgeVariant: 'destructive' as const,
    actionAr: 'يرجى تصحيح المشاكل وإعادة التقديم',
    colorClass: 'text-destructive',
  },
  not_started: {
    ar: 'لم يبدأ',
    icon: AlertTriangle,
    bgClass: 'bg-muted/50',
    borderClass: 'border-muted/30',
    badgeVariant: 'outline' as const,
    actionAr: 'ابدأ عملية التحقق الآن للوصول إلى جميع المميزات',
    colorClass: 'text-muted-foreground',
  },
};

export function KYCStatusBanner({
  status,
  rejectionReason,
  reviewedAt,
  nextAction,
}: KYCStatusBannerProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`border ${config.borderClass} ${config.bgClass} overflow-hidden`}
        dir="rtl"
      >
        <div className="flex items-start gap-4 p-4 sm:p-6">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${config.colorClass}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge variant={config.badgeVariant} className="mb-2">
                  {config.ar}
                </Badge>
                <p className="text-sm sm:text-base text-foreground font-medium">
                  {nextAction || config.actionAr}
                </p>
              </div>
            </div>

            {/* Rejection reason if applicable */}
            {status === 'rejected' && rejectionReason && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-3 p-3 bg-background/50 rounded-md border border-destructive/20"
              >
                <p className="text-xs sm:text-sm text-destructive font-medium mb-1">
                  سبب الرفض:
                </p>
                <p className="text-xs sm:text-sm text-foreground/80">
                  {rejectionReason}
                </p>
              </motion.div>
            )}

            {/* Review timestamp if approved */}
            {status === 'approved' && reviewedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                تم التحقق في {new Date(reviewedAt).toLocaleDateString('ar-SA')}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
