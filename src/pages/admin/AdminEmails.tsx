import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion } from "framer-motion";
import { 
  Mail, 
  Send, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Inbox,
  Edit,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Email {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  content: string;
  template_id: string | null;
  status: string;
  sent_by: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  status: string;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_id: string | null;
  target_audience: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailStats {
  total: number;
  delivered: number;
  pending: number;
  failed: number;
}

const AdminEmails = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<EmailStats>({ total: 0, delivered: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection states
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Dialog states
  const [newEmailDialogOpen, setNewEmailDialogOpen] = useState(false);
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const [newCampaignDialogOpen, setNewCampaignDialogOpen] = useState(false);
  const [viewEmailDialogOpen, setViewEmailDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  
  // Form states
  const [newEmail, setNewEmail] = useState({
    type: "single",
    template_id: "",
    recipient_email: "",
    subject: "",
    content: ""
  });
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    content: "",
    type: "manual"
  });
  
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    subject: "",
    content: "",
    target_audience: "all"
  });
  
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Real-time subscriptions
    const emailsChannel = supabase
      .channel('emails-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emails' }, () => {
        fetchEmails();
        fetchStats();
      })
      .subscribe();
      
    const templatesChannel = supabase
      .channel('templates-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_templates' }, () => {
        fetchTemplates();
      })
      .subscribe();
      
    const campaignsChannel = supabase
      .channel('campaigns-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_campaigns' }, () => {
        fetchCampaigns();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(emailsChannel);
      supabase.removeChannel(templatesChannel);
      supabase.removeChannel(campaignsChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchEmails(), fetchTemplates(), fetchCampaigns(), fetchStats()]);
    setLoading(false);
  };

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching emails:', error);
      return;
    }
    
    setEmails(data || []);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }
    
    setTemplates(data || []);
  };

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching campaigns:', error);
      return;
    }
    
    setCampaigns(data || []);
  };

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('emails')
      .select('status');
    
    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }
    
    const total = data?.length || 0;
    const delivered = data?.filter(e => e.status === 'delivered').length || 0;
    const pending = data?.filter(e => e.status === 'pending').length || 0;
    const failed = data?.filter(e => e.status === 'failed').length || 0;
    
    setStats({ total, delivered, pending, failed });
  };

  const handleSendEmail = async () => {
    if (!newEmail.recipient_email || !newEmail.subject || !newEmail.content) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    setSendingEmail(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('emails')
      .insert({
        recipient_email: newEmail.recipient_email,
        subject: newEmail.subject,
        content: newEmail.content,
        template_id: newEmail.template_id || null,
        status: 'pending',
        sent_by: user?.id
      });
    
    if (error) {
      console.error('Error sending email:', error);
      toast.error("حدث خطأ في إرسال البريد");
    } else {
      toast.success("تم إضافة البريد للإرسال");
      setNewEmailDialogOpen(false);
      setNewEmail({ type: "single", template_id: "", recipient_email: "", subject: "", content: "" });
    }
    
    setSendingEmail(false);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    setSavingTemplate(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('email_templates')
      .insert({
        name: newTemplate.name,
        subject: newTemplate.subject,
        content: newTemplate.content,
        type: newTemplate.type,
        created_by: user?.id
      });
    
    if (error) {
      console.error('Error saving template:', error);
      toast.error("حدث خطأ في حفظ القالب");
    } else {
      toast.success("تم حفظ القالب بنجاح");
      setNewTemplateDialogOpen(false);
      setNewTemplate({ name: "", subject: "", content: "", type: "manual" });
    }
    
    setSavingTemplate(false);
  };

  const handleSaveCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.content) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    setSavingCampaign(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('email_campaigns')
      .insert({
        name: newCampaign.name,
        subject: newCampaign.subject,
        content: newCampaign.content,
        target_audience: newCampaign.target_audience,
        created_by: user?.id
      });
    
    if (error) {
      console.error('Error saving campaign:', error);
      toast.error("حدث خطأ في حفظ الحملة");
    } else {
      toast.success("تم حفظ الحملة بنجاح");
      setNewCampaignDialogOpen(false);
      setNewCampaign({ name: "", subject: "", content: "", target_audience: "all" });
    }
    
    setSavingCampaign(false);
  };

  const handleDeleteEmail = async (id: string) => {
    const { error } = await supabase.from('emails').delete().eq('id', id);
    
    if (error) {
      toast.error("حدث خطأ في حذف البريد");
    } else {
      toast.success("تم حذف البريد بنجاح");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from('email_templates').delete().eq('id', id);
    
    if (error) {
      toast.error("حدث خطأ في حذف القالب");
    } else {
      toast.success("تم حذف القالب بنجاح");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const { error } = await supabase.from('email_campaigns').delete().eq('id', id);
    
    if (error) {
      toast.error("حدث خطأ في حذف الحملة");
    } else {
      toast.success("تم حذف الحملة بنجاح");
      setSelectedCampaignIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDeleteEmails = async () => {
    if (selectedEmailIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedEmailIds.length} رسالة؟`)) return;

    setBulkDeleting(true);
    const { error } = await supabase.from('emails').delete().in('id', selectedEmailIds);
    
    if (error) {
      toast.error("حدث خطأ في حذف الرسائل");
    } else {
      toast.success(`تم حذف ${selectedEmailIds.length} رسالة بنجاح`);
      setSelectedEmailIds([]);
    }
    setBulkDeleting(false);
  };

  const handleBulkDeleteTemplates = async () => {
    if (selectedTemplateIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedTemplateIds.length} قالب؟`)) return;

    setBulkDeleting(true);
    const { error } = await supabase.from('email_templates').delete().in('id', selectedTemplateIds);
    
    if (error) {
      toast.error("حدث خطأ في حذف القوالب");
    } else {
      toast.success(`تم حذف ${selectedTemplateIds.length} قالب بنجاح`);
      setSelectedTemplateIds([]);
    }
    setBulkDeleting(false);
  };

  const handleBulkDeleteCampaigns = async () => {
    if (selectedCampaignIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedCampaignIds.length} حملة؟`)) return;

    setBulkDeleting(true);
    const { error } = await supabase.from('email_campaigns').delete().in('id', selectedCampaignIds);
    
    if (error) {
      toast.error("حدث خطأ في حذف الحملات");
    } else {
      toast.success(`تم حذف ${selectedCampaignIds.length} حملة بنجاح`);
      setSelectedCampaignIds([]);
    }
    setBulkDeleting(false);
  };

  const handleTemplateChange = (templateId: string) => {
    setNewEmail(prev => ({ ...prev, template_id: templateId }));
    
    if (templateId && templateId !== "custom") {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setNewEmail(prev => ({
          ...prev,
          subject: template.subject,
          content: template.content
        }));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">تم التسليم</Badge>;
      case 'pending':
        return <Badge variant="secondary">في الانتظار</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
  };

  const filteredEmails = emails.filter(email => 
    email.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const emailStats = [
    { label: "إجمالي المرسل", value: stats.total.toLocaleString(), icon: Send, color: "from-primary to-primary/70" },
    { label: "تم التسليم", value: stats.delivered.toLocaleString(), icon: CheckCircle, color: "from-emerald-500 to-green-500" },
    { label: "في الانتظار", value: stats.pending.toLocaleString(), icon: Clock, color: "from-amber-500 to-yellow-500" },
    { label: "فشل الإرسال", value: stats.failed.toLocaleString(), icon: XCircle, color: "from-destructive to-red-500" },
  ];

  return (
    <AdminDashboardLayout>
      <div className="space-y-4 md:space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-3">
          <Dialog open={newEmailDialogOpen} onOpenChange={setNewEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs sm:text-sm order-1 sm:order-none">
                <Plus className="w-3.5 h-3.5" />
                <span>إنشاء رسالة</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء رسالة بريد جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع الرسالة</label>
                    <Select value={newEmail.type} onValueChange={(value) => setNewEmail(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">مستخدم واحد</SelectItem>
                        <SelectItem value="group">مجموعة</SelectItem>
                        <SelectItem value="all">جميع المستخدمين</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">القالب</label>
                    <Select value={newEmail.template_id} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قالب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">مخصص</SelectItem>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المستلم</label>
                  <Input 
                    placeholder="البريد الإلكتروني" 
                    value={newEmail.recipient_email}
                    onChange={(e) => setNewEmail(prev => ({ ...prev, recipient_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">العنوان</label>
                  <Input 
                    placeholder="عنوان الرسالة" 
                    value={newEmail.subject}
                    onChange={(e) => setNewEmail(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المحتوى</label>
                  <Textarea 
                    placeholder="محتوى الرسالة..." 
                    className="min-h-[150px]" 
                    value={newEmail.content}
                    onChange={(e) => setNewEmail(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setNewEmailDialogOpen(false)}>إلغاء</Button>
                  <Button className="gap-2" onClick={handleSendEmail} disabled={sendingEmail}>
                    {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    إرسال الآن
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">إدارة البريد الإلكتروني</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">إدارة الرسائل والقوالب والحملات</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {emailStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sent" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-md text-xs sm:text-sm">
            <TabsTrigger value="sent" className="gap-1 sm:gap-2 px-2">
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">المرسلة</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1 sm:gap-2 px-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">القوالب</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1 sm:gap-2 px-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">الحملات</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-1 sm:gap-2 px-2">
              <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">الواردة</span>
            </TabsTrigger>
          </TabsList>

          {/* Sent Emails */}
          <TabsContent value="sent">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  الرسائل المرسلة
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="بحث..." 
                      className="pr-9 w-48" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد رسائل مرسلة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEmails.map((email, index) => (
                      <motion.div
                        key={email.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{email.subject}</p>
                            <p className="text-sm text-muted-foreground">{email.recipient_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(email.status)}
                          <span className="text-sm text-muted-foreground hidden md:block">{formatDate(email.created_at)}</span>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedEmail(email);
                                setViewEmailDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteEmail(email.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  قوالب البريد
                </CardTitle>
                <Dialog open={newTemplateDialogOpen} onOpenChange={setNewTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      قالب جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>إنشاء قالب جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">اسم القالب</label>
                          <Input 
                            placeholder="اسم القالب" 
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">النوع</label>
                          <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">يدوي</SelectItem>
                              <SelectItem value="auto">تلقائي</SelectItem>
                              <SelectItem value="campaign">حملة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">العنوان</label>
                        <Input 
                          placeholder="عنوان الرسالة" 
                          value={newTemplate.subject}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">المحتوى</label>
                        <Textarea 
                          placeholder="محتوى الرسالة..." 
                          className="min-h-[150px]" 
                          value={newTemplate.content}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setNewTemplateDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
                          {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                          حفظ القالب
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد قوالب</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2">
                                <Edit className="w-4 h-4" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2 text-destructive"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h3 className="font-medium mb-1">{template.name}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">{template.type === 'auto' ? 'تلقائي' : template.type === 'campaign' ? 'حملة' : 'يدوي'}</Badge>
                          <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                            {template.status === 'active' ? 'نشط' : 'مسودة'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          تم الاستخدام {template.usage_count} مرة
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns */}
          <TabsContent value="campaigns">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  الحملات البريدية
                </CardTitle>
                <Dialog open={newCampaignDialogOpen} onOpenChange={setNewCampaignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      إنشاء حملة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>إنشاء حملة بريدية جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">اسم الحملة</label>
                          <Input 
                            placeholder="اسم الحملة" 
                            value={newCampaign.name}
                            onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">الجمهور المستهدف</label>
                          <Select value={newCampaign.target_audience} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, target_audience: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الجمهور" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع المستخدمين</SelectItem>
                              <SelectItem value="verified">المستخدمين الموثقين</SelectItem>
                              <SelectItem value="new">المستخدمين الجدد</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">العنوان</label>
                        <Input 
                          placeholder="عنوان الرسالة" 
                          value={newCampaign.subject}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">المحتوى</label>
                        <Textarea 
                          placeholder="محتوى الرسالة..." 
                          className="min-h-[150px]" 
                          value={newCampaign.content}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setNewCampaignDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSaveCampaign} disabled={savingCampaign}>
                          {savingCampaign ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                          حفظ الحملة
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد حملات</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((campaign, index) => (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'completed' ? 'secondary' : 'outline'}>
                            {campaign.status === 'active' ? 'نشط' : campaign.status === 'completed' ? 'مكتمل' : 'مسودة'}
                          </Badge>
                          <span className="text-sm text-muted-foreground hidden md:block">
                            {campaign.sent_count} / {campaign.total_recipients}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inbox */}
          <TabsContent value="inbox">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="w-5 h-5" />
                  صندوق الوارد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد رسائل واردة</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Email Dialog */}
        <Dialog open={viewEmailDialogOpen} onOpenChange={setViewEmailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الرسالة</DialogTitle>
            </DialogHeader>
            {selectedEmail && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">المستلم</p>
                    <p className="font-medium">{selectedEmail.recipient_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    {getStatusBadge(selectedEmail.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{selectedEmail.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المحتوى</p>
                  <div className="p-4 bg-secondary/30 rounded-xl mt-1 whitespace-pre-wrap">
                    {selectedEmail.content}
                  </div>
                </div>
                {selectedEmail.error_message && (
                  <div>
                    <p className="text-sm text-destructive">رسالة الخطأ</p>
                    <p className="text-destructive">{selectedEmail.error_message}</p>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  تاريخ الإنشاء: {format(new Date(selectedEmail.created_at), 'PPpp', { locale: ar })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminEmails;