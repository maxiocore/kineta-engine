/**
 * Reset Password Page
 * صفحة إعادة تعيين كلمة المرور
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '@/lib/auth/authService';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

const passwordSchema = z.string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل');

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for recovery token in URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery' || session) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
      }
    };

    checkSession();

    // Listen for auth changes (recovery link click)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidToken(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = (): string | null => {
    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      return validation.error.errors[0].message;
    }
    if (password !== confirmPassword) {
      return 'كلمتا المرور غير متطابقتين';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    const result = await updatePassword(password);

    if (result.success) {
      setSuccess(true);
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } else {
      setError(result.error || 'حدث خطأ. حاول مرة أخرى.');
    }

    setIsLoading(false);
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { level: 1, text: 'ضعيفة', color: 'bg-red-500' },
      { level: 2, text: 'متوسطة', color: 'bg-orange-500' },
      { level: 3, text: 'جيدة', color: 'bg-yellow-500' },
      { level: 4, text: 'قوية', color: 'bg-green-500' },
      { level: 5, text: 'ممتازة', color: 'bg-emerald-500' },
    ];

    return levels[Math.min(strength, 5) - 1] || levels[0];
  };

  const passwordStrength = getPasswordStrength();

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-4 pt-20" dir="rtl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">رابط غير صالح</h1>
            <p className="text-muted-foreground mb-6">
              رابط استعادة كلمة المرور منتهي الصلاحية أو غير صالح.
            </p>
            <Button onClick={() => navigate('/auth')}>
              العودة لتسجيل الدخول
            </Button>
          </motion.div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center p-4 pt-20 bg-gradient-to-br from-background via-secondary/30 to-background" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>
                
                <h2 className="text-2xl font-bold mb-2">تم تغيير كلمة المرور</h2>
                <p className="text-muted-foreground mb-6">
                  تم تحديث كلمة المرور بنجاح. سيتم توجيهك للوحة التحكم...
                </p>

                <div className="flex items-center justify-center gap-2 text-green-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">جاري التحويل...</span>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">إعادة تعيين كلمة المرور</h1>
                  <p className="text-muted-foreground">
                    أدخل كلمة المرور الجديدة لحسابك
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور الجديدة</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        className="pr-10 pl-10"
                        dir="ltr"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Password strength */}
                    {password && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= passwordStrength.level ? passwordStrength.color : 'bg-secondary'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          قوة كلمة المرور: <span className="font-medium">{passwordStrength.text}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError(null);
                        }}
                        className="pr-10 pl-10"
                        dir="ltr"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين</p>
                    )}
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

                  <div className="bg-secondary/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">متطلبات كلمة المرور:</p>
                    <ul className="text-xs space-y-1">
                      <li className={password.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}>
                        ✓ 8 أحرف على الأقل
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-500' : 'text-muted-foreground'}>
                        ✓ حرف كبير واحد على الأقل
                      </li>
                      <li className={/[0-9]/.test(password) ? 'text-green-500' : 'text-muted-foreground'}>
                        ✓ رقم واحد على الأقل
                      </li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                    className="w-full h-12"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'تحديث كلمة المرور'
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
