/**
 * Forgot Password Modal Component
 * استعادة كلمة المرور عبر البريد الإلكتروني فقط
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { requestPasswordReset } from '@/lib/auth/authService';
import { z } from 'zod';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailSchema = z.string().email('البريد الإلكتروني غير صالح');

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    const result = await requestPasswordReset(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'حدث خطأ. حاول مرة أخرى.');
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">
            استعادة كلمة المرور
          </DialogTitle>
          <DialogDescription className="text-right text-muted-foreground">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </motion.div>
              
              <h3 className="text-lg font-semibold mb-2">تم إرسال الرابط</h3>
              <p className="text-muted-foreground text-sm mb-6">
                تم إرسال رابط استعادة كلمة المرور إلى:
                <br />
                <strong className="text-foreground">{email}</strong>
              </p>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-right">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ الرابط صالح لمدة ساعة واحدة فقط. تحقق من مجلد الرسائل غير المرغوبة إذا لم تجد الرسالة.
                </p>
              </div>

              <Button
                onClick={handleClose}
                className="mt-6 w-full"
                variant="outline"
              >
                إغلاق
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-right block">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    className="pr-10 text-left"
                    dir="ltr"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 ml-2" />
                      إرسال الرابط
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
