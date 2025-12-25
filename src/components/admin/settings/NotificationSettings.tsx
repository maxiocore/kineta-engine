import { Bell, FileText, Loader2, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import SettingsCard from "./SettingsCard";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface NotificationSettingsProps {
  settings: Record<string, any>;
  saving: string | null;
  onToggle: (key: string, value: boolean) => Promise<void>;
}

const notificationOptions = [
  { 
    key: 'notification_new_orders', 
    label: 'إشعارات الطلبات الجديدة', 
    desc: 'تنبيه عند استلام طلب جديد',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    key: 'notification_new_users', 
    label: 'إشعارات تسجيل المستخدمين', 
    desc: 'تنبيه عند تسجيل مستخدم جديد',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    key: 'notification_payments', 
    label: 'إشعارات المدفوعات', 
    desc: 'تنبيه عند استلام دفعة',
    color: 'from-yellow-500 to-orange-500'
  },
  { 
    key: 'notification_daily_reports', 
    label: 'تقارير يومية', 
    desc: 'إرسال ملخص يومي بالبريد',
    color: 'from-purple-500 to-pink-500'
  },
];

const NotificationSettings = ({ settings, saving, onToggle }: NotificationSettingsProps) => {
  const { toast } = useToast();
  const [sendingReport, setSendingReport] = useState(false);

  const handleSendWeeklyReport = async () => {
    setSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-admin-report');
      
      if (error) throw error;
      
      toast({
        title: "تم الإرسال",
        description: `تم إرسال التقرير الأسبوعي إلى ${data.sentCount} أدمن`,
      });
    } catch (error: any) {
      console.error('Error sending weekly report:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال التقرير الأسبوعي",
        variant: "destructive",
      });
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <SettingsCard
      icon={Bell}
      title="إعدادات الإشعارات"
      description="تكوين نظام الإشعارات"
      delay={0.1}
    >
      <div className="space-y-1">
        {notificationOptions.map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors group"
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
                checked={settings[item.key] === true}
                onCheckedChange={(checked) => onToggle(item.key, checked)}
                disabled={saving === item.key}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </motion.div>
        ))}
        
        {/* Weekly Report Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4 mt-4 border-t border-border/50"
        >
          <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">التقرير الأسبوعي</p>
                <p className="text-xs text-muted-foreground">إرسال تقرير إحصائي شامل للأدمن</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSendWeeklyReport}
              disabled={sendingReport}
              className="gap-2"
            >
              {sendingReport ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              إرسال الآن
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-3">
            يُرسل هذا التقرير تلقائياً كل يوم أحد صباحاً
          </p>
        </motion.div>
      </div>
    </SettingsCard>
  );
};

export default NotificationSettings;
