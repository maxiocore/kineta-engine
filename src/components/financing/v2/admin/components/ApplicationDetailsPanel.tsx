/**
 * ASH HOLDING Financing Admin V2 - Application Details Panel (Enhanced)
 * لوحة تفاصيل الطلب المحسّنة
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  ChevronLeft,
  AlertTriangle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import type { AdminApplicationView } from '../types';
import { STATUS_CONFIG, STATUS_COLORS } from '../../config/statusConfig';
import { AdminStatusTimeline } from './AdminStatusTimeline';
import { AdminAuditLog } from './AdminAuditLog';
import { AdminQuickActions } from './AdminQuickActions';
import { cn } from '@/lib/utils';

interface ApplicationDetailsPanelProps {
  application: AdminApplicationView | null;
  onClose: () => void;
}

export function ApplicationDetailsPanel({
  application,
  onClose,
}: ApplicationDetailsPanelProps) {
  if (!application) return null;

  const statusConfig = STATUS_CONFIG[application.status];
  const colors = STATUS_COLORS[statusConfig?.color || 'gray'];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col border-border/50">
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    #{application.application_number}
                  </CardTitle>
                  <button
                    onClick={() => copyToClipboard(application.application_number, 'رقم الطلب')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(application.submitted_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                </p>
              </div>
            </div>
            <Badge className={cn('font-normal text-xs', colors?.badge)}>
              {statusConfig?.nameAr}
            </Badge>
          </div>

          {/* Contract Version Warning */}
          {application.contract_version > 1 && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs text-warning font-medium">
                إصدار العقد: v{application.contract_version}
              </span>
            </div>
          )}
        </CardHeader>

        <Separator />

        {/* Tabbed Content */}
        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden" dir="rtl">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-9">
            <TabsTrigger value="details" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              التفاصيل
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              المسار
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              السجل
            </TabsTrigger>
          </TabsList>

          {/* Tab: Details */}
          <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <CardContent className="p-4 space-y-5">
                {/* Customer Info */}
                <Section title="معلومات العميل" icon={User}>
                  <InfoRow label="الاسم" value={application.full_name} copyable onCopy={() => copyToClipboard(application.full_name, 'الاسم')} />
                  <InfoRow label="الهوية" value={application.national_id} copyable onCopy={() => copyToClipboard(application.national_id, 'الهوية')} />
                  <InfoRow label="الجوال" value={application.phone} isPhone />
                  <InfoRow label="البريد" value={application.email} isEmail />
                  {application.address && (
                    <InfoRow label="العنوان" value={application.address} />
                  )}
                </Section>

                {/* Company Info */}
                {application.company_name && (
                  <Section title="معلومات الشركة" icon={Building2}>
                    <InfoRow label="اسم الشركة" value={application.company_name} />
                    {application.commercial_register && (
                      <InfoRow label="السجل التجاري" value={application.commercial_register} />
                    )}
                    {application.tax_number && (
                      <InfoRow label="الرقم الضريبي" value={application.tax_number} />
                    )}
                  </Section>
                )}

                {/* Financing Details */}
                <Section title="تفاصيل التمويل" icon={CreditCard}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">المبلغ المطلوب</p>
                      <p className="text-lg font-bold mt-1">
                        {application.requested_amount.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">ر.س</p>
                    </div>
                    <div className="bg-success/5 rounded-xl p-3 text-center border border-success/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">المبلغ المعتمد</p>
                      <p className="text-lg font-bold text-success mt-1">
                        {(application.approved_amount || application.requested_amount).toLocaleString('ar-SA')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">ر.س</p>
                    </div>
                  </div>

                  {application.plan_name_ar && (
                    <div className="mt-3 p-2.5 bg-muted/20 rounded-lg border border-border/30">
                      <p className="text-xs text-muted-foreground">
                        الخطة: <span className="text-foreground font-medium">{application.plan_name_ar}</span>
                      </p>
                      {application.plan_installments_count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          عدد الأقساط: <span className="text-foreground font-medium">
                            {application.contract_override_installments || application.plan_installments_count}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </Section>

                {/* Service Description */}
                {application.service_description && (
                  <Section title="وصف الخدمة" icon={FileText}>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {application.service_description}
                    </p>
                  </Section>
                )}

                {/* Admin Notes */}
                {application.admin_notes && (
                  <Section title="ملاحظات الإدارة" icon={FileText}>
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {application.admin_notes}
                    </p>
                  </Section>
                )}
              </CardContent>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Timeline */}
          <TabsContent value="timeline" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <CardContent className="p-4">
                <AdminStatusTimeline
                  currentStatus={application.status}
                  submittedAt={application.submitted_at}
                  updatedAt={application.updated_at}
                  phaseUpdatedAt={application.phase_updated_at}
                />
              </CardContent>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Audit Log */}
          <TabsContent value="audit" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <CardContent className="p-4">
                <AdminAuditLog applicationId={application.id} />
              </CardContent>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Quick Actions */}
        <div className="p-4 flex-shrink-0">
          <AdminQuickActions application={application} onActionComplete={onClose} />
        </div>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  isPhone,
  isEmail,
  copyable,
  onCopy,
}: {
  label: string;
  value: string;
  isPhone?: boolean;
  isEmail?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1 group">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {isPhone ? (
          <a
            href={`tel:${value}`}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            dir="ltr"
          >
            {value}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ) : isEmail ? (
          <a
            href={`mailto:${value}`}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            dir="ltr"
          >
            {value}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ) : (
          <span className="text-xs font-medium">{value}</span>
        )}
        {copyable && (
          <button
            onClick={onCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
