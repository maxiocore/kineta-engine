import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Wallet, 
  Plus, 
  Minus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  RefreshCw,
  Eye,
  Filter
} from "lucide-react";

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
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);

  // Fetch user balances with profiles
  const { data: userBalances = [], isLoading: balancesLoading, refetch: refetchBalances } = useQuery({
    queryKey: ["admin-user-balances", searchTerm],
    queryFn: async () => {
      const { data: balances, error } = await supabase
        .from("user_balances")
        .select("*")
        .order("balance", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = balances?.map(b => b.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      let result = (balances || []).map(b => ({
        ...b,
        profile: profileMap.get(b.user_id) || null
      }));
      
      // Filter by search term
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

      // Fetch profiles separately
      const userIds = depositsData?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (depositsData || []).map(d => ({
        ...d,
        profile: profileMap.get(d.user_id) || null
      })) as Deposit[];
    },
  });

  // Calculate stats
  const stats = {
    totalBalance: userBalances.reduce((sum, u) => sum + (u.balance || 0), 0),
    totalDeposited: userBalances.reduce((sum, u) => sum + (u.total_deposited || 0), 0),
    totalSpent: userBalances.reduce((sum, u) => sum + (u.total_spent || 0), 0),
    pendingDeposits: deposits.filter(d => d.status === "pending").length,
    totalUsers: userBalances.length,
  };

  // Update balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, newBalance, action, amount, reason }: {
      userId: string;
      newBalance: number;
      action: "add" | "deduct";
      amount: number;
      reason: string;
    }) => {
      const { error } = await supabase
        .from("user_balances")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Log the action in audit_logs
      await supabase.from("audit_logs").insert({
        table_name: "user_balances",
        record_id: userId,
        action: action === "add" ? "BALANCE_ADD" : "BALANCE_DEDUCT",
        new_value: { balance: newBalance, change: amount, reason },
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
    },
    onSuccess: () => {
      toast.success(balanceAction === "add" ? "تم إضافة الرصيد بنجاح" : "تم خصم الرصيد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-user-balances"] });
      setIsDialogOpen(false);
      setAmount("");
      setReason("");
      setSelectedUser(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الرصيد");
    },
  });

  // Update deposit status mutation
  const updateDepositMutation = useMutation({
    mutationFn: async ({ depositId, status, notes }: {
      depositId: string;
      status: string;
      notes?: string;
    }) => {
      const updateData: any = { 
        status,
        ...(status === "completed" && { completed_at: new Date().toISOString() })
      };
      
      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from("deposits")
        .update(updateData)
        .eq("id", depositId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الإيداع بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-balances"] });
      setIsDepositDialogOpen(false);
      setSelectedDeposit(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الإيداع");
    },
  });

  const handleBalanceUpdate = () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    const changeAmount = parseFloat(amount);
    const currentBalance = selectedUser.balance || 0;
    const newBalance = balanceAction === "add" 
      ? currentBalance + changeAmount 
      : currentBalance - changeAmount;

    if (newBalance < 0) {
      toast.error("لا يمكن أن يكون الرصيد سالباً");
      return;
    }

    updateBalanceMutation.mutate({
      userId: selectedUser.user_id,
      newBalance,
      action: balanceAction,
      amount: changeAmount,
      reason
    });
  };

  const handleDepositAction = (action: "approve" | "reject") => {
    if (!selectedDeposit) return;

    updateDepositMutation.mutate({
      depositId: selectedDeposit.id,
      status: action === "approve" ? "completed" : "rejected",
      notes: reason
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">مكتمل</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">قيد الانتظار</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">مرفوض</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">فشل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-7 w-7 text-primary" />
              إدارة المحافظ
            </h1>
            <p className="text-muted-foreground mt-1">إدارة أرصدة المستخدمين والإيداعات</p>
          </div>
          <Button onClick={() => { refetchBalances(); refetchDeposits(); }} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الأرصدة</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalBalance.toFixed(2)} ر.س</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الإيداعات</p>
                  <p className="text-2xl font-bold text-green-500">{stats.totalDeposited.toFixed(2)} ر.س</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.totalSpent.toFixed(2)} ر.س</p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إيداعات معلقة</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pendingDeposits}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عدد المستخدمين</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="balances" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="balances" className="gap-2">
              <Wallet className="h-4 w-4" />
              أرصدة المستخدمين
            </TabsTrigger>
            <TabsTrigger value="deposits" className="gap-2">
              <DollarSign className="h-4 w-4" />
              الإيداعات
            </TabsTrigger>
          </TabsList>

          {/* User Balances Tab */}
          <TabsContent value="balances">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>أرصدة المستخدمين</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث بالاسم أو البريد..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستخدم</TableHead>
                        <TableHead className="text-right">الرصيد الحالي</TableHead>
                        <TableHead className="text-right">إجمالي الإيداعات</TableHead>
                        <TableHead className="text-right">إجمالي المصروفات</TableHead>
                        <TableHead className="text-right">آخر تحديث</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balancesLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : userBalances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            لا توجد بيانات
                          </TableCell>
                        </TableRow>
                      ) : (
                        userBalances.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.profile?.full_name || "بدون اسم"}</p>
                                <p className="text-sm text-muted-foreground">{user.profile?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                              {user.balance.toFixed(2)} ر.س
                            </TableCell>
                            <TableCell className="text-green-500">
                              {user.total_deposited.toFixed(2)} ر.س
                            </TableCell>
                            <TableCell className="text-orange-500">
                              {user.total_spent.toFixed(2)} ر.س
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(user.updated_at), "dd MMM yyyy", { locale: ar })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-green-500 border-green-500/30 hover:bg-green-500/10"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setBalanceAction("add");
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                  إضافة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setBalanceAction("deduct");
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                  خصم
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>إدارة الإيداعات</CardTitle>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 ml-2" />
                        <SelectValue placeholder="تصفية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="rejected">مرفوض</SelectItem>
                        <SelectItem value="failed">فشل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستخدم</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">المضاف للرصيد</TableHead>
                        <TableHead className="text-right">طريقة الدفع</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depositsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : deposits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            لا توجد إيداعات
                          </TableCell>
                        </TableRow>
                      ) : (
                        deposits.map((deposit) => (
                          <TableRow key={deposit.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{deposit.profile?.full_name || "بدون اسم"}</p>
                                <p className="text-sm text-muted-foreground">{deposit.profile?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {deposit.amount.toFixed(2)} ر.س
                            </TableCell>
                            <TableCell className="text-green-500 font-medium">
                              {deposit.total_credited.toFixed(2)} ر.س
                              {deposit.bonus_amount && deposit.bonus_amount > 0 && (
                                <span className="text-xs text-muted-foreground block">
                                  (بونص: {deposit.bonus_amount.toFixed(2)})
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {deposit.payment_methods?.name_ar || "غير محدد"}
                            </TableCell>
                            <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(deposit.created_at), "dd MMM yyyy HH:mm", { locale: ar })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedDeposit(deposit);
                                    setIsDepositDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {deposit.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-green-500 border-green-500/30 hover:bg-green-500/10"
                                      onClick={() => {
                                        setSelectedDeposit(deposit);
                                        updateDepositMutation.mutate({
                                          depositId: deposit.id,
                                          status: "completed"
                                        });
                                      }}
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                                      onClick={() => {
                                        setSelectedDeposit(deposit);
                                        updateDepositMutation.mutate({
                                          depositId: deposit.id,
                                          status: "rejected"
                                        });
                                      }}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Balance Update Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {balanceAction === "add" ? (
                  <>
                    <Plus className="h-5 w-5 text-green-500" />
                    إضافة رصيد
                  </>
                ) : (
                  <>
                    <Minus className="h-5 w-5 text-red-500" />
                    خصم رصيد
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">المستخدم</p>
                <p className="font-medium">{selectedUser?.profile?.full_name || selectedUser?.profile?.email}</p>
                <p className="text-sm text-muted-foreground mt-2">الرصيد الحالي</p>
                <p className="text-xl font-bold text-primary">{selectedUser?.balance.toFixed(2)} ر.س</p>
              </div>

              <div className="space-y-2">
                <Label>المبلغ (ر.س)</Label>
                <Input
                  type="number"
                  placeholder="أدخل المبلغ"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label>السبب (اختياري)</Label>
                <Textarea
                  placeholder="أدخل سبب التعديل..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">الرصيد بعد التعديل</p>
                  <p className="text-xl font-bold text-primary">
                    {(balanceAction === "add" 
                      ? (selectedUser?.balance || 0) + parseFloat(amount)
                      : (selectedUser?.balance || 0) - parseFloat(amount)
                    ).toFixed(2)} ر.س
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleBalanceUpdate}
                  disabled={updateBalanceMutation.isPending}
                  className={balanceAction === "add" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                >
                  {updateBalanceMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : null}
                  {balanceAction === "add" ? "إضافة الرصيد" : "خصم الرصيد"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Deposit Details Dialog */}
        <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                تفاصيل الإيداع
              </DialogTitle>
            </DialogHeader>
            {selectedDeposit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">المستخدم</p>
                    <p className="font-medium">{selectedDeposit.profile?.full_name || "بدون اسم"}</p>
                    <p className="text-xs text-muted-foreground">{selectedDeposit.profile?.email}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">المبلغ</p>
                    <p className="text-lg font-bold">{selectedDeposit.amount.toFixed(2)} ر.س</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">المضاف</p>
                    <p className="text-lg font-bold text-green-500">{selectedDeposit.total_credited.toFixed(2)} ر.س</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">البونص</p>
                    <p className="text-lg font-bold text-primary">{(selectedDeposit.bonus_amount || 0).toFixed(2)} ر.س</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                  <p className="font-medium">{selectedDeposit.payment_methods?.name_ar || "غير محدد"}</p>
                </div>

                {selectedDeposit.transaction_id && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">رقم المعاملة</p>
                    <p className="font-mono text-sm">{selectedDeposit.transaction_id}</p>
                  </div>
                )}

                {selectedDeposit.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">ملاحظات</p>
                    <p className="text-sm">{selectedDeposit.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p>تاريخ الإنشاء</p>
                    <p className="text-foreground">
                      {format(new Date(selectedDeposit.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                    </p>
                  </div>
                  {selectedDeposit.completed_at && (
                    <div>
                      <p>تاريخ الإكمال</p>
                      <p className="text-foreground">
                        {format(new Date(selectedDeposit.completed_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </p>
                    </div>
                  )}
                </div>

                {selectedDeposit.status === "pending" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleDepositAction("approve")}
                      disabled={updateDepositMutation.isPending}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      الموافقة
                    </Button>
                    <Button
                      onClick={() => handleDepositAction("reject")}
                      disabled={updateDepositMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 ml-2" />
                      رفض
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminWallets;
