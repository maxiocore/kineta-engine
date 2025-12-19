import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  CreditCard, 
  Check, 
  Info,
  Loader2,
  Gift,
  Sparkles,
  Shield,
  Clock,
  Zap,
  DollarSign,
  BadgeCheck,
  Send,
  Copy,
  CheckCircle2,
  Banknote,
  Smartphone,
  Globe,
  Bitcoin,
  ExternalLink,
  Star,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  instructions: string | null;
  instructions_ar: string | null;
  min_amount: number | null;
  max_amount: number | null;
  extra_fee_type: string | null;
  extra_fee_value: number | null;
  is_active: boolean;
}

interface PaymentBonus {
  id: string;
  payment_method_id: string | null;
  min_amount: number;
  max_amount: number | null;
  bonus_type: string;
  bonus_value: number;
  is_active: boolean;
}

const paymentIcons: Record<string, { icon: typeof CreditCard; gradient: string; color: string }> = {
  'visa': { icon: CreditCard, gradient: 'from-blue-500 to-blue-600', color: 'text-blue-500' },
  'mastercard': { icon: CreditCard, gradient: 'from-red-500 to-orange-500', color: 'text-red-500' },
  'paypal': { icon: Globe, gradient: 'from-blue-400 to-blue-600', color: 'text-blue-400' },
  'crypto': { icon: Bitcoin, gradient: 'from-orange-400 to-yellow-500', color: 'text-orange-400' },
  'bitcoin': { icon: Bitcoin, gradient: 'from-orange-400 to-yellow-500', color: 'text-orange-400' },
  'bank': { icon: Banknote, gradient: 'from-green-500 to-emerald-600', color: 'text-green-500' },
  'vodafone': { icon: Smartphone, gradient: 'from-red-500 to-red-600', color: 'text-red-500' },
  'instapay': { icon: Zap, gradient: 'from-purple-500 to-pink-500', color: 'text-purple-500' },
  'usdt': { icon: DollarSign, gradient: 'from-green-400 to-teal-500', color: 'text-green-400' },
  'paylink': { icon: CreditCard, gradient: 'from-emerald-500 to-teal-600', color: 'text-emerald-500' },
  'default': { icon: CreditCard, gradient: 'from-primary to-primary/80', color: 'text-primary' },
};

const getPaymentIcon = (type: string, name: string) => {
  const lowerName = name.toLowerCase();
  const lowerType = type.toLowerCase();
  
  for (const key of Object.keys(paymentIcons)) {
    if (lowerName.includes(key) || lowerType.includes(key)) {
      return paymentIcons[key];
    }
  }
  return paymentIcons.default;
};

const presetAmounts = [10, 25, 50, 100, 250, 500, 1000];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  }
};

