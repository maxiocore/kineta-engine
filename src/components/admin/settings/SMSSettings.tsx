import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Save, TestTube, Loader2, CheckCircle, XCircle, Info } from "lucide-react";

interface SMSConfig {
  enabled: boolean;
  sender_name: string;
}

const defaultConfig: SMSConfig = {
  enabled: true,
  sender_name: 'MaxioCore',
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
      // Fetch SMS config
      const { data: smsConfig, error: configError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'sms_config')
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      // Fetch SMS enabled status
      const { data: smsEnabled, error: enabledError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'sms_notifications_enabled')
        .single();

      if (enabledError && enabledError.code !== 'PGRST116') {
        throw enabledError;
      }

      const savedConfig = smsConfig?.value as unknown as Partial<SMSConfig> || {};
      const isEnabled = smsEnabled?.value !== 'false';

      setConfig({
        ...defaultConfig,
        ...savedConfig,
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
            provider: 'messagebird',
            sender_name: config.sender_name,
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
          message: 'هذه رسالة اختبار من MaxioCore - تم إرسالها بنجاح!',
          type: 'general'
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('تم إرسال رسالة الاختبار بنجاح عبر MessageBird!');
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
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">إعدادات الرسائل النصية SMS</CardTitle>
                <CardDescription>إدارة إرسال الرسائل النصية عبر MessageBird</CardDescription>
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
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">MessageBird (Bird)</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">بوابة رسائل عالمية متقدمة - موصى بها</p>
            </div>
          </div>

          <Separator />

          {/* Sender Name */}
          <div className="space-y-4">
            <h3 className="font-medium">اسم المرسل</h3>
            <div className="space-y-2">
              <Label htmlFor="sender-name">Sender Name / ID</Label>
              <Input
                id="sender-name"
                placeholder="MaxioCore"
                value={config.sender_name}
                onChange={(e) => setConfig({ ...config, sender_name: e.target.value })}
                dir="ltr"
                className="max-w-sm"
              />
              <p className="text-xs text-muted-foreground">
                يمكنك استخدام اسم علامتك التجارية أو رقم هاتف مسجل. الحد الأقصى 11 حرف.
              </p>
            </div>
          </div>

          <Separator />

          {/* API Configuration Info */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <p className="font-medium">إعداد MessageBird (Bird):</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                  <li>انتقل إلى <a href="https://dashboard.messagebird.com" target="_blank" rel="noopener noreferrer" className="underline">MessageBird Dashboard</a></li>
                  <li>أنشئ حساب أو سجل الدخول</li>
                  <li>انتقل إلى Developers → API Access → Create new access key</li>
                  <li>اختر صلاحية "Channels Sending and Receiving"</li>
                  <li>انسخ الـ Access Key وأضفه في Secrets</li>
                </ol>
                <p className="text-xs mt-2">
                  المتغير المطلوب: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">MESSAGEBIRD_API_KEY</code>
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test SMS */}
          <div className="space-y-4">
            <h3 className="font-medium">اختبار الإرسال</h3>
            <div className="flex gap-3">
              <Input
                placeholder="رقم الهاتف للاختبار (مثال: 0555123456)"
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
          </div>

          <Separator />

          {/* Status & Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.enabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    مفعل - MessageBird
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
