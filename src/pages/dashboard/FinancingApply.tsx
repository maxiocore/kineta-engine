import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Landmark,
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  CreditCard,
  CheckCircle2,
  Shield,
  Briefcase,
  AlertTriangle,
  Sparkles,
  Wallet,
  Ban,
} from "lucide-react";
import { sendFinancingNewApplicationEmail } from "@/lib/emailService";

interface FinancingPlan {
  id: string;
  name_ar: string;
  installments_count: number;
  duration_months: number;
  min_amount: number;
  max_amount: number | null;
}

export default function FinancingApply() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    national_id: "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    address: "",
    company_name: "",
    commercial_register: "",
    tax_number: "",
    requested_amount: "",
    service_description: "",
    project_type: "",
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const { data: plans = [] } = useQuery({
    queryKey: ["financing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financing_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as FinancingPlan[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedPlanId) throw new Error("بيانات ناقصة");

      const applicationNumber = `FIN-${Date.now()}`;
      
      const { error } = await supabase.from("financing_applications").insert([{
        user_id: user.id,
        plan_id: selectedPlanId,
        full_name: formData.full_name,
        national_id: formData.national_id,
        phone: formData.phone,
        email: formData.email,
        address: formData.address || null,
        company_name: formData.company_name || null,
        commercial_register: formData.commercial_register || null,
        tax_number: formData.tax_number || null,
        requested_amount: parseFloat(formData.requested_amount),
        service_description: `${formData.project_type}: ${formData.service_description}`,
        application_number: applicationNumber,
      }]);

      if (error) throw error;

      // Send email notification to admin
      try {
        await sendFinancingNewApplicationEmail("info@maxiocore.com", {
          applicantName: formData.full_name,
          applicantEmail: formData.email,
          applicantPhone: formData.phone,
          applicationNumber,
          requestedAmount: parseFloat(formData.requested_amount),
          serviceDescription: `${formData.project_type}: ${formData.service_description}`,
        });
        console.log("Admin notification email sent successfully");
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      toast.success("تم تقديم طلب التمويل بنجاح! سيتم مراجعته وإرسال النتيجة عبر الإيميل.");
      navigate("/dashboard/financing");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تقديم الطلب");
    },
  });

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const monthlyInstallment = selectedPlan && formData.requested_amount
    ? parseFloat(formData.requested_amount) / selectedPlan.installments_count
    : 0;

  const canProceed = () => {
    if (step === 1) return formData.full_name && formData.national_id && formData.phone && formData.email;
    if (step === 2) return selectedPlanId && formData.requested_amount;
    if (step === 3) return formData.project_type && formData.service_description;
    if (step === 4) return acceptTerms;
    return false;
  };

  return (
    <ClientDashboardLayout>
      <motion.div className="space-y-6 max-w-3xl mx-auto" dir="rtl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              تقديم طلب تمويل
            </h1>
            <p className="text-muted-foreground mt-1">احصل على خدماتك الآن وادفع لاحقاً</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard/financing"><ArrowLeft className="h-4 w-4 ml-2" />العودة</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">الخطوة {step} من {totalSteps}</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 && <><User className="h-5 w-5" />البيانات الشخصية</>}
              {step === 2 && <><CreditCard className="h-5 w-5" />خطة التمويل</>}
              {step === 3 && <><Briefcase className="h-5 w-5" />تفاصيل المشروع</>}
              {step === 4 && <><Shield className="h-5 w-5" />المراجعة والموافقة</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>الاسم الكامل *</Label><Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
                  <div><Label>رقم الهوية *</Label><Input value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} /></div>
                  <div><Label>رقم الجوال *</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div><Label>البريد الإلكتروني *</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="md:col-span-2"><Label>العنوان</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                  <div><Label>اسم الشركة (اختياري)</Label><Input value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} /></div>
                  <div><Label>السجل التجاري (اختياري)</Label><Input value={formData.commercial_register} onChange={e => setFormData({...formData, commercial_register: e.target.value})} /></div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div><Label>المبلغ المطلوب (ر.س) *</Label><Input type="number" value={formData.requested_amount} onChange={e => setFormData({...formData, requested_amount: e.target.value})} /></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {plans.map(plan => (
                      <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className={`p-4 rounded-xl border-2 text-center transition-all ${selectedPlanId === plan.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                        <div className="text-2xl font-bold text-primary">{plan.installments_count}</div>
                        <div className="text-sm text-muted-foreground">{plan.installments_count === 1 ? "دفعة" : "أقساط"}</div>
                      </button>
                    ))}
                  </div>
                  {selectedPlan && formData.requested_amount && (
                    <Card className="bg-emerald-500/10 border-emerald-500/30">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">القسط الشهري</p>
                        <p className="text-3xl font-bold text-emerald-400">{monthlyInstallment.toFixed(2)} ر.س</p>
                        <Badge className="mt-2 bg-emerald-500/20 text-emerald-400"><Sparkles className="h-3 w-3 ml-1" />بدون فوائد</Badge>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <Label>نوع الخدمة المطلوبة *</Label>
                    <RadioGroup value={formData.project_type} onValueChange={v => setFormData({...formData, project_type: v})}>
                      <div className="flex items-center gap-2"><RadioGroupItem value="برمجة" id="dev" /><Label htmlFor="dev">برمجة وتطوير</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="تصميم" id="design" /><Label htmlFor="design">تصميم جرافيك</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="سوشيال" id="social" /><Label htmlFor="social">خدمات مواقع التواصل</Label></div>
                    </RadioGroup>
                  </div>
                  <div><Label>وصف المشروع *</Label><Textarea rows={4} placeholder="صف مشروعك والخدمات المطلوبة..." value={formData.service_description} onChange={e => setFormData({...formData, service_description: e.target.value})} /></div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <Card><CardContent className="p-4 space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">الاسم</span><span className="font-medium">{formData.full_name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">المبلغ</span><span className="font-medium">{formData.requested_amount} ر.س</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">عدد الأقساط</span><span className="font-medium">{selectedPlan?.installments_count}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">القسط الشهري</span><span className="font-medium text-primary">{monthlyInstallment.toFixed(2)} ر.س</span></div>
                  </CardContent></Card>
                  
                  {/* Balance Info Card */}
                  <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Wallet className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-400 mb-2">كيف يتم استلام الخدمة؟</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            بمجرد الموافقة على طلبك، يُضاف مبلغ التمويل كرصيد في حسابك على المنصة. 
                            يمكنك استخدام هذا الرصيد لشراء خدمات البرمجة والتصميم ومواقع التواصل. 
                            يتم تسليم الخدمات حسب الاتفاق المحدد مع فريقنا.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warning Card */}
                  <Card className="bg-yellow-500/10 border-yellow-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-400 mb-2">تنبيهات مهمة</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                              <Ban className="h-4 w-4 text-red-400" />
                              <span>لا يمكن سحب مبلغ التمويل نقداً</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Ban className="h-4 w-4 text-red-400" />
                              <span>لا يمكن تحويل الرصيد لحسابات أخرى</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span>الرصيد صالح فقط لخدماتنا داخل المنصة</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-start gap-2 p-4 rounded-lg border">
                    <Checkbox id="terms" checked={acceptTerms} onCheckedChange={c => setAcceptTerms(!!c)} />
                    <Label htmlFor="terms" className="text-sm">أوافق على <Link to="/dashboard/financing/guide" className="text-primary underline">شروط وأحكام التمويل</Link> والسند التنفيذي</Label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}><ArrowRight className="h-4 w-4 ml-2" />السابق</Button>
              {step < totalSteps ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="bg-gradient-to-r from-emerald-500 to-teal-600">التالي<ArrowLeft className="h-4 w-4 mr-2" /></Button>
              ) : (
                <Button onClick={() => submitMutation.mutate()} disabled={!canProceed() || submitMutation.isPending} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  {submitMutation.isPending ? "جاري الإرسال..." : "تقديم الطلب"}<CheckCircle2 className="h-4 w-4 mr-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ClientDashboardLayout>
  );
}
