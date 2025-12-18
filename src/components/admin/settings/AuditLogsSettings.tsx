import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  Settings, 
  Edit, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Clock,
  User,
  Filter,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditLogs, AuditLog } from "@/hooks/useAuditLogs";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const settingsLabels: Record<string, string> = {
  site_name: 'اسم الموقع',
  site_description: 'وصف الموقع',
  contact_email: 'البريد الإلكتروني',
  contact_phone: 'رقم الهاتف',
  notification_new_orders: 'إشعارات الطلبات',
  notification_new_users: 'إشعارات المستخدمين',
  notification_payments: 'إشعارات المدفوعات',
  notification_daily_reports: 'التقارير اليومية',
  security_2fa_required: 'التحقق بخطوتين',
  security_activity_logging: 'تسجيل النشاطات',
  security_account_lockout: 'قفل الحساب',
  security_email_verification: 'التحقق من البريد',
  maintenance_mode: 'وضع الصيانة',
  max_upload_size: 'حجم الملفات',
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'INSERT': return Plus;
    case 'UPDATE': return Edit;
    case 'DELETE': return Trash2;
    default: return Settings;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'INSERT': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'UPDATE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'INSERT': return 'إضافة';
    case 'UPDATE': return 'تعديل';
    case 'DELETE': return 'حذف';
    default: return action;
  }
};

const formatValue = (value: any): string => {
  if (value === true) return 'مُفعّل';
  if (value === false) return 'مُعطّل';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const AuditLogItem = ({ log, index }: { log: AuditLog; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const ActionIcon = getActionIcon(log.action);
  const settingLabel = settingsLabels[log.record_id || ''] || log.record_id;

  const oldValue = log.old_value?.value;
  const newValue = log.new_value?.value;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {/* Timeline line */}
      {index > 0 && (
        <div className="absolute top-0 right-[19px] w-0.5 h-full bg-border/50 -translate-y-full" />
      )}
      
      <div className="flex gap-3">
        {/* Timeline dot */}
        <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${getActionColor(log.action)}`}>
          <ActionIcon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 pb-4">
          <div 
            className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={getActionColor(log.action)}>
                    {getActionLabel(log.action)}
                  </Badge>
                  <span className="font-medium text-sm">{settingLabel}</span>
                </div>
                
                {log.action === 'UPDATE' && oldValue !== undefined && newValue !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="line-through text-destructive/70">{formatValue(oldValue)}</span>
                    {' → '}
                    <span className="text-green-500">{formatValue(newValue)}</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(log.created_at), { 
                    addSuffix: true, 
                    locale: ar 
                  })}
                </span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-border/50"
                >
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {log.old_value && (
                      <div>
                        <p className="text-muted-foreground mb-1">القيمة السابقة</p>
                        <pre className="p-2 rounded bg-destructive/10 text-destructive overflow-x-auto">
                          {JSON.stringify(log.old_value.value, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.new_value && (
                      <div>
                        <p className="text-muted-foreground mb-1">القيمة الجديدة</p>
                        <pre className="p-2 rounded bg-green-500/10 text-green-500 overflow-x-auto">
                          {JSON.stringify(log.new_value.value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{log.user_email || log.user_id || 'النظام'}</span>
                    </div>
                    <span>
                      {new Date(log.created_at).toLocaleString('ar-SA')}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AuditLogsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

interface AuditLogsSettingsProps {
  showHeader?: boolean;
}

const AuditLogsSettings = ({ showHeader = true }: AuditLogsSettingsProps) => {
  const [filter, setFilter] = useState<string>("all");
  const { logs, loading, refetch } = useAuditLogs('system_settings', 100);

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.action === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="lg:col-span-2"
    >
      <Card className="glass border-border/50">
        {showHeader && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-2 rounded-xl bg-primary/10 text-primary"
                >
                  <History className="w-5 h-5" />
                </motion.div>
                <div>
                  <CardTitle className="font-display">سجل التغييرات</CardTitle>
                  <CardDescription>تتبع جميع التغييرات في الإعدادات</CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[130px] bg-secondary/50">
                    <Filter className="w-4 h-4 ml-2" />
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="UPDATE">التعديلات</SelectItem>
                    <SelectItem value="INSERT">الإضافات</SelectItem>
                    <SelectItem value="DELETE">الحذف</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon" onClick={refetch}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        )}
        
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <AuditLogsSkeleton />
            ) : filteredLogs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="p-4 rounded-full bg-muted mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">لا توجد سجلات حتى الآن</p>
                <p className="text-xs text-muted-foreground mt-1">ستظهر التغييرات هنا عند إجراء أي تعديل</p>
              </motion.div>
            ) : (
              <div className="space-y-0">
                {filteredLogs.map((log, index) => (
                  <AuditLogItem key={log.id} log={log} index={index} />
                ))}
              </div>
            )}
          </ScrollArea>
          
          {filteredLogs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground"
            >
              <span>إجمالي السجلات: {filteredLogs.length}</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                تحديث لحظي
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuditLogsSettings;
