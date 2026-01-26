/**
 * إجراءات الأدمن لسند الأمر
 * Admin Actions for Executive Bond
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Play, 
  FileCheck, 
  Send, 
  CheckCircle2, 
  BadgeCheck,
  Loader2,
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ExecutiveBondStatus, 
  getBondState,
  getOrderedBondStates,
  getBondProgress
} from '@/lib/financing/stateMachine/v2/bondStates';

interface ExecutiveBondAdminActionsProps {
  applicationId: string;
  bondId?: string;
  currentStatus: ExecutiveBondStatus;
  customerName: string;
  applicationNumber: string;
  onStatusChange?: (newStatus: ExecutiveBondStatus) => void;
}

interface ActionConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  applicableStatuses: ExecutiveBondStatus[];
  targetStatus: ExecutiveBondStatus;
  action: string;
  requiresNotes?: boolean;
  confirmMessage: string;
}

const ADMIN_ACTIONS: ActionConfig[] = [
  {
    id: 'start_issuing',
    label: 'بدء إصدار السند',
    description: 'بدء إجراءات إصدار السند في منصة نافذ',
    icon: Play,
    color: 'bg-blue-500 hover:bg-blue-600',
    applicableStatuses: ['NOT_ISSUED'],
    targetStatus: 'ISSUING',
    action: 'start_issuing',
    confirmMessage: 'سيتم إشعار العميل عبر واتساب بأن السند قيد الإصدار'
  },
  {
    id: 'mark_issued',
    label: 'تم الإصدار',
    description: 'تسجيل أن السند تم إصداره في نافذ',
    icon: FileCheck,
    color: 'bg-yellow-500 hover:bg-yellow-600',
    applicableStatuses: ['ISSUING'],
    targetStatus: 'ISSUED',
    action: 'mark_issued',
    confirmMessage: 'سيتم تسجيل أن السند جاهز'
  },
  {
    id: 'send_to_client',
    label: 'إرسال للعميل',
    description: 'إرسال إشعار للعميل بأن السند جاهز للتوقيع',
    icon: Send,
    color: 'bg-orange-500 hover:bg-orange-600',
    applicableStatuses: ['ISSUING', 'ISSUED'],
    targetStatus: 'SENT_TO_CLIENT',
    action: 'send_to_client',
    confirmMessage: 'سيتم إرسال إشعار واتساب للعميل لتوقيع السند'
  },
  {
    id: 'admin_verify',
    label: 'اعتماد السند',
    description: 'التحقق من توقيع العميل واعتماد السند نهائياً',
    icon: BadgeCheck,
    color: 'bg-green-500 hover:bg-green-600',
    applicableStatuses: ['SIGNED_BY_CLIENT'],
    targetStatus: 'VERIFIED_BY_ADMIN',
    action: 'admin_verify',
    requiresNotes: true,
    confirmMessage: 'سيتم اعتماد السند ونقل الطلب لمرحلة تفعيل الرصيد'
  }
];

export function ExecutiveBondAdminActions({
  applicationId,
  bondId,
  currentStatus,
  customerName,
  applicationNumber,
  onStatusChange
}: ExecutiveBondAdminActionsProps) {
  const [selectedAction, setSelectedAction] = useState<ActionConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const stateInfo = getBondState(currentStatus);
  const progress = getBondProgress(currentStatus);
  const orderedStates = getOrderedBondStates();
  
  const availableActions = ADMIN_ACTIONS.filter(action => 
    action.applicableStatuses.includes(currentStatus)
  );

  const handleExecuteAction = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('executive-bond-workflow', {
        body: {
          action: selectedAction.action,
          application_id: applicationId,
          bond_id: bondId,
          admin_notes: adminNotes || undefined
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('تم تنفيذ الإجراء بنجاح!', {
          description: data.messageAr
        });

        if (onStatusChange) {
          onStatusChange(data.status);
        }

        setSelectedAction(null);
        setAdminNotes('');
      } else {
        throw new Error(data.errorAr || data.error);
      }
    } catch (error: any) {
      console.error('Error executing bond action:', error);
      toast.error('فشل في تنفيذ الإجراء', {
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-primary/20" dir="rtl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">إدارة سند الأمر</CardTitle>
            <Badge 
              className={cn(
                'text-white',
                stateInfo.color === 'gray' && 'bg-gray-500',
                stateInfo.color === 'blue' && 'bg-blue-500',
                stateInfo.color === 'yellow' && 'bg-yellow-500',
                stateInfo.color === 'orange' && 'bg-orange-500',
                stateInfo.color === 'green' && 'bg-green-500',
                stateInfo.color === 'red' && 'bg-red-500'
              )}
            >
              {stateInfo.nameAr}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {customerName} - طلب #{applicationNumber}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">التقدم:</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-medium">{progress}%</span>
          </div>

          {/* Current Status Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">{stateInfo.adminMessage}</p>
            {stateInfo.requiredAction && (
              <p className="text-xs text-muted-foreground mt-1">
                الإجراء المطلوب: {stateInfo.requiredAction}
              </p>
            )}
          </div>

          {/* Status Timeline (compact) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {orderedStates.map((state, index) => {
              const isCompleted = state.order < stateInfo.order;
              const isCurrent = state.status === currentStatus;
              const isPending = state.order > stateInfo.order;

              return (
                <div key={state.status} className="flex items-center">
                  <div 
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      isCompleted && 'bg-green-500 text-white',
                      isCurrent && 'bg-primary text-white ring-2 ring-primary/30',
                      isPending && 'bg-muted text-muted-foreground'
                    )}
                    title={state.nameAr}
                  >
                    {isCompleted ? '✓' : state.order}
                  </div>
                  {index < orderedStates.length - 1 && (
                    <ArrowLeft className={cn(
                      'w-4 h-4 mx-1',
                      isCompleted ? 'text-green-500' : 'text-muted'
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Available Actions */}
          {availableActions.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">الإجراءات المتاحة</Label>
              <div className="grid gap-2">
                {availableActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      className={cn(
                        'justify-start h-auto py-3 px-4',
                        'border-2 hover:border-primary/50'
                      )}
                      onClick={() => setSelectedAction(action)}
                    >
                      <div className={cn('p-2 rounded-lg text-white ml-3', action.color)}>
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>
                {stateInfo.isTerminal 
                  ? 'السند مكتمل ومعتمد' 
                  : 'بانتظار إجراء من العميل أو النظام'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction && (
                <>
                  <div className={cn('p-2 rounded-lg text-white', selectedAction.color)}>
                    <selectedAction.icon className="w-5 h-5" />
                  </div>
                  {selectedAction.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAction?.confirmMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>سيتم إرسال إشعار واتساب تلقائي للعميل</span>
            </div>

            {selectedAction?.requiresNotes && (
              <div className="space-y-2">
                <Label>ملاحظات الاعتماد (اختياري)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظات للسجل..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedAction(null)}
              disabled={isProcessing}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleExecuteAction}
              disabled={isProcessing}
              className={selectedAction?.color}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 ml-2" />
              )}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ExecutiveBondAdminActions;
