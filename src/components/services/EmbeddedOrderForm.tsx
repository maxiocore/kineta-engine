import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Link as LinkIcon,
  Hash,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  Tag,
  Info,
  Clock,
  Shield,
  Zap,
  X,
  Sparkles,
  ArrowRight,
  Gift,
  Percent,
  CreditCard,
  Target,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import OrderProgressIndicator from "@/components/orders/OrderProgressIndicator";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  features: any;
  external_service_id: string | null;
  refill_enabled: boolean | null;
}

interface EmbeddedOrderFormProps {
  service: Service | null;
  onClose: () => void;
  onSuccess?: () => void;
}

// Enhanced animated number with spring physics
const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString('ar-SA'));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  
  return <motion.span className={className}>{display}</motion.span>;
};

// Enhanced animated price with glow effect
const AnimatedPrice = ({ value, size = "default" }: { value: number; size?: "default" | "large" }) => {
  const spring = useSpring(value, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => v.toFixed(2));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  
  return (
    <motion.span 
      className={cn(
        "tabular-nums",
        size === "large" && "text-3xl font-bold"
      )}
      key={value}
    >
      {display}
    </motion.span>
  );
};

// Quantity button component with ripple effect
const QuantityButton = ({ 
  onClick, 
  disabled, 
  icon: Icon,
  variant = "default"
}: { 
  onClick: () => void; 
  disabled: boolean;
  icon: React.ComponentType<any>;
  variant?: "default" | "add";
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.1 }}
    whileTap={{ scale: disabled ? 1 : 0.9 }}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
      "border-2 disabled:opacity-40 disabled:cursor-not-allowed",
      variant === "add" 
        ? "bg-gradient-to-br from-primary to-accent border-primary/30 text-white shadow-lg shadow-primary/30" 
        : "bg-muted/50 border-border hover:border-primary/50 hover:bg-primary/10"
    )}
  >
    <Icon className="w-5 h-5" />
  </motion.button>
);

// Quick quantity preset chip
const QuantityChip = ({ 
  value, 
  active, 
  onClick 
}: { 
  value: number; 
  active: boolean; 
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-medium transition-all",
      active 
        ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30" 
        : "bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30"
    )}
  >
    {value.toLocaleString('ar-SA')}
  </motion.button>
);

