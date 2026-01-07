import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Save, TestTube, Loader2, CheckCircle, XCircle, Info, ExternalLink } from "lucide-react";

interface SMSConfig {
  enabled: boolean;
}

const defaultConfig: SMSConfig = {
  enabled: true,
};

export const SMSSettings = () => {
  const [config, setConfig] = useState<SMSConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch SMS enabled status
      const { data: smsEnabled, error: enabledError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'sms_notifications_enabled')
        .single();

      if (enabledError && enabledError.code !== 'PGRST116') {
        throw enabledError;
      }

      const isEnabled = smsEnabled?.value !== 'false';

      setConfig({
        enabled: isEnabled,
      });
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save SMS config
      const { error: configError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'sms_config',
          category: 'notifications',
          value: {
            provider: 'twilio',
          } as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (configError) throw configError;

      // Save SMS enabled status
      const { error: enabledError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'sms_notifications_enabled',
          category: 'notifications',
          value: config.enabled ? 'true' : 'false',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (enabledError) throw enabledError;

      toast.success('تم حفظ إعدادات الرسائل النصية بنجاح');
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const testSMS = async () => {
    if (!testPhone) {
      toast.error('يرجى إدخال رقم هاتف للاختبار');
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sms-notify', {
        body: {
          phone: testPhone,
          message: 'هذه رسالة اختبار من MaxioCore - تم إرسالها بنجاح عبر Twilio!',
          type: 'general'
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('تم إرسال رسالة الاختبار بنجاح عبر Twilio!');
      } else {
        toast.error(data?.error || 'فشل إرسال الرسالة');
      }
    } catch (error: any) {
      console.error('Error testing SMS:', error);
      toast.error(error.message || 'حدث خطأ أثناء الاختبار');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-lg">إعدادات الرسائل النصية SMS</CardTitle>
                <CardDescription>إدارة إرسال الرسائل النصية عبر Twilio</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sms-enabled" className="text-sm">تفعيل</Label>
              <Switch
                id="sms-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Info */}
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">Twilio</p>
              <p className="text-sm text-red-600 dark:text-red-400">منصة اتصالات سحابية عالمية - الأكثر استخداماً</p>
            </div>
            <a 
              href="https://www.twilio.com/console" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <ExternalLink className="w-4 h-4" />
              لوحة التحكم
            </a>
          </div>

          <Separator />

          {/* API Configuration Info */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300 space-y-2">
                <p className="font-medium">إعداد Twilio:</p>
                <ol className="list-decimal list-inside space-y-1 text-red-700 dark:text-red-400">
                  <li>انتقل إلى <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console</a></li>
                  <li>أنشئ حساب جديد أو سجل الدخول</li>
                  <li>احصل على <strong>Account SID</strong> و <strong>Auth Token</strong> من الصفحة الرئيسية</li>
                  <li>اشترِ رقم هاتف من Phone Numbers → Manage → Buy a number</li>
                  <li>أضف المتغيرات في Secrets</li>
                </ol>
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                  <p className="font-medium mb-2">المتغيرات المطلوبة:</p>
                  <ul className="space-y-1 font-mono text-xs">
                    <li><code className="bg-red-200 dark:bg-red-800 px-1 rounded">TWILIO_ACCOUNT_SID</code> - معرف الحساب</li>
                    <li><code className="bg-red-200 dark:bg-red-800 px-1 rounded">TWILIO_AUTH_TOKEN</code> - رمز المصادقة</li>
                    <li><code className="bg-red-200 dark:bg-red-800 px-1 rounded">TWILIO_PHONE_NUMBER</code> - رقم الإرسال (بصيغة +1234567890)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">99.9%</p>
              <p className="text-xs text-muted-foreground">نسبة التسليم</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">180+</p>
              <p className="text-xs text-muted-foreground">دولة مدعومة</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">API</p>
              <p className="text-xs text-muted-foreground">موثوق وسريع</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">24/7</p>
              <p className="text-xs text-muted-foreground">دعم فني</p>
            </div>
          </div>

          <Separator />

          {/* Test SMS */}
          <div className="space-y-4">
            <h3 className="font-medium">اختبار الإرسال</h3>
            <div className="flex gap-3">
              <Input
                placeholder="رقم الهاتف للاختبار (مثال: +966555123456)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                dir="ltr"
                className="max-w-xs"
              />
              <Button 
                variant="outline" 
                onClick={testSMS}
                disabled={testing || !config.enabled}
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <TestTube className="w-4 h-4 ml-2" />
                )}
                اختبار
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              أدخل رقم الهاتف بالصيغة الدولية (مثال: +966555123456 أو 0555123456)
            </p>
          </div>

          <Separator />

          {/* Status & Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.enabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    مفعل - Twilio
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">غير مفعل</span>
                </>
              )}
            </div>
            
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
