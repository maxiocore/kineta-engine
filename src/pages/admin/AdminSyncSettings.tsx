import { useState, useEffect } from "react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, 
  Clock, 
  Settings, 
  History, 
  Play, 
  Pause,
  DollarSign,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface SyncSettings {
  auto_sync_enabled: boolean;
  sync_frequency: string;
  sync_time: string;
  update_prices: boolean;
  update_descriptions: boolean;
}

interface SyncLog {
  id: string;
  created_at: string;
  success: boolean;
  providers_count: number;
  updated_count: number;
  prices_updated: number;
  descriptions_updated: number;
}

const AdminSyncSettings = () => {
  const [settings, setSettings] = useState<SyncSettings>({
    auto_sync_enabled: true,
    sync_frequency: "daily",
    sync_time: "03:00",
    update_prices: true,
    update_descriptions: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchSyncLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "sync_settings")
        .single();

      if (data && !error) {
        const value = data.value as unknown as SyncSettings;
        setSettings(value);
      }
    } catch (error) {
      console.error("Error fetching sync settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("table_name", "services_sync")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && !error) {
        const logs: SyncLog[] = data.map((log) => ({
          id: log.id,
          created_at: log.created_at,
          success: (log.new_value as any)?.success ?? true,
          providers_count: (log.new_value as any)?.providers_count ?? 0,
          updated_count: (log.new_value as any)?.updated_count ?? 0,
          prices_updated: (log.new_value as any)?.prices_updated ?? 0,
          descriptions_updated: (log.new_value as any)?.descriptions_updated ?? 0,
        }));
        setSyncLogs(logs);
      }
    } catch (error) {
      console.error("Error fetching sync logs:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "sync_settings",
          value: settings as any,
          category: "sync",
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;

      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const runManualSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-services", {
        body: {
          update_prices: settings.update_prices,
          update_descriptions: settings.update_descriptions,
        },
      });

      if (error) throw error;

      // Log the sync
      await supabase.from("audit_logs").insert({
        table_name: "services_sync",
        action: "manual_sync",
        new_value: {
          success: true,
          providers_count: data?.results?.length ?? 0,
          updated_count: data?.results?.reduce((sum: number, r: any) => sum + (r.updated || 0), 0) ?? 0,
          prices_updated: data?.results?.reduce((sum: number, r: any) => sum + (r.pricesUpdated || 0), 0) ?? 0,
          descriptions_updated: data?.results?.reduce((sum: number, r: any) => sum + (r.descriptionsUpdated || 0), 0) ?? 0,
        },
      });

      toast.success("تمت المزامنة بنجاح");
      fetchSyncLogs();
    } catch (error) {
      console.error("Error running sync:", error);
      toast.error("فشل في المزامنة");
    } finally {
      setSyncing(false);
    }
  };

  const frequencyOptions = [
    { value: "hourly", label: "كل ساعة" },
    { value: "daily", label: "يومياً" },
    { value: "weekly", label: "أسبوعياً" },
    { value: "manual", label: "يدوي فقط" },
  ];

  const timeOptions = [
    { value: "00:00", label: "12:00 صباحاً" },
    { value: "03:00", label: "3:00 صباحاً" },
    { value: "06:00", label: "6:00 صباحاً" },
    { value: "09:00", label: "9:00 صباحاً" },
    { value: "12:00", label: "12:00 ظهراً" },
    { value: "15:00", label: "3:00 مساءً" },
    { value: "18:00", label: "6:00 مساءً" },
    { value: "21:00", label: "9:00 مساءً" },
  ];

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-primary" />
              إعدادات المزامنة التلقائية
            </h1>
            <p className="text-muted-foreground mt-1">
              تحكم في وقت وتكرار تحديث الخدمات من المزودين
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={runManualSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Play className="w-4 h-4 ml-2" />
              )}
              مزامنة الآن
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Settings className="w-4 h-4 ml-2" />
              )}
              حفظ الإعدادات
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                إعدادات التوقيت
              </CardTitle>
              <CardDescription>
                حدد متى وكم مرة تريد مزامنة الخدمات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  {settings.auto_sync_enabled ? (
                    <Play className="w-5 h-5 text-success" />
                  ) : (
                    <Pause className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="font-medium">المزامنة التلقائية</Label>
                    <p className="text-xs text-muted-foreground">
                      تفعيل التحديث التلقائي للخدمات
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.auto_sync_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, auto_sync_enabled: checked })
                  }
                />
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label>تكرار المزامنة</Label>
                <Select
                  value={settings.sync_frequency}
                  onValueChange={(value) =>
                    setSettings({ ...settings, sync_frequency: value })
                  }
                  disabled={!settings.auto_sync_enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label>وقت المزامنة</Label>
                <Select
                  value={settings.sync_time}
                  onValueChange={(value) =>
                    setSettings({ ...settings, sync_time: value })
                  }
                  disabled={!settings.auto_sync_enabled || settings.sync_frequency === "hourly"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Update Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                خيارات التحديث
              </CardTitle>
              <CardDescription>
                حدد البيانات التي تريد تحديثها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Update Prices */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-success" />
                  <div>
                    <Label className="font-medium">تحديث الأسعار</Label>
                    <p className="text-xs text-muted-foreground">
                      تحديث أسعار الخدمات من المزود
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.update_prices}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, update_prices: checked })
                  }
                />
              </div>

              {/* Update Descriptions */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <Label className="font-medium">تحديث الأوصاف</Label>
                    <p className="text-xs text-muted-foreground">
                      تحديث تفاصيل ومميزات الخدمات
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.update_descriptions}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, update_descriptions: checked })
                  }
                />
              </div>

              {/* Status Summary */}
              <div className="mt-4 p-4 rounded-lg border border-border/50 bg-card">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  حالة المزامنة
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الحالة:</span>
                    <Badge variant={settings.auto_sync_enabled ? "default" : "secondary"}>
                      {settings.auto_sync_enabled ? "مفعلة" : "متوقفة"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التكرار:</span>
                    <span>{frequencyOptions.find(f => f.value === settings.sync_frequency)?.label}</span>
                  </div>
                  {settings.sync_frequency !== "hourly" && settings.sync_frequency !== "manual" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الوقت:</span>
                      <span>{timeOptions.find(t => t.value === settings.sync_time)?.label}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              سجل المزامنة
            </CardTitle>
            <CardDescription>
              آخر 10 عمليات مزامنة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syncLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد سجلات مزامنة بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(log.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.providers_count} مزود • {log.updated_count} خدمة محدثة
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {log.prices_updated > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="w-3 h-3 ml-1" />
                          {log.prices_updated} سعر
                        </Badge>
                      )}
                      {log.descriptions_updated > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 ml-1" />
                          {log.descriptions_updated} وصف
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSyncSettings;
