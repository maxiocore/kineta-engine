import { Shield, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import SettingsCard from "./SettingsCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SecuritySettingsProps {
  settings: Record<string, any>;
  saving: string | null;
  onToggle: (key: string, value: boolean) => Promise<void>;
}

const securityOptions = [
  { 
    key: 'security_2fa_required', 
    label: 'التحقق بخطوتين إلزامي', 
    desc: 'للمشرفين فقط',
    badge: 'مستحسن',
    badgeVariant: 'default' as const
  },
  { 
    key: 'security_activity_logging', 
    label: 'تسجيل النشاطات', 
    desc: 'حفظ سجل لجميع العمليات',
    badge: 'مهم',
    badgeVariant: 'default' as const
  },
  { 
    key: 'security_account_lockout', 
    label: 'قفل الحساب', 
    desc: 'بعد 5 محاولات فاشلة',
    badge: 'أمان',
    badgeVariant: 'default' as const
  },
  { 
    key: 'security_email_verification', 
    label: 'التحقق من البريد', 
    desc: 'إلزامي للتسجيل',
    badge: null,
    badgeVariant: 'secondary' as const
  },
];

const SecuritySettings = ({ settings, saving, onToggle }: SecuritySettingsProps) => {
  const enabledCount = securityOptions.filter(opt => settings[opt.key] === true).length;
  const securityLevel = enabledCount >= 3 ? 'high' : enabledCount >= 2 ? 'medium' : 'low';

  return (
    <SettingsCard
      icon={Shield}
      title="إعدادات الأمان"
      description="تكوين إعدادات الحماية"
      delay={0.2}
    >
      <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">مستوى الأمان</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3].map((level) => (
                <motion.div
                  key={level}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + level * 0.1 }}
                  className={`w-3 h-3 rounded-full ${
                    level <= (securityLevel === 'high' ? 3 : securityLevel === 'medium' ? 2 : 1)
                      ? securityLevel === 'high' 
                        ? 'bg-green-500' 
                        : securityLevel === 'medium' 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <span className={`text-sm font-medium ${
              securityLevel === 'high' ? 'text-green-500' : 
              securityLevel === 'medium' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {securityLevel === 'high' ? 'عالي' : securityLevel === 'medium' ? 'متوسط' : 'منخفض'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {securityOptions.map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{item.label}</p>
                  {item.badge && (
                    <Badge variant={item.badgeVariant} className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </div>
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
      </div>

      {securityLevel === 'low' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive">يُنصح بتفعيل المزيد من خيارات الأمان</span>
        </motion.div>
      )}
    </SettingsCard>
  );
};

export default SecuritySettings;
