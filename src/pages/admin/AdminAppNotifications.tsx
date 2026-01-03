import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
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
  Target,
  TrendingUp,
  MessageSquare,
  Gift,
  Megaphone,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
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
}

const notificationTypes = [
  { value: 'general', label: 'عام', icon: Bell, color: 'bg-blue-500' },
  { value: 'offer', label: 'عرض', icon: Gift, color: 'bg-green-500' },
  { value: 'announcement', label: 'إعلان', icon: Megaphone, color: 'bg-purple-500' },
  { value: 'alert', label: 'تنبيه', icon: AlertCircle, color: 'bg-yellow-500' },
  { value: 'update', label: 'تحديث', icon: RefreshCw, color: 'bg-cyan-500' },
];

const AdminAppNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, sent: 0, pending: 0, totalReads: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AppNotification | null>(null);
  
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

      // Calculate stats
      const total = notifs.length;
      const sent = notifs.filter(n => n.sent_at).length;
      const pending = notifs.filter(n => !n.sent_at && n.is_active).length;
      const totalReads = notifs.reduce((sum, n) => sum + (n.read_count || 0), 0);

      setStats({ total, sent, pending, totalReads });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('فشل في تحميل الإشعارات');
    } finally {
      setLoading(false);
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

  const getTypeInfo = (type: string) => {
    return notificationTypes.find(t => t.value === type) || notificationTypes[0];
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">إشعارات التطبيق</h1>
            <p className="text-muted-foreground mt-1">إدارة وإرسال الإشعارات للمستخدمين</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إشعار جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingNotification ? 'تعديل الإشعار' : 'إنشاء إشعار جديد'}
                </DialogTitle>
                <DialogDescription>
                  قم بإنشاء إشعار جديد لإرساله للمستخدمين
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>العنوان (عربي) *</Label>
                    <Input
                      value={formData.title_ar}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      placeholder="عنوان الإشعار بالعربية"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان (إنجليزي)</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Notification title in English"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الرسالة (عربي) *</Label>
                    <Textarea
                      value={formData.message_ar}
                      onChange={(e) => setFormData({ ...formData, message_ar: e.target.value })}
                      placeholder="نص الإشعار بالعربية"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الرسالة (إنجليزي)</Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Notification message in English"
                      rows={3}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <type.icon className="h-4 w-4" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رابط الصورة (اختياري)</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                      type="url"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رابط الإجراء (اختياري)</Label>
                    <Input
                      value={formData.action_url}
                      onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                      placeholder="https://..."
                      type="url"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.send_push}
                      onCheckedChange={(checked) => setFormData({ ...formData, send_push: checked })}
                    />
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      إشعار التطبيق
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.send_email}
                      onCheckedChange={(checked) => setFormData({ ...formData, send_email: checked })}
                    />
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      بريد إلكتروني
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>نشط</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingNotification ? 'تحديث' : 'إنشاء'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.sent}</p>
                  <p className="text-sm text-muted-foreground">تم الإرسال</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">في الانتظار</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Eye className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReads}</p>
                  <p className="text-sm text-muted-foreground">المشاهدات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الإشعارات</CardTitle>
            <CardDescription>جميع الإشعارات المنشأة</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد إشعارات بعد</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const typeInfo = getTypeInfo(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors gap-4"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                            <typeInfo.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate">{notification.title_ar}</h3>
                              <Badge variant={notification.sent_at ? 'default' : 'secondary'}>
                                {notification.sent_at ? 'تم الإرسال' : 'في الانتظار'}
                              </Badge>
                              {!notification.is_active && (
                                <Badge variant="outline">غير نشط</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message_ar}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(notification.created_at), 'dd MMM yyyy', { locale: ar })}
                              </span>
                              {notification.sent_at && (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Send className="h-3 w-3" />
                                    {notification.sent_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {notification.read_count}
                                  </span>
                                </>
                              )}
                              {notification.send_push && (
                                <span className="flex items-center gap-1">
                                  <Smartphone className="h-3 w-3" />
                                  Push
                                </span>
                              )}
                              {notification.send_email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  Email
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end md:self-center">
                          {!notification.sent_at && notification.is_active && (
                            <Button
                              size="sm"
                              onClick={() => handleSendNotification(notification)}
                              disabled={sending === notification.id}
                            >
                              {sending === notification.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  إرسال
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(notification)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAppNotifications;
