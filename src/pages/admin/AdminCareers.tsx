import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Eye,
  Mail,
  Phone,
  Calendar,
  Building2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Download
} from "lucide-react";

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "جديد", color: "bg-blue-500", icon: Clock },
  reviewing: { label: "قيد المراجعة", color: "bg-yellow-500", icon: Eye },
  interviewed: { label: "تمت المقابلة", color: "bg-purple-500", icon: Users },
  accepted: { label: "مقبول", color: "bg-green-500", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-500", icon: XCircle }
};

const employmentTypes = [
  { value: "full_time", label: "دوام كامل" },
  { value: "part_time", label: "دوام جزئي" },
  { value: "contract", label: "عقد" },
  { value: "internship", label: "تدريب" },
  { value: "remote", label: "عن بُعد" }
];

const AdminCareers = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("jobs");
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    title_ar: "",
    department: "",
    department_ar: "",
    location: "Remote",
    location_ar: "عن بُعد",
    employment_type: "full_time",
    description: "",
    description_ar: "",
    salary_range: "",
    salary_range_ar: "",
    is_active: true,
    is_featured: false
  });

  // Fetch jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch applications
  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, job_postings(title_ar)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Create/Update job
  const jobMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingJob) {
        const { error } = await supabase
          .from('job_postings')
          .update(data)
          .eq('id', editingJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_postings')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast.success(editingJob ? "تم تحديث الوظيفة" : "تمت إضافة الوظيفة");
      setIsJobDialogOpen(false);
      resetJobForm();
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    }
  });

  // Delete job
  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast.success("تم حذف الوظيفة");
    }
  });

  // Update application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status, 
          admin_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;

      // Send email notification based on status
      if (selectedApplication) {
        let subject = "";
        let message = "";
        
        if (status === "accepted") {
          subject = "تهانينا! تم قبول طلبك";
          message = `مرحباً ${selectedApplication.full_name}،\n\nيسعدنا إبلاغك بأنه تم قبول طلبك للوظيفة. سنتواصل معك قريباً لترتيب الخطوات التالية.\n\nمع أطيب التحيات،\nفريق الموارد البشرية`;
        } else if (status === "interviewed") {
          subject = "دعوة لمقابلة";
          message = `مرحباً ${selectedApplication.full_name}،\n\nنود دعوتك لإجراء مقابلة معنا. سنتواصل معك لتحديد الموعد المناسب.\n\nمع أطيب التحيات،\nفريق الموارد البشرية`;
        } else if (status === "rejected") {
          subject = "بخصوص طلب التوظيف";
          message = `مرحباً ${selectedApplication.full_name}،\n\nنشكرك على اهتمامك بالانضمام إلى فريقنا. للأسف، لم يتم اختيارك لهذه الوظيفة. نتمنى لك التوفيق في مسيرتك المهنية.\n\nمع أطيب التحيات،\nفريق الموارد البشرية`;
        }

        if (subject) {
          await supabase.functions.invoke('send-email', {
            body: {
              to: selectedApplication.email,
              subject,
              html: `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8;">${message.replace(/\n/g, '<br>')}</div>`
            }
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      toast.success("تم تحديث حالة الطلب");
      setSelectedApplication(null);
    }
  });

  const resetJobForm = () => {
    setJobForm({
      title: "",
      title_ar: "",
      department: "",
      department_ar: "",
      location: "Remote",
      location_ar: "عن بُعد",
      employment_type: "full_time",
      description: "",
      description_ar: "",
      salary_range: "",
      salary_range_ar: "",
      is_active: true,
      is_featured: false
    });
    setEditingJob(null);
  };

  const handleEditJob = (job: any) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || "",
      title_ar: job.title_ar || "",
      department: job.department || "",
      department_ar: job.department_ar || "",
      location: job.location || "Remote",
      location_ar: job.location_ar || "عن بُعد",
      employment_type: job.employment_type || "full_time",
      description: job.description || "",
      description_ar: job.description_ar || "",
      salary_range: job.salary_range || "",
      salary_range_ar: job.salary_range_ar || "",
      is_active: job.is_active ?? true,
      is_featured: job.is_featured ?? false
    });
    setIsJobDialogOpen(true);
  };

  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    jobMutation.mutate(jobForm);
  };

  const newApplicationsCount = applications?.filter(a => a.status === 'new').length || 0;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-6 h-6" />
              إدارة الوظائف
            </h1>
            <p className="text-muted-foreground">إدارة الوظائف والطلبات المقدمة</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الوظائف النشطة</p>
                  <p className="text-2xl font-bold">{jobs?.filter(j => j.is_active).length || 0}</p>
                </div>
                <Briefcase className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold">{applications?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">طلبات جديدة</p>
                  <p className="text-2xl font-bold">{newApplicationsCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مقبولين</p>
                  <p className="text-2xl font-bold">{applications?.filter(a => a.status === 'accepted').length || 0}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="w-4 h-4" />
              الوظائف
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Users className="w-4 h-4" />
              الطلبات
              {newApplicationsCount > 0 && (
                <Badge className="mr-1 bg-red-500">{newApplicationsCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isJobDialogOpen} onOpenChange={(open) => {
                setIsJobDialogOpen(open);
                if (!open) resetJobForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة وظيفة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingJob ? "تعديل الوظيفة" : "إضافة وظيفة جديدة"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitJob} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>العنوان (إنجليزي)</Label>
                        <Input
                          value={jobForm.title}
                          onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label>العنوان (عربي)</Label>
                        <Input
                          value={jobForm.title_ar}
                          onChange={(e) => setJobForm(prev => ({ ...prev, title_ar: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label>القسم (إنجليزي)</Label>
                        <Input
                          value={jobForm.department}
                          onChange={(e) => setJobForm(prev => ({ ...prev, department: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label>القسم (عربي)</Label>
                        <Input
                          value={jobForm.department_ar}
                          onChange={(e) => setJobForm(prev => ({ ...prev, department_ar: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label>الموقع (إنجليزي)</Label>
                        <Input
                          value={jobForm.location}
                          onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>الموقع (عربي)</Label>
                        <Input
                          value={jobForm.location_ar}
                          onChange={(e) => setJobForm(prev => ({ ...prev, location_ar: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>نوع العمل</Label>
                        <Select
                          value={jobForm.employment_type}
                          onValueChange={(value) => setJobForm(prev => ({ ...prev, employment_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {employmentTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>نطاق الراتب (عربي)</Label>
                        <Input
                          value={jobForm.salary_range_ar}
                          onChange={(e) => setJobForm(prev => ({ ...prev, salary_range_ar: e.target.value }))}
                          placeholder="مثال: 10,000 - 15,000 ريال"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>الوصف (عربي)</Label>
                      <Textarea
                        value={jobForm.description_ar}
                        onChange={(e) => setJobForm(prev => ({ ...prev, description_ar: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={jobForm.is_active}
                          onCheckedChange={(checked) => setJobForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label>نشط</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={jobForm.is_featured}
                          onCheckedChange={(checked) => setJobForm(prev => ({ ...prev, is_featured: checked }))}
                        />
                        <Label>مميز</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={jobMutation.isPending}>
                        {jobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingJob ? "تحديث" : "إضافة")}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {jobsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs?.map(job => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{job.title_ar}</h3>
                            {job.is_featured && <Badge className="bg-yellow-500">مميز</Badge>}
                            <Badge variant={job.is_active ? "default" : "secondary"}>
                              {job.is_active ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {job.department_ar} • {job.location_ar}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذه الوظيفة؟")) {
                                deleteJobMutation.mutate(job.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {appsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4">
                {applications?.map(app => {
                  const status = statusLabels[app.status] || statusLabels.new;
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={app.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{app.full_name}</h3>
                              <Badge className={`${status.color} text-white gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              الوظيفة: {app.job_postings?.title_ar || "غير محدد"}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {app.email}
                              </span>
                              {app.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {app.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(app.created_at), "dd MMM yyyy", { locale: ar })}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {app.resume_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={app.resume_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 ml-1" />
                                  السيرة الذاتية
                                </a>
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>
                                  <Eye className="w-4 h-4 ml-1" />
                                  عرض
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl" dir="rtl">
                                <DialogHeader>
                                  <DialogTitle>تفاصيل الطلب</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">الاسم</Label>
                                      <p className="font-medium">{app.full_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">البريد الإلكتروني</Label>
                                      <p className="font-medium">{app.email}</p>
                                    </div>
                                    {app.phone && (
                                      <div>
                                        <Label className="text-muted-foreground">الهاتف</Label>
                                        <p className="font-medium">{app.phone}</p>
                                      </div>
                                    )}
                                    {app.years_of_experience && (
                                      <div>
                                        <Label className="text-muted-foreground">سنوات الخبرة</Label>
                                        <p className="font-medium">{app.years_of_experience}</p>
                                      </div>
                                    )}
                                    {app.current_company && (
                                      <div>
                                        <Label className="text-muted-foreground">الشركة الحالية</Label>
                                        <p className="font-medium">{app.current_company}</p>
                                      </div>
                                    )}
                                    {app.expected_salary && (
                                      <div>
                                        <Label className="text-muted-foreground">الراتب المتوقع</Label>
                                        <p className="font-medium">{app.expected_salary}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    {app.linkedin_url && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-4 h-4 ml-1" />
                                          LinkedIn
                                        </a>
                                      </Button>
                                    )}
                                    {app.portfolio_url && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-4 h-4 ml-1" />
                                          معرض الأعمال
                                        </a>
                                      </Button>
                                    )}
                                  </div>

                                  {app.cover_letter && (
                                    <div>
                                      <Label className="text-muted-foreground">رسالة التقديم</Label>
                                      <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{app.cover_letter}</p>
                                    </div>
                                  )}

                                  <div className="border-t pt-4">
                                    <Label>تحديث الحالة</Label>
                                    <div className="flex gap-2 mt-2">
                                      {Object.entries(statusLabels).map(([key, val]) => (
                                        <Button
                                          key={key}
                                          variant={app.status === key ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => updateStatusMutation.mutate({ id: app.id, status: key })}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <val.icon className="w-4 h-4 ml-1" />
                                          {val.label}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCareers;
