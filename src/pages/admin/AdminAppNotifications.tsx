import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Plus, 
  Send, 
  Users, 
  Eye, 
  Trash2, 
  Edit,
  Mail,
  Smartphone,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  Gift,
  Megaphone,
  AlertCircle,
  Sparkles,
  Image,
  Link,
  FileText,
  Zap,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AppNotification {
  id: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: string;
  image_url?: string;
  action_url?: string;
  target_audience: string;
  target_user_ids: string[];
  is_active: boolean;
  send_push: boolean;
  send_email: boolean;
  sent_count: number;
  read_count: number;
  scheduled_at?: string;
  sent_at?: string;
  expires_at?: string;
  created_at: string;
}

interface NotificationStats {
  total: number;
  sent: number;
  pending: number;
  totalReads: number;
  activeSubscribers: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  name_ar: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: string;
  icon: any;
  color: string;
}

const notificationTypes = [
  { value: 'general', label: 'عام', icon: Bell, color: 'bg-blue-500', textColor: 'text-blue-500' },
  { value: 'offer', label: 'عرض', icon: Gift, color: 'bg-green-500', textColor: 'text-green-500' },
  { value: 'announcement', label: 'إعلان', icon: Megaphone, color: 'bg-purple-500', textColor: 'text-purple-500' },
  { value: 'alert', label: 'تنبيه', icon: AlertCircle, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { value: 'update', label: 'تحديث', icon: RefreshCw, color: 'bg-cyan-500', textColor: 'text-cyan-500' },
];

const templates: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    name_ar: 'ترحيب',
    title: 'Welcome to ASH HOLDING!',
    title_ar: 'مرحباً بك في ASH HOLDING!',
    message: 'We\'re excited to have you. Explore our services and grow your business.',
    message_ar: 'نحن سعداء بانضمامك إلينا. استكشف خدماتنا ونمّي أعمالك معنا.',
    type: 'general',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'promo',
    name: 'Promo/Offer',
    name_ar: 'عرض ترويجي',
    title: 'Special Offer Just for You!',
    title_ar: 'عرض خاص لك فقط!',
    message: 'Don\'t miss out on our exclusive discount. Limited time only!',
    message_ar: 'لا تفوّت خصمنا الحصري. لفترة محدودة فقط!',
    type: 'offer',
    icon: Gift,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'reminder',
    name: 'Reminder',
    name_ar: 'تذكير',
    title: 'Don\'t Forget!',
    title_ar: 'لا تنسَ!',
    message: 'You have pending items that need your attention.',
    message_ar: 'لديك عناصر معلقة تحتاج انتباهك.',
    type: 'alert',
    icon: Clock,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'status',
    name: 'Status Update',
    name_ar: 'تحديث الحالة',
    title: 'Order Status Updated',
    title_ar: 'تم تحديث حالة الطلب',
    message: 'Your order status has been updated. Check it now.',
    message_ar: 'تم تحديث حالة طلبك. تحقق منه الآن.',
    type: 'update',
    icon: RefreshCw,
    color: 'from-cyan-500 to-blue-500',
  },
];

const AdminAppNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ 
    total: 0, sent: 0, pending: 0, totalReads: 0, activeSubscribers: 0 
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AppNotification | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'ios' | 'android'>('ios');
  
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    message: '',
    message_ar: '',
    type: 'general',
    image_url: '',
    action_url: '',
    target_audience: 'all',
    send_push: true,
    send_email: false,
    is_active: true,
  });

  useEffect(() => {
    fetchNotifications();
    fetchSubscriberCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('app_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifs = (data || []) as AppNotification[];
      setNotifications(notifs);

      const total = notifs.length;
      const sent = notifs.filter(n => n.sent_at).length;
      const pending = notifs.filter(n => !n.sent_at && n.is_active).length;
      const totalReads = notifs.reduce((sum, n) => sum + (n.read_count || 0), 0);

      setStats(prev => ({ ...prev, total, sent, pending, totalReads }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('فشل في تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriberCount = async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setStats(prev => ({ ...prev, activeSubscribers: count || 0 }));
    } catch (error) {
      console.error('Error fetching subscriber count:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title_ar || !formData.message_ar) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      if (editingNotification) {
        const { error } = await supabase
          .from('app_notifications')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNotification.id);

        if (error) throw error;
        toast.success('تم تحديث الإشعار بنجاح');
      } else {
        const { error } = await supabase
          .from('app_notifications')
          .insert([formData]);

        if (error) throw error;
        toast.success('تم إنشاء الإشعار بنجاح');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('فشل في حفظ الإشعار');
    }
  };

  const handleSendNotification = async (notification: AppNotification) => {
    setSending(notification.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-app-notification', {
        body: {
          notification_id: notification.id,
          send_push: notification.send_push,
          send_email: notification.send_email,
        },
      });

      if (error) throw error;

      toast.success(`تم إرسال الإشعار إلى ${data.sent_count} مستخدم`);
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('فشل في إرسال الإشعار');
    } finally {
      setSending(null);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;

    try {
      const { error } = await supabase
        .from('app_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف الإشعار');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('فشل في حذف الإشعار');
    }
  };

  const handleEdit = (notification: AppNotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      title_ar: notification.title_ar,
      message: notification.message,
      message_ar: notification.message_ar,
      type: notification.type,
      image_url: notification.image_url || '',
      action_url: notification.action_url || '',
      target_audience: notification.target_audience,
      send_push: notification.send_push,
      send_email: notification.send_email,
      is_active: notification.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingNotification(null);
    setFormData({
      title: '',
      title_ar: '',
      message: '',
      message_ar: '',
      type: 'general',
      image_url: '',
      action_url: '',
      target_audience: 'all',
      send_push: true,
      send_email: false,
      is_active: true,
    });
  };

  const applyTemplate = (template: NotificationTemplate) => {
    setFormData({
      ...formData,
      title: template.title,
      title_ar: template.title_ar,
      message: template.message,
      message_ar: template.message_ar,
      type: template.type,
    });
    toast.success(`تم تطبيق قالب "${template.name_ar}"`);
  };

  const getTypeInfo = (type: string) => {
    return notificationTypes.find(t => t.value === type) || notificationTypes[0];
  };

  // Preview Component
  const NotificationPreview = ({ device }: { device: 'ios' | 'android' }) => {
    const typeInfo = getTypeInfo(formData.type);
    
    if (device === 'ios') {
      return (
        <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-[2.5rem] p-3 max-w-[280px] mx-auto shadow-2xl">
          {/* iOS Status Bar */}
          <div className="flex justify-between items-center px-6 py-2 text-xs">
            <span className="font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-current rounded-sm">
                <div className="w-2/3 h-full bg-current rounded-sm" />
              </div>
            </div>
          </div>
          
          {/* Notification Card */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-4 mx-2"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${typeInfo.color} flex items-center justify-center`}>
                  <typeInfo.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">ASH HOLDING</span>
                    <span className="text-xs text-gray-400">الآن</span>
                  </div>
                  <h4 className="font-semibold text-sm mt-1 text-gray-900 dark:text-white">
                    {formData.title_ar || 'عنوان الإشعار'}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {formData.message_ar || 'محتوى الإشعار سيظهر هنا...'}
                  </p>
                </div>
              </div>
              {formData.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img src={formData.image_url} alt="" className="w-full h-32 object-cover" />
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Home Indicator */}
          <div className="flex justify-center mt-6 pb-2">
            <div className="w-32 h-1 bg-gray-400 rounded-full" />
          </div>
        </div>
      );
    }

    // Android Preview
    return (
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-2 max-w-[280px] mx-auto shadow-2xl">
        {/* Android Status Bar */}
        <div className="flex justify-between items-center px-4 py-2 text-xs text-gray-400">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-current rounded-full" />
            <div className="flex gap-0.5">
              {[1,2,3,4].map(i => (
                <div key={i} className={`w-0.5 h-${i} bg-current rounded-full`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Notification */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 mx-2"
        >
          <div className="bg-gray-800 rounded-xl p-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center`}>
                <typeInfo.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">ASH HOLDING • الآن</span>
                </div>
                <h4 className="font-medium text-sm text-white mt-0.5">
                  {formData.title_ar || 'عنوان الإشعار'}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                  {formData.message_ar || 'محتوى الإشعار سيظهر هنا...'}
                </p>
              </div>
            </div>
            {formData.image_url && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <img src={formData.image_url} alt="" className="w-full h-28 object-cover" />
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Android Nav Bar */}
        <div className="flex justify-center gap-8 mt-8 pb-2">
          <div className="w-4 h-4 border-2 border-gray-600 rounded-sm" />
          <div className="w-4 h-4 border-2 border-gray-600 rounded-full" />
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-600" />
        </div>
      </div>
    );
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              إشعارات التطبيق
            </h1>
            <p className="text-muted-foreground mt-1">إدارة وإرسال الإشعارات للمستخدمين</p>
          </div>
          
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2" size="lg">
            <Plus className="h-5 w-5" />
            إشعار جديد
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
                  <p className="text-xs text-muted-foreground">المشتركين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">الإجمالي</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.sent}</p>
                  <p className="text-xs text-muted-foreground">تم الإرسال</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">في الانتظار</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <Eye className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReads}</p>
                  <p className="text-xs text-muted-foreground">المشاهدات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Form & Templates */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="create" className="gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">إنشاء</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">قوالب</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="w-4 h-4" />
                      <span className="hidden sm:inline">السجل</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent>
                <AnimatePresence mode="wait">
                  {activeTab === 'create' && (
                    <motion.form 
                      key="create"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleSubmit} 
                      className="space-y-6"
                    >
                      {/* Title Fields */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <span className="text-destructive">*</span>
                            العنوان (عربي)
                          </Label>
                          <Input
                            value={formData.title_ar}
                            onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                            placeholder="عنوان الإشعار بالعربية"
                            className="text-right"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>العنوان (إنجليزي)</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Title in English"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Message Fields */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <span className="text-destructive">*</span>
                            الرسالة (عربي)
                          </Label>
                          <Textarea
                            value={formData.message_ar}
                            onChange={(e) => setFormData({ ...formData, message_ar: e.target.value })}
                            placeholder="نص الإشعار بالعربية"
                            rows={3}
                            className="text-right resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الرسالة (إنجليزي)</Label>
                          <Textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Message in English"
                            rows={3}
                            dir="ltr"
                            className="resize-none"
                          />
                        </div>
                      </div>

                      {/* Type & Audience */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>نوع الإشعار</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {notificationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>الجمهور المستهدف</Label>
                          <Select
                            value={formData.target_audience}
                            onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع المستخدمين</SelectItem>
                              <SelectItem value="active">المستخدمون النشطون</SelectItem>
                              <SelectItem value="new">المستخدمون الجدد</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Media & Links */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            رابط الصورة
                          </Label>
                          <Input
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://..."
                            type="url"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            رابط الإجراء
                          </Label>
                          <Input
                            value={formData.action_url}
                            onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                            placeholder="https://..."
                            type="url"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Delivery Options */}
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="send_push"
                            checked={formData.send_push}
                            onCheckedChange={(checked) => setFormData({ ...formData, send_push: checked })}
                          />
                          <Label htmlFor="send_push" className="flex items-center gap-2 cursor-pointer">
                            <Smartphone className="h-4 w-4 text-primary" />
                            إشعار Push
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            id="send_email"
                            checked={formData.send_email}
                            onCheckedChange={(checked) => setFormData({ ...formData, send_email: checked })}
                          />
                          <Label htmlFor="send_email" className="flex items-center gap-2 cursor-pointer">
                            <Mail className="h-4 w-4 text-blue-500" />
                            بريد إلكتروني
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                          />
                          <Label htmlFor="is_active" className="cursor-pointer">
                            نشط
                          </Label>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1 gap-2">
                          <Zap className="w-4 h-4" />
                          {editingNotification ? 'تحديث' : 'إنشاء الإشعار'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setShowPreview(!showPreview)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          معاينة
                        </Button>
                      </div>
                    </motion.form>
                  )}

                  {activeTab === 'templates' && (
                    <motion.div 
                      key="templates"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid sm:grid-cols-2 gap-4"
                    >
                      {templates.map((template) => (
                        <Card 
                          key={template.id}
                          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                          onClick={() => applyTemplate(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <template.icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold">{template.name_ar}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {template.message_ar}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div 
                      key="history"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {notifications.filter(n => n.sent_at).slice(0, 10).map((notification) => {
                            const typeInfo = getTypeInfo(notification.type);
                            return (
                              <div
                                key={notification.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center`}>
                                    <typeInfo.icon className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{notification.title_ar}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(notification.sent_at!), 'dd MMM yyyy - HH:mm', { locale: ar })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Send className="w-3 h-3" />
                                    {notification.sent_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {notification.read_count}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          
                          {notifications.filter(n => n.sent_at).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>لا يوجد سجل إرسال بعد</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  معاينة الإشعار
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={previewDevice === 'ios' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('ios')}
                  >
                    iOS
                  </Button>
                  <Button
                    variant={previewDevice === 'android' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('android')}
                  >
                    Android
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <NotificationPreview device={previewDevice} />
              </CardContent>
            </Card>

            {/* Pending Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    في الانتظار
                  </span>
                  <Badge variant="secondary">{stats.pending}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {notifications.filter(n => !n.sent_at && n.is_active).map((notification) => {
                      const typeInfo = getTypeInfo(notification.type);
                      return (
                        <div
                          key={notification.id}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                              <typeInfo.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{notification.title_ar}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {notification.message_ar}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => handleSendNotification(notification)}
                              disabled={sending === notification.id}
                            >
                              {sending === notification.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              إرسال
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(notification)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {notifications.filter(n => !n.sent_at && n.is_active).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">لا توجد إشعارات معلقة</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAppNotifications;
