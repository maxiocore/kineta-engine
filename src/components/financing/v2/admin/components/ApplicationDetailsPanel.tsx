/**
 * ASH HOLDING Financing Admin V2 - Application Details Panel
 * لوحة تفاصيل الطلب
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Building2,
  CreditCard,
  Calendar,
  FileText,
  ChevronLeft,
  Send,
  XCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { AdminApplicationView, AdminActionType } from '../types';
import { STATUS_CONFIG, STATUS_COLORS } from '../../config/statusConfig';
import { getActionsForStatus, getPrimaryAction, getSecondaryActions } from '../config/actionsConfig';
import { useAdminActions } from '../hooks/useAdminActions';
import { cn } from '@/lib/utils';

interface ApplicationDetailsPanelProps {
  application: AdminApplicationView | null;
  onClose: () => void;
}

export function ApplicationDetailsPanel({ 
  application, 
  onClose 
}: ApplicationDetailsPanelProps) {
  const { executeAction, isExecuting } = useAdminActions();
  const [confirmDialog, setConfirmDialog] = useState<{
    action: AdminActionType;
    requiresReason: boolean;
  } | null>(null);
  const [reason, setReason] = useState('');

  if (!application) return null;

  const statusConfig = STATUS_CONFIG[application.status];
  const colors = STATUS_COLORS[statusConfig?.color || 'gray'];
  const primaryAction = getPrimaryAction(application.status);
  const secondaryActions = getSecondaryActions(application.status);

  const handleAction = async (actionType: AdminActionType) => {
    const action = getActionsForStatus(application.status).find(a => a.id === actionType);
    
    if (action?.requiresConfirmation || action?.requiresReason) {
      setConfirmDialog({ 
        action: actionType, 
        requiresReason: action.requiresReason 
      });
    } else {
      await executeAction({ 
        applicationId: application.id, 
        actionType 
      });
    }
  };

  const confirmAction = async () => {
    if (!confirmDialog) return;
    
    await executeAction({
      applicationId: application.id,
      actionType: confirmDialog.action,
      reason: reason || undefined,
    });
    
    setConfirmDialog(null);
    setReason('');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="h-full"
      >
        <Card className="h-full flex flex-col">
          {/* Header */}
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
                <div>
                  <CardTitle className="text-lg">
                    طلب #{application.application_number}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {format(new Date(application.submitted_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                  </p>
                </div>
              </div>
              <Badge className={cn("font-normal text-sm", colors?.badge)}>
                {statusConfig?.nameAr}
              </Badge>
            </div>
          </CardHeader>

          <Separator />

          {/* Content */}
          <ScrollArea className="flex-1">
            <CardContent className="p-4 space-y-6">
              {/* Customer Info */}
              <Section title="معلومات العميل" icon={User}>
                <InfoRow icon={User} label="الاسم" value={application.full_name} />
                <InfoRow icon={CreditCard} label="الهوية" value={application.national_id} />
                <InfoRow icon={Phone} label="الجوال" value={application.phone} isPhone />
                <InfoRow icon={Mail} label="البريد" value={application.email} />
                {application.address && (
                  <InfoRow icon={MapPin} label="العنوان" value={application.address} />
                )}
              </Section>

              {/* Company Info */}
              {application.company_name && (
                <Section title="معلومات الشركة" icon={Building2}>
                  <InfoRow icon={Building2} label="اسم الشركة" value={application.company_name} />
                  {application.commercial_register && (
                    <InfoRow icon={FileText} label="السجل التجاري" value={application.commercial_register} />
                  )}
                  {application.tax_number && (
                    <InfoRow icon={CreditCard} label="الرقم الضريبي" value={application.tax_number} />
                  )}
                </Section>
              )}

              {/* Financing Details */}
              <Section title="تفاصيل التمويل" icon={CreditCard}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">المبلغ المطلوب</p>
                    <p className="text-lg font-bold mt-1">
                      {application.requested_amount.toLocaleString('ar-SA')} ر.س
                    </p>
                  </div>
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">المبلغ المعتمد</p>
                    <p className="text-lg font-bold text-success mt-1">
                      {(application.approved_amount || application.requested_amount).toLocaleString('ar-SA')} ر.س
                    </p>
                  </div>
                </div>
                
                {application.plan_name_ar && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">الخطة: {application.plan_name_ar}</p>
                    {application.plan_installments_count && (
                      <p className="text-sm text-muted-foreground mt-1">
                        عدد الأقساط: {application.contract_override_installments || application.plan_installments_count}
                      </p>
                    )}
                  </div>
                )}

                {application.contract_version > 1 && (
                  <div className="mt-3 flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">إصدار العقد: {application.contract_version}</span>
                  </div>
                )}
              </Section>

              {/* Service Description */}
              {application.service_description && (
                <Section title="وصف الخدمة" icon={FileText}>
                  <p className="text-sm text-muted-foreground">
                    {application.service_description}
                  </p>
                </Section>
              )}

              {/* Admin Notes */}
              {application.admin_notes && (
                <Section title="ملاحظات الإدارة" icon={FileText}>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {application.admin_notes}
                  </p>
                </Section>
              )}
            </CardContent>
          </ScrollArea>

          <Separator />

          {/* Actions */}
          <div className="p-4 flex-shrink-0 space-y-3">
            {/* Primary Action */}
            {primaryAction && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleAction(primaryAction.id)}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 ml-2" />
                )}
                {primaryAction.nameAr}
              </Button>
            )}

            {/* Secondary Actions */}
            {secondaryActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {secondaryActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.color === 'destructive' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleAction(action.id)}
                    disabled={isExecuting}
                    className={cn(
                      action.color === 'warning' && 'border-warning text-warning hover:bg-warning/10'
                    )}
                  >
                    {action.nameAr}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الإجراء</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من تنفيذ هذا الإجراء؟
            </DialogDescription>
          </DialogHeader>
          
          {confirmDialog?.requiresReason && (
            <Textarea
              placeholder="اكتب سبب الإجراء (مطلوب)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(null)}
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmAction}
              disabled={confirmDialog?.requiresReason && !reason.trim()}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper Components
function Section({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ 
  icon: Icon, 
  label, 
  value,
  isPhone 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  isPhone?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {isPhone ? (
        <a 
          href={`tel:${value}`}
          className="text-sm font-medium text-primary hover:underline"
          dir="ltr"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm font-medium">{value}</span>
      )}
    </div>
  );
}