const floatingAnimation = {
  y: [0, -10, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
};

const glowAnimation = {
  boxShadow: [
    "0 0 20px rgba(16, 185, 129, 0.3)",
    "0 0 40px rgba(16, 185, 129, 0.5)",
    "0 0 20px rgba(16, 185, 129, 0.3)"
  ],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
};

const ClientDeposit = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bonuses, setBonuses] = useState<PaymentBonus[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [usePaylinkDirect, setUsePaylinkDirect] = useState(false);
  const [paylinkLoading, setPaylinkLoading] = useState(false);
  const [clientMobile, setClientMobile] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedMethod) setCurrentStep(2);
    if (selectedMethod && parseFloat(amount) > 0) setCurrentStep(3);
  }, [selectedMethod, amount]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [methodsRes, bonusesRes, balanceRes] = await Promise.all([
      supabase.from('payment_methods').select('*').eq('is_active', true).order('display_order'),
      supabase.from('payment_bonuses').select('*').eq('is_active', true),
      supabase.from('user_balances').select('balance').eq('user_id', user.id).maybeSingle(),
    ]);

    if (methodsRes.data) setPaymentMethods(methodsRes.data);
    if (bonusesRes.data) setBonuses(bonusesRes.data);
    if (balanceRes.data) setCurrentBalance(balanceRes.data.balance);

    setLoading(false);
  };

  const calculateFee = (baseAmount: number): number => {
    if (!selectedMethod || !selectedMethod.extra_fee_value) return 0;
    
    if (selectedMethod.extra_fee_type === 'percentage') {
      return (baseAmount * selectedMethod.extra_fee_value) / 100;
    }
    return selectedMethod.extra_fee_value;
  };

  const calculateBonus = (baseAmount: number): number => {
    const applicableBonuses = bonuses.filter(b => {
      const matchesMethod = !b.payment_method_id || b.payment_method_id === selectedMethod?.id;
      const meetsMin = baseAmount >= b.min_amount;
      const meetsMax = !b.max_amount || baseAmount <= b.max_amount;
      return matchesMethod && meetsMin && meetsMax;
    });

    if (applicableBonuses.length === 0) return 0;

    const bestBonus = applicableBonuses.reduce((best, current) => {
      const currentValue = current.bonus_type === 'percentage' 
        ? (baseAmount * current.bonus_value) / 100 
        : current.bonus_value;
      const bestValue = best.bonus_type === 'percentage' 
        ? (baseAmount * best.bonus_value) / 100 
        : best.bonus_value;
      return currentValue > bestValue ? current : best;
    });

    return bestBonus.bonus_type === 'percentage' 
      ? (baseAmount * bestBonus.bonus_value) / 100 
      : bestBonus.bonus_value;
  };

  const numericAmount = parseFloat(amount) || 0;
  const fee = usePaylinkDirect ? 0 : calculateFee(numericAmount);
  const bonus = calculateBonus(numericAmount);
  const totalCredited = numericAmount - fee + bonus;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ النص إلى الحافظة',
    });
  };

  const handlePaylinkPayment = async () => {
    if (!user || numericAmount <= 0 || !clientMobile) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال المبلغ ورقم الجوال',
        variant: 'destructive',
      });
      return;
    }

    setPaylinkLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('paylink-payment', {
        body: {
          action: 'create-payment',
          userId: user.id,
          amount: numericAmount,
          clientName: profile?.full_name || user.email?.split('@')[0] || 'عميل',
          clientEmail: user.email || '',
          clientMobile: clientMobile,
          callbackUrl: `${window.location.origin}/dashboard/deposits?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard/deposit?payment=cancelled`,
        },
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        toast({
          title: 'جاري التحويل لصفحة الدفع',
          description: 'سيتم تحويلك إلى بوابة الدفع الآمنة',
        });
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('لم يتم الحصول على رابط الدفع');
      }
    } catch (error: any) {
      console.error('Paylink error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إنشاء طلب الدفع',
        variant: 'destructive',
      });
    } finally {
      setPaylinkLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedMethod || numericAmount <= 0) return;

    if (selectedMethod.min_amount && numericAmount < selectedMethod.min_amount) {
      toast({
        title: 'خطأ',
        description: `الحد الأدنى للإيداع هو ${selectedMethod.min_amount} ر.س`,
        variant: 'destructive',
      });
      return;
    }

    if (selectedMethod.max_amount && numericAmount > selectedMethod.max_amount) {
      toast({
        title: 'خطأ',
        description: `الحد الأقصى للإيداع هو ${selectedMethod.max_amount} ر.س`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('deposits').insert({
      user_id: user.id,
      payment_method_id: selectedMethod.id,
      amount: numericAmount,
      fee_amount: fee,
      bonus_amount: bonus,
      total_credited: totalCredited,
      transaction_id: transactionId || null,
      notes: notes || null,
      status: 'pending',
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء طلب الإيداع',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'تم إرسال طلب الإيداع بنجاح',
      description: 'سيتم مراجعة طلبك وإضافة الرصيد خلال 24 ساعة',
    });

    setAmount('');
    setTransactionId('');
    setNotes('');
    setSelectedMethod(null);
    setCurrentStep(1);
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <motion.div 
        className="space-y-6 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/20 via-primary/10 to-accent/20 p-6 md:p-8">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <motion.div 
            className="absolute top-0 left-0 w-40 h-40 bg-primary/30 rounded-full blur-3xl"
            animate={{ 
              x: [0, 20, 0], 
              y: [0, -20, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-48 h-48 bg-accent/30 rounded-full blur-3xl"
            animate={{ 
              x: [0, -20, 0], 
              y: [0, 20, 0],
              scale: [1.2, 1, 1.2]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-success/20 rounded-full blur-2xl"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/40 rounded-full"
              style={{
                top: `${20 + i * 12}%`,
                left: `${10 + i * 15}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative"
                animate={{ 
                  scale: [1, 1.08, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl"
                  animate={glowAnimation}
                >
                  <Wallet className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <motion.div 
                  className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-3 h-3 text-success-foreground" />
                </motion.div>
              </motion.div>
              <div>
                <motion.h1 
                  className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  إيداع رصيد
                </motion.h1>
                <motion.p 
                  className="text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  أضف رصيد إلى حسابك بكل سهولة وأمان
                </motion.p>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-background/90 backdrop-blur-md rounded-xl p-4 border border-success/30 shadow-xl shadow-success/10 min-w-[200px] cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-success/60 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-success/30 transition-shadow"
                  animate={pulseAnimation}
                >
                  <DollarSign className="w-6 h-6 text-success-foreground" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground">رصيدك الحالي</p>
                  <motion.p 
                    className="text-2xl font-bold text-success"
                    key={currentBalance}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {currentBalance.toFixed(2)} ر.س
                  </motion.p>
                </div>
                <TrendingUp className="w-5 h-5 text-success opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Shield, label: 'دفع آمن', desc: '100% مشفر', color: 'text-success', bg: 'from-success/20 to-success/5' },
            { icon: Zap, label: 'سريع', desc: 'إضافة فورية', color: 'text-yellow-500', bg: 'from-yellow-500/20 to-yellow-500/5' },
            { icon: Clock, label: 'دعم 24/7', desc: 'متاح دائماً', color: 'text-blue-500', bg: 'from-blue-500/20 to-blue-500/5' },
            { icon: Gift, label: 'بونص', desc: 'على الإيداعات', color: 'text-accent', bg: 'from-accent/20 to-accent/5' },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ 
                y: -5, 
                scale: 1.02,
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)"
              }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative overflow-hidden bg-gradient-to-br",
                feature.bg,
                "backdrop-blur-sm rounded-xl p-4 border border-border/50 text-center cursor-pointer group"
              )}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  delay: i * 0.5 
                }}
              >
                <feature.icon className={cn("w-7 h-7 mx-auto mb-2", feature.color)} />
              </motion.div>
              <p className="font-semibold text-sm">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Paylink Direct Payment - Featured */}
            <motion.div variants={itemVariants}>
              <Card className="border-2 border-emerald-500/50 shadow-lg overflow-hidden bg-gradient-to-l from-emerald-500/5 to-transparent">
                <CardHeader className="border-b border-emerald-500/20">
                  <CardTitle className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg">الدفع الإلكتروني</span>
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">موصى به</Badge>
                        </div>
                        <p className="text-sm font-normal text-muted-foreground">ادفع مباشرة واحصل على رصيدك فوراً</p>
                      </div>
                      <Zap className="w-6 h-6 text-emerald-500" />
                    </div>
                    {/* Payment Method Icons */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Visa */}
                      <motion.div 
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 bg-[#1A1F71]/10 dark:bg-[#1A1F71]/20 px-3 py-1.5 rounded-lg border border-[#1A1F71]/20 cursor-pointer transition-shadow hover:shadow-md hover:shadow-[#1A1F71]/20"
                      >
                        <svg className="w-8 h-5" viewBox="0 0 48 16" fill="none">
                          <path d="M19.5 1L17 15H14L16.5 1H19.5Z" fill="#1A1F71"/>
                          <path d="M12.5 1L8 15H5L2.5 3.5C2.5 3 2 2.5 1 2L1.5 1H7C8 1 8.5 1.5 8.5 2.5L9.5 10L12.5 1Z" fill="#1A1F71"/>
                          <path d="M34 1L28.5 15H25.5L22 4C22 3.5 21.5 3 21 2.5L21.5 1H28.5C29.5 1 30 1.5 30 2.5L31.5 10.5L34 1Z" fill="#1A1F71"/>
                          <path d="M36 15L38.5 1H44.5C46 1 47 2 47 3.5C47 7 44 8 44 8C44 8 46.5 8 46.5 11C46.5 14 44 15 42 15H36Z" fill="#1A1F71"/>
                        </svg>
                        <span className="text-xs font-medium text-[#1A1F71] dark:text-[#5A6FD1]">Visa</span>
                      </motion.div>
                      {/* Mastercard */}
                      <motion.div 
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 bg-[#EB001B]/10 dark:bg-[#EB001B]/20 px-3 py-1.5 rounded-lg border border-[#EB001B]/20 cursor-pointer transition-shadow hover:shadow-md hover:shadow-[#EB001B]/20"
                      >
                        <svg className="w-6 h-5" viewBox="0 0 24 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#EB001B"/>
                          <circle cx="16" cy="8" r="7" fill="#F79E1B"/>
                          <path d="M12 2.5C13.5 3.5 14.5 5.5 14.5 8C14.5 10.5 13.5 12.5 12 13.5C10.5 12.5 9.5 10.5 9.5 8C9.5 5.5 10.5 3.5 12 2.5Z" fill="#FF5F00"/>
                        </svg>
                        <span className="text-xs font-medium text-[#EB001B] dark:text-[#FF6B6B]">Mastercard</span>
                      </motion.div>
                      {/* Apple Pay */}
                      <motion.div 
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 bg-foreground/5 dark:bg-foreground/10 px-3 py-1.5 rounded-lg border border-foreground/10 cursor-pointer transition-shadow hover:shadow-md hover:shadow-foreground/10"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        <span className="text-xs font-medium">Apple Pay</span>
                      </motion.div>
                      {/* Mada */}
                      <motion.div 
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 bg-[#004B87]/10 dark:bg-[#004B87]/20 px-3 py-1.5 rounded-lg border border-[#004B87]/20 cursor-pointer transition-shadow hover:shadow-md hover:shadow-[#004B87]/20"
                      >
                        <svg className="w-8 h-5" viewBox="0 0 48 16" fill="none">
                          <rect x="0" y="2" width="12" height="12" rx="2" fill="#004B87"/>
                          <rect x="14" y="2" width="12" height="12" rx="2" fill="#48A642"/>
                          <text x="32" y="12" fill="#004B87" fontSize="10" fontWeight="bold">mada</text>
                        </svg>
                        <span className="text-xs font-medium text-[#004B87] dark:text-[#6BA3D6]">مدى</span>
                      </motion.div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-4">
                    {/* Amount Selection for Paylink */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-3 block">اختر المبلغ (ريال سعودي)</Label>
                      <div className="flex flex-wrap gap-3">
                        {[50, 100, 200, 500, 1000].map((preset, i) => (
                          <motion.button
                            key={preset}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setAmount(preset.toString());
                              setUsePaylinkDirect(true);
                              setSelectedMethod(null);
                            }}
                            className={cn(
                              "px-5 py-3 rounded-xl font-semibold transition-all border-2",
                              usePaylinkDirect && amount === preset.toString()
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30"
                                : "bg-secondary/50 border-border hover:border-emerald-500/50 hover:bg-emerald-500/10"
                            )}
                          >
                            {preset} ر.س
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Amount */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">مبلغ مخصص</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="أدخل المبلغ"
                            value={usePaylinkDirect ? amount : ''}
                            onChange={(e) => {
                              setAmount(e.target.value);
                              setUsePaylinkDirect(true);
                              setSelectedMethod(null);
                            }}
                            min={10}
                            className="h-12 pr-4 text-center border-2 focus:border-emerald-500"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">ر.س</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">رقم الجوال <span className="text-destructive">*</span></Label>
                        <Input
                          type="tel"
                          placeholder="05xxxxxxxx"
                          value={clientMobile}
                          onChange={(e) => setClientMobile(e.target.value)}
                          className="h-12 border-2 focus:border-emerald-500"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Paylink Benefits */}
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        { icon: Zap, label: 'إضافة فورية', color: 'text-yellow-500' },
                        { icon: Shield, label: 'دفع آمن', color: 'text-emerald-500' },
                        { icon: CreditCard, label: 'مدى/فيزا/ماستركارد', color: 'text-blue-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
                          <item.icon className={cn("w-5 h-5", item.color)} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pay Button */}
                    <Button
                      className="w-full h-14 text-lg gap-3 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30"
                      size="lg"
                      disabled={!usePaylinkDirect || numericAmount < 10 || !clientMobile || paylinkLoading}
                      onClick={handlePaylinkPayment}
                    >
                      {paylinkLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <>
                          <ExternalLink className="w-5 h-5" />
                          ادفع الآن {numericAmount > 0 && `(${numericAmount} ر.س)`}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Separator */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground px-2">أو اختر طريقة دفع أخرى</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Other Payment Methods */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent border-b border-border/50">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
                      1
                    </div>
                    <div>
                      <span className="text-lg">طرق الدفع الأخرى</span>
                      <p className="text-sm font-normal text-muted-foreground">تحتاج مراجعة يدوية</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد طرق دفع متاحة حالياً</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {paymentMethods.map((method, index) => {
                        const iconData = getPaymentIcon(method.type, method.name);
                        const IconComponent = iconData.icon;
                        
                        return (
                          <motion.div
                            key={method.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedMethod(method);
                              setUsePaylinkDirect(false);
                            }}
                            className={cn(
                              "relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden",
                              selectedMethod?.id === method.id
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-accent/30"
                            )}
                          >
                            <div className={cn(
                              "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
                              `bg-gradient-to-br ${iconData.gradient}`
                            )} />
                            
                            <div className="relative flex items-center gap-4">
                              <div className={cn(
                                "w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-lg",
                                selectedMethod?.id === method.id
                                  ? `bg-gradient-to-br ${iconData.gradient} text-white`
                                  : "bg-secondary"
                              )}>
                                <IconComponent className={cn(
                                  "w-7 h-7 transition-colors",
                                  selectedMethod?.id === method.id ? "text-white" : iconData.color
                                )} />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-lg">{method.name_ar}</p>
                                <p className="text-sm text-muted-foreground">{method.type}</p>
                                {method.min_amount && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    الحد الأدنى: ${method.min_amount}
                                  </p>
                                )}
                              </div>
                              <AnimatePresence>
                                {selectedMethod?.id === method.id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                                  >
                                    <Check className="w-5 h-5 text-primary-foreground" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            
                            {method.extra_fee_value && method.extra_fee_value > 0 && (
                              <Badge variant="secondary" className="absolute top-3 left-3 text-xs">
                                رسوم: {method.extra_fee_type === 'percentage' ? `${method.extra_fee_value}%` : `$${method.extra_fee_value}`}
                              </Badge>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Coming Soon Payment Methods */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 shadow-lg overflow-hidden bg-gradient-to-l from-amber-500/5 to-transparent">
                <CardHeader className="border-b border-amber-500/20">
                  <CardTitle className="flex items-center gap-3">
                    <motion.div 
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30"
                    >
                      <Star className="w-5 h-5" />
                    </motion.div>
                    <div>
                      <span className="text-lg">طرق دفع قادمة قريباً</span>
                      <p className="text-sm font-normal text-muted-foreground">نعمل على إضافة المزيد من الخيارات</p>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="mr-auto"
                    >
                      <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                        <Sparkles className="w-3 h-3 ml-1" />
                        قريباً
                      </Badge>
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {/* Bank Transfer */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative group"
                    >
                      <div className="p-4 rounded-xl border-2 border-dashed border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-600/10 text-center transition-all group-hover:border-green-500/50 group-hover:shadow-lg group-hover:shadow-green-500/10">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                          className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/30"
                        >
                          <Banknote className="w-7 h-7 text-white" />
                        </motion.div>
                        <p className="font-bold text-sm mb-1">التحويل البنكي</p>
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 border-green-500/30 text-green-600">
                          Bank Transfer
                        </Badge>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent rounded-xl pointer-events-none"
                      />
                    </motion.div>

                    {/* Binance */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative group"
                    >
                      <div className="p-4 rounded-xl border-2 border-dashed border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-yellow-600/10 text-center transition-all group-hover:border-yellow-500/50 group-hover:shadow-lg group-hover:shadow-yellow-500/10">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                          className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30"
                        >
                          <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L6.5 7.5 8.4 9.4 12 5.8l3.6 3.6 1.9-1.9L12 2zM2 12l5.5-5.5 1.9 1.9L5.8 12l3.6 3.6-1.9 1.9L2 12zm20 0l-5.5 5.5-1.9-1.9 3.6-3.6-3.6-3.6 1.9-1.9L22 12zM12 22l5.5-5.5-1.9-1.9-3.6 3.6-3.6-3.6-1.9 1.9L12 22zm0-7l2.5-2.5L12 10l-2.5 2.5L12 15z"/>
                          </svg>
                        </motion.div>
                        <p className="font-bold text-sm mb-1">بينانس</p>
                        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
                          Binance
                        </Badge>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent rounded-xl pointer-events-none"
                      />
                    </motion.div>

                    {/* PayPal */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative group"
                    >
                      <div className="p-4 rounded-xl border-2 border-dashed border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-600/10 text-center transition-all group-hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/10">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                          className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30"
                        >
                          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.144 19.532l1.049-5.751c.085-.394.318-.773.721-.929.382-.148.754-.178 1.128-.178h1.236c2.508 0 4.471-.939 5.059-3.604.046-.195.078-.392.094-.586.049-.582-.018-1.127-.294-1.579-.313-.513-.863-.879-1.608-1.118-1.046-.346-2.364-.44-3.762-.44H5.964c-.339 0-.643.227-.724.553L3.006 18.95c-.06.271.144.531.419.531h2.966c.298 0 .566-.207.624-.5l.129-.449z"/>
                            <path d="M8.62 5.91c.256-1.402 1.453-2.41 2.883-2.41h3.722c1.35 0 2.411.302 3.153.911.75.615 1.007 1.482.758 2.635-.298 1.362-.958 2.463-1.913 3.223-1.01.804-2.311 1.231-3.791 1.231H11.33c-.461 0-.865.316-.966.764l-.833 4.569c-.067.367-.385.636-.758.636H6.5"/>
                          </svg>
                        </motion.div>
                        <p className="font-bold text-sm mb-1">باي بال</p>
                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-600">
                          PayPal
                        </Badge>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-xl pointer-events-none"
                      />
                    </motion.div>

                    {/* Tamara */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative group"
                    >
                      <div className="p-4 rounded-xl border-2 border-dashed border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-pink-600/10 text-center transition-all group-hover:border-pink-500/50 group-hover:shadow-lg group-hover:shadow-pink-500/10">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                          className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-500/30"
                        >
                          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </motion.div>
                        <p className="font-bold text-sm mb-1">تمارا</p>
                        <Badge variant="outline" className="text-[10px] bg-pink-500/10 border-pink-500/30 text-pink-600">
                          Tamara
                        </Badge>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent rounded-xl pointer-events-none"
                      />
                    </motion.div>

                    {/* STC Bank */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative group col-span-2 sm:col-span-1"
                    >
                      <div className="p-4 rounded-xl border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-600/10 text-center transition-all group-hover:border-purple-500/50 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                          className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30"
                        >
                          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                          </svg>
                        </motion.div>
                        <p className="font-bold text-sm mb-1">STC Pay</p>
                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 border-purple-500/30 text-purple-600">
                          STC Bank
                        </Badge>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent rounded-xl pointer-events-none"
                      />
                    </motion.div>
                  </div>

                  {/* Coming Soon Notice */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 p-4 rounded-xl bg-gradient-to-l from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
                      >
                        <TrendingUp className="w-5 h-5 text-white" />
                      </motion.div>
                      <div>
                        <p className="font-semibold text-sm">نعمل على إضافة المزيد!</p>
                        <p className="text-xs text-muted-foreground">تابعنا للحصول على آخر التحديثات</p>
                      </div>
                      <motion.div 
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="mr-auto"
                      >
                        <ArrowRight className="w-5 h-5 text-amber-500" />
                      </motion.div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Amount Selection for other methods */}
            <AnimatePresence mode="wait">
              {selectedMethod && (
                <motion.div
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  variants={itemVariants}
                >
                  <Card className="border-border/50 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-l from-success/5 to-transparent border-b border-border/50">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-success/60 flex items-center justify-center text-success-foreground font-bold shadow-lg shadow-success/20">
                          2
                        </div>
                        <div>
                          <span className="text-lg">أدخل المبلغ</span>
                          <p className="text-sm font-normal text-muted-foreground">حدد المبلغ الذي تريد إيداعه</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-3 block">اختر مبلغ سريع</Label>
                        <div className="flex flex-wrap gap-3">
                          {presetAmounts.map((preset, i) => (
                            <motion.button
                              key={preset}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setAmount(preset.toString())}
                              className={cn(
                                "px-5 py-3 rounded-xl font-semibold transition-all border-2",
                                amount === preset.toString()
                                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                                  : "bg-secondary/50 border-border hover:border-primary/50 hover:bg-secondary"
                              )}
                            >
                              ${preset}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">أو أدخل مبلغ مخصص</Label>
                        <div className="relative">
                          <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="أدخل المبلغ"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min={selectedMethod.min_amount || 1}
                            max={selectedMethod.max_amount || undefined}
                            className="h-14 text-xl font-bold pr-12 text-center border-2 focus:border-primary"
                          />
                        </div>
                      </div>

                      {bonuses.filter(b => !b.payment_method_id || b.payment_method_id === selectedMethod.id).length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-gradient-to-l from-success/10 to-success/5 border border-success/20"
                        >
                          <div className="flex items-center gap-2 text-success mb-3">
                            <Gift className="w-5 h-5" />
                            <span className="font-semibold">عروض البونص المتاحة</span>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="space-y-2">
                            {bonuses
                              .filter(b => !b.payment_method_id || b.payment_method_id === selectedMethod.id)
                              .map((b) => (
                                <div key={b.id} className="flex items-center gap-2 text-sm">
                                  <BadgeCheck className="w-4 h-4 text-success" />
                                  <span>
                                    أودع <span className="font-bold">${b.min_amount}+</span> واحصل على{' '}
                                    <span className="font-bold text-success">
                                      {b.bonus_type === 'percentage' ? `${b.bonus_value}%` : `$${b.bonus_value}`}
                                    </span>{' '}
                                    بونص
                                  </span>
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Details */}
            <AnimatePresence mode="wait">
              {selectedMethod && numericAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  variants={itemVariants}
                >
                  <Card className="border-border/50 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-l from-accent/10 to-transparent border-b border-border/50">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-accent-foreground font-bold shadow-lg shadow-accent/20">
                          3
                        </div>
                        <div>
                          <span className="text-lg">تفاصيل الدفع</span>
                          <p className="text-sm font-normal text-muted-foreground">أكمل معلومات الدفع</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {selectedMethod.instructions_ar && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-5 rounded-xl bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                              <Info className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-primary mb-2">تعليمات الدفع</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                {selectedMethod.instructions_ar}
                              </p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-3 gap-2"
                                onClick={() => copyToClipboard(selectedMethod.instructions_ar || '')}
                              >
                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                نسخ التعليمات
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>رقم المعاملة / Transaction ID</Label>
                          <Input
                            placeholder="أدخل رقم المعاملة (اختياري)"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>ملاحظات إضافية</Label>
                          <Textarea
                            placeholder="أي ملاحظات تريد إضافتها... (اختياري)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Smart Wallet Sidebar */}
          <div className="lg:col-span-1">
            <motion.div variants={itemVariants} className="sticky top-6 space-y-4">
              {/* Smart Wallet Card */}
              <Card className="border-border/50 shadow-xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
                <CardHeader className="bg-gradient-to-l from-primary/10 to-transparent border-b border-border/50 pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      <Wallet className="w-5 h-5 text-primary-foreground" />
                    </motion.div>
                    <div>
                      <span className="text-lg">المحفظة الذكية</span>
                      <p className="text-xs font-normal text-muted-foreground">ملخص الإيداع</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Current Balance Mini */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-3 sm:p-4 rounded-xl bg-gradient-to-l from-success/20 to-success/5 border border-success/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-success to-success/60 flex items-center justify-center"
                        >
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </motion.div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">رصيدك الحالي</p>
                          <motion.p 
                            key={currentBalance}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="text-lg sm:text-xl font-bold text-success"
                          >
                            {currentBalance.toFixed(2)} ر.س
                          </motion.p>
                        </div>
                      </div>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                    </div>
                  </motion.div>

                  {/* Selected Method */}
                  {(selectedMethod || usePaylinkDirect) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 sm:p-4 rounded-xl bg-secondary/50 border border-border/50"
                    >
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">طريقة الدفع</p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                          usePaylinkDirect ? "from-emerald-500 to-teal-600" : (selectedMethod ? getPaymentIcon(selectedMethod.type, selectedMethod.name).gradient : "")
                        )}>
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <span className="font-semibold text-sm sm:text-base">
                          {usePaylinkDirect ? 'الدفع الالكتروني' : selectedMethod?.name_ar}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Amount Breakdown */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">المبلغ</span>
                      <span className="font-semibold text-base sm:text-lg">{numericAmount.toFixed(2)} ر.س</span>
                    </div>
                    
                    <AnimatePresence>
                      {fee > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex justify-between items-center py-2 text-destructive"
                        >
                          <span className="text-sm">رسوم الدفع</span>
                          <span className="font-semibold text-sm sm:text-base">-{fee.toFixed(2)} ر.س</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {bonus > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex justify-between items-center py-2"
                        >
                          <span className="flex items-center gap-2 text-success text-sm">
                            <Gift className="w-4 h-4" />
                            بونص
                          </span>
                          <span className="font-semibold text-success text-sm sm:text-base">+{bonus.toFixed(2)} ر.س</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div 
                      className="border-t border-border pt-4 rounded-xl bg-gradient-to-l from-primary/10 to-transparent p-3 sm:p-4 -mx-2 sm:-mx-4"
                      animate={{ 
                        boxShadow: numericAmount > 0 ? [
                          "0 0 0 rgba(var(--primary), 0)",
                          "0 0 20px rgba(var(--primary), 0.2)",
                          "0 0 0 rgba(var(--primary), 0)"
                        ] : "none"
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm sm:text-base">سيضاف لرصيدك</span>
                        <motion.span 
                          key={totalCredited}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="text-xl sm:text-2xl font-bold text-primary"
                        >
                          {totalCredited.toFixed(2)} ر.س
                        </motion.span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Submit Button for manual methods */}
                  {selectedMethod && !usePaylinkDirect && (
                    <Button
                      className="w-full h-12 sm:h-14 text-base sm:text-lg gap-2 sm:gap-3 shadow-lg shadow-primary/30"
                      size="lg"
                      disabled={numericAmount <= 0 || submitting}
                      onClick={handleSubmit}
                    >
                      {submitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                          إرسال طلب الإيداع
                        </>
                      )}
                    </Button>
                  )}

                  {/* Security Badge */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-success/5 border border-success/20"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Shield className="w-4 h-4 text-success" />
                    </motion.div>
                    <span>دفع آمن ومشفر 100%</span>
                  </motion.div>

                  {selectedMethod && !usePaylinkDirect && (
                    <p className="text-[10px] sm:text-xs text-center text-muted-foreground bg-secondary/50 p-2 sm:p-3 rounded-lg">
                      سيتم مراجعة طلبك وإضافة الرصيد خلال 24 ساعة كحد أقصى
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientDeposit;
