import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles, Phone, Shield, Zap, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const emailSchema = z.string().email("البريد الإلكتروني غير صالح");
const passwordSchema = z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
const phoneSchema = z.string().regex(/^(05|5)\d{8}$/, "رقم الجوال غير صالح (مثال: 0512345678)").optional().or(z.literal(''));

const features = [
  { icon: Shield, text: "حماية متقدمة للبيانات", color: "from-emerald-500 to-teal-500" },
  { icon: Zap, text: "سرعة فائقة في التنفيذ", color: "from-amber-500 to-orange-500" },
  { icon: CheckCircle2, text: "دعم فني على مدار الساعة", color: "from-blue-500 to-cyan-500" },
];

const FloatingParticle = ({ delay, duration, x, y, size }: { delay: number; duration: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      y: [0, -30, 0],
      opacity: [0.2, 0.6, 0.2],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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

  const inputVariants = {
    focused: { scale: 1.02, boxShadow: "0 0 20px hsl(var(--primary) / 0.2)" },
    unfocused: { scale: 1, boxShadow: "0 0 0px transparent" }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col lg:flex-row bg-background relative overflow-hidden pt-16 sm:pt-20">
      {/* Animated Background with Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        {/* Floating Particles */}
        <FloatingParticle delay={0} duration={4} x="10%" y="20%" size={8} />
        <FloatingParticle delay={1} duration={5} x="80%" y="15%" size={6} />
        <FloatingParticle delay={2} duration={4.5} x="30%" y="70%" size={10} />
        <FloatingParticle delay={0.5} duration={6} x="70%" y="60%" size={7} />
        <FloatingParticle delay={1.5} duration={5.5} x="50%" y="30%" size={5} />
        <FloatingParticle delay={3} duration={4} x="20%" y="80%" size={9} />
        
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

      {/* Mobile Header */}
      <motion.div 
        className="lg:hidden relative z-20 pt-6 pb-4 px-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/" className="inline-flex items-center justify-center">
          <motion.span 
            className="text-2xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            MaxioCore
          </motion.span>
        </Link>
      </motion.div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10 min-h-0 lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Desktop Logo */}
          <Link to="/" className="hidden lg:flex items-center gap-3 mb-8 group">
            <motion.span 
              className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              MaxioCore
            </motion.span>
          </Link>

          {/* Card Container */}
          <motion.div
            className="relative p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ boxShadow: "0 25px 50px -12px hsl(var(--primary) / 0.15)" }}
          >
            {/* Animated Border Gradient */}
            <motion.div 
              className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none"
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.3), hsl(var(--primary) / 0.3))",
                backgroundSize: "200% 100%",
              }}
              animate={{
                backgroundPosition: ["0% 0%", "200% 0%"],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-[1px] rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-xl" />
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="relative z-10">
              {/* Header with Animation */}
              <div className="text-center mb-6 sm:mb-8">
                <motion.div
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--primary) / 0.15)" }}
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium text-primary">
                    {isSignUp ? "انضم إلينا اليوم" : "أهلاً بعودتك"}
                  </span>
                </motion.div>
                
                <AnimatePresence mode="wait">
                  <motion.h1 
                    key={isSignUp ? "signup" : "signin"}
                    className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isSignUp ? (
                      <>إنشاء <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">حساب جديد</span></>
                    ) : (
                      <>تسجيل <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">الدخول</span></>
                    )}
                  </motion.h1>
                </AnimatePresence>
                
                <motion.p 
                  className="text-sm sm:text-base text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {isSignUp 
                    ? "ابدأ رحلتك نحو النجاح التسويقي" 
                    : "سجل دخولك للوصول إلى لوحة التحكم"}
                </motion.p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <AnimatePresence mode="wait">
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 sm:space-y-5"
                    >
                      <motion.div
                        variants={inputVariants}
                        animate={focusedField === 'name' ? 'focused' : 'unfocused'}
                        className="rounded-xl"
                      >
                        <Label htmlFor="name" className="text-xs sm:text-sm font-medium">الاسم الكامل</Label>
                        <div className="relative mt-1.5 sm:mt-2">
                          <motion.div
                            animate={{ 
                              color: focusedField === 'name' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                            }}
                          >
                            <User className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" />
                          </motion.div>
                          <Input
                            id="name"
                            type="text"
                            placeholder="محمد أحمد"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            className="pr-10 sm:pr-12 bg-secondary/30 border-border/50 h-11 sm:h-12 text-sm sm:text-base text-right rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                            required={isSignUp}
                          />
                        </div>
                        {errors.name && (
                          <motion.p 
                            className="text-xs sm:text-sm text-destructive mt-1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            {errors.name}
                          </motion.p>
                        )}
                      </motion.div>

                      <motion.div
                        variants={inputVariants}
                        animate={focusedField === 'phone' ? 'focused' : 'unfocused'}
                        className="rounded-xl"
                      >
                        <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                          رقم الجوال <span className="text-muted-foreground text-xs">(اختياري)</span>
                        </Label>
                        <div className="relative mt-1.5 sm:mt-2">
                          <motion.div
                            animate={{ 
                              color: focusedField === 'phone' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                            }}
                          >
                            <Phone className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" />
                          </motion.div>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="0512345678"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            className="pr-10 sm:pr-12 bg-secondary/30 border-border/50 h-11 sm:h-12 text-sm sm:text-base rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                            dir="ltr"
                          />
                        </div>
                        {errors.phone && (
                          <motion.p 
                            className="text-xs sm:text-sm text-destructive mt-1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            {errors.phone}
                          </motion.p>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  variants={inputVariants}
                  animate={focusedField === 'email' ? 'focused' : 'unfocused'}
                  className="rounded-xl"
                >
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium">البريد الإلكتروني</Label>
                  <div className="relative mt-1.5 sm:mt-2">
                    <motion.div
                      animate={{ 
                        color: focusedField === 'email' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      <Mail className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="pr-10 sm:pr-12 bg-secondary/30 border-border/50 h-11 sm:h-12 text-sm sm:text-base rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      dir="ltr"
                      required
                    />
                  </div>
                  {errors.email && (
                    <motion.p 
                      className="text-xs sm:text-sm text-destructive mt-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  variants={inputVariants}
                  animate={focusedField === 'password' ? 'focused' : 'unfocused'}
                  className="rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-medium">كلمة المرور</Label>
                    {!isSignUp && (
                      <motion.a 
                        href="#" 
                        className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        نسيت كلمة المرور؟
                      </motion.a>
                    )}
                  </div>
                  <div className="relative mt-1.5 sm:mt-2">
                    <motion.div
                      animate={{ 
                        color: focusedField === 'password' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      <Lock className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="pr-10 sm:pr-12 pl-10 sm:pl-12 bg-secondary/30 border-border/50 h-11 sm:h-12 text-sm sm:text-base rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      dir="ltr"
                      required
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </motion.button>
                  </div>
                  {errors.password && (
                    <motion.p 
                      className="text-xs sm:text-sm text-destructive mt-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full h-11 sm:h-12 overflow-hidden bg-gradient-to-l from-primary to-accent hover:opacity-90 text-sm sm:text-base lg:text-lg font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all group"
                  >
                    {/* Button Shine Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    
                    {isLoading ? (
                      <motion.div 
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <span className="relative flex items-center justify-center gap-2">
                        {isSignUp ? "إنشاء الحساب" : "تسجيل الدخول"}
                        <motion.div
                          animate={{ x: [0, -5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.div>
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Toggle with Animation */}
              <motion.p 
                className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {isSignUp ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
                <motion.button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSignUp ? "سجل دخولك" : "أنشئ حساباً"}
                  <motion.span 
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </motion.p>
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div 
            className="mt-4 sm:mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/">
              <motion.span 
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ x: 5 }}
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
                العودة للصفحة الرئيسية
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Visual Panel - Desktop Only */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-background to-accent/10" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-30">
          <motion.div 
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
            animate={{ 
              backgroundPosition: ["0px 0px", "60px 60px"],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-8 xl:p-12 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative p-8 xl:p-10 rounded-3xl bg-card/30 backdrop-blur-xl border border-border/30 max-w-md text-center shadow-2xl"
          >
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/30 via-transparent to-accent/30 opacity-50 blur-sm" />
            
            <div className="relative z-10">
              <motion.div 
                className="w-16 h-16 xl:w-20 xl:h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 xl:mb-8 flex items-center justify-center shadow-xl shadow-primary/30"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-8 h-8 xl:w-10 xl:h-10 text-primary-foreground" />
              </motion.div>
              
              <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-bold mb-3 xl:mb-4">
                انضم لأكثر من <motion.span 
                  className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  10,000
                </motion.span> مسوّق
              </h2>
              <p className="text-muted-foreground mb-6 xl:mb-8 text-sm xl:text-base 2xl:text-lg">
                "MaxioCore غيّرت استراتيجيتنا الرقمية بالكامل. النتائج تتحدث عن نفسها."
              </p>
              
              {/* Features with Hover Effects */}
              <div className="space-y-3 xl:space-y-4 mb-6 xl:mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 text-right p-3 rounded-xl bg-secondary/20 border border-border/20 cursor-default"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02, 
                      backgroundColor: "hsl(var(--secondary) / 0.4)",
                      borderColor: "hsl(var(--primary) / 0.3)"
                    }}
                  >
                    <motion.div 
                      className={`w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}
                      whileHover={{ rotate: 10 }}
                    >
                      <feature.icon className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
                    </motion.div>
                    <span className="text-sm xl:text-base text-foreground font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                  >
                    <Star className="w-5 h-5 xl:w-6 xl:h-6 fill-yellow-400 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
              <p className="text-xs xl:text-sm text-muted-foreground">تقييم 4.9/5 من أكثر من 2,000 مراجعة</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Features Section */}
      <motion.div 
        className="lg:hidden relative z-10 px-4 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/30 border border-border/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <feature.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
      <Footer />
    </>
  );
};

export default Auth;