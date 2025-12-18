import { useState, useEffect } from "react";
import { Wrench, AlertTriangle, Power, Calendar, Clock, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SettingsCard from "./SettingsCard";
import { motion, AnimatePresence } from "framer-motion";
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
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface MaintenanceSettingsProps {
  settings: Record<string, any>;
  saving: string | null;
  onToggle: (key: string, value: boolean) => Promise<void>;
  onSave: (updates: { key: string; value: any }[]) => Promise<void>;
}

const MaintenanceSettings = ({ settings, saving, onToggle, onSave }: MaintenanceSettingsProps) => {
  const isMaintenanceMode = settings.maintenance_mode === true;
  const isScheduled = settings.maintenance_scheduled === true;
  
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  useEffect(() => {
    if (settings.maintenance_start_time && settings.maintenance_start_time !== 'null') {
      try {
        const start = new Date(settings.maintenance_start_time);
        setStartDate(format(start, 'yyyy-MM-dd'));
        setStartTime(format(start, 'HH:mm'));
      } catch (e) {}
    }
    if (settings.maintenance_end_time && settings.maintenance_end_time !== 'null') {
      try {
        const end = new Date(settings.maintenance_end_time);
        setEndDate(format(end, 'yyyy-MM-dd'));
        setEndTime(format(end, 'HH:mm'));
      } catch (e) {}
    }
    if (settings.maintenance_message && settings.maintenance_message !== 'null') {
      setCustomMessage(settings.maintenance_message);
    }
  }, [settings]);

  const handleMaintenanceToggle = async (checked: boolean) => {
    if (checked) {
      return; // Handled by AlertDialog
    }
    await onToggle('maintenance_mode', false);
  };

  const confirmMaintenanceMode = async () => {
    await onToggle('maintenance_mode', true);
  };

  const handleScheduleMaintenance = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error('يرجى تحديد وقت البدء والانتهاء');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (startDateTime >= endDateTime) {
      toast.error('وقت الانتهاء يجب أن يكون بعد وقت البدء');
      return;
    }

    if (startDateTime < new Date()) {
      toast.error('لا يمكن جدولة صيانة في الماضي');
      return;
    }

    setScheduleSaving(true);
    try {
      await onSave([
        { key: 'maintenance_scheduled', value: true },
        { key: 'maintenance_start_time', value: startDateTime.toISOString() },
        { key: 'maintenance_end_time', value: endDateTime.toISOString() },
        { key: 'maintenance_message', value: customMessage || 'نعمل حالياً على تحسين الموقع' },
      ]);
      toast.success('تم جدولة الصيانة بنجاح');
    } catch (error) {
      toast.error('فشل في جدولة الصيانة');
    } finally {
      setScheduleSaving(false);
    }
  };

  const cancelSchedule = async () => {
    setScheduleSaving(true);
    try {
      await onSave([
        { key: 'maintenance_scheduled', value: false },
        { key: 'maintenance_start_time', value: null },
        { key: 'maintenance_end_time', value: null },
      ]);
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      toast.success('تم إلغاء الجدولة');
    } catch (error) {
      toast.error('فشل في إلغاء الجدولة');
    } finally {
      setScheduleSaving(false);
    }
  };

  const getScheduleStatus = () => {
    if (!isScheduled || !settings.maintenance_start_time) return null;
    
    try {
      const start = new Date(settings.maintenance_start_time);
      const end = new Date(settings.maintenance_end_time);
      const now = new Date();

      if (now < start) {
        return {
          status: 'pending',
          text: `ستبدأ في ${format(start, 'dd MMMM yyyy الساعة HH:mm', { locale: ar })}`,
          color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        };
      } else if (now >= start && now <= end) {
        return {
          status: 'active',
          text: `ستنتهي في ${format(end, 'dd MMMM yyyy الساعة HH:mm', { locale: ar })}`,
          color: 'bg-destructive/10 text-destructive border-destructive/20'
        };
      }
    } catch (e) {}
    return null;
  };

  const scheduleStatus = getScheduleStatus();

  return (
    <SettingsCard
      icon={Wrench}
      title="الصيانة والأداء"
      description="إعدادات صيانة النظام وجدولة الصيانة"
      delay={0.4}
    >
      {/* Current Maintenance Status */}
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

      {/* Schedule Status */}
      <AnimatePresence>
        {scheduleStatus && !isMaintenanceMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-4 p-4 rounded-lg border ${scheduleStatus.color}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="font-medium">صيانة مجدولة</p>
                  <p className="text-xs">{scheduleStatus.text}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={cancelSchedule}
                disabled={scheduleSaving}
              >
                إلغاء
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Manual Maintenance Toggle */}
        <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <Power className={`w-5 h-5 ${isMaintenanceMode ? 'text-destructive' : 'text-green-500'}`} />
            <div>
              <p className="font-medium text-sm">وضع الصيانة الفوري</p>
              <p className="text-xs text-muted-foreground">تفعيل/إيقاف الصيانة مباشرة</p>
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

        {/* Schedule Maintenance Section */}
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="font-medium text-sm">جدولة الصيانة</p>
            <Badge variant="outline" className="text-xs">تلقائي</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">تاريخ البدء</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-secondary/50 text-sm"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">وقت البدء</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-secondary/50 text-sm"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">تاريخ الانتهاء</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-secondary/50 text-sm"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">وقت الانتهاء</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-secondary/50 text-sm"
                dir="ltr"
              />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <Label className="text-xs">رسالة الصيانة (اختياري)</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="نعمل حالياً على تحسين الموقع..."
              className="bg-secondary/50 text-sm min-h-[60px]"
            />
          </div>

          <Button 
            onClick={handleScheduleMaintenance}
            disabled={scheduleSaving || !startDate || !startTime || !endDate || !endTime}
            className="w-full mt-3 bg-gradient-to-l from-primary to-primary/80"
          >
            {scheduleSaving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 ml-2" />
                جدولة الصيانة
              </>
            )}
          </Button>
        </div>

        {/* Other Settings */}
        <div className="border-t border-border/50 pt-4 space-y-3">
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

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full text-sm">
              مسح الكاش
            </Button>
            <Button variant="outline" className="w-full text-sm">
              إعادة البناء
            </Button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
};

export default MaintenanceSettings;
