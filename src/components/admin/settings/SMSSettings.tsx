import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Save, TestTube, Loader2, CheckCircle, XCircle, Info, ExternalLink, RefreshCw, Clock, Phone } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface SMSConfig {
  enabled: boolean;
}

interface SMSLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  error_message?: string;
  type: string;
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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSMSLogs();
  }, []);

  const fetchSettings = async () => {
    try {
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

  const fetchSMSLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSmsLogs(data || []);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
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
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('sms-notify', {
        body: {
          phone: testPhone,
          message: 'مرحباً! هذه رسالة اختبار من ASH HOLDING 🎉 تم الإرسال بنجاح!',
          type: 'general'
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setTestResult({ success: true, message: 'تم إرسال الرسالة بنجاح! تحقق من هاتفك.' });
        toast.success('تم إرسال رسالة الاختبار بنجاح!');
      } else {
        setTestResult({ success: false, message: data?.error || 'فشل إرسال الرسالة' });
        toast.error(data?.error || 'فشل إرسال الرسالة');
      }
      
      // Refresh logs after test
      await fetchSMSLogs();
    } catch (error: any) {
      console.error('Error testing SMS:', error);
      setTestResult({ success: false, message: error.message || 'حدث خطأ أثناء الاختبار' });
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
                <p className="font-medium">إعداد Twilio للسعودية:</p>
                <ol className="list-decimal list-inside space-y-1 text-red-700 dark:text-red-400">
                  <li>انتقل إلى <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console</a></li>
                  <li>قم بترقية حسابك من Trial إلى Paid في قسم Billing</li>
                  <li>فعّل Geographic Permissions للسعودية في Messaging → Settings</li>
                  <li>احصل على <strong>Account SID</strong> و <strong>Auth Token</strong></li>
                  <li>استخدم رقم Twilio الخاص بك للإرسال</li>
                </ol>
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                  <p className="font-medium mb-2">المتغيرات المطلوبة في Secrets:</p>
                  <ul className="space-y-1 font-mono text-xs">
                    <li><code className="bg-red-200 dark:bg-red-800 px-1 rounded">TWILIO_ACCOUNT_SID</code> - معرف الحساب</li>
                    <li><code className="bg-red-200 dark:bg-red-800 px-1 rounded">TWILIO_AUTH_TOKEN</code> - رمز المصادقة</li>
                    <li><code className="bg-red-200 dark:bg-red-800 px-1 rounded">TWILIO_PHONE_NUMBER</code> - رقم الإرسال</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test SMS */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              اختبار الإرسال
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="رقم الهاتف (مثال: 0555123456)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  dir="ltr"
                />
              </div>
              <Button 
                onClick={testSMS}
                disabled={testing || !config.enabled || !testPhone}
                className="gap-2"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                إرسال رسالة اختبار
              </Button>
            </div>
            
            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <p className={`font-medium ${
                    testResult.success 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* SMS Logs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                آخر الرسائل المرسلة
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchSMSLogs}
                disabled={loadingLogs}
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {loadingLogs ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : smsLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد رسائل مرسلة بعد</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {smsLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <div className={`p-1.5 rounded-full ${
                      log.status === 'sent' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {log.status === 'sent' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs" dir="ltr">{log.phone}</span>
                        <Badge variant={log.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                          {log.status === 'sent' ? 'تم الإرسال' : 'فشل'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{log.type}</Badge>
                      </div>
                      <p className="text-muted-foreground truncate mt-1">{log.message}</p>
                      {log.error_message && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{log.error_message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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