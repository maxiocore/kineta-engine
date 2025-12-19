import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  Gift,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Percent,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CashbackData {
  cashback_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface CashbackTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  description_ar: string;
  created_at: string;
}

interface CashbackSettings {
  cashback_percentage: number;
  min_deposit_amount: number;
  max_cashback_amount: number | null;
  is_active: boolean;
}

const ClientCashback = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Realtime subscription for cashback updates
  useEffect(() => {
    if (!user) return;

    const channel: RealtimeChannel = supabase
      .channel('client-cashback-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cashback',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-cashback", user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashback_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cashback-transactions", user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashback_settings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cashback-settings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Fetch cashback data
  const { data: cashbackData, isLoading: cashbackLoading } = useQuery({
    queryKey: ["user-cashback", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_cashback")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as CashbackData | null;
    },
    enabled: !!user,
  });

  // Fetch cashback settings
  const { data: settings } = useQuery({
    queryKey: ["cashback-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashback_settings")
        .select("*")
        .eq("is_active", true)
        .single();
      
      if (error) throw error;
      return data as CashbackSettings;
    },
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["cashback-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cashback_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as CashbackTransaction[];
    },
    enabled: !!user,
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.rpc("withdraw_cashback", {
        p_user_id: user.id,
        p_amount: amount,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; amount?: number };
      if (!result.success) {
        throw new Error(result.error || "فشل السحب");
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success("تم سحب الكاش باك بنجاح إلى رصيدك الرئيسي!");
      queryClient.invalidateQueries({ queryKey: ["user-cashback"] });
      queryClient.invalidateQueries({ queryKey: ["cashback-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["user-balance"] });
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء السحب");
    },
  });

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("الرجاء إدخال مبلغ صحيح");
      return;
    }
    if (cashbackData && amount > cashbackData.cashback_balance) {
      toast.error("المبلغ المطلوب أكبر من رصيد الكاش باك");
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const displayedTransactions = showAllTransactions 
    ? transactions 
    : transactions?.slice(0, 5);

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 lg:space-y-8" dir="rtl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 lg:p-10"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-900/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          {/* Floating Coins Animation */}
          <motion.div 
            className="absolute top-6 left-6 opacity-20"
            animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Gift className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div 
            className="absolute bottom-6 left-1/4 opacity-20"
            animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Wallet className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">محفظة الكاش باك</h1>
                  <p className="text-white/80 text-sm sm:text-base max-w-xl">
                    احصل على {settings?.cashback_percentage || 5}% كاش باك تلقائي عند كل عملية شحن رصيد
                  </p>
                </div>
              </div>
              
              {settings?.is_active && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm"
                >
                  <Percent className="w-6 h-6 text-white" />
                  <div>
                    <p className="text-white/80 text-xs">نسبة الكاش باك</p>
                    <p className="text-2xl font-bold text-white">{settings.cashback_percentage}%</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          {/* Current Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0">متاح</Badge>
                </div>
                {cashbackLoading ? (
                  <Skeleton className="h-10 w-32 bg-white/20" />
                ) : (
                  <p className="text-3xl lg:text-4xl font-bold">
                    ${(cashbackData?.cashback_balance || 0).toFixed(2)}
                  </p>
                )}
                <p className="text-white/80 text-sm mt-2">رصيد الكاش باك الحالي</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Earned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                {cashbackLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <p className="text-3xl lg:text-4xl font-bold text-foreground">
                    ${(cashbackData?.total_earned || 0).toFixed(2)}
                  </p>
                )}
                <p className="text-muted-foreground text-sm mt-2">إجمالي الكاش باك المكتسب</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Withdrawn */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <ArrowDownToLine className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                {cashbackLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <p className="text-3xl lg:text-4xl font-bold text-foreground">
                    ${(cashbackData?.total_withdrawn || 0).toFixed(2)}
                  </p>
                )}
                <p className="text-muted-foreground text-sm mt-2">إجمالي المسحوب</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Withdraw Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-emerald-500" />
                سحب الكاش باك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <p className="text-muted-foreground text-sm mb-3">
                    يمكنك سحب رصيد الكاش باك إلى رصيدك الرئيسي في أي وقت واستخدامه في طلباتك
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                    <Gift className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm">الرصيد المتاح للسحب:</span>
                    <span className="font-bold text-emerald-500">
                      ${(cashbackData?.cashback_balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setWithdrawDialogOpen(true)}
                  disabled={!cashbackData || cashbackData.cashback_balance <= 0}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  سحب الكاش باك
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                كيف يعمل الكاش باك؟
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    step: 1,
                    title: "اشحن رصيدك",
                    desc: "قم بشحن رصيدك بأي مبلغ عبر طرق الدفع المتاحة",
                    icon: DollarSign,
                  },
                  {
                    step: 2,
                    title: "احصل على الكاش باك",
                    desc: `تحصل تلقائياً على ${settings?.cashback_percentage || 5}% كاش باك`,
                    icon: Gift,
                  },
                  {
                    step: 3,
                    title: "اسحب أو استخدم",
                    desc: "اسحب الكاش باك لرصيدك واستخدمه في طلباتك",
                    icon: Wallet,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                سجل المعاملات
              </CardTitle>
              {transactions && transactions.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                  className="gap-1"
                >
                  {showAllTransactions ? (
                    <>
                      عرض أقل
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      عرض الكل ({transactions.length})
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">لا توجد معاملات بعد</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    اشحن رصيدك للحصول على كاش باك تلقائي
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div className="space-y-3">
                    {displayedTransactions?.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "earned"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-blue-500/20 text-blue-500"
                            }`}
                          >
                            {transaction.type === "earned" ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <ArrowDownToLine className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description_ar}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transaction.created_at), "dd MMMM yyyy - HH:mm", {
                                locale: ar,
                              })}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-bold text-lg ${
                            transaction.amount > 0 ? "text-green-500" : "text-blue-500"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-emerald-500" />
                سحب الكاش باك
              </DialogTitle>
              <DialogDescription>
                أدخل المبلغ الذي تريد سحبه إلى رصيدك الرئيسي
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">الرصيد المتاح</span>
                  <span className="font-bold text-emerald-500">
                    ${(cashbackData?.cashback_balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">مبلغ السحب ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="text-lg h-12"
                  step="0.01"
                  min="0"
                  max={cashbackData?.cashback_balance || 0}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWithdrawAmount((cashbackData?.cashback_balance || 0).toString())}
                className="w-full"
              >
                سحب كل الرصيد
              </Button>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                {withdrawMutation.isPending ? (
                  "جاري السحب..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    تأكيد السحب
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientCashback;
