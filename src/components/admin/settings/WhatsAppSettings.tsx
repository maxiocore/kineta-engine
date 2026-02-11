import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Save, TestTube, Loader2, CheckCircle, XCircle, ShieldCheck } from "lucide-react";

interface WhatsAppConfig {
  enabled: boolean;
  notify_on_pending: boolean;
  notify_on_confirmed: boolean;
  notify_on_in_progress: boolean;
  notify_on_completed: boolean;
  notify_on_cancelled: boolean;
  notify_on_refunded: boolean;
}

const defaultConfig: WhatsAppConfig = {
  enabled: false,
  notify_on_pending: true,
  notify_on_confirmed: true,
  notify_on_in_progress: true,
  notify_on_completed: true,
  notify_on_cancelled: true,
  notify_on_refunded: true,
};

export const WhatsAppSettings = () => {
  const [config, setConfig] = useState<WhatsAppConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'whatsapp_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        const savedConfig = data.value as unknown as WhatsAppConfig;
        setConfig({ ...defaultConfig, ...savedConfig });
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'whatsapp_config',
          category: 'notifications',
          value: config as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('تم حفظ إعدادات واتساب بنجاح');
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!testPhone) {
      toast.error('يرجى إدخال رقم هاتف للاختبار');
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-notify', {
        body: {
          to: testPhone,
          type: 'test',
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('تم إرسال رسالة الاختبار بنجاح!');
      } else {
        toast.error(data?.error || 'فشل إرسال الرسالة');
      }
    } catch (error: any) {
      console.error('Error testing WhatsApp:', error);
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
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">إعدادات واتساب</CardTitle>
                <CardDescription>إشعارات حالات الطلبات عبر واتساب</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="whatsapp-enabled" className="text-sm">تفعيل</Label>
              <Switch
                id="whatsapp-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Credentials Status */}
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                بيانات API محفوظة بشكل آمن
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Instance ID و Access Token مخزنة كأسرار مشفرة في النظام
              </p>
            </div>
            <Badge variant="outline" className="mr-auto text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
              مؤمّن
            </Badge>
          </div>

          <Separator />

          {/* Test Connection */}
          <div className="space-y-4">
            <h3 className="font-medium">اختبار الاتصال</h3>
            <div className="flex gap-3">
              <Input
                placeholder="رقم الهاتف للاختبار (مع رمز الدولة)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                dir="ltr"
                className="max-w-xs"
              />
              <Button 
                variant="outline" 
                onClick={testConnection}
                disabled={testing}
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

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">إشعارات الحالات</h3>
            <p className="text-sm text-muted-foreground">
              اختر الحالات التي تريد إرسال إشعارات عندها
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'notify_on_pending', label: 'قيد الانتظار', color: 'bg-yellow-500' },
                { key: 'notify_on_confirmed', label: 'مؤكد', color: 'bg-blue-500' },
                { key: 'notify_on_in_progress', label: 'قيد التنفيذ', color: 'bg-purple-500' },
                { key: 'notify_on_completed', label: 'مكتمل', color: 'bg-green-500' },
                { key: 'notify_on_cancelled', label: 'ملغي', color: 'bg-red-500' },
                { key: 'notify_on_refunded', label: 'مسترد', color: 'bg-orange-500' },
              ].map((status) => (
                <div
                  key={status.key}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    <span className="text-sm">{status.label}</span>
                  </div>
                  <Switch
                    checked={config[status.key as keyof WhatsAppConfig] as boolean}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, [status.key]: checked })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.enabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">جاهز للعمل</span>
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
