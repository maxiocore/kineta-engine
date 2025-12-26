import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles, Phone, Shield, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("البريد الإلكتروني غير صالح");
const passwordSchema = z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
const phoneSchema = z.string().regex(/^(05|5)\d{8}$/, "رقم الجوال غير صالح (مثال: 0512345678)").optional().or(z.literal(''));

const features = [
  { icon: Shield, text: "حماية متقدمة للبيانات" },
  { icon: Zap, text: "سرعة فائقة في التنفيذ" },
  { icon: CheckCircle2, text: "دعم فني على مدار الساعة" },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; phone?: string }>({});
  const { toast } = useToast();
  const { user, signUp, signIn } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    setIsSignUp(searchParams.get("mode") === "signup");
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string; phone?: string } = {};
    
    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (isSignUp && !formData.name.trim()) {
      newErrors.name = "الاسم مطلوب";
    }

    if (isSignUp && formData.phone) {
      try {
        phoneSchema.parse(formData.phone);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.phone = e.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, formData.name, formData.phone);
        
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "خطأ",
              description: "هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "خطأ",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          try {
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (newUser) {
              await supabase.functions.invoke('send-welcome-email', {
                body: {
                  userId: newUser.id,
                  email: formData.email,
                  name: formData.name
                }
              });
            }
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
          }
          
          toast({
            title: "تم إنشاء الحساب!",
            description: "تم تسجيل حسابك بنجاح. سيتم توجيهك للوحة التحكم.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "خطأ",
              description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "خطأ",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "مرحباً بعودتك!",
            description: "تم تسجيل دخولك بنجاح.",
          });
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 50%)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-10 group">
            <motion.span 
              className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              MaxioCore
            </motion.span>
          </Link>

          {/* Card Container */}
          <motion.div
            className="relative p-8 md:p-10 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-50 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {isSignUp ? "انضم إلينا اليوم" : "أهلاً بعودتك"}
                  </span>
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold mb-3">
                  {isSignUp ? (
                    <>إنشاء <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">حساب جديد</span></>
                  ) : (
                    <>تسجيل <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">الدخول</span></>
                  )}
                </h1>
                <p className="text-muted-foreground">
                  {isSignUp 
                    ? "ابدأ رحلتك نحو النجاح التسويقي" 
                    : "سجل دخولك للوصول إلى لوحة التحكم"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium">الاسم الكامل</Label>
                        <div className="relative mt-2">
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="محمد أحمد"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="pr-12 bg-secondary/30 border-border/50 h-13 text-right rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all"
                            required={isSignUp}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-sm text-destructive mt-1.5">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium">
                          رقم الجوال <span className="text-muted-foreground text-xs">(اختياري)</span>
                        </Label>
                        <div className="relative mt-2">
                          <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="0512345678"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="pr-12 bg-secondary/30 border-border/50 h-13 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all"
                            dir="ltr"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-sm text-destructive mt-1.5">{errors.phone}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pr-12 bg-secondary/30 border-border/50 h-13 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all"
                      dir="ltr"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1.5">{errors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
                    {!isSignUp && (
                      <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
                        نسيت كلمة المرور؟
                      </a>
                    )}
                  </div>
                  <div className="relative mt-2">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pr-12 pl-12 bg-secondary/30 border-border/50 h-13 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1.5">{errors.password}</p>
                  )}
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 bg-gradient-to-l from-primary to-accent hover:opacity-90 text-lg font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        {isSignUp ? "إنشاء الحساب" : "تسجيل الدخول"}
                        <ArrowLeft className="w-5 h-5 me-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Toggle */}
              <p className="mt-6 text-center text-muted-foreground">
                {isSignUp ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  {isSignUp ? "سجل دخولك" : "أنشئ حساباً"}
                </button>
              </p>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-sm text-muted-foreground">أو تابع باستخدام</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-transparent" />
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="w-full h-12 bg-secondary/30 border-border/50 hover:bg-secondary/50 rounded-xl transition-all">
                    <svg className="w-5 h-5 ms-2" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    جوجل
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="w-full h-12 bg-secondary/30 border-border/50 hover:bg-secondary/50 rounded-xl transition-all">
                    <svg className="w-5 h-5 ms-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    جيت هب
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              العودة للصفحة الرئيسية
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-background to-accent/10" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{ y: [-30, 30, -30], x: [-10, 10, -10] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.4) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
          animate={{ y: [30, -30, 30], x: [10, -10, 10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
            filter: "blur(25px)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative p-10 rounded-3xl bg-card/30 backdrop-blur-xl border border-border/30 max-w-md text-center shadow-2xl"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/30 via-transparent to-accent/30 opacity-50 blur-sm" />
            
            <div className="relative z-10">
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-8 flex items-center justify-center shadow-xl shadow-primary/30"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                انضم لأكثر من <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">10,000</span> مسوّق
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                "MaxioCore غيّرت استراتيجيتنا الرقمية بالكامل. النتائج تتحدث عن نفسها."
              </p>
              
              {/* Features */}
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 text-right"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.svg 
                    key={i} 
                    className="w-6 h-6 fill-yellow-400 text-yellow-400" 
                    viewBox="0 0 20 20"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </motion.svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">تقييم 4.9/5 من أكثر من 2,000 مراجعة</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;