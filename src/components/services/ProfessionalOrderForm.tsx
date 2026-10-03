import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { payServiceOrder, payDesignOrder, payDevInvoice, newIdempotencyKey, walletErrorMessage } from "@/lib/walletPayments";
import { startPayment, paymentErrorText } from "@/lib/payments";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShoppingCart,
  Sparkles,
  Clock,
  Shield,
  CheckCircle2,
  Wallet,
  ArrowLeft,
  Star,
  Zap,
  Info,
  CreditCard,
  Gift,
  ChevronDown,
  Lock,
  
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";



interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  features: any;
  refill_enabled: boolean | null;
}

interface ProfessionalOrderFormProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  onSuccess?: () => void;
  gradientFrom?: string;
  gradientTo?: string;
}

const ProfessionalOrderForm = ({
  service,
  open,
  onOpenChange,
  balance,
  onSuccess,
  gradientFrom = "from-primary",
  gradientTo = "to-accent",
}: ProfessionalOrderFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const payKeyRef = useRef(newIdempotencyKey());
  const [quantity, setQuantity] = useState(1);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  if (!service) return null;

  const totalPrice = service.price * quantity;
  const hasEnoughBalance = balance >= totalPrice;
  const canPay = hasEnoughBalance;
  const features = Array.isArray(service.features) ? service.features : [];
  const requiresLink = service.category?.toLowerCase().includes("social") || 
                       service.name?.toLowerCase().includes("متابع") ||
                       service.name?.toLowerCase().includes("لايك");

  const handleOrder = async () => {
    if (!user || !service) return;
    
    // التحقق من الرصيد حسب طريقة الدفع
    if (requiresLink && !link.trim()) {
      toast.error("يرجى إدخال الرابط");
      return;
    }

    if (!hasEnoughBalance) {
      toast.error("رصيدك غير كافي", {
        description: "يمكنك الدفع إلكترونياً مباشرة أو شحن رصيدك",
        action: {
          label: "الدفع الإلكتروني",
          onClick: async () => {
            try {
              const pid = await startPayment("service_order", { intent: { service_id: service.id, quantity, link: link || undefined, notes: notes || undefined } });
              navigate(`/payment/${pid}`);
            } catch (e: any) { toast.error(paymentErrorText(e?.message)); }
          },
        },
      });
      return;
    }

    if (isOrdering) return;
    setIsOrdering(true);
    try {
      // Server-side payment: trusted price, atomic wallet debit, idempotent
      const result = await payServiceOrder({
        serviceId: service.id,
        quantity,
        link: link || null,
        notes: notes || null,
        idempotencyKey: payKeyRef.current,
      });
      const orderNumber = result.order_number as string;
      payKeyRef.current = newIdempotencyKey();

      // Send email notification
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: user.email,
            type: "order_created",
            data: {
              name: user.user_metadata?.full_name || "عميلنا العزيز",
              orderNumber,
              serviceName: service.name,
              quantity,
              totalPrice: Number(result.total ?? totalPrice),
              link: link || null,
              paymentMethod: "الرصيد النقدي",
            }
          }
        });
      } catch (emailError) {
        console.log("Email notification failed:", emailError);
      }

      toast.success("تم إنشاء الطلب بنجاح! 🎉", {
        description: `رقم الطلب: ${orderNumber}`,
      });
      
      onOpenChange(false);
      setStep(1);
      setQuantity(1);
      setLink("");
      setNotes("");
      
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/dashboard/orders");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-background/95 backdrop-blur-xl rounded-3xl" dir="rtl">
        {/* Header */}
        <div className={cn("relative p-6 pb-4 bg-gradient-to-br text-white", gradientFrom, gradientTo)}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
          </div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-right">
                  إنشاء طلب جديد
                </DialogTitle>
                <p className="text-sm text-white/80">أكمل البيانات لتأكيد طلبك</p>
              </div>
            </div>

            {/* Service Preview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-base line-clamp-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-xs text-white/70 line-clamp-1 mt-1">{service.description}</p>
                  )}
                </div>
                <div className="text-left shrink-0">
                  <span className="text-2xl font-bold">{service.price.toFixed(0)}</span>
                  <span className="text-xs mr-1">ر.س</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {service.refill_enabled && (
                  <Badge className="bg-white/20 text-white border-0 text-[10px]">
                    <Shield className="w-3 h-3 ml-1" />
                    ضمان مدى الحياة
                  </Badge>
                )}
                <Badge className="bg-white/20 text-white border-0 text-[10px]">
                  <Clock className="w-3 h-3 ml-1" />
                  تنفيذ سريع
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  step >= s 
                    ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white shadow-lg` 
                    : "bg-muted text-muted-foreground"
                )}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={cn(
                    "w-16 sm:w-24 h-1 rounded-full transition-all",
                    step > s ? `bg-gradient-to-r ${gradientFrom} ${gradientTo}` : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>البيانات</span>
            <span>المراجعة</span>
            <span>التأكيد</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 pt-4 space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Quantity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الكمية</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center text-lg font-bold rounded-xl flex-1 max-w-24"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Link Input (conditional) */}
                {requiresLink && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">رابط الحساب / المنشور *</Label>
                    <Input
                      placeholder="https://instagram.com/..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="rounded-xl h-11"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      أدخل الرابط الصحيح لضمان تنفيذ الخدمة
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ملاحظات إضافية (اختياري)</Label>
                  <Textarea
                    placeholder="أي متطلبات أو ملاحظات خاصة..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl min-h-[80px] resize-none"
                  />
                </div>

                <Button 
                  className={cn("w-full h-12 rounded-xl text-white bg-gradient-to-r shadow-lg", gradientFrom, gradientTo)}
                  onClick={() => setStep(2)}
                >
                  متابعة
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Order Summary */}
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-4 space-y-3 border border-border/50">
                  <h4 className="font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    ملخص الطلب
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الخدمة:</span>
                      <span className="font-medium text-right max-w-[200px] truncate">{service.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الكمية:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">السعر للوحدة:</span>
                      <span className="font-medium">{service.price.toFixed(2)} ر.س</span>
                    </div>
                    {link && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الرابط:</span>
                        <span className="font-medium text-xs truncate max-w-[180px]" dir="ltr">{link}</span>
                      </div>
                    )}
                    <div className="border-t border-border/50 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">المجموع:</span>
                        <span className={cn("text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent", gradientFrom, gradientTo)}>
                          {totalPrice.toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-xl text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary" />
                      مميزات الخدمة ({features.length})
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showDetails && "rotate-180")} />
                  </button>
                )}
                
                <AnimatePresence>
                  {showDetails && features.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {features.slice(0, 5).map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 bg-success/5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl"
                    onClick={() => setStep(1)}
                  >
                    رجوع
                  </Button>
                  <Button 
                    className={cn("flex-1 h-12 rounded-xl text-white bg-gradient-to-r shadow-lg", gradientFrom, gradientTo)}
                    onClick={() => setStep(3)}
                  >
                    تأكيد
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Balance Summary */}
                <div className={cn(
                  "rounded-2xl p-4 border-2",
                  canPay 
                    ? "bg-success/5 border-success/30" 
                    : "bg-destructive/5 border-destructive/30"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        canPay ? "bg-success/10" : "bg-destructive/10"
                      )}>
                        <Wallet className={cn("w-5 h-5", canPay ? "text-success" : "text-destructive")} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">رصيدك الحالي</p>
                        <p className="font-bold">{balance.toFixed(2)} ر.س</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">المطلوب</p>
                      <p className={cn("font-bold", canPay ? "text-success" : "text-destructive")}>
                        {totalPrice.toFixed(2)} ر.س
                      </p>
                    </div>
                  </div>
                  
                  {!canPay && (
                    <div className="flex items-center justify-between pt-3 border-t border-destructive/20 mt-3">
                      <span className="text-sm text-destructive">رصيد غير كافي!</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => navigate("/dashboard/deposit")}
                      >
                        <CreditCard className="w-3 h-3 ml-1" />
                        شحن الرصيد
                      </Button>
                    </div>
                  )}
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl text-xs">
                  <Lock className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-muted-foreground">
                    طلبك محمي ومشفر. سيتم خصم المبلغ من رصيدك فور تأكيد الطلب.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl"
                    onClick={() => setStep(2)}
                    disabled={isOrdering}
                  >
                    رجوع
                  </Button>
                  <Button 
                    className={cn("flex-1 h-12 rounded-xl text-white bg-gradient-to-r shadow-lg", gradientFrom, gradientTo)}
                    onClick={handleOrder}
                    disabled={!canPay || isOrdering}
                  >
                    {isOrdering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 ml-2" />
                        تأكيد الطلب
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalOrderForm;
