import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
  Briefcase, Building2, Globe, Clock, DollarSign, Home,
  Upload, Send, Loader2, CheckCircle2, ArrowRight,
} from "lucide-react";

const employmentTypeLabels: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  contract: "عقد",
  internship: "تدريب",
  remote: "عن بُعد",
};

const CareerApply = () => {
  const { jobId } = useParams<{ jobId: string }>();
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

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-posting", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
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
    if (!job) return;
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
        job_id: job.id,
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
          jobTitle: job.title_ar,
        },
      }).catch((err) => console.warn("auto-reply failed:", err));

      toast.success("تم إرسال طلبك بنجاح 🎉", {
        description: "وصلك بريد تأكيد — سنراجع طلبك ونتواصل معك قريباً",
      });
      navigate("/careers", { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error("حدث خطأ أثناء الإرسال", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!job || !job.is_active) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">هذه الوظيفة لم تعد متاحة</h1>
          <p className="text-muted-foreground mb-8">يمكنك تصفح الوظائف الأخرى المتاحة.</p>
          <Button asChild><Link to="/careers">عرض الوظائف</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const reqs = (job.requirements_ar as string[] | null) || [];
  const bens = (job.benefits_ar as string[] | null) || [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10" />
        <div className="container mx-auto px-4 relative z-10">
          <Button variant="ghost" asChild className="mb-6 gap-2">
            <Link to="/careers"><ArrowRight className="w-4 h-4" />رجوع إلى الوظائف</Link>
          </Button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <Globe className="w-3 h-3 ml-1" /> Remote
              </Badge>
              {job.is_featured && (
                <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">مميز</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{job.title_ar}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{job.department_ar}</span>
              <span className="flex items-center gap-1.5"><Home className="w-4 h-4" />{job.location_ar || "عن بُعد"}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{employmentTypeLabels[job.employment_type] || job.employment_type}</span>
              {job.salary_range_ar && (
                <span className="flex items-center gap-1.5 text-primary font-medium"><DollarSign className="w-4 h-4" />{job.salary_range_ar}</span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8 max-w-6xl">
          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {job.description_ar && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" />الوصف الوظيفي</h2>
                  <p className="text-muted-foreground leading-loose whitespace-pre-wrap">{job.description_ar}</p>
                </CardContent>
              </Card>
            )}
            {reqs.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" />المتطلبات</h2>
                  <ul className="space-y-2">
                    {reqs.map((r, i) => (
                      <li key={i} className="flex gap-2 text-muted-foreground"><CheckCircle2 className="w-4 h-4 mt-1 text-green-500 flex-shrink-0" />{r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {bens.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" />المزايا</h2>
                  <ul className="space-y-2">
                    {bens.map((b, i) => (
                      <li key={i} className="flex gap-2 text-muted-foreground"><CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" />{b}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-primary" />تقديم الطلب</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>الاسم الكامل *</Label>
                    <Input value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>البريد الإلكتروني *</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>رقم الهاتف</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>سنوات الخبرة</Label>
                      <Input type="number" value={formData.yearsOfExperience} onChange={(e) => setFormData((p) => ({ ...p, yearsOfExperience: e.target.value }))} />
                    </div>
                    <div>
                      <Label>الراتب المتوقع</Label>
                      <Input value={formData.expectedSalary} onChange={(e) => setFormData((p) => ({ ...p, expectedSalary: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>الشركة الحالية</Label>
                    <Input value={formData.currentCompany} onChange={(e) => setFormData((p) => ({ ...p, currentCompany: e.target.value }))} />
                  </div>
                  <div>
                    <Label>LinkedIn</Label>
                    <Input value={formData.linkedinUrl} onChange={(e) => setFormData((p) => ({ ...p, linkedinUrl: e.target.value }))} placeholder="رابط الحساب" />
                  </div>
                  <div>
                    <Label>معرض الأعمال</Label>
                    <Input value={formData.portfolioUrl} onChange={(e) => setFormData((p) => ({ ...p, portfolioUrl: e.target.value }))} placeholder="رابط البورتفوليو" />
                  </div>
                  <div>
                    <Label>السيرة الذاتية</Label>
                    <div className="mt-1">
                      <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("resume")?.click()} className="w-full gap-2">
                        <Upload className="w-4 h-4" />{resumeFile ? resumeFile.name : "اختر ملف PDF أو DOC"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">الحد الأقصى 5MB</p>
                    </div>
                  </div>
                  <div>
                    <Label>رسالة التقديم</Label>
                    <Textarea rows={4} value={formData.coverLetter} onChange={(e) => setFormData((p) => ({ ...p, coverLetter: e.target.value }))} placeholder="لماذا أنت مناسب لهذه الوظيفة؟" />
                  </div>
                  <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 ml-2" />إرسال الطلب</>}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    بالضغط على "إرسال الطلب" أنت توافق على معالجة بياناتك لأغراض التوظيف. سيصلك رد تلقائي بالبريد.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareerApply;
