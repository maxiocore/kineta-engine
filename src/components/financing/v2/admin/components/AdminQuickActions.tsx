/**
 * ASH HOLDING Financing Admin V2 - Quick Actions Bar
 * شريط الإجراءات السريعة
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Search,
  FileCheck,
  Send,
  FileText,
  Stamp,
  Wallet,
  XCircle,
  Ban,
  RefreshCw,
  DollarSign,
  Calendar,
  Loader2,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AdminApplicationView, AdminActionType } from '../types';
import { getActionsForStatus, getPrimaryAction, getSecondaryActions, type AdminActionConfig } from '../config/actionsConfig';
import { useAdminActions } from '../hooks/useAdminActions';
import { cn } from '@/lib/utils';

interface AdminQuickActionsProps {
  application: AdminApplicationView;
  onActionComplete?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Search, FileCheck, Send, FileText, Stamp, Wallet,
  XCircle, Ban, RefreshCw, DollarSign, Calendar,
};

export function AdminQuickActions({ application, onActionComplete }: AdminQuickActionsProps) {
  const { executeAction, isExecuting } = useAdminActions();
  const [confirmDialog, setConfirmDialog] = useState<{
    action: AdminActionConfig;
  } | null>(null);
  const [reason, setReason] = useState('');

  const primaryAction = getPrimaryAction(application.status);
  const secondaryActions = getSecondaryActions(application.status);
  const allActions = getActionsForStatus(application.status);

  if (allActions.length === 0) return null;

  const handleAction = async (action: AdminActionConfig) => {
    if (action.requiresConfirmation || action.requiresReason) {
      setConfirmDialog({ action });
    } else {
      await executeAction({
        applicationId: application.id,
        actionType: action.id,
      });
      onActionComplete?.();
    }
  };

  const confirmAction = async () => {
    if (!confirmDialog) return;
    await executeAction({
      applicationId: application.id,
      actionType: confirmDialog.action.id,
      reason: reason || undefined,
    });
    setConfirmDialog(null);
    setReason('');
    onActionComplete?.();
  };

  const getActionIcon = (iconName: string) => {
    const Icon = ICON_MAP[iconName] || Zap;
    return Icon;
  };

  const getButtonVariant = (color: string) => {
    if (color === 'destructive') return 'destructive' as const;
    return 'outline' as const;
  };

  return (
    <>
      <div className="space-y-3" dir="rtl">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">إجراءات سريعة</h4>
        </div>

        <div className="space-y-2">
          {/* Primary CTA */}
          {primaryAction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                className="w-full justify-start gap-3 h-11 text-sm font-medium shadow-sm"
                size="lg"
                onClick={() => handleAction(primaryAction)}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  (() => {
                    const Icon = getActionIcon(primaryAction.icon);
                    return <Icon className="h-4 w-4" />;
                  })()
                )}
                <span className="flex-1 text-right">{primaryAction.nameAr}</span>
                {primaryAction.permission !== 'basic' && (
                  <Badge variant="secondary" className="text-[9px] px-1.5">
                    {primaryAction.permission === 'senior' ? 'مشرف' : 'مدير'}
                  </Badge>
                )}
              </Button>
            </motion.div>
          )}

          {/* Secondary Actions */}
          <AnimatePresence>
            {secondaryActions.map((action, index) => {
              const Icon = getActionIcon(action.icon);
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant={getButtonVariant(action.color)}
                    className={cn(
                      'w-full justify-start gap-3 h-9 text-xs',
                      action.color === 'warning' && 'border-warning/30 text-warning hover:bg-warning/5 hover:text-warning',
                      action.color === 'success' && 'border-success/30 text-success hover:bg-success/5 hover:text-success',
                    )}
                    size="sm"
                    onClick={() => handleAction(action)}
                    disabled={isExecuting}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1 text-right">{action.nameAr}</span>
                    {action.requiresReason && (
                      <span className="text-[9px] text-muted-foreground">يتطلب سبب</span>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog && (() => {
                const Icon = getActionIcon(confirmDialog.action.icon);
                return <Icon className="h-5 w-5" />;
              })()}
              {confirmDialog?.action.nameAr}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action.descriptionAr}
            </DialogDescription>
          </DialogHeader>

          {confirmDialog?.action.requiresReason && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                سبب الإجراء <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="اكتب سبب الإجراء..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              إلغاء
            </Button>
            <Button
              variant={confirmDialog?.action.color === 'destructive' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={
                isExecuting || 
                (confirmDialog?.action.requiresReason && !reason.trim())
              }
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : null}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
