import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Upload, 
  Send, 
  Building2, 
  Users, 
  Rocket,
  Heart,
  Trophy,
  Coffee,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface JobPosting {
  id: string;
  title: string;
  title_ar: string;
  department: string;
  department_ar: string;
  location: string;
  location_ar: string;
  employment_type: string;
  description: string | null;
  description_ar: string | null;
  requirements: string[];
  requirements_ar: string[];
  benefits: string[];
  benefits_ar: string[];
  salary_range: string | null;
  salary_range_ar: string | null;
  is_featured: boolean;
}

const employmentTypeLabels: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  contract: "عقد",
  internship: "تدريب",
  remote: "عن بُعد"
};

const Careers = () => {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
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
    expectedSalary: ""
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as JobPosting[];
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الملف كبير جداً", {
          description: "الحد الأقصى لحجم الملف هو 5 ميجابايت"
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSubmitting(true);

    try {
      let resumeUrl = null;

      // Upload resume if provided
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);
        
        resumeUrl = publicUrl;
      }

      // Submit application
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: selectedJob.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          resume_url: resumeUrl,
          cover_letter: formData.coverLetter || null,
          linkedin_url: formData.linkedinUrl || null,
          portfolio_url: formData.portfolioUrl || null,
          years_of_experience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
          current_company: formData.currentCompany || null,
          expected_salary: formData.expectedSalary || null
        });

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke('contact-form', {
        body: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          subject: `طلب توظيف جديد - ${selectedJob.title_ar}`,
          message: `تم تقديم طلب توظيف جديد لوظيفة: ${selectedJob.title_ar}\n\nالاسم: ${formData.fullName}\nالبريد الإلكتروني: ${formData.email}\nالهاتف: ${formData.phone || 'غير محدد'}\nسنوات الخبرة: ${formData.yearsOfExperience || 'غير محدد'}\nالشركة الحالية: ${formData.currentCompany || 'غير محدد'}\nالراتب المتوقع: ${formData.expectedSalary || 'غير محدد'}`
        }
      });

      toast.success("تم إرسال طلبك بنجاح!", {
        description: "سنتواصل معك قريباً"
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        coverLetter: "",
        linkedinUrl: "",
        portfolioUrl: "",
        yearsOfExperience: "",
        currentCompany: "",
        expectedSalary: ""
      });
      setResumeFile(null);
      setSelectedJob(null);

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error("حدث خطأ أثناء الإرسال", {
        description: "يرجى المحاولة مرة أخرى"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: Rocket, title: "فرص نمو مهني", description: "دورات تدريبية وتطوير مستمر" },
    { icon: Coffee, title: "بيئة عمل مريحة", description: "مكاتب حديثة ومرافق متكاملة" },
    { icon: Trophy, title: "مكافآت وحوافز", description: "نظام مكافآت بناءً على الأداء" }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-green-500/20 text-green-400 border-green-500/30 text-lg px-6 py-2">
              <Briefcase className="w-5 h-5 ml-2" />
              انضم إلى فريقنا
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-l from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                ابنِ مستقبلك معنا
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              نبحث عن مواهب استثنائية للانضمام إلى فريقنا المتميز. 
              اكتشف الفرص المتاحة وابدأ رحلتك المهنية معنا.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">لماذا تنضم إلينا؟</h2>
            <p className="text-muted-foreground">نقدم بيئة عمل محفزة ومزايا تنافسية</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-all hover:-translate-y-1 border-green-500/20">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <benefit.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">الوظائف المتاحة</h2>
            <p className="text-muted-foreground">اكتشف الفرص الوظيفية المتاحة حالياً</p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="grid gap-6">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`hover:shadow-lg transition-all hover:-translate-y-1 ${job.is_featured ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{job.title_ar}</h3>
                            {job.is_featured && (
                              <Badge className="bg-green-500 text-white">مميز</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {job.department_ar}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location_ar}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {employmentTypeLabels[job.employment_type] || job.employment_type}
                            </span>
                          </div>
                          {job.description_ar && (
                            <p className="mt-3 text-muted-foreground line-clamp-2">{job.description_ar}</p>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              onClick={() => setSelectedJob(job)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                              تقدم الآن
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">{job.title_ar}</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6 mt-4">
                              {/* Job Details */}
                              <div className="flex flex-wrap gap-3">
                                <Badge variant="outline" className="gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {job.department_ar}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {job.location_ar}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="w-3 h-3" />
                                  {employmentTypeLabels[job.employment_type]}
                                </Badge>
                                {job.salary_range_ar && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                                    {job.salary_range_ar}
                                  </Badge>
                                )}
                              </div>

                              {job.description_ar && (
                                <div>
                                  <h4 className="font-semibold mb-2">الوصف الوظيفي</h4>
                                  <p className="text-muted-foreground">{job.description_ar}</p>
                                </div>
                              )}

                              {job.requirements_ar && job.requirements_ar.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">المتطلبات</h4>
                                  <ul className="space-y-1">
                                    {(job.requirements_ar as string[]).map((req, i) => (
                                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                        <CheckCircle2 className="w-4 h-4 mt-1 text-green-500 flex-shrink-0" />
                                        {req}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Application Form */}
                              <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
                                <h4 className="font-semibold text-lg">تقديم الطلب</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="fullName">الاسم الكامل *</Label>
                                    <Input
                                      id="fullName"
                                      value={formData.fullName}
                                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                                    <Input
                                      id="email"
                                      type="email"
                                      value={formData.email}
                                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <Input
                                      id="phone"
                                      value={formData.phone}
                                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="yearsOfExperience">سنوات الخبرة</Label>
                                    <Input
                                      id="yearsOfExperience"
                                      type="number"
                                      min="0"
                                      value={formData.yearsOfExperience}
                                      onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="currentCompany">الشركة الحالية</Label>
                                    <Input
                                      id="currentCompany"
                                      value={formData.currentCompany}
                                      onChange={(e) => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="expectedSalary">الراتب المتوقع</Label>
                                    <Input
                                      id="expectedSalary"
                                      value={formData.expectedSalary}
                                      onChange={(e) => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                                      placeholder="مثال: 10,000 - 15,000 ريال"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="linkedinUrl">رابط LinkedIn</Label>
                                  <Input
                                    id="linkedinUrl"
                                    value={formData.linkedinUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                    placeholder="https://linkedin.com/in/..."
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="portfolioUrl">رابط معرض الأعمال</Label>
                                  <Input
                                    id="portfolioUrl"
                                    value={formData.portfolioUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                                    placeholder="https://..."
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="resume">السيرة الذاتية (PDF)</Label>
                                  <div className="mt-1">
                                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                      <div className="text-center">
                                        <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                          {resumeFile ? resumeFile.name : "اضغط لرفع السيرة الذاتية"}
                                        </span>
                                      </div>
                                      <input
                                        type="file"
                                        id="resume"
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        onChange={handleFileChange}
                                      />
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="coverLetter">رسالة التقديم</Label>
                                  <Textarea
                                    id="coverLetter"
                                    value={formData.coverLetter}
                                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                                    placeholder="اكتب رسالة قصيرة تعرف فيها بنفسك ولماذا تريد الانضمام إلينا..."
                                    rows={4}
                                  />
                                </div>

                                <Button 
                                  type="submit" 
                                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                      جاري الإرسال...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 ml-2" />
                                      إرسال الطلب
                                    </>
                                  )}
                                </Button>
                              </form>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">لا توجد وظائف متاحة حالياً</h3>
                <p className="text-muted-foreground mb-4">
                  نحن دائماً نبحث عن المواهب المميزة. أرسل سيرتك الذاتية وسنتواصل معك عند توفر فرص مناسبة.
                </p>
                <Button asChild variant="outline">
                  <a href="/contact">تواصل معنا</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">لم تجد الوظيفة المناسبة؟</h2>
            <p className="text-muted-foreground mb-6">
              أرسل لنا سيرتك الذاتية وسنحتفظ بها للفرص المستقبلية
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <a href="/contact">تواصل معنا</a>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
