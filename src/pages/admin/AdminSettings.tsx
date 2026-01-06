import { motion } from "framer-motion";
import { Settings, RefreshCw } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Settings Components
import SettingsSkeleton from "@/components/admin/settings/SettingsSkeleton";
import GeneralSettings from "@/components/admin/settings/GeneralSettings";
import NotificationSettings from "@/components/admin/settings/NotificationSettings";
import SecuritySettings from "@/components/admin/settings/SecuritySettings";
import SystemInfoSettings from "@/components/admin/settings/SystemInfoSettings";
import MaintenanceSettings from "@/components/admin/settings/MaintenanceSettings";
import AppearanceSettings from "@/components/admin/settings/AppearanceSettings";
import AuditLogsSettings from "@/components/admin/settings/AuditLogsSettings";
import { WhatsAppSettings } from "@/components/admin/settings/WhatsAppSettings";
import { SMSSettings } from "@/components/admin/settings/SMSSettings";

const AdminSettings = () => {
  const { settings, loading, saving, updateSetting, updateMultipleSettings, refetch } = useSystemSettings();

  const handleToggle = async (key: string, value: boolean) => {
    await updateSetting(key, value);
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <SettingsSkeleton />
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </motion.div>
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold">إعدادات النظام</h1>
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse ml-1" />
                متصل
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">تكوين وإدارة إعدادات المنصة</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="outline" 
              onClick={refetch}
              className="gap-2 w-full sm:w-auto"
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="sm:inline">تحديث</span>
            </Button>
          </motion.div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <GeneralSettings 
            settings={settings} 
            saving={saving} 
            onSave={updateMultipleSettings} 
          />
          
          <NotificationSettings 
            settings={settings} 
            saving={saving} 
            onToggle={handleToggle} 
          />
          
          <SecuritySettings 
            settings={settings} 
            saving={saving} 
            onToggle={handleToggle} 
          />
          
          <SystemInfoSettings />
          
          <MaintenanceSettings 
            settings={settings} 
            saving={saving} 
            onToggle={handleToggle}
            onSave={updateMultipleSettings}
          />
          
          <AppearanceSettings />
          
          {/* SMS Settings */}
          <SMSSettings />
          
          {/* WhatsApp Settings */}
          <WhatsAppSettings />
          
          {/* Audit Logs - Full width */}
          <AuditLogsSettings />
        </div>

        {/* Footer Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground"
        >
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-center">جميع الإعدادات محفوظة ومتزامنة</span>
        </motion.div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSettings;
