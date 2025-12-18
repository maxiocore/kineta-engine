import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
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
  AlertCircle,
  X,
  Sparkles
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

// Animated number component
const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString('ar-SA'));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  
  return <motion.span>{display}</motion.span>;
};

// Animated price component
const AnimatedPrice = ({ value }: { value: number }) => {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => v.toFixed(2));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  
  return <motion.span>{display}</motion.span>;
};

export default function EmbeddedOrderForm({ service, onClose, onSuccess }: EmbeddedOrderFormProps) {
  const { user } = useAuth();
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

      toast.success("تم إنشاء الطلب بنجاح!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Order error:", error);
      toast.error("حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!service) return null;

  return (
    <motion.div
      ref={formRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="sticky top-4"
    >
      <Card className="overflow-hidden border-primary/20 shadow-xl shadow-primary/5">
        {/* Header */}
        <div className="relative bg-gradient-to-l from-primary/10 via-accent/5 to-primary/10 p-4 border-b border-border/50">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">نموذج الطلب</h3>
                <p className="text-xs text-muted-foreground">أكمل بيانات طلبك</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-5">
          {/* Selected Service Info */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2">{service.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {service.category}
                  </Badge>
                  {service.external_service_id && (
                    <Badge variant="outline" className="text-[10px]">
                      #{service.external_service_id}
                    </Badge>
                  )}
                  {service.refill_enabled && (
                    <Badge className="text-[10px] bg-success/10 text-success border-success/20">
                      <Shield className="w-3 h-3 ml-1" />
                      ضمان
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">السعر / 1000</p>
                <p className="font-bold text-primary">{service.price.toFixed(2)} ر.س</p>
              </div>
              <div className="text-center border-x border-border/50">
                <p className="text-[10px] text-muted-foreground">الحد الأدنى</p>
                <p className="font-bold">{minQuantity.toLocaleString('ar-SA')}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">الحد الأقصى</p>
                <p className="font-bold">{maxQuantity.toLocaleString('ar-SA')}</p>
              </div>
            </div>
          </div>

          {/* Link Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              الرابط
              <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="h-11"
              dir="ltr"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              الكمية
              <span className="text-destructive">*</span>
            </Label>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(minQuantity, quantity - 100))}
                disabled={quantity <= minQuantity}
                className="shrink-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || minQuantity;
                  setQuantity(Math.min(maxQuantity, Math.max(minQuantity, val)));
                }}
                className="text-center font-bold text-lg h-11"
                min={minQuantity}
                max={maxQuantity}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 100))}
                disabled={quantity >= maxQuantity}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Slider
              value={[quantity]}
              onValueChange={([val]) => setQuantity(val)}
              min={minQuantity}
              max={maxQuantity}
              step={10}
              className="py-2"
            />

            {/* Quick quantity presets */}
            <div className="flex flex-wrap gap-2">
              {[100, 500, 1000, 5000, 10000].filter(q => q >= minQuantity && q <= maxQuantity).map((q) => (
                <Button
                  key={q}
                  variant={quantity === q ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuantity(q)}
                  className="text-xs"
                >
                  {q.toLocaleString('ar-SA')}
                </Button>
              ))}
            </div>
          </div>

          {/* Live Price Preview */}
          <motion.div
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 p-4"
            layout
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الكمية</span>
                <span className="font-bold text-lg">
                  <AnimatedNumber value={quantity} />
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">السعر الأساسي</span>
                <span className="font-medium">
                  <AnimatedPrice value={basePrice} /> ر.س
                </span>
              </div>

              <AnimatePresence>
                {appliedCoupon && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between text-success"
                  >
                    <span className="text-sm flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      خصم ({appliedCoupon.code})
                    </span>
                    <span className="font-medium">
                      -<AnimatedPrice value={discountAmount} /> ر.س
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-3 border-t border-primary/20 flex items-center justify-between">
                <span className="font-bold">الإجمالي</span>
                <div className="text-left">
                  <p className="text-2xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                    <AnimatedPrice value={finalPrice} /> ر.س
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Coupon & Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4" />
                  خيارات متقدمة
                </span>
                <motion.div
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                >
                  <Plus className="w-4 h-4" />
                </motion.div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Coupon */}
              <div className="space-y-2">
                <Label className="text-sm">كود الخصم</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل كود الخصم"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className="flex-1"
                  />
                  {appliedCoupon ? (
                    <Button
                      variant="destructive"
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
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm">ملاحظات (اختياري)</Label>
                <Textarea
                  placeholder="أي ملاحظات إضافية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit Button */}
          <Button
            className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-l from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
            onClick={handleSubmit}
            disabled={isSubmitting || !link.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري إنشاء الطلب...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                تأكيد الطلب - <AnimatedPrice value={finalPrice} /> ر.س
              </>
            )}
          </Button>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              سيتم خصم المبلغ من رصيدك فوراً، وستبدأ الخدمة خلال دقائق.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
