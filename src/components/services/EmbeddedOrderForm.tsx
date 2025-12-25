import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
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
  Clock,
  Shield,
  Zap,
  X,
  Sparkles,
  Gift,
  Percent,
  CreditCard,
  Target,
  TrendingUp,
  Star,
  Coins,
  ChevronDown,
  Send,
  FileText,
  BadgeCheck,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notifyNewOrder } from "@/lib/adminNotifyService";
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
        "tabular-nums font-bold",
        size === "large" && "text-4xl"
      )}
      key={value}
    >
      {display}
    </motion.span>
  );
};

// Modern Quantity button component
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
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
      "disabled:opacity-30 disabled:cursor-not-allowed",
      variant === "add" 
        ? "bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground shadow-xl shadow-primary/40" 
        : "bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-border/50"
    )}
  >
    <Icon className="w-6 h-6" />
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
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300",
      active 
        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/40" 
        : "bg-secondary/60 hover:bg-secondary text-secondary-foreground border border-border/40"
    )}
  >
    {value.toLocaleString('ar-SA')}
  </motion.button>
);

// Step indicator component
const StepIndicator = ({ number, title, active, completed }: { number: number; title: string; active: boolean; completed: boolean }) => (
  <motion.div 
    className={cn(
      "flex items-center gap-3 transition-all duration-300",
      active ? "opacity-100" : "opacity-50"
    )}
    animate={{ scale: active ? 1.02 : 1 }}
  >
    <motion.div 
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300",
        completed 
          ? "bg-success text-success-foreground shadow-lg shadow-success/30" 
          : active 
            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/40" 
            : "bg-muted text-muted-foreground"
      )}
      whileHover={{ scale: 1.1 }}
    >
      {completed ? <CheckCircle2 className="w-5 h-5" /> : number}
    </motion.div>
    <span className={cn(
      "text-sm font-medium transition-colors",
      active ? "text-foreground" : "text-muted-foreground"
    )}>
      {title}
    </span>
  </motion.div>
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

  // Points redemption state
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [userPoints, setUserPoints] = useState<{ available_points: number } | null>(null);
  const [userTier, setUserTier] = useState<{ 
    benefits: { discount_percentage?: number; priority_support?: boolean; free_refills?: boolean } | null;
    name_ar: string;
  } | null>(null);

  // Fetch user points and tier benefits
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const { data: pointsData } = await supabase
        .from("user_points")
        .select(`
          available_points,
          tier:reward_tiers(name_ar, benefits)
        `)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (pointsData) {
        setUserPoints({ available_points: pointsData.available_points });
        if (pointsData.tier) {
          const tierData = pointsData.tier as unknown as { name_ar: string; benefits: any };
          setUserTier({
            name_ar: tierData.name_ar,
            benefits: tierData.benefits || null
          });
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Get min/max from features
  const minQuantity = service?.features?.min || 10;
  const maxQuantity = service?.features?.max || 100000;

  // Points conversion rate: 100 points = 1 SAR
  const POINTS_TO_SAR_RATE = 100;

  // Tier discount
  const tierDiscountPercent = userTier?.benefits?.discount_percentage || 0;
  
  // Calculate price
  const basePrice = service ? (service.price / 1000) * quantity : 0;
  const tierDiscount = basePrice * (tierDiscountPercent / 100);
  const priceAfterTier = basePrice - tierDiscount;
  
  const couponDiscount = appliedCoupon 
    ? appliedCoupon.discount_type === 'percentage' 
      ? priceAfterTier * (appliedCoupon.discount_value / 100)
      : appliedCoupon.discount_value
    : 0;
  const priceAfterCoupon = Math.max(0, priceAfterTier - couponDiscount);
  
  // Points discount
  const maxPointsDiscount = userPoints ? userPoints.available_points / POINTS_TO_SAR_RATE : 0;
  const actualPointsToUse = usePoints ? Math.min(pointsToUse, (userPoints?.available_points || 0)) : 0;
  const pointsDiscount = actualPointsToUse / POINTS_TO_SAR_RATE;
  
  const discountAmount = tierDiscount + couponDiscount + pointsDiscount;
  const finalPrice = Math.max(0, basePrice - discountAmount);
  const discountPercentage = basePrice > 0 ? (discountAmount / basePrice) * 100 : 0;

  // Determine current step
  const currentStep = link.trim() ? (quantity > 0 ? 3 : 2) : 1;

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
      setUsePoints(false);
      setPointsToUse(0);
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

      // Insert order and get the created order
      const { data: createdOrder, error } = await supabase.from("orders").insert({
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
      }).select('id').single();

      if (error) throw error;

      const orderId = createdOrder.id;

      // Deduct balance
      await supabase.from("user_balances")
        .update({ 
          balance: balanceData.balance - finalPrice,
          total_spent: (balanceData as any).total_spent + finalPrice,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      // Create balance log with order reference for proper tracking
      await supabase.from("balance_logs").insert({
        user_id: user.id,
        action_type: 'order',
        amount: -finalPrice,
        balance_before: balanceData.balance,
        balance_after: balanceData.balance - finalPrice,
        reference_type: 'order',
        reference_id: orderId,
        notes: `خصم للطلب رقم ${orderNumber}`
      });

      // Deduct points if used
      if (usePoints && actualPointsToUse > 0) {
        // Insert points transaction
        await supabase.from("points_transactions").insert({
          user_id: user.id,
          points: -actualPointsToUse,
          type: "redeemed",
          description: `Points redeemed for order ${orderNumber}`,
          description_ar: `استبدال نقاط للطلب ${orderNumber}`
        });

        // Update user points
        const { data: currentPoints } = await supabase
          .from("user_points")
          .select("available_points, redeemed_points")
          .eq("user_id", user.id)
          .single();

        if (currentPoints) {
          await supabase.from("user_points")
            .update({
              available_points: currentPoints.available_points - actualPointsToUse,
              redeemed_points: currentPoints.redeemed_points + actualPointsToUse,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);
        }
      }

      // Send order to provider IMMEDIATELY after order creation
      console.log('=== SENDING ORDER TO PROVIDER IMMEDIATELY ===');
      console.log('Order details:', {
        orderId: createdOrder.id,
        serviceId: service.id,
        link,
        quantity,
        hasExternalServiceId: !!service.external_service_id
      });

      // Show immediate feedback
      toast.loading("جاري إرسال الطلب للمزود...", { id: 'provider-order' });

      try {
        const { data: providerData, error: providerError } = await supabase.functions.invoke('provider-order', {
          body: {
            orderId: createdOrder.id,
            serviceId: service.id,
            link,
            quantity
          }
        });

        console.log('Provider response:', providerData, 'Error:', providerError);

        if (providerError) {
          console.error('Provider error:', providerError);
          toast.error("فشل إرسال الطلب للمزود - سيتم إعادة المحاولة", { id: 'provider-order' });
          
          // Retry once after 2 seconds
          setTimeout(async () => {
            try {
              const { data: retryData, error: retryError } = await supabase.functions.invoke('provider-order', {
                body: {
                  orderId: createdOrder.id,
                  serviceId: service.id,
                  link,
                  quantity
                }
              });
              
              if (!retryError && retryData?.success) {
                toast.success("تم إرسال الطلب للمزود بنجاح!", { id: 'provider-retry' });
              }
            } catch (e) {
              console.error('Retry failed:', e);
            }
          }, 2000);
        } else if (providerData?.success) {
          toast.success(`تم إرسال الطلب للمزود بنجاح! رقم الطلب الخارجي: ${providerData.external_order_id || '---'}`, { id: 'provider-order' });
        } else if (providerData?.error) {
          toast.error(`خطأ من المزود: ${providerData.error}`, { id: 'provider-order' });
        } else if (providerData?.message?.includes('Local order')) {
          toast.info("تم إنشاء الطلب - خدمة محلية", { id: 'provider-order' });
        }
      } catch (providerErr) {
        console.error('Error calling provider-order:', providerErr);
        toast.error("حدث خطأ في الاتصال بالمزود", { id: 'provider-order' });
      }

      // Notify admins about new order
      notifyNewOrder({
        orderNumber,
        userName: user.user_metadata?.full_name,
        userEmail: user.email || '',
        serviceName: service.name,
        quantity,
        totalPrice: finalPrice,
      });

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
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-4"
      dir="rtl"
    >
      {/* Main Card Container */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card via-card to-background shadow-2xl">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>

        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="relative p-6 pb-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-4 flex-row-reverse">
                <motion.div 
                  className="relative"
                  whileHover={{ rotate: -5, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-[2px] shadow-xl shadow-primary/40">
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <motion.div 
                    className="absolute -top-1 -left-1 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Rocket className="w-3.5 h-3.5 text-success-foreground" />
                  </motion.div>
                </motion.div>
                <div className="text-right">
                  <h3 className="font-bold text-2xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">إتمام الطلب</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">أكمل بيانات طلبك بسهولة</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: -90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-11 h-11 rounded-2xl bg-secondary/60 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Progress Steps - RTL */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30 flex-row-reverse">
              <StepIndicator number={1} title="الرابط" active={currentStep >= 1} completed={currentStep > 1} />
              <div className="flex-1 h-px bg-gradient-to-l from-border to-border/30 mx-3" />
              <StepIndicator number={2} title="الكمية" active={currentStep >= 2} completed={currentStep > 2} />
              <div className="flex-1 h-px bg-gradient-to-l from-border/30 to-border mx-3" />
              <StepIndicator number={3} title="التأكيد" active={currentStep >= 3} completed={false} />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative p-6 pt-4 space-y-6">
          {/* Selected Service Card */}
          <motion.div 
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-bl from-secondary/40 via-secondary/30 to-muted/20 border border-border/40"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-br-full" />
            
            <div className="relative flex items-start gap-4 flex-row-reverse">
              <motion.div 
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shrink-0 border border-primary/20"
                whileHover={{ rotate: -5, scale: 1.05 }}
              >
                <Sparkles className="w-7 h-7 text-primary" />
              </motion.div>
              <div className="flex-1 min-w-0 text-right">
                <p className="font-bold text-base leading-relaxed line-clamp-2">{service.name}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-end">
                  <Badge className="text-[11px] bg-primary/10 text-primary border-primary/20 gap-1.5 flex-row-reverse">
                    <Target className="w-3 h-3" />
                    {service.category}
                  </Badge>
                  {service.external_service_id && (
                    <Badge variant="outline" className="text-[11px] font-mono">
                      #{service.external_service_id}
                    </Badge>
                  )}
                  {service.refill_enabled && (
                    <Badge className="text-[11px] bg-success/10 text-success border-success/20 gap-1.5 flex-row-reverse">
                      <Shield className="w-3 h-3" />
                      مع ضمان
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Service Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border/40">
              <motion.div 
                className="text-center p-3 rounded-xl bg-background/60 border border-border/30"
                whileHover={{ scale: 1.03, y: -2 }}
              >
                <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                  <CreditCard className="w-4 h-4" />
                </div>
                <p className="font-bold text-lg text-primary">{service.price.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ر.س / 1000</p>
              </motion.div>
              <motion.div 
                className="text-center p-3 rounded-xl bg-background/60 border border-border/30"
                whileHover={{ scale: 1.03, y: -2 }}
              >
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="font-bold text-lg">{minQuantity.toLocaleString('ar-SA')}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">الحد الأدنى</p>
              </motion.div>
              <motion.div 
                className="text-center p-3 rounded-xl bg-background/60 border border-border/30"
                whileHover={{ scale: 1.03, y: -2 }}
              >
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Zap className="w-4 h-4" />
                </div>
                <p className="font-bold text-lg">{maxQuantity.toLocaleString('ar-SA')}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">الحد الأقصى</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Link Input Section - RTL */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label className="text-sm font-semibold flex items-center gap-2.5 justify-end flex-row-reverse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/10 flex items-center justify-center border border-primary/20">
                <LinkIcon className="w-4 h-4 text-primary" />
              </div>
              <span>رابط الحساب أو المنشور</span>
              <span className="text-destructive text-lg">*</span>
            </Label>
            <div className="relative group">
              <Input
                placeholder="https://instagram.com/username أو رابط المنشور..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className={cn(
                  "h-14 pl-12 pr-5 text-base bg-secondary/40 border-2 rounded-2xl transition-all duration-300 placeholder:text-muted-foreground/60 text-left",
                  link.trim() 
                    ? "border-success/50 bg-success/5 focus:border-success" 
                    : "border-border/50 focus:border-primary/50 focus:bg-background"
                )}
                dir="ltr"
              />
              <AnimatePresence>
                {link.trim() && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                  >
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-success-foreground" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Quantity Section - RTL */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Label className="text-sm font-semibold flex items-center gap-2.5 justify-end flex-row-reverse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/15 to-accent/10 flex items-center justify-center border border-accent/20">
                <Hash className="w-4 h-4 text-accent" />
              </div>
              <span>الكمية المطلوبة</span>
              <span className="text-destructive text-lg">*</span>
            </Label>
            
            {/* Quantity Controls - RTL */}
            <div className="flex items-center gap-4 flex-row-reverse">
              <QuantityButton
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 100))}
                disabled={quantity >= maxQuantity}
                icon={Plus}
                variant="add"
              />
              
              <div className="flex-1 relative">
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || minQuantity;
                    setQuantity(Math.min(maxQuantity, Math.max(minQuantity, val)));
                  }}
                  className="text-center font-bold text-3xl h-16 bg-secondary/40 border-2 border-border/50 focus:border-primary/50 rounded-2xl"
                  min={minQuantity}
                  max={maxQuantity}
                />
              </div>
              
              <QuantityButton
                onClick={() => setQuantity(Math.max(minQuantity, quantity - 100))}
                disabled={quantity <= minQuantity}
                icon={Minus}
              />
            </div>

            {/* Enhanced Slider */}
            <div className="pt-2 pb-3 px-1">
              <Slider
                value={[quantity]}
                onValueChange={([val]) => setQuantity(val)}
                min={minQuantity}
                max={maxQuantity}
                step={10}
                className="py-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{minQuantity.toLocaleString('ar-SA')}</span>
                <motion.span 
                  className="font-bold text-foreground bg-secondary/80 px-3 py-1 rounded-full text-sm"
                  key={quantity}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                >
                  {quantity.toLocaleString('ar-SA')}
                </motion.span>
                <span>{maxQuantity.toLocaleString('ar-SA')}</span>
              </div>
            </div>

            {/* Quick quantity presets */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
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

          {/* Live Price Preview Card */}
          <motion.div
            className="relative overflow-hidden rounded-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/5 to-primary/8" />
            <motion.div 
              className="absolute inset-0 opacity-40"
              animate={{ 
                background: [
                  "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 40%)",
                  "radial-gradient(circle at 80% 50%, hsl(var(--accent) / 0.15) 0%, transparent 40%)",
                  "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 40%)",
                ]
              }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            
            <div className="relative p-6 border-2 border-primary/20 rounded-3xl space-y-4">
              {/* Header - RTL */}
              <div className="flex items-center gap-3 pb-3 border-b border-border/40 flex-row-reverse">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                  <CreditCard className="w-5 h-5 text-primary-foreground" />
                </div>
                <h4 className="font-bold text-lg">ملخص الطلب</h4>
              </div>

              {/* Price breakdown - RTL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 flex-row-reverse">
                  <span className="text-sm text-muted-foreground flex items-center gap-2 flex-row-reverse">
                    <Hash className="w-4 h-4" />
                    الكمية المطلوبة
                  </span>
                  <motion.span 
                    className="font-bold text-lg"
                    key={quantity}
                    initial={{ scale: 1.15, color: "hsl(var(--primary))" }}
                    animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatedNumber value={quantity} />
                  </motion.span>
                </div>
                
                <div className="flex items-center justify-between py-2 flex-row-reverse">
                  <span className="text-sm text-muted-foreground flex items-center gap-2 flex-row-reverse">
                    <CreditCard className="w-4 h-4" />
                    السعر الأساسي
                  </span>
                  <span className="font-semibold">
                    <AnimatedPrice value={basePrice} /> ر.س
                  </span>
                </div>

                {/* Tier Discount - RTL */}
                <AnimatePresence>
                  {tierDiscountPercent > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="flex items-center justify-between py-3 px-4 -mx-2 rounded-2xl bg-gradient-to-l from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex-row-reverse"
                    >
                      <span className="text-sm flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400 flex-row-reverse">
                        <Star className="w-4 h-4" />
                        خصم {userTier?.name_ar} ({tierDiscountPercent}%)
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        -<AnimatedPrice value={tierDiscount} /> ر.س
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Coupon Discount - RTL */}
                <AnimatePresence>
                  {appliedCoupon && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="flex items-center justify-between py-3 px-4 -mx-2 rounded-2xl bg-gradient-to-l from-success/10 to-emerald-500/10 border border-success/20 flex-row-reverse"
                    >
                      <span className="text-sm flex items-center gap-2 font-semibold text-success flex-row-reverse">
                        <Gift className="w-4 h-4" />
                        كود الخصم ({appliedCoupon.code})
                      </span>
                      <span className="font-bold text-success">
                        -<AnimatedPrice value={couponDiscount} /> ر.س
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Points Discount - RTL */}
                <AnimatePresence>
                  {usePoints && pointsDiscount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="flex items-center justify-between py-3 px-4 -mx-2 rounded-2xl bg-gradient-to-l from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex-row-reverse"
                    >
                      <span className="text-sm flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400 flex-row-reverse">
                        <Coins className="w-4 h-4" />
                        خصم النقاط ({actualPointsToUse.toLocaleString('ar-SA')} نقطة)
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        -<AnimatedPrice value={pointsDiscount} /> ر.س
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Total - RTL */}
              <div className="pt-5 border-t-2 border-dashed border-primary/30">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <motion.div 
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-xl shadow-primary/40"
                      animate={{ rotate: [0, -3, 3, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </motion.div>
                    <div className="text-right">
                      <span className="font-bold text-xl">الإجمالي</span>
                      {discountAmount > 0 && (
                        <p className="text-xs text-success font-medium">وفرت {discountPercentage.toFixed(0)}%</p>
                      )}
                    </div>
                  </div>
                  <motion.div 
                    className="text-left"
                    key={finalPrice}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        <AnimatedPrice value={finalPrice} size="large" />
                      </span>
                      <span className="text-lg font-bold text-muted-foreground">ر.س</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Coupon & Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-secondary/40 hover:bg-secondary/60 transition-all duration-300 border border-border/40"
              >
                <span className="flex items-center gap-3 font-semibold">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                    <Tag className="w-5 h-5 text-warning" />
                  </div>
                  خيارات إضافية
                  <Badge variant="outline" className="text-[10px]">كوبونات، نقاط، ملاحظات</Badge>
                </span>
                <motion.div
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </motion.button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 pt-5">
              {/* Coupon Input */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Percent className="w-4 h-4 text-warning" />
                  كود الخصم
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="أدخل كود الخصم"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className="flex-1 h-12 rounded-xl bg-secondary/40"
                  />
                  {appliedCoupon ? (
                    <Button
                      variant="destructive"
                      className="h-12 rounded-xl px-6"
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
                      className="h-12 rounded-xl px-6"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Points Redemption */}
              {userPoints && userPoints.available_points > 0 && (
                <motion.div 
                  className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-amber-500" />
                      </div>
                      استبدال النقاط
                      <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                        {userPoints.available_points.toLocaleString()} نقطة
                      </Badge>
                    </Label>
                    <Switch
                      checked={usePoints}
                      onCheckedChange={(checked) => {
                        setUsePoints(checked);
                        if (!checked) setPointsToUse(0);
                      }}
                    />
                  </div>

                  <AnimatePresence>
                    {usePoints && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            value={pointsToUse}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setPointsToUse(Math.min(val, userPoints.available_points));
                            }}
                            className="flex-1 h-12 rounded-xl text-center font-bold"
                            placeholder="عدد النقاط"
                          />
                          <Button
                            variant="outline"
                            className="h-12 rounded-xl"
                            onClick={() => setPointsToUse(userPoints.available_points)}
                          >
                            الكل
                          </Button>
                        </div>
                        <Slider
                          value={[pointsToUse]}
                          onValueChange={([val]) => setPointsToUse(val)}
                          min={0}
                          max={userPoints.available_points}
                          step={10}
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            الخصم المكتسب
                          </span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {(pointsToUse / POINTS_TO_SAR_RATE).toFixed(2)} ر.س
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Notes */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  ملاحظات إضافية (اختياري)
                </Label>
                <Textarea
                  placeholder="أضف أي ملاحظات أو متطلبات خاصة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] rounded-xl bg-secondary/40 resize-none"
                />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !link.trim() || quantity < minQuantity}
              className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-l from-primary via-primary to-accent hover:opacity-90 shadow-xl shadow-primary/40 transition-all duration-300 group"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3 flex-row-reverse">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>جاري إرسال الطلب...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-row-reverse">
                  <Send className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                  <span>إرسال الطلب</span>
                  <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm">
                    {finalPrice.toFixed(2)} ر.س
                  </Badge>
                </div>
              )}
            </Button>

            {/* Trust badges - RTL */}
            <div className="flex items-center justify-center gap-4 mt-5 flex-row-reverse">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-row-reverse">
                <BadgeCheck className="w-4 h-4 text-success" />
                <span>دفع آمن</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-row-reverse">
                <Clock className="w-4 h-4 text-primary" />
                <span>تنفيذ سريع</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-row-reverse">
                <Shield className="w-4 h-4 text-warning" />
                <span>ضمان الجودة</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
