import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, Shield, Palette, Globe, Loader2, RefreshCw, Save, Eye, EyeOff, Phone, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

const ClientSettings = () => {
  const { t } = useLanguage();
  const { settings, loading, saving, updateSetting, refetch } = useUserSettings();
  const { user, profile, refetchProfile } = useAuth();
  
  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Phone verification state
  const [verificationStep, setVerificationStep] = useState<'idle' | 'sending' | 'verify' | 'verifying'>('idle');
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneToVerify, setPhoneToVerify] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSendVerificationCode = async () => {
    if (!phone || phone.length < 9) {
      toast.error('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setVerificationStep('sending');
    setPhoneToVerify(phone);

    try {
      const { data, error } = await supabase.functions.invoke('verify-phone', {
        body: { phone, action: 'send' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setVerificationStep('verify');
      toast.success('تم إرسال رمز التحقق إلى رقمك');
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      toast.error(error.message || 'فشل في إرسال رمز التحقق');
      setVerificationStep('idle');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      toast.error('يرجى إدخال رمز التحقق');
      return;
    }

    setVerificationStep('verifying');

    try {
      const { data, error } = await supabase.functions.invoke('verify-phone', {
        body: { 
          phone: phoneToVerify, 
          action: 'verify', 
          code: verificationCode,
          userId: user?.id 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      if (data.valid) {
        toast.success('تم التحقق من رقم الهاتف بنجاح! ✅');
        setVerificationStep('idle');
        setVerificationCode("");
        refetchProfile?.();
      } else {
        toast.error('رمز التحقق غير صحيح');
        setVerificationStep('verify');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast.error(error.message || 'فشل في التحقق من الرمز');
      setVerificationStep('verify');
    }
  };

  const handleCancelVerification = () => {
    setVerificationStep('idle');
    setVerificationCode("");
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('تم تحديث معلومات الحساب بنجاح');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('فشل في تحديث معلومات الحساب');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (!currentPassword) {
      toast.error(t('أدخل كلمة المرور الحالية', 'Enter your current password'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      });

      if (error) throw error;
      
      toast.success('تم تحديث كلمة المرور بنجاح');
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error updating password:', error);
      const msg = String(error?.message || '').toLowerCase();
      const code = String(error?.code || '');
      if (code === 'weak_password' || msg.includes('pwned') || msg.includes('weak') || msg.includes('known')) {
        toast.error(t('كلمة المرور ضعيفة أو مسرّبة، اختر كلمة أقوى', 'Password is weak or has appeared in a data leak. Choose a stronger one.'));
      } else if (code === 'current_password_mismatch' || code === 'current_password_required' || msg.includes('current password')) {
        toast.error(t('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect'));
      } else {
        toast.error(t('فشل في تحديث كلمة المرور', 'Failed to update password'));
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleNotification = async (key: string, value: boolean) => {
    await updateSetting(key as any, value);
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  const notificationOptions = [
    { 
      key: 'notification_email', 
      label: 'إشعارات البريد', 
      desc: 'تلقي التحديثات عبر البريد الإلكتروني',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      key: 'notification_orders', 
      label: 'إشعارات الطلبات', 
      desc: 'تحديثات حالة الطلبات الخاصة بك',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      key: 'notification_promotions', 
      label: 'العروض والتخفيضات', 
      desc: 'إشعارات العروض الخاصة والتخفيضات',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      key: 'notification_push', 
      label: 'الإشعارات الفورية', 
      desc: 'إشعارات في المتصفح',
      color: 'from-yellow-500 to-orange-500'
    },
  ];

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 md:space-y-8 px-1" dir="rtl">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <h1 className="font-display text-xl md:text-3xl font-bold">الإعدادات</h1>
              <Badge variant="outline" className="text-[10px] md:text-xs">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse ml-1" />
                متصل
              </Badge>
            </div>
            <p className="text-xs md:text-base text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              variant="outline" 
              onClick={refetch}
              className="gap-2 h-9 md:h-10 text-sm"
              size="sm"
            >
              <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
              تحديث
            </Button>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  معلومات الحساب
                </CardTitle>
                <CardDescription>تحديث معلوماتك الشخصية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">الاسم الكامل</label>
                  <Input 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-secondary/50" 
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">البريد الإلكتروني</label>
                  <Input 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-secondary/30 opacity-60" 
                    dir="ltr" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">لا يمكن تغيير البريد الإلكتروني</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                    {profile?.phone_verified && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        موثق
                      </Badge>
                    )}
                  </label>
                  
                  {verificationStep === 'idle' && (
                    <div className="space-y-3">
                      <Input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-secondary/50" 
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                      {phone && !profile?.phone_verified && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleSendVerificationCode}
                          className="gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          التحقق من الرقم
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">سيتم استخدامه لإرسال رسائل SMS</p>
                    </div>
                  )}

                  {verificationStep === 'sending' && (
                    <div className="flex items-center gap-2 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm">جاري إرسال رمز التحقق...</span>
                    </div>
                  )}

                  {verificationStep === 'verify' && (
                    <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium">أدخل رمز التحقق المرسل إلى {phoneToVerify}</p>
                      <Input 
                        value={verificationCode} 
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="bg-background text-center text-lg tracking-widest"
                        placeholder="• • • • • •"
                        maxLength={6}
                        dir="ltr"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleVerifyCode}
                          size="sm"
                          className="bg-gradient-primary flex-1"
                        >
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                          تأكيد
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCancelVerification}
                        >
                          <XCircle className="w-4 h-4 ml-2" />
                          إلغاء
                        </Button>
                      </div>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={handleSendVerificationCode}
                        className="text-xs p-0 h-auto"
                      >
                        إعادة إرسال الرمز
                      </Button>
                    </div>
                  )}

                  {verificationStep === 'verifying' && (
                    <div className="flex items-center gap-2 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm">جاري التحقق...</span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20">
                    <Lock className="w-5 h-5 text-yellow-500" />
                  </div>
                  الأمان
                </CardTitle>
                <CardDescription>تغيير كلمة المرور وإعدادات الأمان</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">كلمة المرور الحالية</label>
                  <Input 
                    type={showPasswords ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="bg-secondary/50 pl-10" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">كلمة المرور الجديدة</label>
                  <Input 
                    type={showPasswords ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="bg-secondary/50" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">تأكيد كلمة المرور</label>
                  <Input 
                    type={showPasswords ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="bg-secondary/50" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-muted-foreground"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4 ml-1" /> : <Eye className="w-4 h-4 ml-1" />}
                    {showPasswords ? 'إخفاء' : 'إظهار'}
                  </Button>
                </div>
                <Button 
                  variant="outline"
                  onClick={handleUpdatePassword}
                  disabled={savingPassword || !newPassword || !confirmPassword}
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    'تحديث كلمة المرور'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20">
                    <Palette className="w-5 h-5 text-pink-500" />
                  </div>
                  المظهر واللغة
                </CardTitle>
                <CardDescription>تخصيص مظهر التطبيق</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">السمة</label>
                    <Select 
                      value={settings?.theme || 'system'} 
                      onValueChange={(value) => updateSetting('theme', value)}
                    >
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">تلقائي (حسب النظام)</SelectItem>
                        <SelectItem value="light">فاتح</SelectItem>
                        <SelectItem value="dark">داكن</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">اللغة</label>
                    <Select 
                      value={settings?.language || 'ar'} 
                      onValueChange={(value) => updateSetting('language', value)}
                    >
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {saving === 'theme' || saving === 'language' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحفظ...
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>

          {/* Side Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
                    <Bell className="w-5 h-5 text-blue-500" />
                  </div>
                  الإشعارات
                </CardTitle>
                <CardDescription>تحكم في إشعاراتك</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {notificationOptions.map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color}`} />
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {saving === item.key && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      <Switch 
                        checked={settings?.[item.key as keyof typeof settings] === true}
                        onCheckedChange={(checked) => handleToggleNotification(item.key, checked)}
                        disabled={saving === item.key}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  التحقق بخطوتين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  أضف طبقة إضافية من الأمان لحسابك
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {settings?.two_factor_enabled ? 'مفعّل' : 'غير مفعّل'}
                  </span>
                  <div className="flex items-center gap-2">
                    {saving === 'two_factor_enabled' && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    <Switch 
                      checked={settings?.two_factor_enabled || false}
                      onCheckedChange={(checked) => updateSetting('two_factor_enabled', checked)}
                      disabled={saving === 'two_factor_enabled'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50 border-destructive/30">
              <CardHeader>
                <CardTitle className="font-display text-destructive">منطقة الخطر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  حذف الحساب نهائياً وجميع البيانات المرتبطة
                </p>
                <Button variant="destructive" className="w-full">حذف الحساب</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>جميع الإعدادات محفوظة ومتزامنة في الوقت الفعلي</span>
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSettings;
