/**
 * صفحة حالة طلب التمويل الموحدة
 * Unified Financing Application Status Page
 * 
 * - Timeline بنكي RTL
 * - Activity Log مباشر من قاعدة البيانات
 * - أزرار ديناميكية حسب الحالة
 * - Deep Link Support
 * - Responsive Mobile/Tablet/Desktop
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Hash, 
  Clock, 
  RefreshCw,
  FileText,
  Upload,
  Eye,
  FileSignature,
  ShoppingBag,
  ArrowRight,
  Landmark,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Send,
  Calendar,
  Sparkles,
  ScrollText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  FinancingApplicationStatus, 
  STATE_DEFINITIONS,
  getStateContent 
} from '@/lib/financing/stateMachine';

// =============================================
// Types
// =============================================

interface ActivityLogEntry {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string;
  triggered_by: string;
  reason: string | null;
  is_visible_to_customer: boolean;
  created_at: string;
  metadata: unknown;
}

interface FinancingApplication {
  id: string;
  application_number: string;
  status: string;
  approved_amount: number | null;
  requested_amount: number;
  full_name: string;
  updated_at: string;
  created_at: string;
  // Executive Bond fields
  executive_bond_state: string | null;
  executive_bond_sent_at: string | null;
  executive_bond_signed_at: string | null;
  contract_number: string | null;
}

interface StatusAction {
  label: string;
  action: string;
  icon: React.ElementType;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

// =============================================
// Constants
// =============================================

const STATUS_ORDER: FinancingApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'CONTRACT_PRESENTED',
  'CONTRACT_ACCEPTED',
  'CONTRACT_FINALIZED',
  'CREDIT_DEPOSITED',
  'COMPLETED'
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  SUBMITTED: 'تم الاستلام',
  UNDER_REVIEW: 'قيد المراجعة',
  ADDITIONAL_INFO_REQUIRED: 'مطلوب مستندات',
  RISK_CHECK: 'فحص المخاطر',
  APPROVED: 'تمت الموافقة',
  APPROVED_WITH_LIMITS: 'موافقة معدّلة',
  DECLINED: 'مرفوض',
  CONTRACT_PRESENTED: 'عرض العقد',
  CONTRACT_ACCEPTED: 'تم القبول',
  CONTRACT_FINALIZED: 'اعتماد العقد',
  CREDIT_DEPOSIT_PENDING: 'جاري الإضافة',
  CREDIT_DEPOSITED: 'تم الإيداع',
  FIN_CREDIT_DEPOSITED: 'تم الإيداع',
  ORDER_PAYMENT_IN_PROGRESS: 'جاري الاستخدام',
  COMPLETED: 'مكتمل',
  EXPIRED: 'منتهي',
  CANCELLED: 'ملغي'
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SUBMITTED: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' },
  UNDER_REVIEW: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30' },
  APPROVED: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' },
  APPROVED_WITH_LIMITS: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' },
  DECLINED: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' },
  CONTRACT_PRESENTED: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30' },
  CONTRACT_ACCEPTED: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/30' },
  CONTRACT_FINALIZED: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/30' },
  CREDIT_DEPOSITED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' },
  FIN_CREDIT_DEPOSITED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' },
  COMPLETED: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  EXPIRED: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
  CANCELLED: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
};

// =============================================
// Helper Functions
// =============================================

function getStatusActions(status: string): StatusAction[] {
  const normalizedStatus = status.replace('FIN_', '').toUpperCase();
  
  const actionMap: Record<string, StatusAction[]> = {
    ADDITIONAL_INFO_REQUIRED: [
      { label: 'رفع المستندات', action: 'upload_documents', icon: Upload },
      { label: 'متابعة الحالة', action: 'track', icon: RefreshCw, variant: 'outline' }
    ],
    CONTRACT_PRESENTED: [
      { label: 'عرض العقد', action: 'view_contract', icon: Eye },
      { label: 'الموافقة على العقد', action: 'accept_contract', icon: FileSignature, className: 'bg-gradient-to-r from-primary to-accent' }
    ],
    CONTRACT_ACCEPTED: [
      { label: 'عرض العقد', action: 'view_contract', icon: Eye, variant: 'outline' },
      { label: 'متابعة الحالة', action: 'track', icon: RefreshCw }
    ],
    CONTRACT_FINALIZED: [
      { label: 'عرض العقد', action: 'view_contract', icon: Eye, variant: 'outline' },
      { label: 'متابعة الحالة', action: 'track', icon: RefreshCw }
    ],
    CREDIT_DEPOSITED: [
      { label: 'استخدام الرصيد', action: 'use_credit', icon: ShoppingBag, className: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
      { label: 'عرض الرصيد', action: 'view_balance', icon: Landmark, variant: 'outline' }
    ],
    APPROVED: [
      { label: 'متابعة الحالة', action: 'track', icon: RefreshCw }
    ],
    APPROVED_WITH_LIMITS: [
      { label: 'متابعة الحالة', action: 'track', icon: RefreshCw }
    ],
    DECLINED: [
      { label: 'تقديم طلب جديد', action: 'new_application', icon: FileText }
    ],
    EXPIRED: [
      { label: 'تقديم طلب جديد', action: 'new_application', icon: FileText }
    ],
    CANCELLED: [
      { label: 'تقديم طلب جديد', action: 'new_application', icon: FileText }
    ]
  };

  return actionMap[normalizedStatus] || [
    { label: 'متابعة الحالة', action: 'track', icon: RefreshCw, variant: 'outline' }
  ];
}

function normalizeStatus(status: string): FinancingApplicationStatus {
  // Remove FIN_ prefix if present
  const normalized = status.replace('FIN_', '').toUpperCase();
  if (STATUS_ORDER.includes(normalized as FinancingApplicationStatus)) {
    return normalized as FinancingApplicationStatus;
  }
  return 'SUBMITTED';
}

// =============================================
// Sub-Components
// =============================================

/**
 * Banking-style RTL Timeline
 */
