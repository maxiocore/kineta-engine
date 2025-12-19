import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
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
} from "recharts";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const actionTypeLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  deposit: { label: "إيداع", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: ArrowUpCircle },
  order: { label: "طلب", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: ArrowDownCircle },
  refund: { label: "استرداد", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: RefreshCw },
  commission: { label: "عمولة إحالة", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: TrendingUp },
  credit: { label: "إضافة", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ArrowUpCircle },
  debit: { label: "خصم", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: ArrowDownCircle },
  initial: { label: "رصيد أولي", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: Wallet },
  manual_adjustment: { label: "تعديل يدوي", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: RefreshCw },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ${entry.value?.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ClientBalanceLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<BalanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalSpent: 0,
    currentBalance: 0,
  });

  useEffect(() => {
    if (user) {
      fetchLogs();
      fetchStats();
    }
  }, [user]);

  const fetchLogs = async () => {
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
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;

    const { data: balance } = await supabase
      .from("user_balances")
      .select("balance, total_deposited, total_spent")
      .eq("user_id", user.id)
      .single();

    if (balance) {
      setStats({
        totalDeposits: balance.total_deposited || 0,
        totalSpent: balance.total_spent || 0,
        currentBalance: balance.balance || 0,
      });
    }
  };

  // Prepare chart data - balance over time
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

  // Prepare transactions summary by type
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
      color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">سجل الرصيد</h1>
            <p className="text-muted-foreground mt-1">تتبع جميع تغييرات رصيدك</p>
          </div>
          <Button onClick={fetchLogs} variant="outline" className="gap-2 w-fit">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                    <p className="text-2xl font-bold text-primary">${stats.currentBalance.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإيداعات</p>
                    <p className="text-2xl font-bold text-green-500">${stats.totalDeposits.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                    <p className="text-2xl font-bold text-orange-500">${stats.totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Over Time Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  حركة الرصيد
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : balanceChartData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد بيانات كافية للرسم البياني</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceChartData}>
                        <defs>
                          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          name="الرصيد"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#balanceGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Deposits vs Expenses Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  الإيداعات vs المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : balanceChartData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد بيانات كافية للرسم البياني</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={balanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
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
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="expenses" 
                          name="المصروفات" 
                          fill="#f97316" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transactions Summary */}
        {transactionsSummary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  ملخص العمليات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {transactionsSummary.map((item, index) => {
                    const actionInfo = getActionInfo(item.type);
                    return (
                      <motion.div
                        key={item.type}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 rounded-xl border bg-card/50 hover:bg-card transition-colors"
                      >
                        <Badge variant="outline" className={`mb-2 ${actionInfo.color}`}>
                          {item.label}
                        </Badge>
                        <p className="text-xl font-bold">${item.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{item.count} عملية</p>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
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

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              سجل العمليات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد سجلات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">نوع العملية</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الرصيد قبل</TableHead>
                      <TableHead className="text-right">الرصيد بعد</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log, index) => {
                      const actionInfo = getActionInfo(log.action_type);
                      const ActionIcon = actionInfo.icon;
                      const isPositive = log.amount > 0;

                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(log.created_at), "dd MMM yyyy", { locale: ar })}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground block mt-1">
                              {format(new Date(log.created_at), "HH:mm")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${actionInfo.color}`}>
                              <ActionIcon className="w-3 h-3" />
                              {actionInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                              {isPositive ? "+" : ""}{log.amount.toFixed(2)}$
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            ${log.balance_before.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${log.balance_after.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {log.notes || "-"}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientBalanceLogs;
