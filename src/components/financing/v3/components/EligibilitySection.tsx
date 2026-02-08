/**
 * ASH HOLDING Financing v3 - Eligibility Section
 * قسم فحص الأهلية المتكامل - FinTech Banking Style
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  IdCard,
  Phone,
  Mail,
  History,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useEligibilityMachine } from '@/hooks/useEligibilityMachine';
import { useAuth } from '@/hooks/useAuth';

interface EligibilitySectionProps {
  onEligible: () => void;
  className?: string;
}

const VERIFICATION_STEPS = [
  { id: 'identity', icon: IdCard, label: 'التحقق من الهوية', labelEn: 'Identity' },
  { id: 'phone', icon: Phone, label: 'تأكيد رقم الجوال', labelEn: 'Phone' },
  { id: 'email', icon: Mail, label: 'التحقق من البريد', labelEn: 'Email' },
  { id: 'history', icon: History, label: 'مراجعة السجل', labelEn: 'History' },
  { id: 'risk', icon: ShieldCheck, label: 'تقييم المخاطر', labelEn: 'Risk' },
];

export function EligibilitySection({ onEligible, className }: EligibilitySectionProps) {
  const { user, profile } = useAuth();
  const {
    context,
    currentState,
    isProcessing,
    error,
    decision,
    startVerification,
    reset,
    getProgress,
    canApply,
    getTimeRemaining,
  } = useEligibilityMachine();

  const [nationalId, setNationalId] = useState('');
  const [nationality, setNationality] = useState('saudi');
  const [age, setAge] = useState('');
  const [showForm, setShowForm] = useState(false);

  const hasDecision = decision !== null;
  const isEligible = canApply();
  const progress = getProgress();

  const handleStartCheck = async () => {
    if (!nationalId || !age) return;
    await startVerification({
      nationalId,
      nationality,
      age: parseInt(age),
    });
  };

  const timeRemaining = getTimeRemaining();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  // Already verified & eligible
  if (hasDecision && isEligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="overflow-hidden border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <div className="h-1.5 bg-gradient-to-l from-emerald-500 via-emerald-400 to-teal-500" />
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <motion.div
                className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </motion.div>

              <div>
                <h3 className="text-xl font-extrabold text-foreground mb-1">
                  مؤهل للتمويل ✓
                </h3>
                <p className="text-sm text-muted-foreground">
                  تهانينا! يمكنك الآن تقديم طلب تمويل خدمات
                </p>
              </div>

              {/* Score */}
              <div className="flex items-center gap-6 py-3 px-5 rounded-2xl bg-muted/50">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-emerald-500 tabular-nums">
                    {decision.score}
                  </p>
                  <p className="text-[10px] text-muted-foreground">النقاط</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium tabular-nums">
                      {hoursRemaining > 0 ? `${hoursRemaining} ساعة` : `${minutesRemaining} دقيقة`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">صلاحية التأهيل</p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={onEligible}
                className="w-full max-w-xs gap-2 h-13 text-base rounded-2xl shadow-lg shadow-primary/15 mt-1"
              >
                <Sparkles className="w-4 h-4" />
                طلب تمويل جديد
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Already verified & NOT eligible
  if (hasDecision && !isEligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="overflow-hidden border-destructive/20 shadow-lg shadow-destructive/5">
          <div className="h-1.5 bg-gradient-to-l from-destructive via-red-400 to-orange-400" />
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <motion.div
                className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <XCircle className="w-8 h-8 text-destructive" />
              </motion.div>

              <div>
                <h3 className="text-xl font-extrabold text-foreground mb-1">
                  غير مؤهل حالياً
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  عذراً، لا تستوفي الشروط المطلوبة حالياً. يمكنك إعادة المحاولة لاحقاً.
                </p>
              </div>

              {/* Reasons */}
              {decision.reasons && decision.reasons.length > 0 && (
                <div className="w-full max-w-md space-y-2 text-right">
                  {decision.reasons.map((reason, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {decision.recommendations && decision.recommendations.length > 0 && (
                <div className="w-full max-w-md bg-primary/5 rounded-2xl p-4 text-right">
                  <p className="text-xs font-bold text-primary mb-2">توصيات لتحسين الأهلية:</p>
                  <ul className="space-y-1.5">
                    {decision.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={reset}
                className="gap-2 rounded-xl mt-1"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة فحص الأهلية
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
          <div className="h-1.5 bg-gradient-to-l from-primary via-blue-400 to-cyan-400">
            <motion.div
              className="h-full bg-white/30"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col items-center text-center gap-5">
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Shield className="w-8 h-8 text-primary" />
              </motion.div>

              <div>
                <h3 className="text-lg font-extrabold text-foreground mb-1">
                  جاري فحص الأهلية...
                </h3>
                <p className="text-sm text-muted-foreground">
                  يتم التحقق من بياناتك الآن، يرجى الانتظار
                </p>
              </div>

              {/* Steps Progress */}
              <div className="w-full max-w-md space-y-2.5">
                {VERIFICATION_STEPS.map((step, index) => {
                  const contextStep = context.steps.find(s => s.id === step.id);
                  const isComplete = contextStep?.status === 'verified';
                  const isFailed = contextStep?.status === 'failed';
                  const isActive = !isComplete && !isFailed && (
                    (index === 0 && currentState === 'identity_verification') ||
                    (index === 1 && currentState === 'phone_verification') ||
                    (index === 2 && currentState === 'email_verification') ||
                    (index === 3 && currentState === 'history_check') ||
                    (index === 4 && currentState === 'risk_assessment')
                  );

                  return (
                    <motion.div
                      key={step.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-all',
                        isComplete && 'bg-emerald-500/5',
                        isFailed && 'bg-destructive/5',
                        isActive && 'bg-primary/5',
                      )}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        isComplete && 'bg-emerald-500/10 text-emerald-500',
                        isFailed && 'bg-destructive/10 text-destructive',
                        isActive && 'bg-primary/10 text-primary',
                        !isComplete && !isFailed && !isActive && 'bg-muted text-muted-foreground',
                      )}>
                        {isComplete ? (
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        ) : isFailed ? (
                          <XCircle className="w-4.5 h-4.5" />
                        ) : isActive ? (
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <step.icon className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <span className={cn(
                        'text-sm font-medium flex-1 text-right',
                        isComplete && 'text-emerald-600 dark:text-emerald-400',
                        isFailed && 'text-destructive',
                        isActive && 'text-primary font-bold',
                        !isComplete && !isFailed && !isActive && 'text-muted-foreground',
                      )}>
                        {step.label}
                      </span>
                      {isComplete && contextStep?.score !== undefined && (
                        <span className="text-[11px] font-bold text-emerald-500 tabular-nums">
                          {contextStep.score}/{contextStep.maxScore}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">
                  {progress}% مكتمل
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Initial state - show eligibility check form
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-2xl shadow-primary/25 mb-5">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/[0.07] rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-black/[0.08] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          <motion.div
            className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium mb-5 border border-white/10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Shield className="w-4 h-4" />
            فحص الأهلية
          </motion.div>

          <motion.h2
            className="text-2xl lg:text-3xl font-extrabold mb-3 leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            تمويل الخدمات
          </motion.h2>

          <motion.p
            className="text-primary-foreground/75 text-base mb-4 max-w-lg leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            احصل على رصيد خدمات لاستخدامه في شراء الخدمات. تمويل غير نقدي، سريع وآمن.
          </motion.p>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {['موافقة خلال 24 ساعة', 'بدون كفيل', 'أقساط مرنة'].map((text) => (
              <span key={text} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Eligibility Form */}
      <Card className="border shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-l from-primary/50 to-primary/10" />
        <CardContent className="p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">فحص الأهلية</h3>
              <p className="text-xs text-muted-foreground">
                أدخل بياناتك للتحقق من أهليتك للتمويل
              </p>
            </div>
          </div>

          {!showForm ? (
            <motion.div
              className="text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                size="lg"
                onClick={() => setShowForm(true)}
                className="gap-2 px-8 h-13 text-base rounded-2xl shadow-lg shadow-primary/15"
              >
                <Shield className="w-5 h-5" />
                ابدأ فحص الأهلية
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <p className="text-[11px] text-muted-foreground mt-3">
                الفحص مجاني ولا يؤثر على تقييمك الائتماني
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="form"
                className="space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                {/* National ID */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">رقم الهوية الوطنية</Label>
                  <Input
                    type="text"
                    placeholder="أدخل رقم الهوية (10 أرقام)"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="h-12 rounded-xl text-right"
                    dir="ltr"
                    maxLength={10}
                  />
                </div>

                {/* Nationality */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الجنسية</Label>
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saudi">سعودي</SelectItem>
                      <SelectItem value="gcc">مواطن خليجي</SelectItem>
                      <SelectItem value="resident">مقيم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">العمر</Label>
                  <Input
                    type="number"
                    placeholder="أدخل عمرك"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-12 rounded-xl"
                    min={18}
                    max={65}
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Submit */}
                <Button
                  size="lg"
                  onClick={handleStartCheck}
                  disabled={!nationalId || nationalId.length < 10 || !age || parseInt(age) < 18}
                  className="w-full gap-2 h-13 text-base rounded-2xl shadow-lg shadow-primary/15"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الفحص...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      فحص الأهلية الآن
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  بالضغط على "فحص الأهلية" فإنك توافق على السماح لنا بالتحقق من بياناتك وفقاً لسياسة الخصوصية.
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {[
          { icon: IdCard, title: 'تمويل غير نقدي', desc: 'رصيد خدمات فقط' },
          { icon: Clock, title: 'موافقة سريعة', desc: 'خلال 24 ساعة' },
          { icon: Shield, title: 'آمن ومضمون', desc: 'حماية كاملة' },
          { icon: CheckCircle2, title: 'أقساط مرنة', desc: 'خطط سداد متنوعة' },
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200 group"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.08 }}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2.5 group-hover:bg-primary/15 transition-colors">
              <feature.icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <h3 className="font-bold text-[13px] text-foreground mb-0.5">{feature.title}</h3>
            <p className="text-[11px] text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        className="mt-5 p-3.5 rounded-xl bg-muted/40 border border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          <strong>تنبيه:</strong> التمويل المقدم هو رصيد خدمات غير نقدي يُستخدم حصرياً لشراء الخدمات داخل المنصة. لا يمكن تحويله أو سحبه نقداً.
        </p>
      </motion.div>
    </motion.div>
  );
}