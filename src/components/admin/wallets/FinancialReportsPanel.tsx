import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  PieChart,
  Loader2,
  Wallet,
  CreditCard,
  RefreshCw,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
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
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ReportData {
  summary: {
    totalDeposits: number;
    totalOrders: number;
    totalCommissions: number;
    totalRefunds: number;
    netRevenue: number;
    activeUsers: number;
    newUsers: number;
    averageOrderValue: number;
  };
  dailyData: Array<{
    date: string;
    deposits: number;
    orders: number;
    revenue: number;
    users: number;
  }>;
  depositsByMethod: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  topUsers: Array<{
    name: string;
    email: string;
    totalSpent: number;
    ordersCount: number;
  }>;
  balanceDistribution: Array<{
    range: string;
    count: number;
    total: number;
  }>;
}

const COLORS = ["#8b5cf6", "#10b981", "#f97316", "#3b82f6", "#ec4899", "#14b8a6"];

export const FinancialReportsPanel = () => {
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "week":
        return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarter":
        return { start: subMonths(startOfMonth(now), 2), end: endOfMonth(now) };
      case "year":
        return { start: subMonths(startOfMonth(now), 11), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["financial-report", dateRange],
    queryFn: async (): Promise<ReportData> => {
      const { start, end } = getDateRange();

      // Fetch deposits
      const { data: deposits } = await supabase
        .from("deposits")
        .select("*, payment_methods(name, name_ar)")
        .eq("status", "completed")
        .gte("completed_at", start.toISOString())
        .lte("completed_at", end.toISOString());

      // Fetch orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Fetch commissions
      const { data: commissions } = await supabase
        .from("referral_commissions")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Fetch user balances with profiles
      const { data: balances } = await supabase
        .from("user_balances")
        .select("*")
        .order("total_spent", { ascending: false });

      const userIds = balances?.map((b) => b.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Calculate summary
      const totalDeposits = deposits?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const completedOrders = orders?.filter((o) => o.status === "completed") || [];
      const totalOrders = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
      const totalCommissions = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const refundedOrders = orders?.filter((o) => o.status === "refunded") || [];
      const totalRefunds = refundedOrders.reduce((sum, o) => sum + o.total_price, 0);

      // Build daily data
      const daysCount = dateRange === "week" ? 7 : dateRange === "month" ? 30 : dateRange === "quarter" ? 90 : 365;
      const dailyData = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayDeposits = deposits?.filter(
          (d) => new Date(d.completed_at!) >= dayStart && new Date(d.completed_at!) <= dayEnd
        ) || [];
        const dayOrders = orders?.filter(
          (o) => new Date(o.created_at) >= dayStart && new Date(o.created_at) <= dayEnd
        ) || [];

        dailyData.push({
          date: format(date, dateRange === "year" ? "MMM" : "dd/MM", { locale: ar }),
          deposits: dayDeposits.reduce((sum, d) => sum + d.amount, 0),
          orders: dayOrders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total_price, 0),
          revenue: dayOrders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total_price, 0),
          users: new Set(dayOrders.map((o) => o.user_id)).size,
        });
      }

      // Aggregate for quarter/year views
      let aggregatedDailyData = dailyData;
      if (dateRange === "quarter" || dateRange === "year") {
        const chunkSize = dateRange === "quarter" ? 7 : 30;
        aggregatedDailyData = [];
        for (let i = 0; i < dailyData.length; i += chunkSize) {
          const chunk = dailyData.slice(i, i + chunkSize);
          aggregatedDailyData.push({
            date: chunk[0]?.date || "",
            deposits: chunk.reduce((sum, d) => sum + d.deposits, 0),
            orders: chunk.reduce((sum, d) => sum + d.orders, 0),
            revenue: chunk.reduce((sum, d) => sum + d.revenue, 0),
            users: chunk.reduce((sum, d) => sum + d.users, 0),
          });
        }
      }

      // Deposits by method
      const methodMap = new Map<string, { amount: number; count: number }>();
      deposits?.forEach((d) => {
        const methodName = d.payment_methods?.name_ar || "غير محدد";
        const existing = methodMap.get(methodName) || { amount: 0, count: 0 };
        methodMap.set(methodName, {
          amount: existing.amount + d.amount,
          count: existing.count + 1,
        });
      });

      const depositsByMethod = Array.from(methodMap.entries()).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
      }));

      // Top users
      const topUsers = (balances || []).slice(0, 10).map((b) => {
        const profile = profileMap.get(b.user_id);
        return {
          name: profile?.full_name || "مستخدم",
          email: profile?.email || "",
          totalSpent: b.total_spent,
          ordersCount: orders?.filter((o) => o.user_id === b.user_id && o.status === "completed").length || 0,
        };
      });

      // Balance distribution
      const balanceDistribution = [
        {
          range: "0 - 50$",
          count: balances?.filter((b) => b.balance >= 0 && b.balance <= 50).length || 0,
          total: balances?.filter((b) => b.balance >= 0 && b.balance <= 50).reduce((sum, b) => sum + b.balance, 0) || 0,
        },
        {
          range: "50 - 200$",
          count: balances?.filter((b) => b.balance > 50 && b.balance <= 200).length || 0,
          total: balances?.filter((b) => b.balance > 50 && b.balance <= 200).reduce((sum, b) => sum + b.balance, 0) || 0,
        },
        {
          range: "200 - 500$",
          count: balances?.filter((b) => b.balance > 200 && b.balance <= 500).length || 0,
          total: balances?.filter((b) => b.balance > 200 && b.balance <= 500).reduce((sum, b) => sum + b.balance, 0) || 0,
        },
        {
          range: "500 - 1000$",
          count: balances?.filter((b) => b.balance > 500 && b.balance <= 1000).length || 0,
          total: balances?.filter((b) => b.balance > 500 && b.balance <= 1000).reduce((sum, b) => sum + b.balance, 0) || 0,
        },
        {
          range: "1000$+",
          count: balances?.filter((b) => b.balance > 1000).length || 0,
          total: balances?.filter((b) => b.balance > 1000).reduce((sum, b) => sum + b.balance, 0) || 0,
        },
      ];

      return {
        summary: {
          totalDeposits,
          totalOrders,
          totalCommissions,
          totalRefunds,
          netRevenue: totalOrders - totalCommissions - totalRefunds,
          activeUsers: new Set(orders?.map((o) => o.user_id) || []).size,
          newUsers: balances?.filter((b) => new Date(b.updated_at) >= start).length || 0,
          averageOrderValue: completedOrders.length > 0 ? totalOrders / completedOrders.length : 0,
        },
        dailyData: aggregatedDailyData,
        depositsByMethod,
        topUsers,
        balanceDistribution,
      };
    },
  });

  const exportToPDF = async () => {
    if (!reportData) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const { start, end } = getDateRange();
      
      // Add Arabic font support by using standard fonts
      doc.setFont("helvetica");
      
      // Header with gradient-like effect
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, 210, 45, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("Financial Report", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`, 105, 32, { align: "center" });

      // Summary Section
      let yPos = 55;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 15, yPos);
      yPos += 10;

      // Summary cards
      const summaryData = [
        ["Total Deposits", `$${reportData.summary.totalDeposits.toLocaleString()}`],
        ["Total Orders", `$${reportData.summary.totalOrders.toLocaleString()}`],
        ["Net Revenue", `$${reportData.summary.netRevenue.toLocaleString()}`],
        ["Active Users", reportData.summary.activeUsers.toString()],
        ["Avg Order Value", `$${reportData.summary.averageOrderValue.toFixed(2)}`],
        ["Total Refunds", `$${reportData.summary.totalRefunds.toLocaleString()}`],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        styles: { halign: "center" },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "right", fontStyle: "bold" },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Top Users Section
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Top Users", 15, yPos);
      yPos += 10;

      const topUsersData = reportData.topUsers.slice(0, 5).map((user, index) => [
        (index + 1).toString(),
        user.name,
        user.email,
        `$${user.totalSpent.toLocaleString()}`,
        user.ordersCount.toString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Name", "Email", "Total Spent", "Orders"]],
        body: topUsersData,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { fontSize: 9 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Balance Distribution
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Balance Distribution", 15, yPos);
      yPos += 10;

      const balanceData = reportData.balanceDistribution.map((item) => [
        item.range,
        item.count.toString(),
        `$${item.total.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Range", "Users Count", "Total Balance"]],
        body: balanceData,
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Deposits by Payment Method
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Deposits by Payment Method", 15, yPos);
      yPos += 10;

      const depositMethodData = reportData.depositsByMethod.map((item) => [
        item.method,
        item.count.toString(),
        `$${item.amount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Payment Method", "Count", "Total Amount"]],
        body: depositMethodData,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount} | Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
          105,
          290,
          { align: "center" }
        );
      }

      doc.save(`financial-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("تم تصدير التقرير بصيغة PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء التصدير");
    }

    setIsExporting(false);
  };

  const exportToExcel = async () => {
    if (!reportData) return;
    setIsExporting(true);

    try {
      const { start, end } = getDateRange();
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["التقرير المالي"],
        [`الفترة: ${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`],
        [],
        ["المقياس", "القيمة"],
        ["إجمالي الإيداعات", `$${reportData.summary.totalDeposits.toLocaleString()}`],
        ["إجمالي الطلبات", `$${reportData.summary.totalOrders.toLocaleString()}`],
        ["صافي الإيرادات", `$${reportData.summary.netRevenue.toLocaleString()}`],
        ["المستخدمين النشطين", reportData.summary.activeUsers],
        ["متوسط قيمة الطلب", `$${reportData.summary.averageOrderValue.toFixed(2)}`],
        ["إجمالي الاستردادات", `$${reportData.summary.totalRefunds.toLocaleString()}`],
        ["إجمالي العمولات", `$${reportData.summary.totalCommissions.toLocaleString()}`],
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "الملخص");

      // Daily Data Sheet
      const dailyDataSheet = XLSX.utils.json_to_sheet(
        reportData.dailyData.map((d) => ({
          التاريخ: d.date,
          الإيداعات: d.deposits,
          الطلبات: d.orders,
          الإيرادات: d.revenue,
          المستخدمين: d.users,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, dailyDataSheet, "البيانات اليومية");

      // Top Users Sheet
      const topUsersSheet = XLSX.utils.json_to_sheet(
        reportData.topUsers.map((u) => ({
          الاسم: u.name,
          البريد: u.email,
          إجمالي_الإنفاق: u.totalSpent,
          عدد_الطلبات: u.ordersCount,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, topUsersSheet, "أفضل المستخدمين");

      // Balance Distribution Sheet
      const balanceSheet = XLSX.utils.json_to_sheet(
        reportData.balanceDistribution.map((b) => ({
          النطاق: b.range,
          عدد_المستخدمين: b.count,
          إجمالي_الرصيد: b.total,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, balanceSheet, "توزيع الأرصدة");

      // Deposits by Method Sheet
      const depositsSheet = XLSX.utils.json_to_sheet(
        reportData.depositsByMethod.map((d) => ({
          طريقة_الدفع: d.method,
          عدد_العمليات: d.count,
          إجمالي_المبلغ: d.amount,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, depositsSheet, "الإيداعات حسب الطريقة");

      XLSX.writeFile(workbook, `financial-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("تم تصدير التقرير بصيغة Excel بنجاح");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("حدث خطأ أثناء التصدير");
    }

    setIsExporting(false);
  };

  const summary = reportData?.summary || {
    totalDeposits: 0,
    totalOrders: 0,
    totalCommissions: 0,
    totalRefunds: 0,
    netRevenue: 0,
    activeUsers: 0,
    newUsers: 0,
    averageOrderValue: 0,
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-lg">التقارير المالية</CardTitle>
              <p className="text-sm text-muted-foreground">تحليل شامل مع إمكانية التصدير</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[140px] h-9">
                <CalendarIcon className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="quarter">3 أشهر</SelectItem>
                <SelectItem value="year">سنة</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            <Separator orientation="vertical" className="h-8 hidden sm:block" />

            <Button
              onClick={exportToPDF}
              disabled={isExporting || isLoading}
              size="sm"
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              PDF
            </Button>

            <Button
              onClick={exportToExcel}
              disabled={isExporting || isLoading}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الإيداعات", value: summary.totalDeposits, icon: ArrowUpCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "إجمالي الطلبات", value: summary.totalOrders, icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "صافي الإيرادات", value: summary.netRevenue, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10" },
            { label: "المستخدمين النشطين", value: summary.activeUsers, icon: Users, color: "text-orange-500", bg: "bg-orange-500/10", noPrefix: true },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${stat.bg}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>
                    {stat.noPrefix ? stat.value.toLocaleString("ar-SA") : `$${stat.value.toLocaleString("ar-SA")}`}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue" className="gap-1 text-xs">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">الإيرادات</span>
            </TabsTrigger>
            <TabsTrigger value="deposits" className="gap-1 text-xs">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">الإيداعات</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="gap-1 text-xs">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">التوزيع</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">المستخدمين</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-4">
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData?.dailyData || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="الإيرادات"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="deposits"
                      name="الإيداعات"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorDeposits)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="deposits" className="mt-4">
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData?.depositsByMethod || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="method" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="amount" name="المبلغ" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="count" name="العدد" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="mt-4">
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={reportData?.balanceDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      dataKey="count"
                      nameKey="range"
                    >
                      {reportData?.balanceDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <div className="space-y-3">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))
              ) : (
                reportData?.topUsers.slice(0, 5).map((user, index) => (
                  <motion.div
                    key={user.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-emerald-500">
                        ${user.totalSpent.toLocaleString("ar-SA")}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.ordersCount} طلب</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FinancialReportsPanel;
