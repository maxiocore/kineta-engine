import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Zap,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Minus,
  Brain,
  Sparkles,
  LineChart,
  PieChart,
  Users,
  DollarSign,
  ShoppingCart,
  RotateCcw,
  Clock,
  Eye,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay, format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface TrendAnalysis {
  id: string;
  type: "deposits" | "orders" | "refunds" | "users" | "revenue" | "balance";
  title: string;
  description: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  severity: "positive" | "negative" | "neutral" | "warning";
  icon: React.ElementType;
  recommendation?: string;
}

interface AnomalyAlert {
  id: string;
  type: "spike" | "drop" | "pattern" | "threshold";
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  detectedAt: Date;
  isAcknowledged: boolean;
}

interface HealthMetric {
  name: string;
  value: number;
  status: "good" | "warning" | "critical";
  description: string;
}

export const AnalyticsAlertsPanel = () => {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ["analytics-alerts"],
    queryFn: async () => {
      const now = new Date();
      const today = startOfDay(now);
      const yesterday = startOfDay(subDays(now, 1));
      const lastWeekStart = startOfDay(subDays(now, 7));
      const previousWeekStart = startOfDay(subDays(now, 14));
      const lastMonthStart = startOfDay(subDays(now, 30));
      const previousMonthStart = startOfDay(subDays(now, 60));

      // Fetch deposits - current week vs previous week
      const [currentWeekDeposits, previousWeekDeposits] = await Promise.all([
        supabase
          .from("deposits")
          .select("amount")
          .eq("status", "completed")
          .gte("completed_at", lastWeekStart.toISOString())
          .lte("completed_at", now.toISOString()),
        supabase
          .from("deposits")
          .select("amount")
          .eq("status", "completed")
          .gte("completed_at", previousWeekStart.toISOString())
          .lt("completed_at", lastWeekStart.toISOString()),
      ]);

      // Fetch orders - current week vs previous week
      const [currentWeekOrders, previousWeekOrders] = await Promise.all([
        supabase
          .from("orders")
          .select("total_price, status")
          .gte("created_at", lastWeekStart.toISOString())
          .lte("created_at", now.toISOString()),
        supabase
          .from("orders")
          .select("total_price, status")
          .gte("created_at", previousWeekStart.toISOString())
          .lt("created_at", lastWeekStart.toISOString()),
      ]);

      // Fetch refunds
      const [currentWeekRefunds, previousWeekRefunds] = await Promise.all([
        supabase
          .from("orders")
          .select("total_price")
          .eq("status", "refunded")
          .gte("created_at", lastWeekStart.toISOString())
          .lte("created_at", now.toISOString()),
        supabase
          .from("orders")
          .select("total_price")
          .eq("status", "refunded")
          .gte("created_at", previousWeekStart.toISOString())
          .lt("created_at", lastWeekStart.toISOString()),
      ]);

      // Fetch user balances for analysis
      const { data: balances } = await supabase
        .from("user_balances")
        .select("balance, total_spent, updated_at");

      // Daily data for anomaly detection (last 30 days)
      const dailyDeposits: number[] = [];
      const dailyOrders: number[] = [];
      const dailyRefunds: number[] = [];

      for (let i = 29; i >= 0; i--) {
        const dayStart = startOfDay(subDays(now, i));
        const dayEnd = endOfDay(subDays(now, i));

        const { data: dayDepositsData } = await supabase
          .from("deposits")
          .select("amount")
          .eq("status", "completed")
          .gte("completed_at", dayStart.toISOString())
          .lte("completed_at", dayEnd.toISOString());

        const { data: dayOrdersData } = await supabase
          .from("orders")
          .select("total_price, status")
          .gte("created_at", dayStart.toISOString())
          .lte("created_at", dayEnd.toISOString());

        dailyDeposits.push(dayDepositsData?.reduce((sum, d) => sum + d.amount, 0) || 0);
        dailyOrders.push(
          dayOrdersData
            ?.filter((o) => o.status === "completed")
            .reduce((sum, o) => sum + o.total_price, 0) || 0
        );
        dailyRefunds.push(
          dayOrdersData
            ?.filter((o) => o.status === "refunded")
            .reduce((sum, o) => sum + o.total_price, 0) || 0
        );
      }

      // Calculate metrics
      const currentDepositsTotal = currentWeekDeposits.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const previousDepositsTotal = previousWeekDeposits.data?.reduce((sum, d) => sum + d.amount, 0) || 0;

      const currentOrdersTotal = currentWeekOrders.data
        ?.filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.total_price, 0) || 0;
      const previousOrdersTotal = previousWeekOrders.data
        ?.filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.total_price, 0) || 0;

      const currentRefundsTotal = currentWeekRefunds.data?.reduce((sum, o) => sum + o.total_price, 0) || 0;
      const previousRefundsTotal = previousWeekRefunds.data?.reduce((sum, o) => sum + o.total_price, 0) || 0;

      const currentOrdersCount = currentWeekOrders.data?.filter((o) => o.status === "completed").length || 0;
      const previousOrdersCount = previousWeekOrders.data?.filter((o) => o.status === "completed").length || 0;

      const currentRefundsCount = currentWeekRefunds.data?.length || 0;
      const previousRefundsCount = previousWeekRefunds.data?.length || 0;

      return {
        deposits: { current: currentDepositsTotal, previous: previousDepositsTotal },
        orders: { current: currentOrdersTotal, previous: previousOrdersTotal },
        ordersCount: { current: currentOrdersCount, previous: previousOrdersCount },
        refunds: { current: currentRefundsTotal, previous: previousRefundsTotal },
        refundsCount: { current: currentRefundsCount, previous: previousRefundsCount },
        dailyDeposits,
        dailyOrders,
        dailyRefunds,
        balances: balances || [],
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Calculate change percentage
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Determine trend
  const getTrend = (changePercent: number): "up" | "down" | "stable" => {
    if (changePercent > 5) return "up";
    if (changePercent < -5) return "down";
    return "stable";
  };

  // Calculate standard deviation for anomaly detection
  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { mean: 0, stdDev: 0 };
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  };

  // Generate trend analyses
  const generateTrendAnalyses = (): TrendAnalysis[] => {
    if (!analyticsData) return [];

    const analyses: TrendAnalysis[] = [];

    // Deposits trend
    const depositsChange = calculateChange(analyticsData.deposits.current, analyticsData.deposits.previous);
    const depositsTrend = getTrend(depositsChange);
    analyses.push({
      id: "deposits",
      type: "deposits",
      title: "الإيداعات",
      description:
        depositsTrend === "up"
          ? "ارتفاع ملحوظ في الإيداعات"
          : depositsTrend === "down"
          ? "انخفاض في الإيداعات"
          : "استقرار في الإيداعات",
      currentValue: analyticsData.deposits.current,
      previousValue: analyticsData.deposits.previous,
      changePercent: depositsChange,
      trend: depositsTrend,
      severity: depositsTrend === "up" ? "positive" : depositsTrend === "down" ? "warning" : "neutral",
      icon: ArrowUpCircle,
      recommendation:
        depositsTrend === "down"
          ? "قد تحتاج إلى مراجعة استراتيجيات التسويق أو تقديم عروض خاصة"
          : undefined,
    });

    // Orders trend
    const ordersChange = calculateChange(analyticsData.orders.current, analyticsData.orders.previous);
    const ordersTrend = getTrend(ordersChange);
    analyses.push({
      id: "orders",
      type: "orders",
      title: "الطلبات",
      description:
        ordersTrend === "up"
          ? "نمو في حجم الطلبات"
          : ordersTrend === "down"
          ? "تراجع في الطلبات"
          : "ثبات في معدل الطلبات",
      currentValue: analyticsData.orders.current,
      previousValue: analyticsData.orders.previous,
      changePercent: ordersChange,
      trend: ordersTrend,
      severity: ordersTrend === "up" ? "positive" : ordersTrend === "down" ? "warning" : "neutral",
      icon: ShoppingCart,
      recommendation:
        ordersTrend === "down"
          ? "راجع أسعار الخدمات أو قم بتفعيل عروض ترويجية"
          : undefined,
    });

    // Refunds trend (negative is better)
    const refundsChange = calculateChange(analyticsData.refunds.current, analyticsData.refunds.previous);
    const refundsTrend = getTrend(refundsChange);
    analyses.push({
      id: "refunds",
      type: "refunds",
      title: "الاستردادات",
      description:
        refundsTrend === "up"
          ? "⚠️ زيادة مقلقة في الاستردادات"
          : refundsTrend === "down"
          ? "انخفاض إيجابي في الاستردادات"
          : "استقرار في معدل الاستردادات",
      currentValue: analyticsData.refunds.current,
      previousValue: analyticsData.refunds.previous,
      changePercent: refundsChange,
      trend: refundsTrend,
      severity: refundsTrend === "up" ? "negative" : refundsTrend === "down" ? "positive" : "neutral",
      icon: RotateCcw,
      recommendation:
        refundsTrend === "up"
          ? "تحقق من جودة الخدمات ورضا العملاء فوراً"
          : undefined,
    });

    // Revenue trend
    const revenue = analyticsData.orders.current - analyticsData.refunds.current;
    const prevRevenue = analyticsData.orders.previous - analyticsData.refunds.previous;
    const revenueChange = calculateChange(revenue, prevRevenue);
    const revenueTrend = getTrend(revenueChange);
    analyses.push({
      id: "revenue",
      type: "revenue",
      title: "صافي الإيرادات",
      description:
        revenueTrend === "up"
          ? "نمو في صافي الإيرادات"
          : revenueTrend === "down"
          ? "انخفاض في صافي الإيرادات"
          : "ثبات الإيرادات",
      currentValue: revenue,
      previousValue: prevRevenue,
      changePercent: revenueChange,
      trend: revenueTrend,
      severity: revenueTrend === "up" ? "positive" : revenueTrend === "down" ? "negative" : "neutral",
      icon: DollarSign,
    });

    return analyses;
  };

  // Generate anomaly alerts
  const generateAnomalyAlerts = (): AnomalyAlert[] => {
    if (!analyticsData) return [];

    const alerts: AnomalyAlert[] = [];
    const now = new Date();

    // Check for deposit anomalies
    const depositStats = calculateStats(analyticsData.dailyDeposits.slice(0, -1)); // Exclude today
    const todayDeposits = analyticsData.dailyDeposits[analyticsData.dailyDeposits.length - 1] || 0;

    if (depositStats.stdDev > 0) {
      const depositDeviation = (todayDeposits - depositStats.mean) / depositStats.stdDev;

      if (depositDeviation > 2) {
        alerts.push({
          id: "deposit_spike",
          type: "spike",
          title: "ارتفاع غير عادي في الإيداعات",
          message: `الإيداعات اليوم أعلى بكثير من المعتاد (${depositDeviation.toFixed(1)}σ)`,
          severity: depositDeviation > 3 ? "warning" : "info",
          metric: "الإيداعات",
          value: todayDeposits,
          expectedValue: depositStats.mean,
          deviation: depositDeviation,
          detectedAt: now,
          isAcknowledged: acknowledgedAlerts.has("deposit_spike"),
        });
      } else if (depositDeviation < -2 && depositStats.mean > 0) {
        alerts.push({
          id: "deposit_drop",
          type: "drop",
          title: "انخفاض حاد في الإيداعات",
          message: `الإيداعات اليوم أقل بكثير من المعتاد`,
          severity: depositDeviation < -3 ? "critical" : "warning",
          metric: "الإيداعات",
          value: todayDeposits,
          expectedValue: depositStats.mean,
          deviation: Math.abs(depositDeviation),
          detectedAt: now,
          isAcknowledged: acknowledgedAlerts.has("deposit_drop"),
        });
      }
    }

    // Check for refund anomalies
    const refundStats = calculateStats(analyticsData.dailyRefunds);
    const todayRefunds = analyticsData.dailyRefunds[analyticsData.dailyRefunds.length - 1] || 0;

    if (refundStats.stdDev > 0 && todayRefunds > 0) {
      const refundDeviation = (todayRefunds - refundStats.mean) / refundStats.stdDev;

      if (refundDeviation > 2) {
        alerts.push({
          id: "refund_spike",
          type: "spike",
          title: "⚠️ زيادة مفاجئة في الاستردادات",
          message: `الاستردادات اليوم أعلى من المعتاد بشكل ملحوظ`,
          severity: refundDeviation > 3 ? "critical" : "warning",
          metric: "الاستردادات",
          value: todayRefunds,
          expectedValue: refundStats.mean,
          deviation: refundDeviation,
          detectedAt: now,
          isAcknowledged: acknowledgedAlerts.has("refund_spike"),
        });
      }
    }

    // Check for consecutive declining days
    const last7DaysDeposits = analyticsData.dailyDeposits.slice(-7);
    let consecutiveDeclines = 0;
    for (let i = 1; i < last7DaysDeposits.length; i++) {
      if (last7DaysDeposits[i] < last7DaysDeposits[i - 1]) {
        consecutiveDeclines++;
      } else {
        consecutiveDeclines = 0;
      }
    }

    if (consecutiveDeclines >= 4) {
      alerts.push({
        id: "declining_pattern",
        type: "pattern",
        title: "نمط هبوطي متواصل",
        message: `${consecutiveDeclines} أيام متتالية من انخفاض الإيداعات`,
        severity: consecutiveDeclines >= 5 ? "critical" : "warning",
        metric: "الإيداعات",
        value: consecutiveDeclines,
        expectedValue: 0,
        deviation: consecutiveDeclines,
        detectedAt: now,
        isAcknowledged: acknowledgedAlerts.has("declining_pattern"),
      });
    }

    // Low balance threshold alert
    const lowBalanceUsers = analyticsData.balances.filter((b) => b.balance < 10 && b.balance > 0).length;
    const totalUsers = analyticsData.balances.length;
    const lowBalancePercent = totalUsers > 0 ? (lowBalanceUsers / totalUsers) * 100 : 0;

    if (lowBalancePercent > 30) {
      alerts.push({
        id: "high_low_balance_ratio",
        type: "threshold",
        title: "نسبة عالية من الأرصدة المنخفضة",
        message: `${lowBalancePercent.toFixed(0)}% من المستخدمين لديهم رصيد أقل من 10 ر.س`,
        severity: lowBalancePercent > 50 ? "critical" : "warning",
        metric: "نسبة الأرصدة المنخفضة",
        value: lowBalancePercent,
        expectedValue: 20,
        deviation: lowBalancePercent - 20,
        detectedAt: now,
        isAcknowledged: acknowledgedAlerts.has("high_low_balance_ratio"),
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  };

  // Calculate health score
  const calculateHealthScore = (): { score: number; metrics: HealthMetric[] } => {
    if (!analyticsData) return { score: 0, metrics: [] };

    const metrics: HealthMetric[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Deposits growth
    const depositsChange = calculateChange(analyticsData.deposits.current, analyticsData.deposits.previous);
    const depositsScore = depositsChange > 10 ? 100 : depositsChange > 0 ? 75 : depositsChange > -10 ? 50 : 25;
    metrics.push({
      name: "نمو الإيداعات",
      value: depositsScore,
      status: depositsScore >= 75 ? "good" : depositsScore >= 50 ? "warning" : "critical",
      description: `${depositsChange > 0 ? "+" : ""}${depositsChange.toFixed(1)}%`,
    });
    totalScore += depositsScore;
    maxScore += 100;

    // Orders growth
    const ordersChange = calculateChange(analyticsData.orders.current, analyticsData.orders.previous);
    const ordersScore = ordersChange > 10 ? 100 : ordersChange > 0 ? 75 : ordersChange > -10 ? 50 : 25;
    metrics.push({
      name: "نمو الطلبات",
      value: ordersScore,
      status: ordersScore >= 75 ? "good" : ordersScore >= 50 ? "warning" : "critical",
      description: `${ordersChange > 0 ? "+" : ""}${ordersChange.toFixed(1)}%`,
    });
    totalScore += ordersScore;
    maxScore += 100;

    // Refund rate
    const refundRate =
      analyticsData.ordersCount.current > 0
        ? (analyticsData.refundsCount.current / analyticsData.ordersCount.current) * 100
        : 0;
    const refundScore = refundRate < 2 ? 100 : refundRate < 5 ? 75 : refundRate < 10 ? 50 : 25;
    metrics.push({
      name: "معدل الاسترداد",
      value: refundScore,
      status: refundScore >= 75 ? "good" : refundScore >= 50 ? "warning" : "critical",
      description: `${refundRate.toFixed(1)}%`,
    });
    totalScore += refundScore;
    maxScore += 100;

    // Active users
    const activeUsers = analyticsData.balances.filter((b) => b.total_spent > 0).length;
    const activePercent =
      analyticsData.balances.length > 0 ? (activeUsers / analyticsData.balances.length) * 100 : 0;
    const activeScore = activePercent > 70 ? 100 : activePercent > 50 ? 75 : activePercent > 30 ? 50 : 25;
    metrics.push({
      name: "المستخدمين النشطين",
      value: activeScore,
      status: activeScore >= 75 ? "good" : activeScore >= 50 ? "warning" : "critical",
      description: `${activePercent.toFixed(0)}%`,
    });
    totalScore += activeScore;
    maxScore += 100;

    return {
      score: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      metrics,
    };
  };

  const trendAnalyses = generateTrendAnalyses();
  const anomalyAlerts = generateAnomalyAlerts();
  const { score: healthScore, metrics: healthMetrics } = calculateHealthScore();

  const acknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts((prev) => new Set(prev).add(alertId));
    toast.success("تم تأكيد التنبيه");
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return "from-emerald-500/20 to-emerald-500/5";
    if (score >= 50) return "from-amber-500/20 to-amber-500/5";
    return "from-red-500/20 to-red-500/5";
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="h-5 w-5 text-violet-500" />
            </motion.div>
            التحليلات الذكية
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Health Score */}
              <div className={`p-4 rounded-xl bg-gradient-to-br ${getScoreBg(healthScore)} border`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className={`h-5 w-5 ${getScoreColor(healthScore)}`} />
                    <span className="font-medium text-sm">مؤشر الصحة المالية</span>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>{healthScore}%</span>
                </div>
                <Progress value={healthScore} className="h-2 mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  {healthMetrics.map((metric) => (
                    <div
                      key={metric.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                    >
                      <span className="text-xs text-muted-foreground">{metric.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          metric.status === "good"
                            ? "border-emerald-500/50 text-emerald-500"
                            : metric.status === "warning"
                            ? "border-amber-500/50 text-amber-500"
                            : "border-red-500/50 text-red-500"
                        }`}
                      >
                        {metric.description}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anomaly Alerts */}
              {anomalyAlerts.filter((a) => !a.isAcknowledged).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      تنبيهات الشذوذ
                      <Badge variant="destructive" className="text-xs">
                        {anomalyAlerts.filter((a) => !a.isAcknowledged).length}
                      </Badge>
                    </div>
                    <AnimatePresence>
                      {anomalyAlerts
                        .filter((a) => !a.isAcknowledged)
                        .map((alert, index) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 rounded-lg border ${
                              alert.severity === "critical"
                                ? "bg-red-500/10 border-red-500/30"
                                : alert.severity === "warning"
                                ? "bg-amber-500/10 border-amber-500/30"
                                : "bg-blue-500/10 border-blue-500/30"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <AlertCircle
                                  className={`h-4 w-4 mt-0.5 ${
                                    alert.severity === "critical"
                                      ? "text-red-500"
                                      : alert.severity === "warning"
                                      ? "text-amber-500"
                                      : "text-blue-500"
                                  }`}
                                />
                                <div>
                                  <p className="font-medium text-sm">{alert.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-[10px]">
                                      {alert.metric}: ${alert.value.toLocaleString("ar-SA")}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px]">
                                      المتوقع: ${alert.expectedValue.toLocaleString("ar-SA")}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                <Eye className="h-3 w-3 ml-1" />
                                تأكيد
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Trend Analyses */}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LineChart className="h-4 w-4 text-violet-500" />
                  تحليل الاتجاهات (الأسبوع الحالي)
                </div>
                {trendAnalyses.map((analysis, index) => {
                  const TrendIcon = analysis.icon;
                  return (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              analysis.severity === "positive"
                                ? "bg-emerald-500/10"
                                : analysis.severity === "negative"
                                ? "bg-red-500/10"
                                : analysis.severity === "warning"
                                ? "bg-amber-500/10"
                                : "bg-muted"
                            }`}
                          >
                            <TrendIcon
                              className={`h-5 w-5 ${
                                analysis.severity === "positive"
                                  ? "text-emerald-500"
                                  : analysis.severity === "negative"
                                  ? "text-red-500"
                                  : analysis.severity === "warning"
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{analysis.title}</p>
                            <p className="text-xs text-muted-foreground">{analysis.description}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1">
                            {analysis.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : analysis.trend === "down" ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span
                              className={`font-bold text-sm ${
                                analysis.changePercent > 0
                                  ? analysis.type === "refunds"
                                    ? "text-red-500"
                                    : "text-emerald-500"
                                  : analysis.changePercent < 0
                                  ? analysis.type === "refunds"
                                    ? "text-emerald-500"
                                    : "text-red-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {analysis.changePercent > 0 ? "+" : ""}
                              {analysis.changePercent.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ${analysis.currentValue.toLocaleString("ar-SA")}
                          </p>
                        </div>
                      </div>
                      {analysis.recommendation && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 cursor-help">
                                <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  {analysis.recommendation}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>توصية بناءً على تحليل البيانات</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AnalyticsAlertsPanel;
