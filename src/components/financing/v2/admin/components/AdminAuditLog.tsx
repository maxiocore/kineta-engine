/**
 * ASH HOLDING Financing Admin V2 - Audit Log
 * سجل المراجعة للطلب
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Shield, 
  User, 
  Bot,
  AlertTriangle,
  ChevronDown,
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AdminAuditLogProps {
  applicationId: string;
}

interface ActivityEntry {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string;
  triggered_by: string;
  reason: string | null;
  created_at: string;
  is_visible_to_customer: boolean | null;
  metadata: any;
}

const EVENT_LABELS: Record<string, string> = {
  admin_review_application: 'بدء المراجعة',
  admin_prepare_offer: 'تجهيز العرض',
  admin_send_acknowledgment: 'إرسال الإقرار',
  admin_send_contract: 'إرسال العقد',
  admin_issue_bond: 'إصدار السند',
  admin_activate_credit: 'تفعيل الرصيد',
  admin_update_amount: 'تعديل المبلغ',
  admin_update_installments: 'تعديل الأقساط',
  admin_resend_document: 'إعادة الإرسال',
  admin_decline_application: 'رفض الطلب',
  admin_cancel_application: 'إلغاء الطلب',
  status_change: 'تغيير الحالة',
  application_submitted: 'تقديم الطلب',
  contract_signed: 'توقيع العقد',
  ack_signed: 'توقيع الإقرار',
  bond_signed: 'توقيع السند',
  credit_deposited: 'إيداع الرصيد',
};

export function AdminAuditLog({ applicationId }: AdminAuditLogProps) {
  const [expanded, setExpanded] = useState(true);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['admin-audit-log', applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financing_activity_log')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as ActivityEntry[];
    },
    staleTime: 15_000,
  });

  return (
    <div className="space-y-2" dir="rtl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          سجل النشاط
          {activities.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {activities.length}
            </Badge>
          )}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          expanded && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                لا يوجد نشاط مسجل
              </p>
            ) : (
              <ScrollArea className="max-h-[280px]">
                <div className="space-y-0">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        'flex items-start gap-3 py-2.5 px-1',
                        index !== activities.length - 1 && 'border-b border-border/50'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'mt-0.5 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0',
                        activity.triggered_by === 'admin' 
                          ? 'bg-primary/10' 
                          : activity.triggered_by === 'system' 
                          ? 'bg-muted' 
                          : 'bg-success/10'
                      )}>
                        {activity.triggered_by === 'admin' ? (
                          <Shield className="h-3.5 w-3.5 text-primary" />
                        ) : activity.triggered_by === 'system' ? (
                          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-success" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-foreground truncate">
                            {EVENT_LABELS[activity.event_type] || activity.event_type}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(activity.created_at), 'dd/MM HH:mm', { locale: ar })}
                          </span>
                        </div>

                        {/* Status transition */}
                        {activity.from_status && activity.to_status && activity.from_status !== activity.to_status && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-muted-foreground/70">{activity.from_status}</span>
                            <span className="text-[10px] text-muted-foreground/50">←</span>
                            <span className="text-[10px] text-primary font-medium">{activity.to_status}</span>
                          </div>
                        )}

                        {/* Reason */}
                        {activity.reason && (
                          <div className="mt-1 flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {activity.reason}
                            </p>
                          </div>
                        )}

                        {/* Visibility */}
                        {activity.is_visible_to_customer === false && (
                          <span className="text-[9px] text-muted-foreground/50 mt-0.5 inline-block">
                            🔒 غير مرئي للعميل
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
