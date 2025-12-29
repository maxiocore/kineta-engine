import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  Clock,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
  BarChart3,
  Megaphone,
  Globe,
  Zap,
  CreditCard,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  features: any;
  refill_enabled: boolean | null;
  external_service_id: string | null;
}

const DigitalServiceOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);

  // Form fields
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchService = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .single();

    if (error) {
      toast.error("خطأ في تحميل الخدمة");
      navigate("/dashboard/digital-services");
      return;
    }

    setService(data);
    setLoading(false);
  };

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (data) setBalance(data.balance);
  };

  const totalPrice = service ? service.price * quantity : 0;
  const hasEnoughBalance = balance >= totalPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !user) return;

    if (!hasEnoughBalance) {
      toast.error("رصيدك غير كافٍ لإتمام الطلب");
      return;
    }

    setSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `DM-${Date.now().toString(36).toUpperCase()}`;

      // Create order
      const { error: orderError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        user_id: user.id,
        service_id: service.id,
        quantity,
        total_price: totalPrice,
        link: link || null,
        notes: notes || null,
        status: "pending",
      });

      if (orderError) throw orderError;

      // Deduct balance
      const { error: balanceError } = await supabase
        .from("user_balances")
        .update({ balance: balance - totalPrice })
        .eq("user_id", user.id);

      if (balanceError) throw balanceError;

      // Log balance change
      await supabase.from("balance_logs").insert({
        user_id: user.id,
        action_type: "order",
        amount: -totalPrice,
        balance_before: balance,
        balance_after: balance - totalPrice,
        notes: `طلب خدمة تسويق رقمي: ${service.name}`,
      });

      toast.success("تم إرسال الطلب بنجاح!");
      navigate("/dashboard/digital-orders");
    } catch (error) {
      console.error("Order error:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-4xl mx-auto p-4 space-y-6" dir="rtl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!service) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4" dir="rtl">
          <AlertCircle className="w-16 h-16 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">الخدمة غير موجودة</p>
          <Button onClick={() => navigate("/dashboard/digital-services")}>
            العودة للخدمات
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  const features = Array.isArray(service.features) ? service.features : [];

  return (
    <ClientDashboardLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link
            to="/dashboard/digital-services"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>العودة للخدمات</span>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Service Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="overflow-hidden border-0 shadow-xl">
              {/* Gradient Header */}
              <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6">
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
                
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-white mb-2">{service.name}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-white/20 text-white border-0">
                        <Megaphone className="w-3 h-3 ml-1" />
                        تسويق رقمي
                      </Badge>
                      {service.refill_enabled && (
                        <Badge className="bg-emerald-500/30 text-white border-0">
                          <Shield className="w-3 h-3 ml-1" />
                          ضمان
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-white">{service.price.toFixed(0)}</p>
                    <p className="text-white/70 text-sm">ر.س</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Description */}
                {service.description && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      وصف الخدمة
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                )}

                {/* Features */}
                {features.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      مميزات الخدمة
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {features.map((feature: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50"
                        >
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Zap, label: "بدء فوري", color: "text-amber-500" },
                    { icon: BarChart3, label: "نتائج مضمونة", color: "text-blue-500" },
                    { icon: Globe, label: "دعم 24/7", color: "text-green-500" },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-muted/30">
                      <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-1`} />
                      <p className="text-xs font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="sticky top-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  تفاصيل الطلب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Link */}
                  <div className="space-y-2">
                    <Label htmlFor="link">رابط الحساب / الموقع (اختياري)</Label>
                    <Input
                      id="link"
                      placeholder="https://example.com"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      dir="ltr"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات إضافية</Label>
                    <Textarea
                      id="notes"
                      placeholder="أي تفاصيل إضافية تود إضافتها..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/20 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">سعر الخدمة:</span>
                      <span>{service.price.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الكمية:</span>
                      <span>×{quantity}</span>
                    </div>
                    <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                      <span>الإجمالي:</span>
                      <span className="text-blue-500">{totalPrice.toFixed(2)} ر.س</span>
                    </div>
                  </div>

                  {/* Balance Warning */}
                  {!hasEnoughBalance && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>رصيدك الحالي ({balance.toFixed(2)} ر.س) غير كافٍ</span>
                    </div>
                  )}

                  {/* Balance Info */}
                  <div className="flex justify-between text-sm p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">رصيدك الحالي:</span>
                    <span className="font-semibold">{balance.toFixed(2)} ر.س</span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 hover:opacity-90"
                    disabled={submitting || !hasEnoughBalance}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 ml-2" />
                        تأكيد الطلب
                      </>
                    )}
                  </Button>

                  {!hasEnoughBalance && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/dashboard/deposit")}
                    >
                      شحن الرصيد
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default DigitalServiceOrder;
