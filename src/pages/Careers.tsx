import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Users, 
  Rocket,
  Trophy,
  Coffee,
  Loader2,
  CheckCircle2,
  Globe,
  Wifi,
  Laptop,
  Clock3,
  Sparkles,
  ArrowLeft,
  Star,
  Zap
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
    { icon: Globe, title: "اعمل من أي مكان", description: "لا حدود جغرافية، اعمل من منزلك أو من أي مكان في العالم" },
    { icon: Clock3, title: "مرونة في الوقت", description: "نظّم وقتك بما يناسب حياتك مع الحفاظ على الإنتاجية" },
    { icon: Laptop, title: "أدوات احترافية", description: "نوفر لك جميع الأدوات والبرامج اللازمة للعمل" },
    { icon: Wifi, title: "تواصل مستمر", description: "فريق متصل دائماً عبر أحدث تقنيات التواصل" }
  ];

  const benefits = [
    { icon: Rocket, title: "فرص نمو مهني", description: "دورات تدريبية وتطوير مستمر", color: "from-blue-500 to-cyan-500" },
    { icon: Coffee, title: "بيئة عمل مرنة", description: "توازن مثالي بين العمل والحياة", color: "from-orange-500 to-amber-500" },
    { icon: Trophy, title: "مكافآت وحوافز", description: "نظام مكافآت بناءً على الأداء", color: "from-purple-500 to-pink-500" },
    { icon: Zap, title: "مشاريع مثيرة", description: "اعمل على مشاريع متنوعة ومبتكرة", color: "from-green-500 to-emerald-500" }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          
          {/* Floating Elements */}
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-[10%] w-64 h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              y: [0, 30, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-[10%] w-96 h-96 bg-gradient-to-br from-accent/20 to-accent/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-full blur-3xl"
          />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMjgsMTI4LDEyOCwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Remote Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 mb-8"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border-primary/30 px-4 py-2 text-sm">
                  <Globe className="w-4 h-4 ml-2" />
                  نعمل عن بُعد بالكامل - 100% Remote
                </Badge>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="text-foreground">انضم لفريق</span>
                <br />
                <span className="bg-gradient-to-l from-primary via-primary to-accent bg-clip-text text-transparent">
                  ماكسيو كور
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                نؤمن بأن المواهب لا تعرف حدوداً. انضم إلى فريقنا واعمل من أي مكان في العالم 
                مع فريق شغوف بالتقنية والإبداع.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">100%</div>
                  <div className="text-sm text-muted-foreground">عمل عن بُعد</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">+15</div>
                  <div className="text-sm text-muted-foreground">موظف</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">+5</div>
                  <div className="text-sm text-muted-foreground">دول</div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                  onClick={() => document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  استكشف الفرص المتاحة
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Visual Element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block relative"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Central Circle */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
                />
                
                {/* Floating Icons */}
                {[
                  { Icon: Laptop, delay: 0, position: "top-0 left-1/2 -translate-x-1/2" },
                  { Icon: Globe, delay: 0.5, position: "top-1/4 right-0" },
                  { Icon: Coffee, delay: 1, position: "bottom-1/4 right-0" },
                  { Icon: Rocket, delay: 1.5, position: "bottom-0 left-1/2 -translate-x-1/2" },
                  { Icon: Trophy, delay: 2, position: "bottom-1/4 left-0" },
                  { Icon: Wifi, delay: 2.5, position: "top-1/4 left-0" },
                ].map(({ Icon, delay, position }, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + delay * 0.2, type: "spring" }}
                    className={`absolute ${position} w-16 h-16 bg-card border border-border rounded-2xl shadow-lg flex items-center justify-center`}
                  >
                    <motion.div
                      animate={{ y: [-2, 2, -2] }}
                      transition={{ duration: 2 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Icon className="w-7 h-7 text-primary" />
                    </motion.div>
                  </motion.div>
                ))}

                {/* Center Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-40 h-40 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl"
                  >
                    <Briefcase className="w-20 h-20 text-primary-foreground" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Remote Work Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 px-4 py-2">
              <Wifi className="w-4 h-4 ml-2" />
              100% Remote
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              نؤمن بالعمل عن بُعد
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              فريقنا موزع حول العالم، نعمل معاً بكفاءة عالية دون حاجة لمكتب تقليدي
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {remoteWorkBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
                    >
                      <benefit.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 px-4 py-2">
              <Sparkles className="w-4 h-4 ml-2" />
              مميزاتنا
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">لماذا تنضم إلينا؟</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نقدم بيئة عمل محفزة ومزايا تنافسية لدعم نموك المهني والشخصي
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50 overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center relative">
                    {/* Background Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center shadow-lg`}
                    >
                      <benefit.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section id="jobs-section" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30 px-4 py-2">
              <Briefcase className="w-4 h-4 ml-2" />
              الفرص المتاحة
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">الوظائف المتاحة</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              اكتشف الفرص الوظيفية المتاحة حالياً وابدأ رحلتك معنا
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">جاري تحميل الوظائف...</p>
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="grid gap-6 max-w-4xl mx-auto">
              <AnimatePresence>
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-xl group ${
                      job.is_featured 
                        ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5' 
                        : 'hover:border-primary/30'
                    }`}>
                      <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row">
                          {/* Job Icon */}
                          <div className={`lg:w-32 p-6 flex items-center justify-center ${
                            job.is_featured 
                              ? 'bg-gradient-to-br from-primary to-accent' 
                              : 'bg-muted/50'
                          }`}>
                            <Briefcase className={`w-10 h-10 ${job.is_featured ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          </div>

                          {/* Job Details */}
                          <div className="flex-1 p-6">
                            <div className="flex flex-wrap items-start gap-3 mb-3">
                              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{job.title_ar}</h3>
                              {job.is_featured && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                  <Star className="w-3 h-3 ml-1" />
                                  مميز
                                </Badge>
                              )}
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                                <Globe className="w-3 h-3 ml-1" />
                                عن بُعد
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1.5">
                                <Building2 className="w-4 h-4" />
                                {job.department_ar}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {job.location_ar}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {employmentTypeLabels[job.employment_type] || job.employment_type}
                              </span>
                            </div>

                            {job.description_ar && (
                              <p className="text-muted-foreground line-clamp-2 mb-4">{job.description_ar}</p>
                            )}

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  onClick={() => setSelectedJob(job)}
                                  className={`${
                                    job.is_featured 
                                      ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90' 
                                      : ''
                                  }`}
                                  variant={job.is_featured ? "default" : "outline"}
                                >
                                  تقدم الآن
                                  <ArrowLeft className="w-4 h-4 mr-2" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl flex items-center gap-3">
                                    {job.title_ar}
                                    {job.is_featured && (
                                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                        مميز
                                      </Badge>
                                    )}
                                  </DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-6 mt-4">
                                  <div className="flex flex-wrap gap-3">
                                    <Badge variant="outline" className="gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {job.department_ar}
                                    </Badge>
                                    <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                                      <Globe className="w-3 h-3" />
                                      عن بُعد
                                    </Badge>
                                    <Badge variant="outline" className="gap-1">
                                      <Clock className="w-3 h-3" />
                                      {employmentTypeLabels[job.employment_type]}
                                    </Badge>
                                    {job.salary_range_ar && (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
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
                                    <h4 className="font-semibold text-lg">تقديم الطلب</h4>
                                    
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
                                        <Label htmlFor="yearsOfExperience">سنوات الخبرة</Label>
                                        <Input
                                          id="yearsOfExperience"
                                          type="number"
                                          min="0"
                                          value={formData.yearsOfExperience}
                                          onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="currentCompany">الشركة الحالية</Label>
                                        <Input
                                          id="currentCompany"
                                          value={formData.currentCompany}
                                          onChange={(e) => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="expectedSalary">الراتب المتوقع</Label>
                                        <Input
                                          id="expectedSalary"
                                          value={formData.expectedSalary}
                                          onChange={(e) => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                                          placeholder="مثال: 10,000 - 15,000 ريال"
                                          className="mt-1"
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
                                        className="mt-1"
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor="portfolioUrl">رابط معرض الأعمال</Label>
                                      <Input
                                        id="portfolioUrl"
                                        value={formData.portfolioUrl}
                                        onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                                        placeholder="https://..."
                                        className="mt-1"
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor="resume">السيرة الذاتية (PDF)</Label>
                                      <div className="mt-1">
                                        <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all">
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
                                        className="mt-1"
                                      />
                                    </div>

                                    <Button 
                                      type="submit" 
                                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                                      disabled={isSubmitting}
                                      size="lg"
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
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="text-center py-16 max-w-2xl mx-auto border-dashed">
                <CardContent>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">لا توجد وظائف متاحة حالياً</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    نحن دائماً نبحث عن المواهب المميزة. أرسل سيرتك الذاتية وسنتواصل معك عند توفر فرص مناسبة.
                  </p>
                  <Button asChild size="lg">
                    <a href="/contact">تواصل معنا</a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <motion.div
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full border border-primary/10 rounded-full"
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Send className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">لم تجد الوظيفة المناسبة؟</h2>
            <p className="text-lg text-muted-foreground mb-8">
              أرسل لنا سيرتك الذاتية وسنحتفظ بها للفرص المستقبلية. نحن دائماً نبحث عن المواهب المميزة!
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 px-8">
              <a href="/contact">
                تواصل معنا
                <ArrowLeft className="w-5 h-5 mr-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