export default function EmbeddedOrderForm({ service, onClose, onSuccess }: EmbeddedOrderFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  // Get min/max from features
  const minQuantity = service?.features?.min || 10;
  const maxQuantity = service?.features?.max || 100000;

  // Calculate price
  const basePrice = service ? (service.price / 1000) * quantity : 0;
  const discountAmount = appliedCoupon 
    ? appliedCoupon.discount_type === 'percentage' 
      ? basePrice * (appliedCoupon.discount_value / 100)
      : appliedCoupon.discount_value
    : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);
  const discountPercentage = basePrice > 0 ? (discountAmount / basePrice) * 100 : 0;

  // Scroll to form when service changes
  useEffect(() => {
    if (service && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [service]);

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      setQuantity(service.features?.min || 100);
      setLink("");
      setNotes("");
      setCouponCode("");
      setAppliedCoupon(null);
    }
  }, [service?.id]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("كود الخصم غير صالح");
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("كود الخصم منتهي الصلاحية");
        return;
      }

      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error("تم استخدام كود الخصم الحد الأقصى من المرات");
        return;
      }

      if (data.min_order_amount && basePrice < data.min_order_amount) {
        toast.error(`الحد الأدنى للطلب ${data.min_order_amount} ر.س`);
        return;
      }

      setAppliedCoupon(data);
      toast.success("تم تطبيق كود الخصم بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء التحقق من الكود");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول للطلب");
      return;
    }

    if (!service) {
      toast.error("يرجى اختيار خدمة");
      return;
    }

    if (!link.trim()) {
      toast.error("يرجى إدخال الرابط");
      return;
    }

    if (quantity < minQuantity || quantity > maxQuantity) {
      toast.error(`الكمية يجب أن تكون بين ${minQuantity} و ${maxQuantity}`);
      return;
    }

    // Check balance
    const { data: balanceData } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!balanceData || balanceData.balance < finalPrice) {
      toast.error("رصيدك غير كافي، يرجى شحن حسابك");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        service_id: service.id,
        order_number: orderNumber,
        quantity,
        link,
        notes,
        total_price: finalPrice,
        coupon_id: appliedCoupon?.id || null,
        discount_amount: discountAmount,
        status: "pending"
      });

      if (error) throw error;

      // Deduct balance
      await supabase.from("user_balances")
        .update({ 
          balance: balanceData.balance - finalPrice,
          total_spent: (balanceData as any).total_spent + finalPrice,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      // Show progress indicator
      setCreatedOrderNumber(orderNumber);
      setShowProgress(true);
    } catch (error) {
      console.error("Order error:", error);
      toast.error("حدث خطأ أثناء إنشاء الطلب");
      setIsSubmitting(false);
    }
  };

  const handleProgressClose = () => {
    setShowProgress(false);
    setIsSubmitting(false);
    onSuccess?.();
    onClose();
  };

  const handleViewOrders = () => {
    setShowProgress(false);
    navigate('/dashboard/orders');
  };

  if (!service) return null;

  // Show progress indicator after submission
  if (showProgress) {
    return (
      <OrderProgressIndicator
        orderNumber={createdOrderNumber}
        onClose={handleProgressClose}
        onViewOrders={handleViewOrders}
      />
    );
  }

  return (
    <motion.div
      ref={formRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-4"
    >
      <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10 bg-gradient-to-b from-card to-card/95">
        {/* Animated Header */}
        <div className="relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20" />
          <motion.div 
            className="absolute inset-0"
            animate={{ 
              background: [
                "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 100%, hsl(var(--primary) / 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.3) 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:16px_16px]" />
          
          <div className="relative p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/40">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <motion.div 
                  className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-3 h-3 text-white" />
                </motion.div>
              </motion.div>
              <div>
                <h3 className="font-bold text-xl">نموذج الطلب</h3>
                <p className="text-sm text-muted-foreground">أكمل بيانات طلبك</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-muted/50 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <CardContent className="p-5 space-y-6">
          {/* Selected Service Card */}
          <motion.div 
            className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/50 border border-border/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Decorative corner */}
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-br-full" />
            
            <div className="relative flex items-start gap-3">
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0 border border-primary/20"
                whileHover={{ rotate: 5 }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-2 leading-relaxed">{service.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Target className="w-3 h-3" />
                    {service.category}
                  </Badge>
                  {service.external_service_id && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      #{service.external_service_id}
                    </Badge>
                  )}
                  {service.refill_enabled && (
                    <Badge className="text-[10px] bg-success/10 text-success border-success/20 gap-1">
                      <Shield className="w-3 h-3" />
                      ضمان
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Service Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
              <motion.div 
                className="text-center p-2 rounded-xl bg-background/50"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1 text-primary">
                  <CreditCard className="w-3.5 h-3.5" />
                  <p className="text-[10px] text-muted-foreground">السعر / 1000</p>
                </div>
                <p className="font-bold text-primary mt-1">{service.price.toFixed(2)}</p>
              </motion.div>
              <motion.div 
                className="text-center p-2 rounded-xl bg-background/50 border-x border-border/30"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">الحد الأدنى</p>
                </div>
                <p className="font-bold mt-1">{minQuantity.toLocaleString('ar-SA')}</p>
              </motion.div>
              <motion.div 
                className="text-center p-2 rounded-xl bg-background/50"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">الحد الأقصى</p>
                </div>
                <p className="font-bold mt-1">{maxQuantity.toLocaleString('ar-SA')}</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Link Input with animation */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Label className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <LinkIcon className="w-3.5 h-3.5 text-primary" />
              </div>
              الرابط
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative group">
              <Input
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="h-12 pr-4 text-base bg-muted/30 border-2 border-border/50 focus:border-primary/50 focus:bg-background transition-all rounded-xl"
                dir="ltr"
              />
              <motion.div 
                className={cn(
                  "absolute inset-0 rounded-xl pointer-events-none",
                  link.trim() && "ring-2 ring-success/30"
                )}
                animate={{ opacity: link.trim() ? 1 : 0 }}
              />
            </div>
          </motion.div>

          {/* Quantity Section with enhanced UI */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                <Hash className="w-3.5 h-3.5 text-accent" />
              </div>
              الكمية
              <span className="text-destructive">*</span>
            </Label>
            
            {/* Quantity Controls */}
            <div className="flex items-center gap-3">
              <QuantityButton
                onClick={() => setQuantity(Math.max(minQuantity, quantity - 100))}
                disabled={quantity <= minQuantity}
                icon={Minus}
              />
              
              <div className="flex-1 relative">
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || minQuantity;
                    setQuantity(Math.min(maxQuantity, Math.max(minQuantity, val)));
                  }}
                  className="text-center font-bold text-2xl h-14 bg-muted/30 border-2 border-border/50 focus:border-primary/50 rounded-xl"
                  min={minQuantity}
                  max={maxQuantity}
                />
                <motion.div 
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground bg-background px-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {quantity >= maxQuantity ? "الحد الأقصى" : quantity <= minQuantity ? "الحد الأدنى" : ""}
                </motion.div>
              </div>
              
              <QuantityButton
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 100))}
                disabled={quantity >= maxQuantity}
                icon={Plus}
                variant="add"
              />
            </div>

            {/* Enhanced Slider */}
            <div className="pt-2 pb-4">
              <Slider
                value={[quantity]}
                onValueChange={([val]) => setQuantity(val)}
                min={minQuantity}
                max={maxQuantity}
                step={10}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                <span>{minQuantity.toLocaleString('ar-SA')}</span>
                <span>{maxQuantity.toLocaleString('ar-SA')}</span>
              </div>
            </div>

            {/* Quick quantity presets with animation */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[100, 500, 1000, 5000, 10000].filter(q => q >= minQuantity && q <= maxQuantity).map((q, i) => (
                <motion.div
                  key={q}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <QuantityChip
                    value={q}
                    active={quantity === q}
                    onClick={() => setQuantity(q)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Live Price Preview */}
          <motion.div
            className="relative overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
            <motion.div 
              className="absolute inset-0 opacity-50"
              animate={{ 
                background: [
                  "radial-gradient(circle at 0% 50%, hsl(var(--accent) / 0.2) 0%, transparent 50%)",
                  "radial-gradient(circle at 100% 50%, hsl(var(--accent) / 0.2) 0%, transparent 50%)",
                  "radial-gradient(circle at 0% 50%, hsl(var(--accent) / 0.2) 0%, transparent 50%)",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            
            <div className="relative p-5 border-2 border-primary/20 rounded-2xl space-y-4">
              {/* Price breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    الكمية المطلوبة
                  </span>
                  <motion.span 
                    className="font-bold text-lg"
                    key={quantity}
                    initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                    animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatedNumber value={quantity} />
                  </motion.span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    السعر الأساسي
                  </span>
                  <span className="font-medium">
                    <AnimatedPrice value={basePrice} /> ر.س
                  </span>
                </div>

                <AnimatePresence>
                  {appliedCoupon && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="flex items-center justify-between text-success bg-success/10 -mx-2 px-3 py-2 rounded-xl"
                    >
                      <span className="text-sm flex items-center gap-2 font-medium">
                        <Gift className="w-4 h-4" />
                        خصم ({appliedCoupon.code})
                        <Badge variant="outline" className="text-[10px] border-success/30 text-success">
                          -{discountPercentage.toFixed(0)}%
                        </Badge>
                      </span>
                      <span className="font-bold">
                        -<AnimatedPrice value={discountAmount} /> ر.س
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Total with enhanced animation */}
              <div className="pt-4 border-t-2 border-dashed border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </motion.div>
                    <span className="font-bold text-lg">الإجمالي</span>
                  </div>
                  <motion.div 
                    className="text-left"
                    key={finalPrice}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    <p className="text-3xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                      <AnimatedPrice value={finalPrice} size="large" /> 
                      <span className="text-base mr-1">ر.س</span>
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Coupon & Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-warning" />
                  </div>
                  خيارات متقدمة
                </span>
                <motion.div
                  animate={{ rotate: showAdvanced ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </motion.button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Coupon Input */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Percent className="w-4 h-4 text-warning" />
                  كود الخصم
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل كود الخصم"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className="flex-1 h-11 rounded-xl"
                  />
                  {appliedCoupon ? (
                    <Button
                      variant="destructive"
                      className="h-11 rounded-xl px-5"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                    >
                      إزالة
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="h-11 rounded-xl px-5"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Notes */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  ملاحظات (اختياري)
                </Label>
                <Textarea
                  placeholder="أي ملاحظات إضافية للطلب..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>

          {/* Enhanced Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              className="w-full h-14 text-lg font-bold gap-3 bg-gradient-to-l from-primary via-primary to-accent hover:opacity-90 shadow-xl shadow-primary/30 rounded-2xl border-t border-white/20 transition-all hover:shadow-primary/50 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isSubmitting || !link.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  جاري إنشاء الطلب...
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </motion.div>
                  تأكيد الطلب
                  <ArrowRight className="w-5 h-5" />
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    <AnimatedPrice value={finalPrice} /> ر.س
                  </span>
                </>
              )}
            </Button>
          </motion.div>

          {/* Info Footer */}
          <motion.div 
            className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-l from-muted/30 to-muted/50 border border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1">معالجة سريعة</p>
              سيتم خصم المبلغ من رصيدك فوراً وستبدأ الخدمة خلال دقائق قليلة.
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
