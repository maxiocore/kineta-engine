import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  Loader2,
  CheckCircle2,
  Globe,
  Laptop,
  Coffee,
  Heart,
  Zap,
  Users,
  TrendingUp,
  Shield,
  Wifi,
  Home,
  Calendar,
  DollarSign,
  Award,
  Headphones
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

      // Send notification emails
      await supabase.functions.invoke('career-notification', {
        body: {
          type: 'new_application',
          applicantName: formData.fullName,
          applicantEmail: formData.email,
          jobTitle: selectedJob.title_ar
        }
      });

      toast.success("تم إرسال طلبك بنجاح! 🎉", {
        description: "سنراجع طلبك ونتواصل معك قريباً"
      });

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

  const remoteWorkBenefits = [
    { icon: Globe, title: "اعمل من أي مكان", description: "نؤمن بالحرية الكاملة في اختيار مكان عملك" },
    { icon: Calendar, title: "ساعات مرنة", description: "تحكم في جدولك بما يناسب حياتك" },
    { icon: Home, title: "بيئة عمل مريحة", description: "اعمل من منزلك بكل راحة" }
  ];

  const companyBenefits = [
    { icon: TrendingUp, title: "نمو مهني سريع", description: "فرص ترقية وتطوير مستمر" },
    { icon: DollarSign, title: "رواتب تنافسية", description: "أجور أعلى من معدل السوق" },
    { icon: Award, title: "مكافآت الأداء", description: "حوافز ربع سنوية وسنوية" },
    { icon: Zap, title: "تدريب مستمر", description: "ميزانية تعلم سنوية لكل موظف" },
    { icon: Users, title: "فريق متميز", description: "اعمل مع أفضل المواهب" },
    { icon: Shield, title: "أمان وظيفي", description: "استقرار وضمانات طويلة المدى" }
  ];

  const workCulture = [
    { number: "100%", label: "عمل عن بُعد" },
    { number: "+15", label: "جنسية في الفريق" },
    { number: "4.9", label: "تقييم الموظفين" },
    { number: "90%", label: "معدل الاحتفاظ" }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      {/* Hero Section - Remote First */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-primary/30 text-lg px-6 py-3">
              <Home className="w-5 h-5 ml-2" />
              شركة تعمل عن بُعد بالكامل
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-l from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                اعمل من أي مكان
              </span>
              <br />
              <span className="text-foreground">في العالم</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
              نحن فريق موزع عالمياً يؤمن بأن أفضل المواهب لا تحدها الحدود الجغرافية.
              انضم إلينا واعمل من منزلك، مقهاك المفضل، أو من أي مكان يلهمك.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-lg px-8 py-6 text-white font-bold shadow-lg">
                <Briefcase className="w-5 h-5 ml-2" />
                استكشف الوظائف
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 bg-background/80 backdrop-blur-sm text-foreground font-bold">
                <Users className="w-5 h-5 ml-2" />
                تعرف على فريقنا
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Work Culture Stats */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {workCulture.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-l from-primary to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Remote Work Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Wifi className="w-4 h-4 ml-1" />
              Remote First
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">لماذا العمل عن بُعد معنا؟</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              نوفر لك كل ما تحتاجه للعمل بكفاءة وراحة من أي مكان
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {remoteWorkBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-xl transition-all hover:-translate-y-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                  <CardContent className="pt-8 pb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                      <benefit.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Benefits */}
      <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
              <Heart className="w-4 h-4 ml-1" />
              المزايا والفوائد
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">نهتم براحتك وسعادتك</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              حزمة مزايا شاملة تضمن لك التوازن بين العمل والحياة
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {companyBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/30 group">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-20" id="jobs">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Briefcase className="w-4 h-4 ml-1" />
              الفرص المتاحة
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">الوظائف المتاحة حالياً</h2>
            <p className="text-muted-foreground text-lg">جميع وظائفنا عن بُعد بالكامل - اعمل من أي مكان!</p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="grid gap-4 max-w-4xl mx-auto">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`hover:shadow-xl transition-all hover:-translate-y-1 group ${job.is_featured ? 'border-primary/50 bg-gradient-to-r from-primary/5 to-purple-500/5 ring-1 ring-primary/20' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{job.title_ar}</h3>
                            {job.is_featured && (
                              <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
                                <Zap className="w-3 h-3 ml-1" />
                                مميز
                              </Badge>
                            )}
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                              <Globe className="w-3 h-3 ml-1" />
                              Remote
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4" />
                              {job.department_ar}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {job.location_ar || "عن بُعد - من أي مكان"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {employmentTypeLabels[job.employment_type] || job.employment_type}
                            </span>
                            {job.salary_range_ar && (
                              <span className="flex items-center gap-1.5 text-primary font-medium">
                                <DollarSign className="w-4 h-4" />
                                {job.salary_range_ar}
                              </span>
                            )}
                          </div>
                          {job.description_ar && (
                            <p className="text-muted-foreground line-clamp-2">{job.description_ar}</p>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              onClick={() => setSelectedJob(job)}
                              size="lg"
                              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg shadow-primary/20"
                            >
                              <Send className="w-4 h-4 ml-2" />
                              تقدم الآن
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl flex items-center gap-2">
                                {job.title_ar}
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                  Remote
                                </Badge>
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6 mt-4">
                              <div className="flex flex-wrap gap-3">
                                <Badge variant="outline" className="gap-1.5 py-1.5">
                                  <Building2 className="w-3.5 h-3.5" />
                                  {job.department_ar}
                                </Badge>
                                <Badge variant="outline" className="gap-1.5 py-1.5">
                                  <Globe className="w-3.5 h-3.5" />
                                  عمل عن بُعد 100%
                                </Badge>
                                <Badge variant="outline" className="gap-1.5 py-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {employmentTypeLabels[job.employment_type]}
                                </Badge>
                                {job.salary_range_ar && (
                                  <Badge className="bg-primary/10 text-primary border-primary/30 gap-1.5 py-1.5">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    {job.salary_range_ar}
                                  </Badge>
                                )}
                              </div>

                              <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-4 border border-primary/20">
                                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                                  <Home className="w-5 h-5" />
                                  هذه وظيفة عن بُعد بالكامل
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  يمكنك العمل من أي مكان في العالم. نوفر لك الأدوات والدعم اللازم للعمل بكفاءة.
                                </p>
                              </div>

                              {job.description_ar && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-primary" />
                                    الوصف الوظيفي
                                  </h4>
                                  <p className="text-muted-foreground">{job.description_ar}</p>
                                </div>
                              )}

                              {job.requirements_ar && job.requirements_ar.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    المتطلبات
                                  </h4>
                                  <ul className="space-y-2">
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
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <Send className="w-5 h-5 text-primary" />
                                  تقديم الطلب
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="fullName">الاسم الكامل *</Label>
                                    <Input
                                      id="fullName"
                                      value={formData.fullName}
                                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                      required
                                      className="mt-1"
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
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <Input
                                      id="phone"
                                      value={formData.phone}
                                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="experience">سنوات الخبرة</Label>
                                    <Input
                                      id="experience"
                                      type="number"
                                      value={formData.yearsOfExperience}
                                      onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                      id="linkedin"
                                      value={formData.linkedinUrl}
                                      onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                      placeholder="رابط حسابك"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="portfolio">معرض الأعمال</Label>
                                    <Input
                                      id="portfolio"
                                      value={formData.portfolioUrl}
                                      onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                                      placeholder="رابط معرض أعمالك"
                                      className="mt-1"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="resume">السيرة الذاتية</Label>
                                  <div className="mt-1 flex items-center gap-4">
                                    <Input
                                      id="resume"
                                      type="file"
                                      accept=".pdf,.doc,.docx"
                                      onChange={handleFileChange}
                                      className="hidden"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => document.getElementById('resume')?.click()}
                                      className="gap-2"
                                    >
                                      <Upload className="w-4 h-4" />
                                      {resumeFile ? resumeFile.name : "اختر ملف"}
                                    </Button>
                                    <span className="text-xs text-muted-foreground">PDF, DOC (الحد: 5MB)</span>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="coverLetter">رسالة التقديم</Label>
                                  <Textarea
                                    id="coverLetter"
                                    value={formData.coverLetter}
                                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                                    placeholder="لماذا تريد الانضمام إلينا؟"
                                    rows={4}
                                    className="mt-1"
                                  />
                                </div>

                                <Button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 py-6"
                                  size="lg"
                                >
                                  {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <>
                                      <Send className="w-5 h-5 ml-2" />
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Coffee className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">لا توجد وظائف متاحة حالياً</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                نحن دائماً نبحث عن مواهب متميزة. أرسل سيرتك الذاتية وسنتواصل معك عند توفر فرص مناسبة.
              </p>
              <Button variant="outline" size="lg">
                <Send className="w-4 h-4 ml-2" />
                أرسل سيرتك الذاتية
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              لم تجد الوظيفة المناسبة؟
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              لا تقلق! أرسل سيرتك الذاتية وسنحتفظ بها للفرص المستقبلية المناسبة لمهاراتك.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                <Send className="w-5 h-5 ml-2" />
                أرسل طلباً عاماً
              </Button>
              <Button size="lg" variant="outline">
                تابعنا على LinkedIn
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
