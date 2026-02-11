import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Banknote, Calculator, Clock, Shield, ChevronLeft, 
  CheckCircle2, Sparkles, ArrowLeft, Loader2, 
  CreditCard, FileText, Package, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice, formatNumber } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";

interface FinancingPlan {
  id: string;
  name_ar: string;
  description_ar: string | null;
  installments_count: number;
  duration_months: number;
  min_amount: number;
  max_amount: number | null;
  display_order: number | null;
}

interface DevService {
  id: string;
  title_ar: string;
  base_price: number;
  category: string;
  icon: string | null;
}

type Step = "intro" | "type" | "service" | "plan" | "details" | "review";

const ClientFinancing = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [plans, setPlans] = useState<FinancingPlan[]>([]);
  const [services, setServices] = useState<DevService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [financingType, setFinancingType] = useState<"service" | "custom" | null>(null);
  const [selectedService, setSelectedService] = useState<DevService | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<FinancingPlan | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [serviceDescription, setServiceDescription] = useState("");
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    const [plansRes, servicesRes] = await Promise.all([
      supabase.from("financing_plans").select("*").eq("is_active", true).order("display_order"),
      supabase.from("dev_services").select("id, title_ar, base_price, category, icon").eq("is_active", true).order("display_order"),
    ]);
    if (plansRes.data) setPlans(plansRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    setLoading(false);
  };

  const eligiblePlans = plans.filter(p => {
    const amt = amount || 0;
    return amt >= p.min_amount && (!p.max_amount || amt <= p.max_amount);
  });

  const monthlyPayment = selectedPlan && amount > 0
    ? amount / selectedPlan.installments_count
    : 0;

  const handleSubmit = async () => {
    if (!user || !selectedPlan) return;
    if (!fullName || !nationalId || !phone || !email) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    if (amount < selectedPlan.min_amount) {
      toast.error(`الحد الأدنى للمبلغ ${formatPrice(selectedPlan.min_amount)}`);
      return;
    }

    setSubmitting(true);
    try {
      const appNumber = `FIN-${Date.now().toString(36).toUpperCase()}`;
      const { data: insertedApp, error: insertError } = await supabase.from("financing_applications").insert({
        application_number: appNumber,
        user_id: user.id,
        plan_id: selectedPlan.id,
        full_name: fullName,
        national_id: nationalId,
        phone,
        email,
        company_name: companyName || null,
        requested_amount: amount,
        service_id: selectedService?.id || null,
        service_description: serviceDescription || selectedService?.title_ar || null,
        status: "pending",
      }).select("id").single();

      if (insertError) throw insertError;

      // Submit to external financing provider via BFF Gateway
      try {
        const { data: bffResponse, error: bffError } = await supabase.functions.invoke("bff-gateway", {
          body: { path: "finance/submit", body: { application_id: insertedApp.id } },
        });

        if (bffError) {
          console.warn("BFF submission warning:", bffError);
          // Still show success - application saved locally, provider sync will retry
        } else {
          console.log("BFF submission success:", bffResponse);
        }
      } catch (bffErr) {
        console.warn("Failed to sync with financing provider:", bffErr);
      }

      toast.success("تم تقديم طلب التمويل بنجاح! سيتم مراجعته من جهة التمويل");
      navigate("/dashboard/financing/applications");
    } catch (err: any) {
      console.error("Financing submit error:", err);
      toast.error("حدث خطأ أثناء تقديم الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    const stepOrder: Step[] = ["intro", "type", "service", "plan", "details", "review"];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      // Skip "service" step if type is "custom"
      let prevIndex = currentIndex - 1;
      if (stepOrder[prevIndex] === "service" && financingType === "custom") {
        prevIndex--;
      }
      setStep(stepOrder[prevIndex]);
    }
  };

  const goNext = (nextStep: Step) => {
    setStep(nextStep);
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground mb-4">
            <Banknote className="h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">مركز التمويل</h1>
          <p className="text-muted-foreground">موّل خدماتك بأقساط مريحة وبدون فوائد</p>
        </motion.div>

        {/* Progress */}
        {step !== "intro" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2"
          >
            {(["type", "service", "plan", "details", "review"] as Step[])
              .filter(s => !(s === "service" && financingType === "custom"))
              .map((s, i, arr) => {
                const currentArr = arr;
                const currentIdx = currentArr.indexOf(step);
                const thisIdx = i;
                const isActive = step === s;
                const isDone = thisIdx < currentIdx;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      isActive ? "bg-primary text-primary-foreground scale-110" :
                      isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    {i < arr.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5 transition-all",
                        thisIdx < currentIdx ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
          </motion.div>
        )}

        {/* Back button */}
        {step !== "intro" && (
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </Button>
        )}

        <AnimatePresence mode="wait">
          {/* INTRO */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Shield, title: "بدون فوائد", desc: "تمويل إسلامي بدون أي فوائد أو رسوم مخفية" },
                  { icon: Clock, title: "موافقة سريعة", desc: "مراجعة وموافقة على طلبك خلال 24 ساعة" },
                  { icon: Calculator, title: "أقساط مرنة", desc: "اختر خطة تقسيط من 1 إلى 24 شهر" },
                ].map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all h-full">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                          <f.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold">{f.title}</h3>
                        <p className="text-sm text-muted-foreground">{f.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => goNext("type")}
                  className="gap-2 bg-gradient-to-l from-primary to-primary/80 font-bold text-lg px-8"
                >
                  <Sparkles className="h-5 w-5" />
                  ابدأ طلب التمويل
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/dashboard/financing/applications")}
                  className="gap-2"
                >
                  <FileText className="h-5 w-5" />
                  طلباتي السابقة
                </Button>
              </div>
            </motion.div>
          )}

          {/* TYPE SELECTION */}
          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-center">اختر نوع التمويل</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={cn(
                      "cursor-pointer border-2 transition-all h-full",
                      financingType === "service" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                    onClick={() => { setFinancingType("service"); goNext("service"); }}
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      <Package className="h-10 w-10 mx-auto text-primary" />
                      <h3 className="text-lg font-bold">تمويل خدمة</h3>
                      <p className="text-sm text-muted-foreground">اختر خدمة من خدماتنا وموّلها بأقساط مريحة</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={cn(
                      "cursor-pointer border-2 transition-all h-full",
                      financingType === "custom" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                    onClick={() => { setFinancingType("custom"); setSelectedService(null); goNext("plan"); }}
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      <CreditCard className="h-10 w-10 mx-auto text-primary" />
                      <h3 className="text-lg font-bold">تمويل حر</h3>
                      <p className="text-sm text-muted-foreground">حدد المبلغ المطلوب واختر خطة التقسيط المناسبة</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* SERVICE SELECTION */}
          {step === "service" && (
            <motion.div
              key="service"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-center">اختر الخدمة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map((svc) => (
                  <motion.div key={svc.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card
                      className={cn(
                        "cursor-pointer border-2 transition-all",
                        selectedService?.id === svc.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                      onClick={() => {
                        setSelectedService(svc);
                        setAmount(svc.base_price);
                        goNext("plan");
                      }}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">{svc.category}</Badge>
                          {selectedService?.id === svc.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </div>
                        <h3 className="font-bold text-sm">{svc.title_ar}</h3>
                        <p className="text-primary font-bold">{formatPrice(svc.base_price)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PLAN SELECTION */}
          {step === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-center">اختر خطة التقسيط</h2>

              {/* Amount input for custom type */}
              {financingType === "custom" && (
                <div className="max-w-md mx-auto space-y-2">
                  <Label>المبلغ المطلوب (ر.س)</Label>
                  <Input
                    type="number"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="أدخل المبلغ"
                    min={100}
                    className="text-center text-lg font-bold"
                  />
                </div>
              )}

              {selectedService && (
                <div className="max-w-md mx-auto p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-sm text-muted-foreground">المبلغ المطلوب</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(amount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedService.title_ar}</p>
                </div>
              )}

              {amount > 0 && eligiblePlans.length === 0 && (
                <div className="text-center p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-6 w-6 mx-auto text-destructive mb-2" />
                  <p className="text-sm text-destructive">لا توجد خطط متاحة لهذا المبلغ</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(amount > 0 ? eligiblePlans : plans).map((plan, i) => {
                  const monthly = amount > 0 ? amount / plan.installments_count : 0;
                  const isSelected = selectedPlan?.id === plan.id;
                  const isDisabled = amount > 0 && !eligiblePlans.find(p => p.id === plan.id);

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={!isDisabled ? { scale: 1.03 } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer border-2 transition-all relative overflow-hidden",
                          isSelected ? "border-primary bg-primary/5 shadow-lg" :
                          isDisabled ? "border-border/50 opacity-50 cursor-not-allowed" :
                          "border-border hover:border-primary/40"
                        )}
                        onClick={() => {
                          if (!isDisabled && amount > 0) {
                            setSelectedPlan(plan);
                            goNext("details");
                          }
                        }}
                      >
                        {plan.installments_count === 3 && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-green-500 to-emerald-500" />
                        )}
                        {plan.installments_count === 6 && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-blue-500 to-cyan-500" />
                        )}
                        {plan.installments_count === 12 && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-purple-500 to-pink-500" />
                        )}
                        {plan.installments_count === 24 && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-amber-500 to-orange-500" />
                        )}
                        <CardContent className="p-5 text-center space-y-3">
                          <div className="text-3xl font-black text-primary">{plan.installments_count}</div>
                          <h3 className="font-bold">{plan.name_ar}</h3>
                          <p className="text-xs text-muted-foreground">{plan.description_ar}</p>
                          {amount > 0 && !isDisabled && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs text-muted-foreground">القسط الشهري</p>
                              <p className="text-lg font-bold text-primary">{formatPrice(monthly)}</p>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            الحد: {formatNumber(plan.min_amount, 0)} - {plan.max_amount ? formatNumber(plan.max_amount, 0) : "∞"} ر.س
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* DETAILS */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              <h2 className="text-xl font-bold text-center">بياناتك الشخصية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="الاسم رباعي" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهوية / الإقامة *</Label>
                  <Input value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="10 أرقام" maxLength={10} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال *</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني *</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" dir="ltr" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>اسم الشركة (اختياري)</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="اسم الشركة أو المؤسسة" />
                </div>
                {financingType === "custom" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>وصف الخدمة المطلوبة</Label>
                    <Textarea
                      value={serviceDescription}
                      onChange={e => setServiceDescription(e.target.value)}
                      placeholder="اشرح الخدمة أو المشروع المطلوب تمويله..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={() => goNext("review")}
                  disabled={!fullName || !nationalId || !phone || !email}
                  className="gap-2 font-bold px-8"
                >
                  مراجعة الطلب
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* REVIEW */}
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              <h2 className="text-xl font-bold text-center">مراجعة طلب التمويل</h2>

              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">نوع التمويل</p>
                      <p className="font-bold">{financingType === "service" ? "تمويل خدمة" : "تمويل حر"}</p>
                    </div>
                    {selectedService && (
                      <div>
                        <p className="text-muted-foreground">الخدمة</p>
                        <p className="font-bold">{selectedService.title_ar}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">المبلغ المطلوب</p>
                      <p className="font-bold text-primary text-lg">{formatPrice(amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">خطة التقسيط</p>
                      <p className="font-bold">{selectedPlan?.name_ar}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">القسط الشهري</p>
                      <p className="font-bold text-primary text-lg">{formatPrice(monthlyPayment)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">عدد الأقساط</p>
                      <p className="font-bold">{selectedPlan?.installments_count} قسط</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الاسم</span>
                      <span className="font-medium">{fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الهوية</span>
                      <span className="font-medium" dir="ltr">{nationalId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الجوال</span>
                      <span className="font-medium" dir="ltr">{phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">البريد</span>
                      <span className="font-medium" dir="ltr">{email}</span>
                    </div>
                    {companyName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الشركة</span>
                        <span className="font-medium">{companyName}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-300 flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>بتقديم هذا الطلب، أنت توافق على مراجعة بياناتك والتواصل معك لإتمام إجراءات التمويل. سيتم التحقق من هويتك وأهليتك للتمويل.</p>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 bg-gradient-to-l from-primary to-primary/80 font-bold px-10 text-lg"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  تقديم الطلب
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientFinancing;
