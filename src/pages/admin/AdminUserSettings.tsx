import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Settings, Search, RefreshCw, Bell, BellOff, Shield, ShieldOff, Eye, Loader2 } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserSetting {
  id: string;
  user_id: string;
  notification_email: boolean;
  notification_orders: boolean;
  notification_promotions: boolean;
  notification_push: boolean;
  language: string;
  theme: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const AdminUserSettings = () => {
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSetting | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      // Fetch settings
      const { data: settingsOnly, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (settingsError) throw settingsError;

      // Fetch profiles separately
      const userIds = settingsOnly?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const settingsWithProfiles: UserSetting[] = settingsOnly?.map(setting => ({
        ...setting,
        profile: profiles?.find(p => p.id === setting.user_id) || { full_name: null, email: null }
      })) || [];

      setUserSettings(settingsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching user settings:', error);
      toast.error('فشل في تحميل إعدادات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSettings();

    // Real-time subscription
    const channel = supabase
      .channel('admin-user-settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings'
        },
        () => {
          fetchUserSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateSetting = async (userId: string, key: string, value: any) => {
    setUpdating(`${userId}-${key}`);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          [key]: value,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('user_id', userId);

      if (error) throw error;

      setUserSettings(prev => prev.map(s => 
        s.user_id === userId ? { ...s, [key]: value } : s
      ));

      if (selectedUser?.user_id === userId) {
        setSelectedUser(prev => prev ? { ...prev, [key]: value } : null);
      }

      toast.success('تم تحديث الإعداد بنجاح');
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast.error('فشل في تحديث الإعداد');
    } finally {
      setUpdating(null);
    }
  };

  const filteredSettings = userSettings.filter(setting => {
    const searchLower = searchQuery.toLowerCase();
    return (
      setting.profile?.full_name?.toLowerCase().includes(searchLower) ||
      setting.profile?.email?.toLowerCase().includes(searchLower) ||
      setting.user_id.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: userSettings.length,
    emailEnabled: userSettings.filter(s => s.notification_email).length,
    twoFactorEnabled: userSettings.filter(s => s.two_factor_enabled).length,
    pushEnabled: userSettings.filter(s => s.notification_push).length,
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-9 w-64" />
          <div className="grid sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
              >
                <Settings className="w-6 h-6 text-primary" />
              </motion.div>
              <h1 className="font-display text-3xl font-bold">إعدادات المستخدمين</h1>
              <Badge variant="outline" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />
                لحظي
              </Badge>
            </div>
            <p className="text-muted-foreground">إدارة ومتابعة إعدادات جميع المستخدمين</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="outline" 
              onClick={fetchUserSettings}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إشعارات البريد</p>
                    <p className="text-2xl font-bold text-blue-500">{stats.emailEnabled}</p>
                  </div>
                  <Bell className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">التحقق بخطوتين</p>
                    <p className="text-2xl font-bold text-green-500">{stats.twoFactorEnabled}</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الإشعارات الفورية</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats.pushEnabled}</p>
                  </div>
                  <Bell className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search & Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <CardTitle className="font-display">قائمة الإعدادات</CardTitle>
                  <CardDescription>عرض وإدارة إعدادات المستخدمين</CardDescription>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو البريد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-secondary/50"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead className="text-center">البريد</TableHead>
                      <TableHead className="text-center">الطلبات</TableHead>
                      <TableHead className="text-center">العروض</TableHead>
                      <TableHead className="text-center">2FA</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          لا توجد نتائج
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSettings.map((setting) => (
                        <TableRow key={setting.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{setting.profile?.full_name || 'بدون اسم'}</p>
                              <p className="text-xs text-muted-foreground">{setting.profile?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {updating === `${setting.user_id}-notification_email` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Switch
                                  checked={setting.notification_email}
                                  onCheckedChange={(checked) => 
                                    handleUpdateSetting(setting.user_id, 'notification_email', checked)
                                  }
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {updating === `${setting.user_id}-notification_orders` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Switch
                                  checked={setting.notification_orders}
                                  onCheckedChange={(checked) => 
                                    handleUpdateSetting(setting.user_id, 'notification_orders', checked)
                                  }
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {updating === `${setting.user_id}-notification_promotions` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Switch
                                  checked={setting.notification_promotions}
                                  onCheckedChange={(checked) => 
                                    handleUpdateSetting(setting.user_id, 'notification_promotions', checked)
                                  }
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {setting.two_factor_enabled ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-500">
                                <Shield className="w-3 h-3 ml-1" />
                                مفعّل
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <ShieldOff className="w-3 h-3 ml-1" />
                                غير مفعّل
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedUser(setting)}
                                >
                                  <Eye className="w-4 h-4 ml-1" />
                                  عرض
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="font-display">
                                    إعدادات {setting.profile?.full_name || 'المستخدم'}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                                    <span>السمة</span>
                                    <Badge variant="outline">
                                      {setting.theme === 'dark' ? 'داكن' : setting.theme === 'light' ? 'فاتح' : 'تلقائي'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                                    <span>اللغة</span>
                                    <Badge variant="outline">
                                      {setting.language === 'ar' ? 'العربية' : 'English'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                                    <span>إشعارات البريد</span>
                                    {setting.notification_email ? (
                                      <Bell className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <BellOff className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                                    <span>إشعارات الطلبات</span>
                                    {setting.notification_orders ? (
                                      <Bell className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <BellOff className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                                    <span>إشعارات العروض</span>
                                    {setting.notification_promotions ? (
                                      <Bell className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <BellOff className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                                    <span>الإشعارات الفورية</span>
                                    {setting.notification_push ? (
                                      <Bell className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <BellOff className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                                    <span>التحقق بخطوتين</span>
                                    {setting.two_factor_enabled ? (
                                      <Shield className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <ShieldOff className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground pt-2">
                                    آخر تحديث: {new Date(setting.updated_at).toLocaleString('ar-SA')}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>متابعة التغييرات في الوقت الفعلي</span>
        </motion.div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminUserSettings;
