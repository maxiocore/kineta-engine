import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Search,
  Filter,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Clock,
  Sparkles,
  History,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface BalanceLog {
  id: string;
  action_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  notes: string | null;
  reference_type: string | null;
  created_at: string;
}

const actionTypeLabels: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType; gradient: string }> = {
  deposit: { label: "إيداع", color: "text-emerald-500", bgColor: "bg-emerald-500/10 border-emerald-500/30", icon: ArrowUpCircle, gradient: "from-emerald-500 to-emerald-600" },
  order: { label: "طلب", color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/30", icon: ArrowDownCircle, gradient: "from-orange-500 to-orange-600" },
  refund: { label: "استرداد", color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/30", icon: RefreshCw, gradient: "from-blue-500 to-blue-600" },
  commission: { label: "عمولة إحالة", color: "text-purple-500", bgColor: "bg-purple-500/10 border-purple-500/30", icon: TrendingUp, gradient: "from-purple-500 to-purple-600" },
  credit: { label: "إضافة", color: "text-green-500", bgColor: "bg-green-500/10 border-green-500/30", icon: ArrowUpCircle, gradient: "from-green-500 to-green-600" },
  debit: { label: "خصم", color: "text-red-500", bgColor: "bg-red-500/10 border-red-500/30", icon: ArrowDownCircle, gradient: "from-red-500 to-red-600" },
  initial: { label: "رصيد أولي", color: "text-gray-500", bgColor: "bg-gray-500/10 border-gray-500/30", icon: Wallet, gradient: "from-gray-500 to-gray-600" },
  manual_adjustment: { label: "تعديل يدوي", color: "text-yellow-500", bgColor: "bg-yellow-500/10 border-yellow-500/30", icon: RefreshCw, gradient: "from-yellow-500 to-yellow-600" },
};

const PIE_COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7', '#eab308', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-2xl">
        <p className="text-sm font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.value?.toFixed(2)} ر.س
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const LiveIndicator = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30">
    <motion.div className="w-2 h-2 rounded-full bg-emerald-500" animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
    <span className="text-xs font-medium text-emerald-500">مباشر</span>
  </div>
);

const ClientBalanceLogsContent = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<BalanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isRealtime, setIsRealtime] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalDeposits: 0, totalSpent: 0, currentBalance: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("balance_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (!error && data) { setLogs(data); setLastUpdate(new Date()); }
    setLoading(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const { data: balance } = await supabase.from("user_balances").select("balance, total_deposited, total_spent").eq("user_id", user.id).maybeSingle();
    if (balance) setStats({ totalDeposits: balance.total_deposited || 0, totalSpent: balance.total_spent || 0, currentBalance: balance.balance || 0 });
  }, [user]);

  useEffect(() => { if (user) { fetchLogs(); fetchStats(); } }, [user, fetchLogs, fetchStats]);

  useEffect(() => {
    if (!user || !isRealtime) return;
    const channel = supabase.channel('balance_logs_content_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'balance_logs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newLog = payload.new as BalanceLog;
          setLogs(prev => [newLog, ...prev]);
          setNewLogIds(prev => new Set(prev).add(newLog.id));
          setLastUpdate(new Date());
          const actionInfo = actionTypeLabels[newLog.action_type] || { label: newLog.action_type };
          toast.success(`${actionInfo.label}: ${newLog.amount > 0 ? '+' : ''}${newLog.amount.toFixed(2)} ر.س`);
          setTimeout(() => setNewLogIds(prev => { const next = new Set(prev); next.delete(newLog.id); return next; }), 5000);
          fetchStats();
        }
      ).subscribe();
    const balanceChannel = supabase.channel('user_balances_content_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_balances', filter: `user_id=eq.${user.id}` }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); supabase.removeChannel(balanceChannel); };
  }, [user, isRealtime, fetchStats]);

  const balanceChartData = useMemo(() => {
    if (logs.length === 0) return [];
    const sortedLogs = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const dailyData: Record<string, { date: string; balance: number; deposits: number; expenses: number }> = {};
    sortedLogs.forEach(log => {
      const dateKey = format(new Date(log.created_at), "dd/MM");
      if (!dailyData[dateKey]) dailyData[dateKey] = { date: dateKey, balance: log.balance_after, deposits: 0, expenses: 0 };
      else dailyData[dateKey].balance = log.balance_after;
      if (log.amount > 0) dailyData[dateKey].deposits += log.amount;
      else dailyData[dateKey].expenses += Math.abs(log.amount);
    });
    return Object.values(dailyData);
  }, [logs]);

  const transactionsSummary = useMemo(() => {
    const summary: Record<string, { type: string; label: string; total: number; count: number }> = {};
    logs.forEach(log => {
      const actionInfo = actionTypeLabels[log.action_type] || { label: log.action_type };
      if (!summary[log.action_type]) summary[log.action_type] = { type: log.action_type, label: actionInfo.label, total: 0, count: 0 };
      summary[log.action_type].total += Math.abs(log.amount);
      summary[log.action_type].count += 1;
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [logs]);

  const pieChartData = useMemo(() => transactionsSummary.slice(0, 6).map((item, index) => ({ name: item.label, value: item.total, color: PIE_COLORS[index % PIE_COLORS.length] })), [transactionsSummary]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const matchesSearch = log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || log.action_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.action_type === filterType;
    return matchesSearch && matchesFilter;
  }), [logs, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType]);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Skeleton className="w-8 h-8 rounded-full" /></div>;

  return (
    <div className="space-y-4 md:space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <History className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold">سجل الرصيد</h2>
            <p className="text-xs md:text-sm text-muted-foreground">تتبع جميع تغييرات رصيدك</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveIndicator />
          <Button onClick={() => { fetchLogs(); fetchStats(); }} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />تحديث
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {[
          { title: "الرصيد الحالي", value: stats.currentBalance, icon: Wallet, color: "primary", gradient: "from-primary to-primary/60" },
          { title: "إجمالي الإيداعات", value: stats.totalDeposits, icon: TrendingUp, color: "emerald", gradient: "from-emerald-500 to-emerald-600" },
          { title: "إجمالي المصروفات", value: stats.totalSpent, icon: TrendingDown, color: "orange", gradient: "from-orange-500 to-orange-600" }
        ].map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className={`text-xl font-bold ${stat.color === 'primary' ? 'text-primary' : stat.color === 'emerald' ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {stat.value.toFixed(2)} ر.س
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><Activity className="w-5 h-5 text-primary" />حركة الرصيد</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center"><BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد بيانات</p></div>
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceChartData}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="balance" name="الرصيد" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#balanceGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-lg">توزيع المعاملات</CardTitle></CardHeader>
          <CardContent>
            {pieChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground"><p className="text-sm">لا توجد بيانات</p></div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                      {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث في الملاحظات..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="النوع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="deposit">إيداع</SelectItem>
                  <SelectItem value="order">طلب</SelectItem>
                  <SelectItem value="refund">استرداد</SelectItem>
                  <SelectItem value="commission">عمولة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><History className="w-5 h-5" />سجل المعاملات</span>
            <Badge variant="secondary">{filteredLogs.length} معاملة</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          {paginatedLogs.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">لا توجد معاملات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedLogs.map((log, index) => {
                const actionInfo = actionTypeLabels[log.action_type] || { label: log.action_type, color: "text-gray-500", bgColor: "bg-gray-500/10", icon: Wallet, gradient: "from-gray-500 to-gray-600" };
                const ActionIcon = actionInfo.icon;
                const isPositive = log.amount > 0;
                const isNew = newLogIds.has(log.id);
                const isExpanded = expandedLogId === log.id;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, backgroundColor: isNew ? 'hsl(var(--primary) / 0.05)' : 'transparent' }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-3 md:p-4 rounded-xl border ${isNew ? 'border-primary/50' : 'border-border/50'} bg-card cursor-pointer`}
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${actionInfo.gradient} flex items-center justify-center`}>
                          <ActionIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`${actionInfo.bgColor} ${actionInfo.color} text-xs`}>{actionInfo.label}</Badge>
                            {isNew && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">جديد</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: ar })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <p className={`text-lg font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                            {isPositive ? "+" : ""}{log.amount.toFixed(2)} ر.س
                          </p>
                          <p className="text-xs text-muted-foreground">الرصيد: {log.balance_after.toFixed(2)} ر.س</p>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}><ChevronDown className="w-5 h-5 text-muted-foreground" /></motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="pt-3 mt-3 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-muted/30 rounded-lg p-2"><p className="text-xs text-muted-foreground">الرصيد قبل</p><p className="font-semibold">{log.balance_before.toFixed(2)} ر.س</p></div>
                            <div className="bg-muted/30 rounded-lg p-2"><p className="text-xs text-muted-foreground">الرصيد بعد</p><p className="font-semibold">{log.balance_after.toFixed(2)} ر.س</p></div>
                            <div className="bg-muted/30 rounded-lg p-2"><p className="text-xs text-muted-foreground">الفرق</p><p className={`font-semibold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>{isPositive ? "+" : ""}{log.amount.toFixed(2)} ر.س</p></div>
                            <div className="bg-muted/30 rounded-lg p-2"><p className="text-xs text-muted-foreground">التوقيت</p><p className="font-semibold text-sm">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}</p></div>
                          </div>
                          {log.notes && <div className="mt-3 bg-muted/30 rounded-lg p-2"><p className="text-xs text-muted-foreground">ملاحظات</p><p className="text-sm">{log.notes}</p></div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsRight className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronRight className="w-4 h-4" /></Button>
              <span className="text-sm px-3">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsLeft className="w-4 h-4" /></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientBalanceLogsContent;
