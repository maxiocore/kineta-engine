import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { format, subDays, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Wallet, 
  Search,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Bell,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  CreditCard,
  Landmark,
  History,
} from "lucide-react";
import { WalletsStatsCards } from "@/components/admin/wallets/WalletsStatsCards";
import { WalletsCharts } from "@/components/admin/wallets/WalletsCharts";
import { UserBalanceCard } from "@/components/admin/wallets/UserBalanceCard";
import { DepositCard } from "@/components/admin/wallets/DepositCard";
import { WalletTransferDialog } from "@/components/admin/wallets/WalletTransferDialog";
import { DepositDetailsDialog } from "@/components/admin/wallets/DepositDetailsDialog";
import { RecentActivities } from "@/components/admin/wallets/RecentActivities";
import { FinancialReportsPanel } from "@/components/admin/wallets/FinancialReportsPanel";

interface UserBalance {
  id: string;
  user_id: string;
  balance: number;
  total_deposited: number;
  total_spent: number;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  } | null;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  total_credited: number;
  bonus_amount: number | null;
  fee_amount: number | null;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  } | null;
  payment_methods?: {
    name: string;
    name_ar: string;
  } | null;
}

interface BankWithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  account_holder_name: string;
  iban: string;
  status: string;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

interface BalanceLog {
  id: string;
  user_id: string;
  action_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  notes: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  created_by: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const STATUS_CONFIG = {
  pending: { label: "قيد المراجعة", color: "bg-amber-500/20 text-amber-600 border-amber-500/30", icon: Clock },
  processing: { label: "قيد التنفيذ", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", icon: RefreshCw },
  completed: { label: "مكتمل", color: "bg-green-500/20 text-green-600 border-green-500/30", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-500/20 text-red-600 border-red-500/30", icon: XCircle },
};

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  deposit: { label: "إيداع", color: "text-green-500", icon: ArrowUpCircle },
  order: { label: "طلب", color: "text-red-500", icon: ArrowDownCircle },
  refund: { label: "استرداد", color: "text-blue-500", icon: RefreshCw },
  credit: { label: "إضافة", color: "text-emerald-500", icon: ArrowUpCircle },
  debit: { label: "خصم", color: "text-orange-500", icon: ArrowDownCircle },
  initial: { label: "رصيد ابتدائي", color: "text-purple-500", icon: Wallet },
};

const AdminFinancialHub = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("wallets");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
  const [balanceAction, setBalanceAction] = useState<"add" | "deduct">("add");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<BankWithdrawalRequest | null>(null);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawalActionType, setWithdrawalActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Realtime subscription
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('admin-financial-hub-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
        queryClient.invalidateQueries({ queryKey: ["financial-deposits"] });
        queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_balances' }, () => {
        queryClient.invalidateQueries({ queryKey: ["financial-balances"] });
        queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_withdrawal_requests' }, () => {
        queryClient.invalidateQueries({ queryKey: ["financial-withdrawals"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balance_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ["financial-logs"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Fetch user balances
  const { data: userBalances = [], isLoading: balancesLoading, refetch: refetchBalances } = useQuery({
    queryKey: ["financial-balances", searchTerm],
    queryFn: async () => {
      const { data: balances, error } = await supabase
        .from("user_balances")
        .select("*")
        .order("balance", { ascending: false });

      if (error) throw error;
      
      const userIds = balances?.map(b => b.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      let result = (balances || []).map(b => ({
        ...b,
        profile: profileMap.get(b.user_id) || null
      }));
      
      if (searchTerm) {
        result = result.filter((item) => 
          item.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return result as UserBalance[];
    },
  });

  // Fetch deposits
  const { data: deposits = [], isLoading: depositsLoading, refetch: refetchDeposits } = useQuery({
    queryKey: ["financial-deposits", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("deposits")
        .select(`*, payment_methods (name, name_ar)`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: depositsData, error } = await query;
      if (error) throw error;

      const userIds = depositsData?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (depositsData || []).map(d => ({
        ...d,
        profile: profileMap.get(d.user_id) || null
      })) as Deposit[];
    },
  });

  // Fetch withdrawals
  const { data: withdrawals = [], isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["financial-withdrawals", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("bank_withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((request) => ({
        ...request,
        profiles: profileMap.get(request.user_id) || null,
      })) as BankWithdrawalRequest[];
    },
  });

  // Fetch balance logs
  const { data: balanceLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["financial-logs", searchTerm],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from("balance_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      const userIds = [...new Set(logs.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      let result = logs.map(log => ({
        ...log,
        profile: profileMap.get(log.user_id) || null
      }));

      if (searchTerm) {
        result = result.filter((item) => 
          item.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return result as BalanceLog[];
    },
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["financial-stats"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      
      const [balancesRes, depositsRes, todayDepositsRes, withdrawalsRes] = await Promise.all([
        supabase.from("user_balances").select("balance, total_deposited, total_spent"),
        supabase.from("deposits").select("amount, status").eq("status", "pending"),
        supabase.from("deposits").select("amount").eq("status", "completed").gte("completed_at", today),
        supabase.from("bank_withdrawal_requests").select("amount, status").eq("status", "pending"),
      ]);

      const balances = balancesRes.data || [];
      const totalBalance = balances.reduce((sum, b) => sum + (b.balance || 0), 0);
      const totalDeposited = balances.reduce((sum, b) => sum + (b.total_deposited || 0), 0);
      const totalSpent = balances.reduce((sum, b) => sum + (b.total_spent || 0), 0);
      const todayDeposits = (todayDepositsRes.data || []).reduce((sum, d) => sum + d.amount, 0);
      const pendingWithdrawals = withdrawalsRes.data?.length || 0;

      return {
        totalBalance,
        totalDeposited,
        totalSpent,
        pendingDeposits: depositsRes.data?.length || 0,
        totalUsers: balances.length,
        todayDeposits,
        todayWithdrawals: 0,
        averageBalance: balances.length > 0 ? totalBalance / balances.length : 0,
        pendingWithdrawals,
      };
    },
  });

  // Chart data
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), "dd/MM"),
    deposits: Math.floor(Math.random() * 5000) + 1000,
    withdrawals: Math.floor(Math.random() * 3000) + 500,
    balance: Math.floor(Math.random() * 10000) + 5000,
  }));

  const distributionData = [
    { name: "رصيد عالي (>1000)", value: userBalances.filter(u => u.balance > 1000).length, color: "#8b5cf6" },
    { name: "رصيد متوسط (100-1000)", value: userBalances.filter(u => u.balance >= 100 && u.balance <= 1000).length, color: "#10b981" },
    { name: "رصيد منخفض (<100)", value: userBalances.filter(u => u.balance < 100).length, color: "#f97316" },
  ];

  // Mutations
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, currentBalance, newBalance, action, amount, reason }: any) => {
      const adminUser = await supabase.auth.getUser();
      const adminId = adminUser.data.user?.id;

      // تحديث الرصيد
      const { error } = await supabase
        .from("user_balances")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;

      // تسجيل في سجل الرصيد
      await supabase.from("balance_logs").insert({
        user_id: userId,
        action_type: action === "add" ? "admin_credit" : "admin_debit",
        amount: action === "add" ? amount : -amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        notes: reason || (action === "add" ? "إضافة رصيد بواسطة الإدارة" : "خصم رصيد بواسطة الإدارة"),
        created_by: adminId,
        reference_type: "admin_adjustment",
      });

      // تسجيل في سجل المراجعة
      await supabase.from("audit_logs").insert({
        table_name: "user_balances",
        record_id: userId,
        action: action === "add" ? "BALANCE_ADD" : "BALANCE_DEDUCT",
        old_value: { balance: currentBalance },
        new_value: { balance: newBalance, change: amount, reason },
        user_id: adminId
      });

      // إرسال إشعار للمستخدم
      await supabase.from("notifications").insert({
        user_id: userId,
        title: action === "add" ? "تم إضافة رصيد لحسابك" : "تم خصم رصيد من حسابك",
        message: action === "add" 
          ? `تم إضافة ${amount.toLocaleString('ar-SA')} ر.س إلى رصيدك${reason ? `. السبب: ${reason}` : ""}`
          : `تم خصم ${amount.toLocaleString('ar-SA')} ر.س من رصيدك${reason ? `. السبب: ${reason}` : ""}`,
        type: action === "add" ? "success" : "warning",
      });
    },
    onSuccess: () => {
      toast.success(balanceAction === "add" ? "تم إضافة الرصيد بنجاح" : "تم خصم الرصيد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["financial-balances"] });
      queryClient.invalidateQueries({ queryKey: ["financial-logs"] });
      queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
      setIsTransferDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الرصيد"),
  });

  const updateDepositMutation = useMutation({
    mutationFn: async ({ depositId, status }: { depositId: string; status: string }) => {
      const { error } = await supabase
        .from("deposits")
        .update({ status, ...(status === "completed" && { completed_at: new Date().toISOString() }) })
        .eq("id", depositId);
      if (error) throw error;
      
      if (status === "completed") {
        try {
          await supabase.functions.invoke('notify-deposit-success', { body: { depositId } });
        } catch (e) {
          console.error("Failed to send deposit notification:", e);
        }
      }
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الإيداع بنجاح");
      queryClient.invalidateQueries({ queryKey: ["financial-deposits"] });
      setIsDepositDialogOpen(false);
      setSelectedDeposit(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الإيداع"),
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("bank_withdrawal_requests")
        .update({
          status,
          admin_notes: notes || null,
          processed_at: status === "completed" || status === "rejected" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      if (status === "rejected" && selectedWithdrawal) {
        const { data: currentCashback } = await supabase
          .from("user_cashback")
          .select("cashback_balance, total_withdrawn")
          .eq("user_id", selectedWithdrawal.user_id)
          .single();

        if (currentCashback) {
          await supabase
            .from("user_cashback")
            .update({
              cashback_balance: currentCashback.cashback_balance + selectedWithdrawal.amount,
              total_withdrawn: Math.max(0, currentCashback.total_withdrawn - selectedWithdrawal.amount),
            })
            .eq("user_id", selectedWithdrawal.user_id);
        }

        await supabase.from("cashback_transactions").insert({
          user_id: selectedWithdrawal.user_id,
          amount: selectedWithdrawal.amount,
          type: "refund",
          description: "Refund from rejected bank withdrawal",
          description_ar: "استرداد من طلب سحب بنكي مرفوض",
          reference_id: id,
        });

        await supabase.from("notifications").insert({
          user_id: selectedWithdrawal.user_id,
          title: "تم رفض طلب السحب البنكي",
          message: `تم رفض طلب السحب البنكي بقيمة ${selectedWithdrawal.amount} ر.س. ${notes ? `السبب: ${notes}` : ""} تم إرجاع المبلغ لرصيد الكاش باك.`,
          type: "warning",
        });
      }

      if (status === "completed" && selectedWithdrawal) {
        await supabase.from("notifications").insert({
          user_id: selectedWithdrawal.user_id,
          title: "تم تنفيذ السحب البنكي",
          message: `تم تحويل مبلغ ${selectedWithdrawal.amount} ر.س إلى حسابك البنكي في ${selectedWithdrawal.bank_name} بنجاح.`,
          type: "success",
        });
      }

      return { id, status };
    },
    onSuccess: (data) => {
      const statusText = data.status === "completed" ? "الموافقة على" : data.status === "rejected" ? "رفض" : "تحديث";
      toast.success(`تم ${statusText} الطلب بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["financial-withdrawals"] });
      setWithdrawalDialogOpen(false);
      setSelectedWithdrawal(null);
      setAdminNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ");
    },
  });

  const handleBalanceSubmit = (amount: number, reason: string) => {
    if (!selectedUser) return;
    const newBalance = balanceAction === "add" 
      ? selectedUser.balance + amount 
      : selectedUser.balance - amount;
    
    if (newBalance < 0) {
      toast.error("لا يمكن أن يكون الرصيد سالباً");
      return;
    }

    updateBalanceMutation.mutate({
      userId: selectedUser.user_id,
      currentBalance: selectedUser.balance,
      newBalance,
      action: balanceAction,
      amount,
      reason
    });
  };

  const handleWithdrawalAction = (request: BankWithdrawalRequest, type: "approve" | "reject") => {
    setSelectedWithdrawal(request);
    setWithdrawalActionType(type);
    setAdminNotes("");
    setWithdrawalDialogOpen(true);
  };

  const confirmWithdrawalAction = () => {
    if (!selectedWithdrawal || !withdrawalActionType) return;
    updateWithdrawalMutation.mutate({
      id: selectedWithdrawal.id,
      status: withdrawalActionType === "approve" ? "completed" : "rejected",
      notes: adminNotes,
    });
  };

  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  const handleRefreshAll = () => {
    refetchBalances();
    refetchDeposits();
    refetchWithdrawals();
    refetchLogs();
    toast.success("تم تحديث البيانات");
  };

  return (
    <AdminDashboardLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 sm:space-y-6" 
        dir="rtl"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Landmark className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">المركز المالي</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">إدارة شاملة للمحافظ والإيداعات والسحوبات</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pendingDeposits.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Bell className="h-3 w-3 ml-1" />
                {pendingDeposits.length} إيداع معلق
              </Badge>
            )}
            {pendingWithdrawals.length > 0 && (
              <Badge variant="secondary" className="animate-pulse bg-orange-500/20 text-orange-600">
                <Building2 className="h-3 w-3 ml-1" />
                {pendingWithdrawals.length} سحب معلق
              </Badge>
            )}
            <Button onClick={handleRefreshAll} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <WalletsStatsCards stats={stats || { totalBalance: 0, totalDeposited: 0, totalSpent: 0, pendingDeposits: 0, totalUsers: 0, todayDeposits: 0, todayWithdrawals: 0, averageBalance: 0 }} isLoading={statsLoading} />

        {/* Charts */}
        <WalletsCharts chartData={chartData} distributionData={distributionData} isLoading={statsLoading} />

        {/* Financial Reports */}
        <FinancialReportsPanel />

        {/* Main Tabs Content */}
        <Card className="border-border/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger value="wallets" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">المحافظ</span>
                </TabsTrigger>
                <TabsTrigger value="deposits" className="gap-2 py-2.5 relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">الإيداعات</span>
                  {pendingDeposits.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {pendingDeposits.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="gap-2 py-2.5 relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">السحوبات</span>
                  {pendingWithdrawals.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingWithdrawals.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">السجل</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Wallets Tab */}
              <TabsContent value="wallets" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold">أرصدة المستخدمين</h3>
                    <div className="relative w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10 h-9"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {balancesLoading ? (
                        [...Array(5)].map((_, i) => (
                          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                        ))
                      ) : userBalances.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Wallet className="h-12 w-12 mb-4 opacity-50" />
                          <p>لا توجد أرصدة</p>
                        </div>
                      ) : (
                        userBalances.map((user, index) => (
                          <UserBalanceCard
                            key={user.id}
                            user={user}
                            index={index}
                            onAddBalance={(u) => { setSelectedUser(u); setBalanceAction("add"); setIsTransferDialogOpen(true); }}
                            onDeductBalance={(u) => { setSelectedUser(u); setBalanceAction("deduct"); setIsTransferDialogOpen(true); }}
                            onViewDetails={(u) => { setSelectedUser(u); }}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Deposits Tab */}
              <TabsContent value="deposits" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-base font-semibold">الإيداعات</h3>
                    <div className="flex gap-2 flex-wrap">
                      {["all", "pending", "completed", "rejected"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={statusFilter === status ? "default" : "outline"}
                          onClick={() => setStatusFilter(status)}
                          className="h-8"
                        >
                          {status === "all" ? "الكل" : status === "pending" ? "معلق" : status === "completed" ? "مكتمل" : "مرفوض"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {depositsLoading ? (
                        [...Array(5)].map((_, i) => (
                          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                        ))
                      ) : deposits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <DollarSign className="h-12 w-12 mb-4 opacity-50" />
                          <p>لا توجد إيداعات</p>
                        </div>
                      ) : (
                        deposits.map((deposit, index) => (
                          <DepositCard
                            key={deposit.id}
                            deposit={deposit}
                            index={index}
                            onApprove={(d) => updateDepositMutation.mutate({ depositId: d.id, status: "completed" })}
                            onReject={(d) => updateDepositMutation.mutate({ depositId: d.id, status: "rejected" })}
                            onViewDetails={(d) => { setSelectedDeposit(d); setIsDepositDialogOpen(true); }}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Withdrawals Tab */}
              <TabsContent value="withdrawals" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-base font-semibold">طلبات السحب البنكي</h3>
                    <div className="flex gap-2 flex-wrap">
                      {["all", "pending", "completed", "rejected"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={statusFilter === status ? "default" : "outline"}
                          onClick={() => setStatusFilter(status)}
                          className="h-8"
                        >
                          {status === "all" ? "الكل" : status === "pending" ? "معلق" : status === "completed" ? "مكتمل" : "مرفوض"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <ScrollArea className="h-[500px]">
                    {withdrawalsLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : withdrawals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Building2 className="h-12 w-12 mb-4 opacity-50" />
                        <p>لا توجد طلبات سحب بنكي</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">المستخدم</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">البنك</TableHead>
                            <TableHead className="text-right">IBAN</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withdrawals.map((request) => {
                            const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                            const StatusIcon = statusConfig.icon;

                            return (
                              <TableRow key={request.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                      <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{request.profiles?.full_name || "مستخدم"}</p>
                                      <p className="text-xs text-muted-foreground">{request.profiles?.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-emerald-500">{request.amount.toFixed(2)} ر.س</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{request.bank_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono" dir="ltr">
                                    {request.iban.slice(0, 10)}...
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${statusConfig.color} gap-1`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ar })}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {request.status === "pending" && (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                        onClick={() => handleWithdrawalAction(request, "approve")}
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        onClick={() => handleWithdrawalAction(request, "reject")}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold">سجل المعاملات المالية</h3>
                    <div className="relative w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10 h-9"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[500px]">
                    {logsLoading ? (
                      <div className="space-y-3">
                        {[...Array(10)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : balanceLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <History className="h-12 w-12 mb-4 opacity-50" />
                        <p>لا توجد سجلات</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">المستخدم</TableHead>
                            <TableHead className="text-right">النوع</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">الرصيد قبل</TableHead>
                            <TableHead className="text-right">الرصيد بعد</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">ملاحظات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balanceLogs.map((log) => {
                            const actionConfig = ACTION_CONFIG[log.action_type] || { label: log.action_type, color: "text-gray-500", icon: FileText };
                            const ActionIcon = actionConfig.icon;

                            return (
                              <TableRow key={log.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                      <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{log.profile?.full_name || "مستخدم"}</p>
                                      <p className="text-xs text-muted-foreground">{log.profile?.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`flex items-center gap-1 ${actionConfig.color}`}>
                                    <ActionIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{actionConfig.label}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={`font-bold ${log.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {log.amount >= 0 ? '+' : ''}{log.amount.toFixed(2)} $
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">${log.balance_before.toFixed(2)}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">${log.balance_after.toFixed(2)}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
                                    {log.notes || "-"}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Recent Activities Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <RecentActivities />
          </div>
        </div>

        {/* Dialogs */}
        <WalletTransferDialog
          isOpen={isTransferDialogOpen}
          onClose={() => { setIsTransferDialogOpen(false); setSelectedUser(null); }}
          user={selectedUser}
          action={balanceAction}
          onSubmit={handleBalanceSubmit}
          isLoading={updateBalanceMutation.isPending}
        />

        <DepositDetailsDialog
          isOpen={isDepositDialogOpen}
          onClose={() => { setIsDepositDialogOpen(false); setSelectedDeposit(null); }}
          deposit={selectedDeposit}
          onApprove={() => selectedDeposit && updateDepositMutation.mutate({ depositId: selectedDeposit.id, status: "completed" })}
          onReject={() => selectedDeposit && updateDepositMutation.mutate({ depositId: selectedDeposit.id, status: "rejected" })}
          isLoading={updateDepositMutation.isPending}
        />

        {/* Withdrawal Action Dialog */}
        <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {withdrawalActionType === "approve" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    الموافقة على طلب السحب
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    رفض طلب السحب
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {withdrawalActionType === "approve"
                  ? "هل أنت متأكد من الموافقة على طلب السحب هذا؟ سيتم إخطار المستخدم بالموافقة."
                  : "هل أنت متأكد من رفض طلب السحب هذا؟ سيتم إرجاع المبلغ لرصيد الكاش باك الخاص بالمستخدم."}
              </DialogDescription>
            </DialogHeader>

            {selectedWithdrawal && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المستخدم:</span>
                    <span className="font-medium">{selectedWithdrawal.profiles?.full_name || "مستخدم"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span className="font-bold text-emerald-500">{selectedWithdrawal.amount.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البنك:</span>
                    <span>{selectedWithdrawal.bank_name}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ملاحظات (اختياري)</label>
                  <Textarea
                    placeholder="أضف ملاحظات..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setWithdrawalDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                variant={withdrawalActionType === "approve" ? "default" : "destructive"}
                onClick={confirmWithdrawalAction}
                disabled={updateWithdrawalMutation.isPending}
                className="gap-2"
              >
                {updateWithdrawalMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                {withdrawalActionType === "approve" ? "موافقة" : "رفض"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminFinancialHub;
