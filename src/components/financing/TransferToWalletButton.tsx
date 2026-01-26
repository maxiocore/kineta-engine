/**
 * زر تحويل رصيد التمويل إلى رصيد المنصة
 * Transfer Financing Credit to Platform Wallet Button
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftRight, 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Info,
  CreditCard,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface TransferToWalletButtonProps {
  applicationId: string;
  availableBalance: number;
  onTransferComplete?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

type TransferState = 'idle' | 'checking' | 'ready' | 'confirming' | 'processing' | 'success' | 'error';

export function TransferToWalletButton({
  applicationId,
  availableBalance,
  onTransferComplete,
  disabled = false,
  variant = 'default',
  size = 'default',
  className = ''
}: TransferToWalletButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<TransferState>('idle');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [transferResult, setTransferResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetState = () => {
    setState('idle');
    setAmount('');
    setError(null);
    setTransferResult(null);
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setState('checking');
    setError(null);

    try {
      const { data, error: checkError } = await supabase.functions.invoke(
        'wallet-internal-transfer',
        {
          body: { application_id: applicationId },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // Parse query param action
      const response = await supabase.functions.invoke(
        'wallet-internal-transfer?action=can_transfer',
        {
          body: { application_id: applicationId },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (!result.success || !result.can_transfer) {
        setError(result.message || 'لا يمكن التحويل حالياً');
        setState('error');
        return;
      }

      setState('ready');
      // Set default amount to full available balance
      setAmount(availableBalance.toString());
    } catch (err: any) {
      console.error('Check transfer error:', err);
      setError('فشل التحقق من إمكانية التحويل');
      setState('error');
    }
  };

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ صالح');
      return;
    }

    if (numAmount > availableBalance) {
      setError('المبلغ المطلوب أكبر من الرصيد المتاح');
      return;
    }

    setError(null);
    setState('confirming');
  };

  const handleTransfer = async () => {
    setState('processing');
    setError(null);

    try {
      const response = await supabase.functions.invoke(
        'wallet-internal-transfer?action=transfer',
        {
          body: {
            amount: parseFloat(amount),
            application_id: applicationId
          },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (!result.success) {
        setError(result.message || 'فشل التحويل');
        setState('error');
        return;
      }

      setTransferResult(result);
      setState('success');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['service-credit-summary'] });
      queryClient.invalidateQueries({ queryKey: ['service-credit-details'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      
      toast({
        title: 'تم التحويل بنجاح',
        description: `تم تحويل ${formatCurrency(parseFloat(amount))} إلى رصيد المنصة`,
      });

      onTransferComplete?.();
    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'حدث خطأ أثناء التحويل');
      setState('error');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetState, 300);
  };

  // Don't show button if no balance
  if (availableBalance <= 0) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        variant={variant}
        size={size}
        disabled={disabled}
        className={`bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ${className}`}
      >
        <ArrowLeftRight className="h-4 w-4 ml-2" />
        تحويل إلى رصيد الخدمات
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Wallet className="h-5 w-5 text-primary" />
              تحويل إلى رصيد المنصة
            </DialogTitle>
            <DialogDescription>
              تحويل رصيد التمويل إلى رصيد الخدمات داخل المنصة
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Checking State */}
            {state === 'checking' && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 gap-4"
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">جارٍ التحقق...</p>
              </motion.div>
            )}

            {/* Ready State - Enter Amount */}
            {state === 'ready' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Available Balance */}
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">الرصيد المتاح للتحويل</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(availableBalance)}
                  </p>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="transfer-amount">المبلغ المراد تحويله</Label>
                  <div className="relative">
                    <Input
                      id="transfer-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-lg pl-16"
                      min={1}
                      max={availableBalance}
                      step={0.01}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ر.س
                    </span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setAmount(availableBalance.toString())}
                    className="p-0 h-auto text-xs"
                  >
                    تحويل الرصيد بالكامل
                  </Button>
                </div>

                {/* Warning */}
                <Alert className="bg-amber-50 border-amber-200">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    <strong>تنويه هام:</strong> الرصيد مخصص للاستخدام داخل المنصة فقط 
                    ولا يمكن سحبه أو تحويله خارج المنصة.
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    إلغاء
                  </Button>
                  <Button onClick={handleConfirm} className="flex-1">
                    متابعة
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Confirming State */}
            {state === 'confirming' && (
              <motion.div
                key="confirming"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-center">تأكيد التحويل</h4>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">من: رصيد التمويل</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">إلى: رصيد المنصة</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">المبلغ</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(parseFloat(amount))}
                    </span>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    سيتم خصم المبلغ من رصيد التمويل وإضافته إلى رصيد المنصة فوراً.
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setState('ready')} className="flex-1">
                    رجوع
                  </Button>
                  <Button onClick={handleTransfer} className="flex-1">
                    تأكيد التحويل
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Processing State */}
            {state === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 gap-4"
              >
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <ArrowLeftRight className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-medium">جارٍ تنفيذ التحويل...</p>
                  <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {state === 'success' && transferResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-600">تم التحويل بنجاح!</h3>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المبلغ المُحوّل</span>
                    <span className="font-medium">{formatCurrency(transferResult.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رصيد التمويل الجديد</span>
                    <span className="font-medium">{formatCurrency(transferResult.source_balance_after)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رصيد المنصة الجديد</span>
                    <span className="font-medium text-primary">{formatCurrency(transferResult.destination_balance_after)}</span>
                  </div>
                </div>

                <Button onClick={handleClose} className="w-full">
                  إغلاق
                </Button>
              </motion.div>
            )}

            {/* Error State */}
            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center py-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive">فشل التحويل</h3>
                </div>

                <Alert variant="destructive">
                  <AlertDescription>{error || 'حدث خطأ غير متوقع'}</AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    إغلاق
                  </Button>
                  <Button onClick={handleOpen} className="flex-1">
                    إعادة المحاولة
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
