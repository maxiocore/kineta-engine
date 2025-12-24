import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, startOfMonth, subMonths, parseISO } from "date-fns";
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
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Coins,
  Receipt,
  CreditCard,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
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
  ComposedChart,
  Line,
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  deposit: { 
    label: "إيداع", 
    color: "text-emerald-500", 
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    icon: ArrowUpCircle,
    gradient: "from-emerald-500 to-emerald-600"
  },
  order: { 
    label: "طلب", 
    color: "text-orange-500", 
    bgColor: "bg-orange-500/10 border-orange-500/30",
    icon: ArrowDownCircle,
    gradient: "from-orange-500 to-orange-600"
  },
  refund: { 
    label: "استرداد", 
    color: "text-blue-500", 
    bgColor: "bg-blue-500/10 border-blue-500/30",
    icon: RefreshCw,
    gradient: "from-blue-500 to-blue-600"
  },
  commission: { 
    label: "عمولة إحالة", 
    color: "text-purple-500", 
    bgColor: "bg-purple-500/10 border-purple-500/30",
    icon: TrendingUp,
    gradient: "from-purple-500 to-purple-600"
  },
  credit: { 
    label: "إضافة", 
    color: "text-green-500", 
    bgColor: "bg-green-500/10 border-green-500/30",
    icon: ArrowUpCircle,
    gradient: "from-green-500 to-green-600"
  },
  debit: { 
    label: "خصم", 
    color: "text-red-500", 
    bgColor: "bg-red-500/10 border-red-500/30",
    icon: ArrowDownCircle,
    gradient: "from-red-500 to-red-600"
  },
  initial: { 
    label: "رصيد أولي", 
    color: "text-gray-500", 
    bgColor: "bg-gray-500/10 border-gray-500/30",
    icon: Wallet,
    gradient: "from-gray-500 to-gray-600"
  },
  manual_adjustment: { 
    label: "تعديل يدوي", 
    color: "text-yellow-500", 
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    icon: RefreshCw,
    gradient: "from-yellow-500 to-yellow-600"
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

// Enhanced Transaction Card Component
const TransactionCard = ({ 
  log, 
  index, 
  isNew, 
  isExpanded,
  onToggle 
}: { 
  log: BalanceLog; 
  index: number; 
  isNew: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const actionInfo = actionTypeLabels[log.action_type] || {
    label: log.action_type,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10 border-gray-500/30",
    icon: Wallet,
    gradient: "from-gray-500 to-gray-600"
  };
  const ActionIcon = actionInfo.icon;
  const isPositive = log.amount > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        backgroundColor: isNew ? 'hsl(var(--primary) / 0.05)' : 'transparent' 
      }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ 
        delay: index * 0.03,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{ scale: 1.01 }}
      className={`relative group rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
        isNew ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border/50 hover:border-border'
      }`}
    >
      {/* New indicator glow */}
      {isNew && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        />
      )}
      
      {/* Left accent bar */}
      <motion.div 
        className={`absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b ${actionInfo.gradient}`}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: index * 0.03 + 0.1 }}
      />

      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Right side - Icon, Type & Amount */}
          <div className="flex items-center gap-3 flex-1">
            <motion.div 
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${actionInfo.gradient} flex items-center justify-center shadow-lg`}
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ActionIcon className="w-6 h-6 text-white" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className={`${actionInfo.bgColor} ${actionInfo.color} border font-medium text-xs px-2 py-0.5`}
                >
                  {actionInfo.label}
                </Badge>
                {isNew && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium"
                  >
                    جديد
                  </motion.span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(log.created_at), "dd MMM yyyy", { locale: ar })}</span>
                <span>•</span>
                <span>{format(new Date(log.created_at), "HH:mm:ss")}</span>
              </div>
            </div>
          </div>

          {/* Left side - Amount */}
          <div className="flex items-center gap-3">
            <motion.div 
              className="text-left"
              initial={isNew ? { scale: 1.2 } : {}}
              animate={{ scale: 1 }}
            >
              <motion.p 
                className={`text-lg font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}
                animate={isNew ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {isPositive ? "+" : ""}{log.amount.toFixed(2)} ر.س
              </motion.p>
              <p className="text-xs text-muted-foreground">
                الرصيد: {log.balance_after.toFixed(2)} ر.س
              </p>
            </motion.div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-border/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">الرصيد قبل</p>
                    <p className="font-semibold">{log.balance_before.toFixed(2)} ر.س</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">الرصيد بعد</p>
                    <p className="font-semibold">{log.balance_after.toFixed(2)} ر.س</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">الفرق</p>
                    <p className={`font-semibold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                      {isPositive ? "+" : ""}{log.amount.toFixed(2)} ر.س
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">التوقيت</p>
                    <p className="font-semibold text-sm">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                </div>
                
                {log.notes && (
                  <div className="mt-3 bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                    <p className="text-sm">{log.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Stats Mini Card
const StatsMiniCard = ({ 
  label, 
  value, 
  count, 
  icon: Icon, 
  color, 
  bgColor,
  delay 
}: { 
  label: string; 
  value: number; 
  count: number;
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.03, y: -2 }}
    className={`relative overflow-hidden p-4 rounded-2xl border ${bgColor} transition-all cursor-default group`}
  >
    <motion.div 
      className="absolute -top-8 -left-8 w-24 h-24 rounded-full opacity-20 blur-2xl"
      style={{ backgroundColor: color.replace('text-', '').includes('-') ? undefined : color }}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    <div className="flex items-center gap-2 mb-2">
      <motion.div
        whileHover={{ rotate: 10 }}
        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bgColor} flex items-center justify-center`}
      >
        <Icon className={`w-4 h-4 ${color}`} />
      </motion.div>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
    <motion.p 
      className="text-xl font-bold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.1 }}
    >
      {value.toFixed(2)} ر.س
    </motion.p>
    <p className="text-xs text-muted-foreground mt-0.5">{count} عملية</p>
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
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalSpent: 0,
    currentBalance: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  // Monthly comparison data
  const monthlyChartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    const monthlyData: Record<string, { 
      month: string; 
      monthLabel: string;
      deposits: number; 
      expenses: number; 
      refunds: number;
      net: number;
    }> = {};
    
    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM yyyy", { locale: ar });
      monthlyData[monthKey] = {
        month: monthKey,
        monthLabel,
        deposits: 0,
        expenses: 0,
        refunds: 0,
        net: 0,
      };
    }
    
    logs.forEach(log => {
      const monthKey = format(new Date(log.created_at), "yyyy-MM");
      
      if (monthlyData[monthKey]) {
        if (log.action_type === 'deposit' || log.action_type === 'credit' || log.action_type === 'commission') {
          monthlyData[monthKey].deposits += log.amount;
        } else if (log.action_type === 'refund') {
          monthlyData[monthKey].refunds += log.amount;
        } else if (log.amount < 0) {
          monthlyData[monthKey].expenses += Math.abs(log.amount);
        }
      }
    });
    
    // Calculate net for each month
    Object.values(monthlyData).forEach(month => {
      month.net = month.deposits + month.refunds - month.expenses;
    });
    
    return Object.values(monthlyData);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "all" || log.action_type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [logs, searchTerm, filterType]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage, ITEMS_PER_PAGE]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const getActionInfo = (actionType: string) => {
    return actionTypeLabels[actionType] || {
      label: actionType,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10 border-gray-500/30",
      icon: Wallet,
      gradient: "from-gray-500 to-gray-600"
    };
  };

  return (
    <ClientDashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-4 md:space-y-6 px-1"
        dir="rtl"
      >
        {/* Header - Mobile Optimized */}
        <motion.div 
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <motion.div 
                className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.05, rotate: 5 }}
                animate={{ 
                  boxShadow: [
                    "0 10px 25px -5px hsl(var(--primary) / 0.25)",
                    "0 15px 35px -5px hsl(var(--primary) / 0.35)",
                    "0 10px 25px -5px hsl(var(--primary) / 0.25)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <History className="w-5 h-5 md:w-7 md:h-7 text-primary-foreground" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-xl md:text-3xl font-display font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  سجل الرصيد
                </motion.h1>
                <motion.p 
                  className="text-xs md:text-sm text-muted-foreground mt-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  تتبع جميع تغييرات رصيدك في الوقت الفعلي
                </motion.p>
              </div>
            </div>
            
            <motion.div 
              className="flex items-center gap-2 md:gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <LiveIndicator />
              <Button 
                onClick={() => { fetchLogs(); fetchStats(); }} 
                variant="outline" 
                size="sm"
                className="gap-2 h-8 md:h-9 group"
              >
                <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span className="hidden sm:inline">تحديث</span>
              </Button>
            </motion.div>
          </div>
          
          {/* Last update indicator */}
          <motion.div 
            key={lastUpdate.toISOString()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground"
          >
            <Clock className="w-3 h-3" />
            <span>آخر تحديث: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ar })}</span>
          </motion.div>
        </motion.div>

        {/* Stats Cards - Enhanced with better animations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            {
              title: "الرصيد الحالي",
              value: stats.currentBalance,
              icon: Wallet,
              color: "primary",
              gradient: "from-primary to-primary/60",
              delay: 0.1
            },
            {
              title: "إجمالي الإيداعات",
              value: stats.totalDeposits,
              icon: TrendingUp,
              color: "emerald",
              gradient: "from-emerald-500 to-emerald-600",
              delay: 0.2
            },
            {
              title: "إجمالي المصروفات",
              value: stats.totalSpent,
              icon: TrendingDown,
              color: "orange",
              gradient: "from-orange-500 to-orange-600",
              delay: 0.3
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: stat.delay, type: "spring", stiffness: 300 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group"
            >
              <Card className={`relative overflow-hidden bg-gradient-to-br from-${stat.color === 'primary' ? 'primary' : stat.color + '-500'}/5 via-${stat.color === 'primary' ? 'primary' : stat.color + '-500'}/10 to-transparent border-${stat.color === 'primary' ? 'primary' : stat.color + '-500'}/20 h-full`}>
                <motion.div 
                  className={`absolute -top-10 -left-10 w-32 h-32 bg-${stat.color === 'primary' ? 'primary' : stat.color + '-500'}/10 rounded-full blur-3xl`}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <CardContent className="p-4 md:p-5 relative">
                  <div className="flex items-center gap-3 md:gap-4">
                    <motion.div 
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                      whileHover={{ rotate: 10, scale: 1.05 }}
                    >
                      <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium">{stat.title}</p>
                      <motion.p 
                        key={stat.value}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className={`text-xl md:text-2xl lg:text-3xl font-bold ${
                          stat.color === 'primary' ? 'text-primary' : 
                          stat.color === 'emerald' ? 'text-emerald-500' : 'text-orange-500'
                        }`}
                      >
                        {stat.value.toFixed(2)} ر.س
                      </motion.p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Section - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Balance Over Time Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Activity className="w-5 h-5 text-primary" />
                    </motion.div>
                    حركة الرصيد
                  </CardTitle>
                  <Badge variant="outline" className="text-xs gap-1 bg-primary/5">
                    <Sparkles className="w-3 h-3" />
                    تحديث لحظي
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[280px] w-full rounded-xl" />
                ) : balanceChartData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <motion.div 
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">لا توجد بيانات كافية للرسم البياني</p>
                    </motion.div>
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
                          tickFormatter={(value) => `${value}`}
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
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
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
                    <motion.div 
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Circle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">لا توجد بيانات</p>
                    </motion.div>
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
                          formatter={(value: number) => [`${value.toFixed(2)} ر.س`, '']}
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

        {/* Monthly Comparison Chart - NEW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </motion.div>
                  مقارنة شهرية
                </CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">الإيداعات</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">المصروفات</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">الاستردادات</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[320px] w-full rounded-xl" />
              ) : monthlyChartData.length === 0 ? (
                <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">لا توجد بيانات كافية</p>
                  </motion.div>
                </div>
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyChartData} barGap={4}>
                      <defs>
                        <linearGradient id="depositsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.5} />
                        </linearGradient>
                        <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
                        </linearGradient>
                        <linearGradient id="refundsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                      <XAxis 
                        dataKey="monthLabel" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-2xl"
                              >
                                <p className="text-sm font-bold text-foreground mb-3">{label}</p>
                                <div className="space-y-2">
                                  {payload.map((entry: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-xs text-muted-foreground">{entry.name}</span>
                                      </div>
                                      <span className="text-sm font-semibold" style={{ color: entry.color }}>
                                        {entry.value?.toFixed(2)} ر.س
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-border">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">صافي الحركة</span>
                                    <span className={`text-sm font-bold ${
                                      (payload[0]?.payload?.net || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                                    }`}>
                                      {(payload[0]?.payload?.net || 0) >= 0 ? '+' : ''}
                                      {(payload[0]?.payload?.net || 0).toFixed(2)} ر.س
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="deposits" 
                        name="الإيداعات" 
                        fill="url(#depositsGradient)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                      <Bar 
                        dataKey="expenses" 
                        name="المصروفات" 
                        fill="url(#expensesGradient)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                      <Bar 
                        dataKey="refunds" 
                        name="الاستردادات" 
                        fill="url(#refundsGradient)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="net" 
                        name="صافي الحركة"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Monthly Summary Cards */}
              {monthlyChartData.length > 0 && (
                <motion.div 
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {(() => {
                    const totals = monthlyChartData.reduce((acc, m) => ({
                      deposits: acc.deposits + m.deposits,
                      expenses: acc.expenses + m.expenses,
                      refunds: acc.refunds + m.refunds,
                      net: acc.net + m.net,
                    }), { deposits: 0, expenses: 0, refunds: 0, net: 0 });
                    
                    return [
                      { label: "إجمالي الإيداعات", value: totals.deposits, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                      { label: "إجمالي المصروفات", value: totals.expenses, color: "text-orange-500", bg: "bg-orange-500/10" },
                      { label: "إجمالي الاستردادات", value: totals.refunds, color: "text-blue-500", bg: "bg-blue-500/10" },
                      { label: "صافي الحركة", value: totals.net, color: totals.net >= 0 ? "text-emerald-500" : "text-red-500", bg: totals.net >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
                    ].map((item, idx) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * idx }}
                        className={`${item.bg} rounded-xl p-3 text-center`}
                      >
                        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p className={`text-lg font-bold ${item.color}`}>
                          {item.value >= 0 && item.label === "صافي الحركة" ? '+' : ''}
                          {item.value.toFixed(2)} ر.س
                        </p>
                      </motion.div>
                    ));
                  })()}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Summary - Enhanced */}
        {transactionsSummary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-5 h-5 text-primary" />
                  </motion.div>
                  ملخص العمليات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {transactionsSummary.map((item, index) => {
                    const actionInfo = getActionInfo(item.type);
                    return (
                      <StatsMiniCard
                        key={item.type}
                        label={item.label}
                        value={item.total}
                        count={item.count}
                        icon={actionInfo.icon}
                        color={actionInfo.color}
                        bgColor={actionInfo.bgColor}
                        delay={0.1 * index}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في السجل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 bg-background/50"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48 bg-background/50">
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

        {/* Logs List - Enhanced with Card View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Calendar className="w-5 h-5 text-primary" />
                  </motion.div>
                  سجل العمليات
                </CardTitle>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Receipt className="w-3 h-3" />
                    {filteredLogs.length} عملية
                  </Badge>
                </motion.div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Skeleton className="h-20 w-full rounded-2xl" />
                    </motion.div>
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 text-muted-foreground"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wallet className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  </motion.div>
                  <p className="text-lg font-medium">لا توجد سجلات</p>
                  <p className="text-sm mt-1">سيظهر هنا سجل جميع عملياتك المالية</p>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {paginatedLogs.map((log, index) => (
                        <TransactionCard
                          key={log.id}
                          log={log}
                          index={index}
                          isNew={newLogIds.has(log.id)}
                          isExpanded={expandedLogId === log.id}
                          onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between pt-6 border-t border-border/50 mt-6"
                    >
                      <div className="text-sm text-muted-foreground">
                        عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} من {filteredLogs.length} عملية
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* First Page */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </motion.button>
                        
                        {/* Previous Page */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="w-4 h-4 rotate-90" />
                        </motion.button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 mx-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              if (totalPages <= 5) return true;
                              if (page === 1 || page === totalPages) return true;
                              if (Math.abs(page - currentPage) <= 1) return true;
                              return false;
                            })
                            .map((page, index, array) => (
                              <div key={page} className="flex items-center">
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="px-1 text-muted-foreground">...</span>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setCurrentPage(page)}
                                  className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all ${
                                    currentPage === page
                                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                      : 'hover:bg-muted'
                                  }`}
                                >
                                  {page}
                                </motion.button>
                              </div>
                            ))}
                        </div>

                        {/* Next Page */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </motion.button>
                        
                        {/* Last Page */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientBalanceLogs;
