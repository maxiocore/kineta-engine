import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Activity,
  Clock,
  Eye,
  Sparkles,
  Circle,
  History,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

const actionTypeLabels: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  deposit: { 
    label: "إيداع", 
    color: "text-emerald-500", 
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    icon: ArrowUpCircle 
  },
  order: { 
    label: "طلب", 
    color: "text-orange-500", 
    bgColor: "bg-orange-500/10 border-orange-500/30",
    icon: ArrowDownCircle 
  },
  refund: { 
    label: "استرداد", 
    color: "text-blue-500", 
    bgColor: "bg-blue-500/10 border-blue-500/30",
    icon: RefreshCw 
  },
  commission: { 
    label: "عمولة إحالة", 
    color: "text-purple-500", 
    bgColor: "bg-purple-500/10 border-purple-500/30",
    icon: TrendingUp 
  },
  credit: { 
    label: "إضافة", 
    color: "text-green-500", 
    bgColor: "bg-green-500/10 border-green-500/30",
    icon: ArrowUpCircle 
  },
  debit: { 
    label: "خصم", 
    color: "text-red-500", 
    bgColor: "bg-red-500/10 border-red-500/30",
    icon: ArrowDownCircle 
  },
  initial: { 
    label: "رصيد أولي", 
    color: "text-gray-500", 
    bgColor: "bg-gray-500/10 border-gray-500/30",
    icon: Wallet 
  },
  manual_adjustment: { 
    label: "تعديل يدوي", 
    color: "text-yellow-500", 
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    icon: RefreshCw 
  },
};

const PIE_COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7', '#eab308', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-2xl"
      >
        <p className="text-sm font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.value?.toFixed(2)} ر.س
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-emerald-500"
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-xs font-medium text-emerald-500">مباشر</span>
  </motion.div>
);

const ClientBalanceLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<BalanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isRealtime, setIsRealtime] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalSpent: 0,
    currentBalance: 0,
  });

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("balance_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(data);
      setLastUpdate(new Date());
    }
    setLoading(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const { data: balance } = await supabase
      .from("user_balances")
      .select("balance, total_deposited, total_spent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (balance) {
      setStats({
        totalDeposits: balance.total_deposited || 0,
        totalSpent: balance.total_spent || 0,
        currentBalance: balance.balance || 0,
      });
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchLogs();
      fetchStats();
    }
  }, [user, fetchLogs, fetchStats]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !isRealtime) return;

    const channel = supabase
      .channel('balance_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'balance_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newLog = payload.new as BalanceLog;
          setLogs(prev => [newLog, ...prev]);
          setNewLogIds(prev => new Set(prev).add(newLog.id));
          setLastUpdate(new Date());
          
          // Show toast notification
          const actionInfo = actionTypeLabels[newLog.action_type] || { label: newLog.action_type };
          const isPositive = newLog.amount > 0;
          toast.success(
            `${actionInfo.label}: ${isPositive ? '+' : ''}${newLog.amount.toFixed(2)} ر.س`,
            {
              description: `الرصيد الجديد: ${newLog.balance_after.toFixed(2)} ر.س`,
              icon: isPositive ? <ArrowUpCircle className="w-5 h-5 text-emerald-500" /> : <ArrowDownCircle className="w-5 h-5 text-orange-500" />,
            }
          );
          
          // Remove highlight after 5 seconds
          setTimeout(() => {
            setNewLogIds(prev => {
              const next = new Set(prev);
              next.delete(newLog.id);
              return next;
            });
          }, 5000);
          
          // Refresh stats
          fetchStats();
        }
      )
      .subscribe();

    // Also subscribe to balance updates
    const balanceChannel = supabase
      .channel('user_balances_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_balances',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(balanceChannel);
    };
  }, [user, isRealtime, fetchStats]);

  // Chart data
  const balanceChartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const dailyData: Record<string, { date: string; balance: number; deposits: number; expenses: number }> = {};
    
    sortedLogs.forEach(log => {
      const dateKey = format(new Date(log.created_at), "dd/MM");
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          balance: log.balance_after,
          deposits: 0,
          expenses: 0,
        };
      } else {
        dailyData[dateKey].balance = log.balance_after;
      }
      
      if (log.amount > 0) {
        dailyData[dateKey].deposits += log.amount;
      } else {
        dailyData[dateKey].expenses += Math.abs(log.amount);
      }
    });
    
    return Object.values(dailyData);
  }, [logs]);

  // Transactions summary
  const transactionsSummary = useMemo(() => {
    const summary: Record<string, { type: string; label: string; total: number; count: number }> = {};
    
    logs.forEach(log => {
      const actionInfo = actionTypeLabels[log.action_type] || { label: log.action_type };
      
      if (!summary[log.action_type]) {
        summary[log.action_type] = {
          type: log.action_type,
          label: actionInfo.label,
          total: 0,
          count: 0,
        };
      }
      
      summary[log.action_type].total += Math.abs(log.amount);
      summary[log.action_type].count += 1;
    });
    
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [logs]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    return transactionsSummary.slice(0, 6).map((item, index) => ({
      name: item.label,
      value: item.total,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }, [transactionsSummary]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.action_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getActionInfo = (actionType: string) => {
    return actionTypeLabels[actionType] || {
      label: actionType,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10 border-gray-500/30",
      icon: Wallet,
    };
  };

  return (
    <ClientDashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <History className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  سجل الرصيد
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">تتبع جميع تغييرات رصيدك بشكل لحظي</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <LiveIndicator />
              <Button 
                onClick={() => { fetchLogs(); fetchStats(); }} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">تحديث</span>
              </Button>
            </div>
          </div>
          
          {/* Last update indicator */}
          <motion.div 
            key={lastUpdate.toISOString()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Clock className="w-3 h-3" />
            <span>آخر تحديث: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ar })}</span>
          </motion.div>
        </div>

        {/* Stats Cards - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20 group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div 
                className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20"
                    whileHover={{ rotate: 10 }}
                  >
                    <Wallet className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">الرصيد الحالي</p>
                    <motion.p 
                      key={stats.currentBalance}
                      initial={{ scale: 1.1, color: 'hsl(var(--primary))' }}
                      animate={{ scale: 1, color: 'hsl(var(--primary))' }}
                      className="text-3xl font-bold"
                    >
                      {stats.currentBalance.toFixed(2)} ر.س
                    </motion.p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-transparent border-emerald-500/20 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div 
                className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                    whileHover={{ rotate: 10 }}
                  >
                    <TrendingUp className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">إجمالي الإيداعات</p>
                    <motion.p 
                      key={stats.totalDeposits}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-emerald-500"
                    >
                      {stats.totalDeposits.toFixed(2)} ر.س
                    </motion.p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-transparent border-orange-500/20 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div 
                className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20"
                    whileHover={{ rotate: 10 }}
                  >
                    <TrendingDown className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">إجمالي المصروفات</p>
                    <motion.p 
                      key={stats.totalSpent}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-orange-500"
                    >
                      {stats.totalSpent.toFixed(2)} ر.س
                    </motion.p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Over Time Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    حركة الرصيد
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="w-3 h-3 ml-1" />
                    تحديث لحظي
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[280px] w-full rounded-xl" />
                ) : balanceChartData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">لا توجد بيانات كافية للرسم البياني</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceChartData}>
                        <defs>
                          <linearGradient id="balanceGradientEnhanced" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          name="الرصيد"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          fill="url(#balanceGradientEnhanced)"
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5 text-primary" />
                  توزيع العمليات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[280px] w-full rounded-xl" />
                ) : pieChartData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Circle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">لا توجد بيانات</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom"
                          formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
                الإيداعات مقابل المصروفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full rounded-xl" />
              ) : balanceChartData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد بيانات كافية</p>
                  </div>
                </div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={balanceChartData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                      />
                      <Bar 
                        dataKey="deposits" 
                        name="الإيداعات" 
                        fill="#22c55e" 
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar 
                        dataKey="expenses" 
                        name="المصروفات" 
                        fill="#f97316" 
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Summary */}
        {transactionsSummary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  ملخص العمليات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {transactionsSummary.map((item, index) => {
                    const actionInfo = getActionInfo(item.type);
                    const ActionIcon = actionInfo.icon;
                    return (
                      <motion.div
                        key={item.type}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        className={`p-4 rounded-xl border ${actionInfo.bgColor} transition-all cursor-default`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <ActionIcon className={`w-4 h-4 ${actionInfo.color}`} />
                          <span className={`text-xs font-medium ${actionInfo.color}`}>{item.label}</span>
                        </div>
                        <p className="text-xl font-bold">${item.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.count} عملية</p>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في السجل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 ml-2" />
                    <SelectValue placeholder="نوع العملية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="deposit">إيداع</SelectItem>
                    <SelectItem value="order">طلب</SelectItem>
                    <SelectItem value="refund">استرداد</SelectItem>
                    <SelectItem value="commission">عمولة</SelectItem>
                    <SelectItem value="credit">إضافة</SelectItem>
                    <SelectItem value="debit">خصم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logs Table - Enhanced with animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  سجل العمليات
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {filteredLogs.length} عملية
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-muted-foreground"
                >
                  <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">لا توجد سجلات</p>
                  <p className="text-sm mt-1">سيظهر هنا سجل جميع عملياتك المالية</p>
                </motion.div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-right font-semibold">التاريخ</TableHead>
                        <TableHead className="text-right font-semibold">نوع العملية</TableHead>
                        <TableHead className="text-right font-semibold">المبلغ</TableHead>
                        <TableHead className="text-right font-semibold hidden sm:table-cell">الرصيد قبل</TableHead>
                        <TableHead className="text-right font-semibold">الرصيد بعد</TableHead>
                        <TableHead className="text-right font-semibold hidden md:table-cell">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredLogs.map((log, index) => {
                          const actionInfo = getActionInfo(log.action_type);
                          const ActionIcon = actionInfo.icon;
                          const isPositive = log.amount > 0;
                          const isNew = newLogIds.has(log.id);

                          return (
                            <motion.tr
                              key={log.id}
                              initial={{ opacity: 0, x: -20, backgroundColor: isNew ? 'hsl(var(--primary) / 0.1)' : 'transparent' }}
                              animate={{ 
                                opacity: 1, 
                                x: 0, 
                                backgroundColor: isNew ? 'hsl(var(--primary) / 0.05)' : 'transparent' 
                              }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.02 }}
                              className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${isNew ? 'relative' : ''}`}
                            >
                              {isNew && (
                                <motion.div 
                                  className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-r"
                                  initial={{ scaleY: 0 }}
                                  animate={{ scaleY: 1 }}
                                />
                              )}
                              <TableCell className="py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium block">
                                      {format(new Date(log.created_at), "dd MMM yyyy", { locale: ar })}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(log.created_at), "HH:mm:ss")}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`gap-1.5 ${actionInfo.bgColor} ${actionInfo.color} border font-medium`}>
                                  <ActionIcon className="w-3.5 h-3.5" />
                                  {actionInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <motion.span 
                                  className={`font-bold text-base ${isPositive ? "text-emerald-500" : "text-red-500"}`}
                                  initial={isNew ? { scale: 1.2 } : {}}
                                  animate={{ scale: 1 }}
                                >
                                  {isPositive ? "+" : ""}{log.amount.toFixed(2)}$
                                </motion.span>
                              </TableCell>
                              <TableCell className="text-muted-foreground hidden sm:table-cell">
                                ${log.balance_before.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold">${log.balance_after.toFixed(2)}</span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate hidden md:table-cell">
                                {log.notes || "-"}
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientBalanceLogs;
