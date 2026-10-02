import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Briefcase, Plus, Edit, Trash2, Users, Eye, Mail, Phone,
  Calendar, Building2, ExternalLink, Loader2, CheckCircle2,
  Clock, XCircle, Download, X, Video, MapPin, Send, Star,
} from "lucide-react";

type StatusKey = "new" | "reviewing" | "interviewed" | "accepted" | "rejected";

const statusLabels: Record<StatusKey, { label: string; color: string; icon: any }> = {
  new: { label: "جديد", color: "bg-blue-500", icon: Clock },
  reviewing: { label: "قيد المراجعة", color: "bg-yellow-500", icon: Eye },
  interviewed: { label: "مقابلة مجدولة", color: "bg-purple-500", icon: Users },
  accepted: { label: "مقبول", color: "bg-green-500", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-500", icon: XCircle },
};

const employmentTypes = [
  { value: "full_time", label: "دوام كامل" },
  { value: "part_time", label: "دوام جزئي" },
  { value: "contract", label: "عقد" },
  { value: "internship", label: "تدريب" },
  { value: "remote", label: "عن بُعد" },
];

const emptyJob = {
  title: "", title_ar: "", department: "", department_ar: "",
  location: "Remote", location_ar: "عن بُعد",
  employment_type: "full_time",
  description: "", description_ar: "",
  salary_range: "", salary_range_ar: "",
  requirements_ar: [] as string[],
  benefits_ar: [] as string[],
  is_active: true, is_featured: false,
};

const AdminCareers = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("jobs");
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobForm, setJobForm] = useState({ ...emptyJob });
  const [newReq, setNewReq] = useState("");
  const [newBen, setNewBen] = useState("");

  // Application dialog state
  const [openApp, setOpenApp] = useState<any>(null);
  const [appForm, setAppForm] = useState({
    status: "new" as StatusKey,
    admin_notes: "",
    interview_date: "",
    interview_location: "",
    interview_type: "online" as "online" | "in_person",
    rating: 0,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_postings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, job_postings(title_ar)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const jobMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingJob) {
        const { error } = await supabase.from("job_postings").update(data).eq("id", editingJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_postings").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success(editingJob ? "تم تحديث الوظيفة" : "تمت إضافة الوظيفة");
      setIsJobDialogOpen(false);
      resetJobForm();
    },
    onError: (e: any) => toast.error("حدث خطأ: " + e.message),
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_postings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("تم حذف الوظيفة");
    },
  });

  const applicationMutation = useMutation({
    mutationFn: async () => {
      if (!openApp) return;
      const prevStatus = openApp.status as StatusKey;
      const update: any = {
        status: appForm.status,
        admin_notes: appForm.admin_notes || null,
        rating: appForm.rating || null,
        reviewed_at: new Date().toISOString(),
      };
      if (appForm.status === "interviewed") {
        if (!appForm.interview_date) throw new Error("حدد موعد المقابلة");
        update.interview_date = new Date(appForm.interview_date).toISOString();
        update.interview_location = appForm.interview_location || null;
        update.interview_type = appForm.interview_type;
      }
      const { error } = await supabase.from("job_applications").update(update).eq("id", openApp.id);
      if (error) throw error;

      // Fire the right email based on new status (auto-reply by section)
      if (appForm.status !== prevStatus || appForm.status === "interviewed") {
        await supabase.functions.invoke("career-notification", {
          body: {
            type: "status_update",
            applicantName: openApp.full_name,
            applicantEmail: openApp.email,
            jobTitle: openApp.job_postings?.title_ar || "وظيفة",
            status: appForm.status,
            adminNotes: appForm.admin_notes || undefined,
            interviewDate: update.interview_date,
            interviewLocation: update.interview_location,
            interviewType: update.interview_type,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success("تم حفظ التغييرات وإرسال البريد للمتقدم");
      setOpenApp(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success("تم حذف الطلب");
      setOpenApp(null);
    },
  });

  function resetJobForm() {
    setJobForm({ ...emptyJob });
    setNewReq(""); setNewBen("");
    setEditingJob(null);
  }

  function handleEditJob(job: any) {
    setEditingJob(job);
    setJobForm({
      title: job.title || "", title_ar: job.title_ar || "",
      department: job.department || "", department_ar: job.department_ar || "",
      location: job.location || "Remote", location_ar: job.location_ar || "عن بُعد",
      employment_type: job.employment_type || "full_time",
      description: job.description || "", description_ar: job.description_ar || "",
      salary_range: job.salary_range || "", salary_range_ar: job.salary_range_ar || "",
      requirements_ar: (job.requirements_ar as string[]) || [],
      benefits_ar: (job.benefits_ar as string[]) || [],
      is_active: job.is_active ?? true, is_featured: job.is_featured ?? false,
    });
    setIsJobDialogOpen(true);
  }

  function openApplication(app: any) {
    setOpenApp(app);
    setAppForm({
      status: (app.status as StatusKey) || "new",
      admin_notes: app.admin_notes || "",
      interview_date: app.interview_date ? new Date(app.interview_date).toISOString().slice(0, 16) : "",
      interview_location: app.interview_location || "",
      interview_type: (app.interview_type as any) || "online",
      rating: app.rating || 0,
    });
  }

  const newApplicationsCount = applications?.filter((a) => a.status === "new").length || 0;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="w-6 h-6" />إدارة التوظيف</h1>
            <p className="text-muted-foreground">الوظائف، الطلبات، مواعيد المقابلات والإشعارات التلقائية</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">الوظائف النشطة</p><p className="text-2xl font-bold">{jobs?.filter(j=>j.is_active).length||0}</p></div><Briefcase className="w-8 h-8 text-green-500"/></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">إجمالي الطلبات</p><p className="text-2xl font-bold">{applications?.length||0}</p></div><Users className="w-8 h-8 text-blue-500"/></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">طلبات جديدة</p><p className="text-2xl font-bold">{newApplicationsCount}</p></div><Clock className="w-8 h-8 text-yellow-500"/></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">مقابلات مجدولة</p><p className="text-2xl font-bold">{applications?.filter(a=>a.status==='interviewed').length||0}</p></div><Calendar className="w-8 h-8 text-purple-500"/></div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="jobs" className="gap-2"><Briefcase className="w-4 h-4"/>الوظائف</TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Users className="w-4 h-4"/>الطلبات
              {newApplicationsCount>0 && <Badge className="mr-1 bg-red-500">{newApplicationsCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* -------- Jobs tab -------- */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isJobDialogOpen} onOpenChange={(o)=>{setIsJobDialogOpen(o); if(!o) resetJobForm();}}>
                <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4"/>إضافة وظيفة</Button></DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader><DialogTitle>{editingJob?"تعديل الوظيفة":"إضافة وظيفة جديدة"}</DialogTitle></DialogHeader>
                  <form onSubmit={(e)=>{e.preventDefault();jobMutation.mutate(jobForm);}} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>العنوان (إنجليزي)</Label><Input value={jobForm.title} onChange={(e)=>setJobForm(p=>({...p,title:e.target.value}))} required/></div>
                      <div><Label>العنوان (عربي)</Label><Input value={jobForm.title_ar} onChange={(e)=>setJobForm(p=>({...p,title_ar:e.target.value}))} required/></div>
                      <div><Label>القسم (إنجليزي)</Label><Input value={jobForm.department} onChange={(e)=>setJobForm(p=>({...p,department:e.target.value}))} required/></div>
                      <div><Label>القسم (عربي)</Label><Input value={jobForm.department_ar} onChange={(e)=>setJobForm(p=>({...p,department_ar:e.target.value}))} required/></div>
                      <div><Label>الموقع (إنجليزي)</Label><Input value={jobForm.location} onChange={(e)=>setJobForm(p=>({...p,location:e.target.value}))}/></div>
                      <div><Label>الموقع (عربي)</Label><Input value={jobForm.location_ar} onChange={(e)=>setJobForm(p=>({...p,location_ar:e.target.value}))}/></div>
                      <div>
                        <Label>نوع العمل</Label>
                        <Select value={jobForm.employment_type} onValueChange={(v)=>setJobForm(p=>({...p,employment_type:v}))}>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>{employmentTypes.map(t=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>نطاق الراتب (عربي)</Label><Input value={jobForm.salary_range_ar} onChange={(e)=>setJobForm(p=>({...p,salary_range_ar:e.target.value}))} placeholder="مثال: 10,000 - 15,000 ريال"/></div>
                    </div>

                    <div>
                      <Label>الوصف (عربي)</Label>
                      <Textarea rows={4} value={jobForm.description_ar} onChange={(e)=>setJobForm(p=>({...p,description_ar:e.target.value}))}/>
                    </div>

                    {/* Requirements list */}
                    <div>
                      <Label>المتطلبات</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={newReq} onChange={(e)=>setNewReq(e.target.value)} placeholder="أضف متطلب جديد" onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();if(newReq.trim()){setJobForm(p=>({...p,requirements_ar:[...p.requirements_ar,newReq.trim()]}));setNewReq("");}}}}/>
                        <Button type="button" variant="outline" onClick={()=>{if(newReq.trim()){setJobForm(p=>({...p,requirements_ar:[...p.requirements_ar,newReq.trim()]}));setNewReq("");}}}><Plus className="w-4 h-4"/></Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {jobForm.requirements_ar.map((r,i)=>(
                          <Badge key={i} variant="secondary" className="gap-1 py-1.5">{r}
                            <button type="button" onClick={()=>setJobForm(p=>({...p,requirements_ar:p.requirements_ar.filter((_,j)=>j!==i)}))}><X className="w-3 h-3"/></button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Benefits list */}
                    <div>
                      <Label>المزايا والفوائد</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={newBen} onChange={(e)=>setNewBen(e.target.value)} placeholder="أضف ميزة جديدة" onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();if(newBen.trim()){setJobForm(p=>({...p,benefits_ar:[...p.benefits_ar,newBen.trim()]}));setNewBen("");}}}}/>
                        <Button type="button" variant="outline" onClick={()=>{if(newBen.trim()){setJobForm(p=>({...p,benefits_ar:[...p.benefits_ar,newBen.trim()]}));setNewBen("");}}}><Plus className="w-4 h-4"/></Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {jobForm.benefits_ar.map((b,i)=>(
                          <Badge key={i} className="gap-1 py-1.5 bg-primary/10 text-primary border-primary/30 border hover:bg-primary/10">{b}
                            <button type="button" onClick={()=>setJobForm(p=>({...p,benefits_ar:p.benefits_ar.filter((_,j)=>j!==i)}))}><X className="w-3 h-3"/></button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2"><Switch checked={jobForm.is_active} onCheckedChange={(c)=>setJobForm(p=>({...p,is_active:c}))}/><Label>نشط</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={jobForm.is_featured} onCheckedChange={(c)=>setJobForm(p=>({...p,is_featured:c}))}/><Label>مميز</Label></div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={jobMutation.isPending}>
                        {jobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : (editingJob?"تحديث":"إضافة")}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {jobsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
              <div className="grid gap-4">
                {jobs?.map(job=>(
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold">{job.title_ar}</h3>
                            {job.is_featured && <Badge className="bg-yellow-500">مميز</Badge>}
                            <Badge variant={job.is_active?"default":"secondary"}>{job.is_active?"نشط":"غير نشط"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{job.department_ar} • {job.location_ar}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span>{((job.requirements_ar as string[])||[]).length} متطلب</span>
                            <span>{((job.benefits_ar as string[])||[]).length} ميزة</span>
                            <span>{applications?.filter(a=>a.job_id===job.id).length||0} طلب</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={()=>handleEditJob(job)}><Edit className="w-4 h-4"/></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={()=>{if(confirm("حذف الوظيفة؟"))deleteJobMutation.mutate(job.id);}}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* -------- Applications tab -------- */}
          <TabsContent value="applications" className="space-y-4">
            {appsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
              <div className="grid gap-4">
                {applications?.map(app=>{
                  const st = statusLabels[(app.status as StatusKey)] || statusLabels.new;
                  const Icon = st.icon;
                  return (
                    <Card key={app.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold">{app.full_name}</h3>
                              <Badge className={`${st.color} text-white gap-1`}><Icon className="w-3 h-3"/>{st.label}</Badge>
                              {app.rating ? <Badge variant="outline" className="gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500"/>{app.rating}/5</Badge> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">الوظيفة: {app.job_postings?.title_ar || "غير محدد"}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Mail className="w-4 h-4"/>{app.email}</span>
                              {app.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4"/>{app.phone}</span>}
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/>{format(new Date(app.created_at),"dd MMM yyyy",{locale:ar})}</span>
                              {app.interview_date && (
                                <span className="flex items-center gap-1 text-purple-600 font-medium">
                                  <Calendar className="w-4 h-4"/>المقابلة: {format(new Date(app.interview_date),"dd MMM yyyy HH:mm",{locale:ar})}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {app.resume_url && <Button variant="outline" size="sm" asChild><a href={app.resume_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 ml-1"/>السيرة</a></Button>}
                            <Button size="sm" onClick={()=>openApplication(app)}><Eye className="w-4 h-4 ml-1"/>إدارة</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {!applications?.length && <p className="text-center py-12 text-muted-foreground">لا توجد طلبات بعد</p>}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ===== Application management dialog ===== */}
        <Dialog open={!!openApp} onOpenChange={(o)=>!o&&setOpenApp(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            {openApp && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    إدارة طلب — {openApp.full_name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Applicant info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><Label className="text-muted-foreground">البريد</Label><p className="font-medium">{openApp.email}</p></div>
                    {openApp.phone && <div><Label className="text-muted-foreground">الهاتف</Label><p className="font-medium">{openApp.phone}</p></div>}
                    <div><Label className="text-muted-foreground">الوظيفة</Label><p className="font-medium">{openApp.job_postings?.title_ar}</p></div>
                    {openApp.years_of_experience!=null && <div><Label className="text-muted-foreground">سنوات الخبرة</Label><p className="font-medium">{openApp.years_of_experience}</p></div>}
                    {openApp.current_company && <div><Label className="text-muted-foreground">الشركة الحالية</Label><p className="font-medium">{openApp.current_company}</p></div>}
                    {openApp.expected_salary && <div><Label className="text-muted-foreground">الراتب المتوقع</Label><p className="font-medium">{openApp.expected_salary}</p></div>}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {openApp.linkedin_url && <Button variant="outline" size="sm" asChild><a href={openApp.linkedin_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 ml-1"/>LinkedIn</a></Button>}
                    {openApp.portfolio_url && <Button variant="outline" size="sm" asChild><a href={openApp.portfolio_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 ml-1"/>البورتفوليو</a></Button>}
                    {openApp.resume_url && <Button variant="outline" size="sm" asChild><a href={openApp.resume_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 ml-1"/>السيرة الذاتية</a></Button>}
                  </div>

                  {openApp.cover_letter && (
                    <div><Label className="text-muted-foreground">رسالة التقديم</Label>
                      <p className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">{openApp.cover_letter}</p>
                    </div>
                  )}

                  {/* Status + rating */}
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <Label>الحالة</Label>
                      <Select value={appForm.status} onValueChange={(v)=>setAppForm(p=>({...p,status:v as StatusKey}))}>
                        <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k,v])=>(
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>تقييم المتقدم</Label>
                      <div className="flex gap-1 mt-1">
                        {[1,2,3,4,5].map(n=>(
                          <button key={n} type="button" onClick={()=>setAppForm(p=>({...p,rating:p.rating===n?0:n}))}>
                            <Star className={`w-7 h-7 transition ${n<=appForm.rating?'text-yellow-500 fill-yellow-500':'text-muted-foreground/40'}`}/>
                          </button>
                        ))}
                      </div>
                    </div>

                    {appForm.status === "interviewed" && (
                      <div className="rounded-lg border bg-purple-500/5 p-4 space-y-4">
                        <h4 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-600"/>تفاصيل المقابلة</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>الموعد (التاريخ والوقت)</Label>
                            <Input type="datetime-local" value={appForm.interview_date} onChange={(e)=>setAppForm(p=>({...p,interview_date:e.target.value}))} required/>
                          </div>
                          <div>
                            <Label>نوع المقابلة</Label>
                            <Select value={appForm.interview_type} onValueChange={(v)=>setAppForm(p=>({...p,interview_type:v as any}))}>
                              <SelectTrigger><SelectValue/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="online"><Video className="w-4 h-4 inline ml-1"/>عن بُعد</SelectItem>
                                <SelectItem value="in_person"><MapPin className="w-4 h-4 inline ml-1"/>حضورية</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>{appForm.interview_type === "online" ? "رابط المقابلة (Zoom / Meet / Teams)" : "عنوان المقابلة"}</Label>
                          <Input value={appForm.interview_location} onChange={(e)=>setAppForm(p=>({...p,interview_location:e.target.value}))} placeholder={appForm.interview_type==="online"?"https://meet.google.com/...":"العنوان الكامل"}/>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>ملاحظات (ستُرسل للمتقدم إن كتبتها)</Label>
                      <Textarea rows={3} value={appForm.admin_notes} onChange={(e)=>setAppForm(p=>({...p,admin_notes:e.target.value}))} placeholder="ملاحظات اختيارية تُضاف إلى بريد المتقدم"/>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="destructive" size="sm" onClick={()=>{if(confirm("حذف الطلب نهائياً؟"))deleteApplication.mutate(openApp.id);}}>
                    <Trash2 className="w-4 h-4 ml-1"/>حذف
                  </Button>
                  <Button onClick={()=>applicationMutation.mutate()} disabled={applicationMutation.isPending} className="gap-2">
                    {applicationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                    حفظ وإرسال البريد
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCareers;
