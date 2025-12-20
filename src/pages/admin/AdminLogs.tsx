import { useState, useEffect, useCallback } from "react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Search, 
  Download,
  Calendar,
  User,
  Shield,
  Settings,
  ShoppingBag,
  Edit,
  Trash2,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Users,
  Ticket,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_value: any;
  new_value: any;
  user_id: string | null;
  created_at: string;
}

interface LogStats {
  total: number;
  today: number;
  orders: number;
  users: number;
  tickets: number;
  settings: number;
  services: number;
}

const tableLabels: Record<string, { label: string; icon: any; color: string }> = {
  orders: { label: 'الطلبات', icon: ShoppingBag, color: 'from-blue-500 to-cyan-500' },
  profiles: { label: 'المستخدمين', icon: Users, color: 'from-green-500 to-emerald-500' },
  support_tickets: { label: 'التذاكر', icon: Ticket, color: 'from-purple-500 to-pink-500' },
  system_settings: { label: 'الإعدادات', icon: Settings, color: 'from-orange-500 to-amber-500' },
  services: { label: 'الخدمات', icon: Package, color: 'from-indigo-500 to-violet-500' },
};

const actionIcons: Record<string, any> = {
  INSERT: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
};

const actionColors: Record<string, string> = {
  INSERT: 'bg-green-500/10 text-green-500 border-green-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const actionLabels: Record<string, string> = {
  INSERT: 'إضافة',
  UPDATE: 'تعديل',
  DELETE: 'حذف',
};

const LogItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-32" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="glass border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

interface LogItemProps {
  log: AuditLog;
  index: number;
}