function BankingTimeline({ 
  currentStatus,
  className 
}: { 
  currentStatus: string;
  className?: string;
}) {
  const normalizedStatus = normalizeStatus(currentStatus);
  const currentIndex = STATUS_ORDER.indexOf(normalizedStatus);
  const isTerminal = ['DECLINED', 'EXPIRED', 'CANCELLED'].includes(currentStatus.replace('FIN_', ''));
  
  // عرض 5 خطوات حول الحالة الحالية
  const startIndex = Math.max(0, currentIndex - 1);
  const endIndex = Math.min(STATUS_ORDER.length, startIndex + 5);
  const visibleSteps = STATUS_ORDER.slice(startIndex, endIndex);
  
  const progressPercent = currentIndex >= 0 
    ? ((currentIndex - startIndex) / (visibleSteps.length - 1)) * 100 
    : 0;

  return (
    <div className={cn('w-full py-4', className)} dir="rtl">
      {/* شريط التقدم */}
      <div className="relative mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              isTerminal ? 'bg-destructive' : 'bg-gradient-to-l from-primary via-accent to-primary'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* الخطوات */}
      <div className="flex items-start justify-between gap-2">
        {visibleSteps.map((step, index) => {
          const actualIndex = startIndex + index;
          const isCompleted = actualIndex < currentIndex;
          const isCurrent = step === normalizedStatus;
          const isUpcoming = actualIndex > currentIndex;

          return (
            <motion.div
              key={step}
              className="flex flex-col items-center flex-1 min-w-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* الدائرة */}
              <motion.div
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all mb-2',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && !isTerminal && 'bg-primary/10 border-primary text-primary ring-4 ring-primary/20',
                  isCurrent && isTerminal && 'bg-destructive/10 border-destructive text-destructive',
                  isUpcoming && 'bg-muted border-muted-foreground/20 text-muted-foreground'
                )}
                animate={isCurrent ? {
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                ) : (
                  <span className="text-xs font-bold">{actualIndex + 1}</span>
                )}
              </motion.div>

              {/* التسمية */}
              <span className={cn(
                'text-[10px] sm:text-xs font-medium text-center leading-tight px-1',
                isCompleted && 'text-primary',
                isCurrent && 'text-primary font-bold',
                isUpcoming && 'text-muted-foreground'
              )}>
                {STATUS_LABELS[step] || step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Activity Log Component
 */
function ActivityLog({ 
  entries,
  isLoading,
  className 
}: { 
  entries: ActivityLogEntry[];
  isLoading: boolean;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn('text-center py-8', className)} dir="rtl">
        <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">لا توجد تحديثات بعد</p>
      </div>
    );
  }

  const triggerLabels: Record<string, string> = {
    customer: 'أنت',
    admin: 'الإدارة',
    system: 'النظام'
  };

  const triggerColors: Record<string, string> = {
    customer: 'text-blue-600',
    admin: 'text-green-600',
    system: 'text-purple-600'
  };

  return (
    <ScrollArea className={cn('h-[300px] sm:h-[400px]', className)}>
      <div className="relative pr-4" dir="rtl">
        {/* خط الـ Timeline */}
        <div className="absolute right-[11px] top-2 bottom-2 w-0.5 bg-muted" />

        <div className="space-y-4">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              className="relative flex gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* الدائرة */}
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 bg-background border-2',
                entry.to_status.includes('APPROVED') || entry.to_status.includes('ACCEPTED') || entry.to_status.includes('DEPOSITED') || entry.to_status.includes('COMPLETED')
                  ? 'border-green-500 text-green-600'
                  : entry.to_status.includes('DECLINED') || entry.to_status.includes('CANCELLED')
                  ? 'border-red-500 text-red-600'
                  : 'border-primary text-primary'
              )}>
                <CheckCircle2 className="w-3 h-3" />
              </div>

              {/* المحتوى */}
              <div className="flex-1 min-w-0 pb-4">
                <p className="text-sm font-medium">
                  {STATUS_LABELS[entry.to_status.replace('FIN_', '')] || entry.to_status}
                </p>
                {entry.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {entry.reason}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span className={triggerColors[entry.triggered_by]}>
                    {triggerLabels[entry.triggered_by] || entry.triggered_by}
                  </span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ar })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

/**
 * Status Info Header - Always Visible
 */
function StatusInfoHeader({
  application,
  className
}: {
  application: FinancingApplication;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const statusColors = STATUS_COLORS[application.status.replace('FIN_', '')] || STATUS_COLORS.SUBMITTED;

  const copyApplicationNumber = () => {
    navigator.clipboard.writeText(application.application_number);
    setCopied(true);
    toast.success('تم نسخ رقم الطلب');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className={cn('rounded-xl border bg-card p-4 sm:p-6', className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* المعلومات الأساسية */}
        <div className="flex items-start gap-3">
          <motion.div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
              statusColors.bg
            )}
            whileHover={{ scale: 1.05 }}
          >
            <Landmark className={cn('w-6 h-6', statusColors.text)} />
          </motion.div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg sm:text-xl truncate">
              {application.full_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={copyApplicationNumber}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Hash className="w-3.5 h-3.5" />
                <span className="font-mono">{application.application_number}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* الحالة وآخر تحديث */}
        <div className="flex flex-col sm:items-end gap-2">
          <Badge className={cn('text-sm px-3 py-1', statusColors.bg, statusColors.text, statusColors.border)}>
            {STATUS_LABELS[application.status.replace('FIN_', '')] || application.status}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>
              آخر تحديث: {format(new Date(application.updated_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
            </span>
          </div>
        </div>
      </div>

      {/* المبلغ المعتمد */}
      {application.approved_amount && (
        <motion.div
          className="mt-4 pt-4 border-t flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-sm text-muted-foreground">رصيد الخدمات المعتمد</span>
          <span className="text-xl sm:text-2xl font-bold text-primary">
            {application.approved_amount.toLocaleString('ar-SA')} 
            <span className="text-sm font-normal text-muted-foreground mr-1">ر.س</span>
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Action Buttons Component
 */
function ActionButtons({
  status,
  applicationId,
  onAction,
  className
}: {
  status: string;
  applicationId: string;
  onAction: (action: string) => void;
  className?: string;
}) {
  const actions = getStatusActions(status);

  if (actions.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-3', className)} dir="rtl">
      {actions.map((action, index) => (
        <motion.div
          key={action.action}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex-1 min-w-[140px]"
        >
          <Button
            variant={action.variant || 'default'}
            className={cn('w-full gap-2', action.className)}
            onClick={() => onAction(action.action)}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Executive Bond Status Card - كارت حالة السند التنفيذي للعميل
 */
function ExecutiveBondCard({
  bondState,
  bondSentAt,
  bondSignedAt,
  applicationId,
  onConfirmSigned
}: {
  bondState: string;
  bondSentAt: string | null;
  bondSignedAt: string | null;
  applicationId: string;
  onConfirmSigned: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  
  const getBondStateInfo = () => {
    switch (bondState) {
      case 'ISSUED':
        return {
          title: 'السند التنفيذي جاهز للتوقيع',
          description: 'تم إرسال السند التنفيذي إليك عبر منصة نافذ. يرجى توقيعه لإتمام عملية التمويل.',
          color: 'border-orange-500 bg-orange-500/5',
          badgeColor: 'bg-orange-500',
          icon: FileSignature,
          showConfirmButton: true
        };
      case 'SIGNED_BY_CLIENT':
        return {
          title: 'تم توقيع السند التنفيذي',
          description: 'شكراً لك! تم تأكيد توقيعك على السند التنفيذي. سيتم تفعيل التمويل قريباً.',
          color: 'border-green-500 bg-green-500/5',
          badgeColor: 'bg-green-500',
          icon: CheckCircle2,
          showConfirmButton: false
        };
      default:
        return {
          title: 'جاري معالجة السند',
          description: 'جاري إعداد السند التنفيذي. سيتم إعلامك عند جاهزيته.',
          color: 'border-blue-500 bg-blue-500/5',
          badgeColor: 'bg-blue-500',
          icon: Loader2,
          showConfirmButton: false
        };
    }
  };

  const info = getBondStateInfo();
  const IconComponent = info.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className={cn('border-2', info.color)} dir="rtl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <div className={cn('p-3 rounded-xl text-white', info.badgeColor)}>
              <IconComponent className={cn('w-6 h-6', bondState === 'ISSUING' && 'animate-spin')} />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg">{info.title}</h3>
                <Badge className={cn('text-white', info.badgeColor)}>
                  {bondState === 'ISSUED' ? 'بانتظار التوقيع' : bondState === 'SIGNED_BY_CLIENT' ? 'تم التوقيع' : 'جاري الإعداد'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{info.description}</p>
              
              {bondSentAt && (
                <p className="text-xs text-muted-foreground">
                  تاريخ الإرسال: {format(new Date(bondSentAt), 'dd MMM yyyy - HH:mm', { locale: ar })}
                </p>
              )}
              {bondSignedAt && (
                <p className="text-xs text-green-600">
                  تاريخ التوقيع: {format(new Date(bondSignedAt), 'dd MMM yyyy - HH:mm', { locale: ar })}
                </p>
              )}
            </div>

            {/* Actions */}
            {info.showConfirmButton && (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => window.open('https://nafath.sa', '_blank')}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-500/10"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  فتح منصة نافذ
                </Button>
                <Button
                  onClick={onConfirmSigned}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التأكيد...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                      تأكيد توقيع السند
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================
// Main Component
// =============================================

export function UnifiedStatusPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [application, setApplication] = useState<FinancingApplication | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogLoading, setIsLogLoading] = useState(true);

  // Deep link handling - check for source param
  const source = searchParams.get('source'); // email, whatsapp, etc.

  const fetchApplication = useCallback(async () => {
    if (!applicationId || !user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('financing_applications')
        .select('id, application_number, status, approved_amount, requested_amount, full_name, updated_at, created_at, executive_bond_state, executive_bond_sent_at, executive_bond_signed_at, contract_number')
        .eq('id', applicationId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setApplication(data as FinancingApplication);
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('حدث خطأ في تحميل بيانات الطلب');
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, user?.id]);

  const fetchActivityLog = useCallback(async () => {
    if (!applicationId) return;

    try {
      setIsLogLoading(true);
      const { data, error } = await supabase
        .from('financing_activity_log')
        .select('*')
        .eq('application_id', applicationId)
        .eq('is_visible_to_customer', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivityLog(data || []);
    } catch (error) {
      console.error('Error fetching activity log:', error);
      // Fallback to empty - don't show error to user
      setActivityLog([]);
    } finally {
      setIsLogLoading(false);
    }
  }, [applicationId]);

  // Handle confirm bond signed - تأكيد توقيع السند التنفيذي
  const handleConfirmBondSigned = async () => {
    if (!applicationId) return;
    
    try {
      const { error } = await supabase
        .from('financing_applications')
        .update({
          executive_bond_state: 'SIGNED_BY_CLIENT',
          executive_bond_signed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;
      
      toast.success('تم تأكيد توقيع السند التنفيذي بنجاح');
      fetchApplication();
    } catch (error) {
      console.error('Error confirming bond signed:', error);
      toast.error('حدث خطأ أثناء تأكيد التوقيع');
    }
  };

  useEffect(() => {
    fetchApplication();
    fetchActivityLog();

    // Real-time subscription
    if (applicationId) {
      const channel = supabase
        .channel(`unified-status-${applicationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'financing_applications',
            filter: `id=eq.${applicationId}`
          },
          (payload) => {
            setApplication(prev => prev ? { ...prev, ...payload.new } as FinancingApplication : null);
            toast.success('تم تحديث حالة الطلب');
            fetchActivityLog();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'financing_activity_log',
            filter: `application_id=eq.${applicationId}`
          },
          () => {
            fetchActivityLog();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [applicationId, fetchApplication, fetchActivityLog]);

  // Track deep link source
  useEffect(() => {
    if (source && applicationId) {
      // يمكن إضافة تتبع analytics هنا
      console.log(`Status page accessed from: ${source}`);
    }
  }, [source, applicationId]);

  const handleAction = (action: string) => {
    switch (action) {
      case 'upload_documents':
        navigate(`/dashboard/financing/documents/${applicationId}`);
        break;
      case 'view_contract':
        navigate(`/dashboard/financing/contract/${applicationId}`);
        break;
      case 'accept_contract':
        navigate(`/dashboard/financing/contract/${applicationId}?action=sign`);
        break;
      case 'use_credit':
        navigate('/dashboard/services');
        break;
      case 'view_balance':
        navigate('/dashboard/financial?tab=balance-logs');
        break;
      case 'new_application':
        navigate('/dashboard/financing/apply');
        break;
      case 'track':
        fetchApplication();
        fetchActivityLog();
        toast.success('تم تحديث البيانات');
        break;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 p-4" dir="rtl">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // Not Found State
  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center" dir="rtl">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">لم يتم العثور على الطلب</h2>
        <p className="text-muted-foreground mb-6">
          الطلب غير موجود أو ليس لديك صلاحية للوصول إليه
        </p>
        <Button onClick={() => navigate('/dashboard/financing')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للتمويل
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header - Always Visible */}
      <StatusInfoHeader application={application} />

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" dir="rtl" className="w-full">
        <TabsList className="bg-card/80 backdrop-blur-sm border border-border/50 inline-flex w-full sm:w-auto gap-0.5 p-0.5 h-10 rounded-lg shadow-sm">
          <TabsTrigger 
            value="overview" 
            className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 font-medium gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger 
            value="installments" 
            className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 font-medium gap-1.5"
          >
            <Calendar className="h-4 w-4" />
            <span>الأقساط</span>
          </TabsTrigger>
          <TabsTrigger 
            value="contract" 
            className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 font-medium gap-1.5"
          >
            <ScrollText className="h-4 w-4" />
            <span>العقد</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Banking Timeline */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <BankingTimeline currentStatus={application.status} />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <ActionButtons
            status={application.status}
            applicationId={application.id}
            onAction={handleAction}
          />

          {/* Executive Bond Status Card - عرض حالة السند التنفيذي */}
          {application.executive_bond_state && application.executive_bond_state !== 'NOT_ISSUED' && (
            <ExecutiveBondCard
              bondState={application.executive_bond_state}
              bondSentAt={application.executive_bond_sent_at}
              bondSignedAt={application.executive_bond_signed_at}
              applicationId={application.id}
              onConfirmSigned={() => {
                handleConfirmBondSigned();
              }}
            />
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    تفاصيل الحالة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* الرسالة الحالية */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm leading-relaxed">
                      {getStateContent(application.status.replace('FIN_', '') as FinancingApplicationStatus)?.description || 
                       'جاري معالجة طلبك. سيتم إخطارك بأي تحديثات.'}
                    </p>
                  </div>

                  {/* معلومات إضافية */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground block mb-1">المبلغ المطلوب</span>
                      <span className="font-bold">{application.requested_amount.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground block mb-1">تاريخ التقديم</span>
                      <span className="font-bold">{format(new Date(application.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                    </div>
                  </div>

                  {/* ملاحظة التمويل */}
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      ⚠️ التمويل غير نقدي - رصيد خدمات يُستخدم داخل المنصة فقط ولا يمكن سحبه أو تحويله
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Log */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    سجل التحديثات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityLog 
                    entries={activityLog} 
                    isLoading={isLogLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Installments Tab */}
        <TabsContent value="installments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                جدول الأقساط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">جدول الأقساط</p>
                <p className="text-sm">سيتم عرض جدول الأقساط بعد تفعيل التمويل</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate(`/dashboard/financing/status/${applicationId}#installments`)}
                >
                  عرض الأقساط من لوحة التمويل
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract Tab */}
        <TabsContent value="contract" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="w-5 h-5" />
                العقد والمستندات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.contract_number ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-bold text-emerald-600">تم توقيع العقد</span>
                    </div>
                    <p className="text-sm text-muted-foreground">رقم العقد: {application.contract_number}</p>
                  </div>
                  <Button 
                    onClick={() => navigate(`/dashboard/financing/contract/${applicationId}`)}
                    className="w-full bg-gradient-to-r from-purple-500 to-violet-600"
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    عرض العقد
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">العقد غير متاح</p>
                  <p className="text-sm">سيتم إتاحة العقد بعد الموافقة على طلب التمويل</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UnifiedStatusPage;
