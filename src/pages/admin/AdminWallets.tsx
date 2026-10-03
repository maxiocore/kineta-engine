import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { adminAdjustWallet, newIdempotencyKey, walletErrorMessage } from "@/lib/walletPayments";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, subDays, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Wallet, 
  Search,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Filter,
  Download,
  Bell,
  Sparkles,
} from "lucide-react";
import { WalletsStatsCards } from "@/components/admin/wallets/WalletsStatsCards";
import { WalletsCharts } from "@/components/admin/wallets/WalletsCharts";
import { UserBalanceCard } from "@/components/admin/wallets/UserBalanceCard";
import { DepositCard } from "@/components/admin/wallets/DepositCard";
import { WalletTransferDialog } from "@/components/admin/wallets/WalletTransferDialog";
import { DepositDetailsDialog } from "@/components/admin/wallets/DepositDetailsDialog";
import { RecentActivities } from "@/components/admin/wallets/RecentActivities";
import { SmartAlertsPanel } from "@/components/admin/wallets/SmartAlertsPanel";
import { FinancialReportsPanel } from "@/components/admin/wallets/FinancialReportsPanel";
import { AnalyticsAlertsPanel } from "@/components/admin/wallets/AnalyticsAlertsPanel";

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

const AdminWallets = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
  const [balanceAction, setBalanceAction] = useState<"add" | "deduct">("add");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);

  // Realtime subscription
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('admin-wallets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
        queryClient.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_balances' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-user-balances"] });
        queryClient.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Fetch user balances
  const { data: userBalances = [], isLoading: balancesLoading, refetch: refetchBalances } = useQuery({
    queryKey: ["admin-user-balances", searchTerm],
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
    queryKey: ["admin-deposits", statusFilter],
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

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-wallet-stats"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      
      const [balancesRes, depositsRes, todayDepositsRes] = await Promise.all([
        supabase.from("user_balances").select("balance, total_deposited, total_spent"),
        supabase.from("deposits").select("amount, status").eq("status", "pending"),
        supabase.from("deposits").select("amount").eq("status", "completed").gte("completed_at", today),
      ]);

      const balances = balancesRes.data || [];
      const totalBalance = balances.reduce((sum, b) => sum + (b.balance || 0), 0);
      const totalDeposited = balances.reduce((sum, b) => sum + (b.total_deposited || 0), 0);
      const totalSpent = balances.reduce((sum, b) => sum + (b.total_spent || 0), 0);
      const todayDeposits = (todayDepositsRes.data || []).reduce((sum, d) => sum + d.amount, 0);

      return {
        totalBalance,
        totalDeposited,
        totalSpent,
        pendingDeposits: depositsRes.data?.length || 0,
        totalUsers: balances.length,
        todayDeposits,
        todayWithdrawals: 0,
        averageBalance: balances.length > 0 ? totalBalance / balances.length : 0,
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
    mutationFn: async ({ userId, currentBalance, newBalance: requestedBalance, action, amount, reason }: any) => {
      let newBalance = requestedBalance;
      const adminUser = await supabase.auth.getUser();
      const adminId = adminUser.data.user?.id;

      // Server-side, audited, idempotent ledger adjustment (no direct balance writes)
      const finalReason = (reason && String(reason).trim().length >= 3)
        ? String(reason).trim()
        : (action === "add" ? "إضافة رصيد بواسطة الإدارة" : "خصم رصيد بواسطة الإدارة");
      const res = await adminAdjustWallet({
        userId,
        action: action === "add" ? "credit" : "debit",
        amount: Number(amount),
        reason: finalReason,
        idempotencyKey: newIdempotencyKey(),
      });
      if (adminId && res?.balance_after !== undefined) newBalance = Number(res.balance_after);

      // إرسال إشعار للمستخدم
      await supabase.from("notifications").insert({
        user_id: userId,
        title: action === "add" ? "تم إضافة رصيد لحسابك" : "تم خصم رصيد من حسابك",
        message: action === "add" 
          ? `تم إضافة ${amount.toLocaleString('ar-SA')} ر.س إلى رصيدك${reason ? `. السبب: ${reason}` : ""}`
          : `تم خصم ${amount.toLocaleString('ar-SA')} ر.س من رصيدك${reason ? `. السبب: ${reason}` : ""}`,
        type: action === "add" ? "success" : "warning",
      });

      // إرسال إيميل للمستخدم
      try {
        await supabase.functions.invoke('notify-balance-change', {
          body: { userId, action, amount, newBalance, reason }
        });
      } catch (e) {
        console.error("Failed to send balance change email:", e);
      }
    },
    onSuccess: () => {
      toast.success(balanceAction === "add" ? "تم إضافة الرصيد بنجاح" : "تم خصم الرصيد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-user-balances"] });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
      setIsTransferDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (e) => toast.error(walletErrorMessage(e)),
  });

  const updateDepositMutation = useMutation({
    mutationFn: async ({ depositId, status }: { depositId: string; status: string }) => {
      const { error } = await supabase
        .from("deposits")
        .update({ status, ...(status === "completed" && { completed_at: new Date().toISOString() }) })
        .eq("id", depositId);
      if (error) throw error;
      
      // Send email notification if deposit is completed
      if (status === "completed") {
        try {
          await supabase.functions.invoke('notify-deposit-success', {
            body: { depositId }
          });
        } catch (e) {
          console.error("Failed to send deposit notification:", e);
        }
      }
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الإيداع بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      setIsDepositDialogOpen(false);
      setSelectedDeposit(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الإيداع"),
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

  const pendingDeposits = deposits.filter(d => d.status === 'pending');

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
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Wallet className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">إدارة المحافظ</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">إدارة أرصدة المستخدمين والإيداعات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingDeposits.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Bell className="h-3 w-3 ml-1" />
                {pendingDeposits.length} إيداع معلق
              </Badge>
            )}
            <Button onClick={() => { refetchBalances(); refetchDeposits(); }} variant="outline" size="sm" className="gap-2">
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Balances & Deposits Tabs */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Tabs defaultValue="balances" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 h-9 sm:h-10">
                <TabsTrigger value="balances" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">أرصدة</span> المستخدمين
                </TabsTrigger>
                <TabsTrigger value="deposits" className="gap-1.5 sm:gap-2 text-xs sm:text-sm relative">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  الإيداعات
                  {pendingDeposits.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-destructive text-destructive-foreground text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                      {pendingDeposits.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="balances">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <CardTitle className="text-sm sm:text-base">أرصدة المستخدمين</CardTitle>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث بالاسم أو البريد..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pr-9 sm:pr-10 h-8 sm:h-9 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] sm:h-[500px] px-2 sm:px-4 pb-3 sm:pb-4">
                      <div className="space-y-2">
                        {balancesLoading ? (
                          [...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 sm:h-24 rounded-xl bg-muted animate-pulse" />
                          ))
                        ) : userBalances.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
                            <Wallet className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
                            <p className="text-sm">لا توجد أرصدة</p>
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deposits">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <CardTitle className="text-sm sm:text-base">الإيداعات</CardTitle>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {["all", "pending", "completed", "rejected"].map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={statusFilter === status ? "default" : "outline"}
                            onClick={() => setStatusFilter(status)}
                            className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                          >
                            {status === "all" ? "الكل" : status === "pending" ? "معلق" : status === "completed" ? "مكتمل" : "مرفوض"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] sm:h-[500px] px-2 sm:px-4 pb-3 sm:pb-4">
                      <div className="space-y-2">
                        {depositsLoading ? (
                          [...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 sm:h-24 rounded-xl bg-muted animate-pulse" />
                          ))
                        ) : deposits.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
                            <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
                            <p className="text-sm">لا توجد إيداعات</p>
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar: Alerts + Analytics + Activities */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4 order-1 lg:order-2">
            <SmartAlertsPanel />
            <AnalyticsAlertsPanel />
            <RecentActivities />
          </div>
        </div>

        {/* Dialogs */}
        <WalletTransferDialog
          isOpen={isTransferDialogOpen}
          onClose={() => setIsTransferDialogOpen(false)}
          user={selectedUser}
          action={balanceAction}
          onSubmit={handleBalanceSubmit}
          isLoading={updateBalanceMutation.isPending}
        />

        <DepositDetailsDialog
          isOpen={isDepositDialogOpen}
          onClose={() => setIsDepositDialogOpen(false)}
          deposit={selectedDeposit}
          onApprove={() => selectedDeposit && updateDepositMutation.mutate({ depositId: selectedDeposit.id, status: "completed" })}
          onReject={() => selectedDeposit && updateDepositMutation.mutate({ depositId: selectedDeposit.id, status: "rejected" })}
          isLoading={updateDepositMutation.isPending}
        />
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminWallets;
