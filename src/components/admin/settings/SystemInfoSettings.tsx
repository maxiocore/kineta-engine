import { useState } from "react";
import { Database, RefreshCw, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SettingsCard from "./SettingsCard";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const SystemInfoSettings = () => {
  const [backingUp, setBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const systemInfo = [
    { label: 'إصدار النظام', value: '2.1.0', icon: null },
    { label: 'حالة الخادم', value: 'يعمل بشكل طبيعي', status: 'success', icon: CheckCircle2 },
    { label: 'استخدام التخزين', value: '45%', progress: 45 },
    { label: 'آخر نسخة احتياطية', value: 'منذ ساعتين', status: 'info', icon: null },
  ];

  const handleBackup = async () => {
    setBackingUp(true);
    setBackupProgress(0);
    
    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setBackingUp(false);
          toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <SettingsCard
      icon={Database}
      title="معلومات النظام"
      description="حالة النظام والموارد"
      delay={0.3}
    >
      <div className="space-y-3">
        {systemInfo.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30 border border-border/30"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.progress !== undefined ? (
                <div className="flex items-center gap-2">
                  <Progress value={item.progress} className="w-20 h-2" />
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ) : (
                <>
                  {item.icon && item.status === 'success' && (
                    <item.icon className="w-4 h-4 text-green-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    item.status === 'success' ? 'text-green-500' : ''
                  }`}>
                    {item.value}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {backingUp && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">جاري إنشاء النسخة الاحتياطية...</span>
            <span className="font-medium">{backupProgress}%</span>
          </div>
          <Progress value={backupProgress} className="h-2" />
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleBackup}
          disabled={backingUp}
        >
          {backingUp ? (
            <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <Database className="w-4 h-4 ml-2" />
          )}
          نسخة احتياطية
        </Button>
        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 ml-2" />
          تصدير البيانات
        </Button>
      </div>
    </SettingsCard>
  );
};

export default SystemInfoSettings;
