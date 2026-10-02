import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import {
  Send, Loader2, Upload, ArrowRight, Sparkles, Globe, FileText, CheckCircle2,
} from "lucide-react";

const CareerGeneralApply = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
    linkedinUrl: "",
    portfolioUrl: "",
    yearsOfExperience: "",
    currentCompany: "",
    expectedSalary: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً", { description: "الحد الأقصى 5 ميجابايت" });
      return;
    }
    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let resumeUrl: string | null = null;
      if (resumeFile) {
        const ext = resumeFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("resumes").upload(fileName, resumeFile);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(fileName);
        resumeUrl = publicUrl;
      }

      const { error } = await supabase.from("job_applications").insert({
        job_id: null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        resume_url: resumeUrl,
        cover_letter: formData.coverLetter || null,
        linkedin_url: formData.linkedinUrl || null,
        portfolio_url: formData.portfolioUrl || null,
        years_of_experience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
        current_company: formData.currentCompany || null,
        expected_salary: formData.expectedSalary || null,
      });
      if (error) throw error;

      // Auto-reply confirmation email
      supabase.functions.invoke("career-notification", {
        body: {
          type: "new_application",
          applicantName: formData.fullName,
          applicantEmail: formData.email,
          jobTitle: "تقديم عام",
        },
      }).catch((err) => console.warn("auto-reply failed:", err));

      toast.success("تم إرسال سيرتك الذاتية بنجاح 🎉", {
        description: "وصلك بريد تأكيد — سنحتفظ ببياناتك ونتواصل معك عند توفر فرصة مناسبة",
      });
      navigate("/careers", { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error("حدث خطأ أثناء الإرسال", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="container mx-auto px-4 relative z-10">
          <Button variant="ghost" asChild className="mb-6 gap-2">
            <Link to="/careers"><ArrowRight className="w-4 h-4" />رجوع إلى الوظائف</Link>
          </Button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 ml-1" /> تقديم عام
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              أرسل <span className="bg-gradient-to-l from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">سيرتك الذاتية</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              حتى لو لم تكن هناك وظيفة مناسبة حالياً، نحتفظ بسيرتك الذاتية ونتواصل معك فور توفر فرصة تناسب مهاراتك وخبراتك.
            </p>
            <div className="flex flex-wrap gap-4 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" />عمل عن بُعد بالكامل</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" />رد تلقائي فوري بالبريد</span>
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary" />سيرتك محفوظة للفرص القادمة</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-xl border-primary/20">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />بيانات التقديم
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>الاسم الكامل *</Label>
                      <Input value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>البريد الإلكتروني *</Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>رقم الهاتف</Label>
                      <Input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div>
                      <Label>سنوات الخبرة</Label>
                      <Input type="number" value={formData.yearsOfExperience} onChange={(e) => setFormData((p) => ({ ...p, yearsOfExperience: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>الشركة الحالية</Label>
                      <Input value={formData.currentCompany} onChange={(e) => setFormData((p) => ({ ...p, currentCompany: e.target.value }))} />
                    </div>
                    <div>
                      <Label>الراتب المتوقع</Label>
                      <Input value={formData.expectedSalary} onChange={(e) => setFormData((p) => ({ ...p, expectedSalary: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>LinkedIn</Label>
                      <Input value={formData.linkedinUrl} onChange={(e) => setFormData((p) => ({ ...p, linkedinUrl: e.target.value }))} placeholder="رابط الحساب" />
                    </div>
                    <div>
                      <Label>معرض الأعمال</Label>
                      <Input value={formData.portfolioUrl} onChange={(e) => setFormData((p) => ({ ...p, portfolioUrl: e.target.value }))} placeholder="رابط البورتفوليو" />
                    </div>
                  </div>
                  <div>
                    <Label>السيرة الذاتية *</Label>
                    <div className="mt-1">
                      <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("resume")?.click()} className="w-full gap-2 border-dashed border-2 h-12">
                        <Upload className="w-4 h-4" />{resumeFile ? resumeFile.name : "اختر ملف PDF أو DOC"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">الحد الأقصى 5MB</p>
                    </div>
                  </div>
                  <div>
                    <Label>نبذة عنك</Label>
                    <Textarea rows={4} value={formData.coverLetter} onChange={(e) => setFormData((p) => ({ ...p, coverLetter: e.target.value }))} placeholder="حدثنا عن مهاراتك ومجالات اهتمامك ونوع الفرص التي تبحث عنها..." />
                  </div>
                  <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 font-bold">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 ml-2" />إرسال السيرة الذاتية</>}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    بالضغط على "إرسال" أنت توافق على معالجة بياناتك لأغراض التوظيف. سيصلك رد تلقائي بالبريد.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareerGeneralApply;