const LogItem = ({ log, index }: LogItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const tableInfo = tableLabels[log.table_name] || { label: log.table_name, icon: Activity, color: 'from-gray-500 to-gray-600' };
  const ActionIcon = actionIcons[log.action] || Activity;
  const TableIcon = tableInfo.icon;

  const getDisplayValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'مُفعّل' : 'مُعطّل';
    if (key === 'status') {
      const statusLabels: Record<string, string> = {
        pending: 'قيد الانتظار',
        confirmed: 'مؤكد',
        in_progress: 'قيد التنفيذ',
        completed: 'مكتمل',
        cancelled: 'ملغي',
        refunded: 'مسترد',
        open: 'مفتوحة',
        resolved: 'محلولة',
        closed: 'مغلقة',
        active: 'نشط',
        inactive: 'غير نشط',
      };
      return statusLabels[value] || value;
    }
    if (key === 'priority') {
      const priorityLabels: Record<string, string> = {
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'عالية',
        urgent: 'عاجلة',
      };
      return priorityLabels[value] || value;
    }
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div 
        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer border border-transparent hover:border-primary/20"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${tableInfo.color}`}>
            <TableIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">{tableInfo.label}</p>
              <Badge variant="outline" className={actionColors[log.action]}>
                <ActionIcon className="w-3 h-3 ml-1" />
                {actionLabels[log.action]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}
              </span>
              {log.record_id && (
                <>
                  <span>•</span>
                  <span className="font-mono text-xs">{log.record_id.slice(0, 8)}...</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:block">
            {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm', { locale: ar })}
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
            className="overflow-hidden"
          >
            <div className="p-4 mr-14 mt-2 rounded-lg bg-muted/30 border border-border/50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {log.old_value && (
                  <div>
                    <p className="text-muted-foreground mb-2 font-medium">القيمة السابقة</p>
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
                      {Object.entries(log.old_value).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="text-destructive font-medium">{getDisplayValue(value, key)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {log.new_value && (
                  <div>
                    <p className="text-muted-foreground mb-2 font-medium">القيمة الجديدة</p>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 space-y-1">
                      {Object.entries(log.new_value).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="text-green-500 font-medium">{getDisplayValue(value, key)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{log.user_id ? log.user_id.slice(0, 8) + '...' : 'النظام'}</span>
                </div>
                <span>•</span>
                <span>{format(new Date(log.created_at), 'yyyy/MM/dd HH:mm:ss', { locale: ar })}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AdminLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LogStats>({
    total: 0, today: 0, orders: 0, users: 0, tickets: 0, settings: 0, services: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [activeTab, setActiveTab] = useState("all");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);

      // Calculate stats
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const todayLogs = (data || []).filter(log => 
        isWithinInterval(new Date(log.created_at), { start: todayStart, end: todayEnd })
      );

      setStats({
        total: data?.length || 0,
        today: todayLogs.length,
        orders: (data || []).filter(l => l.table_name === 'orders').length,
        users: (data || []).filter(l => l.table_name === 'profiles').length,
        tickets: (data || []).filter(l => l.table_name === 'support_tickets').length,
        settings: (data || []).filter(l => l.table_name === 'system_settings').length,
        services: (data || []).filter(l => l.table_name === 'services').length,
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('فشل في تحميل السجلات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          const newLog = payload.new as AuditLog;
          setLogs(prev => [newLog, ...prev].slice(0, 200));
          setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            today: prev.today + 1,
            orders: newLog.table_name === 'orders' ? prev.orders + 1 : prev.orders,
            users: newLog.table_name === 'profiles' ? prev.users + 1 : prev.users,
            tickets: newLog.table_name === 'support_tickets' ? prev.tickets + 1 : prev.tickets,
            settings: newLog.table_name === 'system_settings' ? prev.settings + 1 : prev.settings,
            services: newLog.table_name === 'services' ? prev.services + 1 : prev.services,
          }));
          toast.info('سجل جديد', { description: `${tableLabels[newLog.table_name]?.label || newLog.table_name} - ${actionLabels[newLog.action]}` });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    // Tab filter
    if (activeTab !== 'all' && log.table_name !== activeTab) return false;
    
    // Table filter
    if (selectedTable !== 'all' && log.table_name !== selectedTable) return false;
    
    // Action filter
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    
    // Date filter
    if (dateRange.from && new Date(log.created_at) < startOfDay(dateRange.from)) return false;
    if (dateRange.to && new Date(log.created_at) > endOfDay(dateRange.to)) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTable = tableLabels[log.table_name]?.label.toLowerCase().includes(query);
      const matchAction = actionLabels[log.action]?.toLowerCase().includes(query);
      const matchRecord = log.record_id?.toLowerCase().includes(query);
      const matchValues = JSON.stringify(log.old_value || log.new_value)?.toLowerCase().includes(query);
      return matchTable || matchAction || matchRecord || matchValues;
    }
    
    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTable("all");
    setSelectedAction("all");
    setDateRange({});
  };

  const hasActiveFilters = searchQuery || selectedTable !== 'all' || selectedAction !== 'all' || dateRange.from || dateRange.to;

  const logStats = [
    { label: "إجمالي العمليات", value: stats.total, icon: Activity, color: "from-primary to-primary/70" },
    { label: "عمليات اليوم", value: stats.today, icon: Clock, color: "from-blue-500 to-cyan-500" },
    { label: "عمليات الطلبات", value: stats.orders, icon: ShoppingBag, color: "from-green-500 to-emerald-500" },
    { label: "عمليات المستخدمين", value: stats.users, icon: Users, color: "from-purple-500 to-pink-500" },
  ];

  const exportLogs = () => {
    const csvContent = [
      ['التاريخ', 'الجدول', 'العملية', 'معرف السجل', 'المستخدم'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        tableLabels[log.table_name]?.label || log.table_name,
        actionLabels[log.action],
        log.record_id || '-',
        log.user_id || 'النظام'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('تم تصدير السجلات بنجاح');
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-4 md:space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-3">
          <div className="flex gap-2 order-1 sm:order-none">
            <Button variant="outline" onClick={fetchLogs} size="sm" className="gap-1.5 text-xs sm:text-sm">
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
            <Button variant="outline" onClick={exportLogs} size="sm" className="gap-1.5 text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تصدير</span>
            </Button>
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
              >
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </motion.div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">سجل العمليات</h1>
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse ml-1" />
                مباشر
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">تتبع جميع الأنشطة والعمليات في النظام</p>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {logStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{stat.value.toLocaleString('ar-SA')}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="بحث في السجلات..." 
                  className="pr-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الجدول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الجداول</SelectItem>
                  <SelectItem value="orders">الطلبات</SelectItem>
                  <SelectItem value="profiles">المستخدمين</SelectItem>
                  <SelectItem value="support_tickets">التذاكر</SelectItem>
                  <SelectItem value="services">الخدمات</SelectItem>
                  <SelectItem value="system_settings">الإعدادات</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العمليات</SelectItem>
                  <SelectItem value="INSERT">إضافة</SelectItem>
                  <SelectItem value="UPDATE">تعديل</SelectItem>
                  <SelectItem value="DELETE">حذف</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'MM/dd')} - ${format(dateRange.to, 'MM/dd')}`
                      ) : format(dateRange.from, 'yyyy/MM/dd')
                    ) : 'تحديد التاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full max-w-2xl">
            <TabsTrigger value="all" className="gap-1">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">الكل</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">الطلبات</span>
            </TabsTrigger>
            <TabsTrigger value="profiles" className="gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">المستخدمين</span>
            </TabsTrigger>
            <TabsTrigger value="support_tickets" className="gap-1">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">التذاكر</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">الخدمات</span>
            </TabsTrigger>
            <TabsTrigger value="system_settings" className="gap-1">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          <Card className="glass border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-primary" />
                  سجل العمليات
                  {filteredLogs.length > 0 && (
                    <Badge variant="secondary" className="mr-2">
                      {filteredLogs.length.toLocaleString('ar-SA')}
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <LogItemSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <FileText className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">لا توجد سجلات</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasActiveFilters ? 'لا توجد نتائج تطابق معايير البحث' : 'ستظهر السجلات هنا عند إجراء أي عملية'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="mt-4">
                        مسح الفلاتر
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {filteredLogs.map((log, index) => (
                      <LogItem key={log.id} log={log} index={index} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </Tabs>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>السجلات تُحدّث تلقائياً في الوقت الفعلي</span>
        </motion.div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminLogs;
