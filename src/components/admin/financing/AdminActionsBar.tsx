/**
 * شريط إجراءات الأدمن للتمويل
 * Admin Financing Actions Bar
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  ThumbsUp, 
  XCircle, 
  Save, 
  FileText, 
  BadgeCheck,
  FileCheck,
  Stamp,
  Bell,
  CheckSquare,
  Wallet,
  Loader2
} from 'lucide-react';
import { AdminAction, ApplicationStatus } from '@/lib/financing/stateMachine/v2/types';
import { getActionsForStatus } from '@/lib/financing/stateMachine/v2/adminActions';
import { APPLICATION_STATES } from '@/lib/financing/stateMachine/v2/applicationStates';

interface AdminActionsBarProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
  onExecuteAction: (actionId: string, reason?: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  ThumbsUp,
  XCircle,
  Save,
  FileText,
  BadgeCheck,
  FileCheck,
  Stamp,
  Bell,
  CheckSquare,
  Wallet
};

export function AdminActionsBar({
  applicationId,
  currentStatus,
  onExecuteAction,
  loading = false,
  className
}: AdminActionsBarProps) {
  const [confirmAction, setConfirmAction] = useState<AdminAction | null>(null);
  const [reason, setReason] = useState('');
  const [executing, setExecuting] = useState(false);

  const availableActions = getActionsForStatus(currentStatus);
  const stateInfo = APPLICATION_STATES[currentStatus];

  async function handleConfirm() {
    if (!confirmAction) return;
    
    setExecuting(true);
    try {
      await onExecuteAction(confirmAction.id, reason || undefined);
      setConfirmAction(null);
      setReason('');
    } finally {
      setExecuting(false);
    }
  }

  if (availableActions.length === 0) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground" dir="rtl">
        لا توجد إجراءات متاحة للحالة الحالية
      </div>
    );
  }

  return (
    <div className={className} dir="rtl">
      {/* Current Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">الحالة الحالية:</span>
          <Badge 
            variant="outline"
            className={`
              ${stateInfo.color === 'green' && 'border-green-200 bg-green-50 text-green-700'}
              ${stateInfo.color === 'blue' && 'border-blue-200 bg-blue-50 text-blue-700'}
              ${stateInfo.color === 'yellow' && 'border-yellow-200 bg-yellow-50 text-yellow-700'}
              ${stateInfo.color === 'red' && 'border-red-200 bg-red-50 text-red-700'}
              ${stateInfo.color === 'purple' && 'border-purple-200 bg-purple-50 text-purple-700'}
              ${stateInfo.color === 'orange' && 'border-orange-200 bg-orange-50 text-orange-700'}
              ${stateInfo.color === 'gray' && 'border-gray-200 bg-gray-50 text-gray-700'}
            `}
          >
            {stateInfo.nameAr}
          </Badge>
        </div>
        {stateInfo.requiredAction && (
          <span className="text-xs text-muted-foreground">
            الإجراء المطلوب: {stateInfo.requiredAction}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {availableActions.map(action => {
          const IconComponent = ICON_MAP[action.icon] || MessageSquare;
          
          return (
            <Button
              key={action.id}
              variant={action.color === 'destructive' ? 'destructive' : 
                       action.color === 'success' ? 'default' : 
                       action.color === 'warning' ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => {
                if (action.requiresConfirmation) {
                  setConfirmAction(action);
                } else {
                  onExecuteAction(action.id);
                }
              }}
              disabled={loading}
              className={`
                ${action.color === 'success' && 'bg-green-600 hover:bg-green-700'}
                ${action.color === 'warning' && 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'}
              `}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <IconComponent className="h-4 w-4 ml-2" />
              )}
              {action.nameAr}
            </Button>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الإجراء</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Reason input for certain actions */}
          {confirmAction?.id === 'decline_application' && (
            <div className="space-y-2 py-4">
              <Label htmlFor="reason">سبب الرفض (مطلوب)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="أدخل سبب رفض الطلب..."
                rows={3}
              />
            </div>
          )}

          {confirmAction?.id === 'request_info' && (
            <div className="space-y-2 py-4">
              <Label htmlFor="reason">المستندات/المعلومات المطلوبة</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="حدد المستندات أو المعلومات المطلوبة من العميل..."
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={executing || (confirmAction?.id === 'decline_application' && !reason)}
              className={`
                ${confirmAction?.color === 'destructive' && 'bg-red-600 hover:bg-red-700'}
                ${confirmAction?.color === 'success' && 'bg-green-600 hover:bg-green-700'}
              `}
            >
              {executing ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التنفيذ...
                </>
              ) : (
                'تأكيد'
              )}
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
