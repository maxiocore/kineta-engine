import { Wrench, AlertTriangle, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SettingsCard from "./SettingsCard";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MaintenanceSettingsProps {
  settings: Record<string, any>;
  saving: string | null;
  onToggle: (key: string, value: boolean) => Promise<void>;
  onSave: (updates: { key: string; value: any }[]) => Promise<void>;
}

const MaintenanceSettings = ({ settings, saving, onToggle, onSave }: MaintenanceSettingsProps) => {
  const isMaintenanceMode = settings.maintenance_mode === true;

  const handleMaintenanceToggle = async (checked: boolean) => {
    if (checked) {
      // Show confirmation dialog handled by AlertDialog
      return;
    }
    await onToggle('maintenance_mode', false);
  };

  const confirmMaintenanceMode = async () => {
    await onToggle('maintenance_mode', true);
  };

  return (
    <SettingsCard
      icon={Wrench}
      title="الصيانة والأداء"
      description="إعدادات صيانة النظام"
      delay={0.4}
    >
      <AnimatePresence>
        {isMaintenanceMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
              </div>
              <div>
                <p className="font-medium text-destructive">وضع الصيانة مُفعّل</p>
                <p className="text-xs text-muted-foreground">الموقع غير متاح للمستخدمين حالياً</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <Power className={`w-5 h-5 ${isMaintenanceMode ? 'text-destructive' : 'text-green-500'}`} />
            <div>
              <p className="font-medium text-sm">وضع الصيانة</p>
              <p className="text-xs text-muted-foreground">إيقاف الموقع مؤقتاً للصيانة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving === 'maintenance_mode' && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
            {!isMaintenanceMode ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Switch 
                    checked={isMaintenanceMode}
                    disabled={saving === 'maintenance_mode'}
                  />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تفعيل وضع الصيانة؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم إيقاف الموقع مؤقتاً ولن يتمكن المستخدمون من الوصول إليه. هل أنت متأكد؟
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmMaintenanceMode} className="bg-destructive hover:bg-destructive/90">
                      تفعيل الصيانة
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Switch 
                checked={isMaintenanceMode}
                onCheckedChange={() => handleMaintenanceToggle(false)}
                disabled={saving === 'maintenance_mode'}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxUpload">الحد الأقصى لحجم الملفات (MB)</Label>
          <Input
            id="maxUpload"
            type="number"
            value={settings.max_upload_size || 10}
            onChange={(e) => onSave([{ key: 'max_upload_size', value: parseInt(e.target.value) || 10 }])}
            className="bg-secondary/50 border-border/50"
            min={1}
            max={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" className="w-full text-sm">
            مسح الكاش
          </Button>
          <Button variant="outline" className="w-full text-sm">
            إعادة البناء
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
};

export default MaintenanceSettings;
