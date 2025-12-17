import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const emailSchema = z.string().email("البريد الإلكتروني غير صالح");
const passwordSchema = z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل");

const AdminAuth = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();
  const { user, isAdmin, signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate("/admin");
    } else if (user && !isAdmin) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحيات الوصول للوحة الإدارة.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, isAdmin, navigate, toast]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
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
      }
      // Redirect will be handled by useEffect after auth state updates
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
    <div className="min-h-screen flex bg-gradient-dark">
      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="font-display font-bold text-xl text-primary-foreground">م</span>
            </div>
            <span className="font-display font-bold text-xl">ماركت برو</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">لوحة الإدارة</h1>
                <p className="text-sm text-muted-foreground">وصول المسؤولين فقط</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              سجل دخولك بحساب المسؤول للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative mt-2">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pr-10 bg-secondary/50 border-border/50 h-12"
                  dir="ltr"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative mt-2">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10 pl-10 bg-secondary/50 border-border/50 h-12"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-destructive hover:bg-destructive/90 text-lg font-semibold"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
              ) : (
                <>
                  دخول لوحة الإدارة
                  <ArrowLeft className="w-5 h-5 me-2" />
                </>
              )}
            </Button>
          </form>

          {/* Back to client login */}
          <p className="mt-6 text-center text-muted-foreground">
            لست مسؤولاً؟{" "}
            <Link to="/auth" className="text-primary hover:underline font-medium">
              تسجيل دخول العملاء
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-destructive/20 via-background to-primary/10" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-3xl bg-destructive/30 blur-sm"
          animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-primary/30 blur-sm"
          animate={{ y: [20, -20, 20], x: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-8 max-w-md text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-destructive/20 mx-auto mb-6 flex items-center justify-center">
              <Shield className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-4">
              منطقة محمية
            </h2>
            <p className="text-muted-foreground mb-6">
              هذه الصفحة مخصصة للمسؤولين فقط. يرجى تسجيل الدخول بحساب مسؤول معتمد.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>اتصال آمن ومشفر</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
