import { useState, useEffect, useRef } from "react";
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
  Percent,
  DollarSign,
  Building2,
  CreditCard,
  Clock,
  AlertTriangle,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";


const CASHBACK_ERRORS: Record<string, string> = {
  INSUFFICIENT_CASHBACK: "رصيد الكاش باك غير كافٍ",
  INVALID_AMOUNT: "المبلغ غير صالح",
  INVALID_AMOUNT_PRECISION: "المبلغ يجب ألا يتجاوز منزلتين عشريتين",
  BELOW_MINIMUM: "الحد الأدنى للسحب البنكي 100 ر.س",
  INVALID_IBAN: "رقم الآيبان غير صحيح (SA + 22 رقماً)",
  INVALID_BANK_DETAILS: "يرجى التحقق من بيانات البنك",
};
const cashbackErrorText = (msg?: string) => CASHBACK_ERRORS[(msg ?? "").match(/[A-Z_]{5,}/)?.[0] ?? ""] ?? "تعذر تنفيذ السحب، حاول مرة أخرى";

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

interface BankWithdrawalRequest {
  id: string;
  amount: number;
  bank_name: string;
  account_holder_name: string;
  iban: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const SAUDI_BANKS = [
  "البنك الأهلي السعودي",
  "بنك الراجحي",
  "بنك الرياض",
  "بنك الإنماء",
  "البنك العربي الوطني",
  "بنك البلاد",
  "البنك السعودي الفرنسي",
  "بنك ساب",
  "البنك السعودي للاستثمار",
  "بنك الجزيرة",
];

const MIN_BANK_WITHDRAWAL = 100;

const ClientCashback = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cashbackKey = useRef<string>(crypto.randomUUID());
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [withdrawType, setWithdrawType] = useState<"balance" | "bank">("balance");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [iban, setIban] = useState("");

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

  // Fetch bank withdrawal requests
  const { data: bankRequests } = useQuery({
    queryKey: ["bank-withdrawal-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bank_withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BankWithdrawalRequest[];
    },
    enabled: !!user,
  });

  // Withdraw to balance mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.rpc("cashback_withdraw_to_wallet" as any, { p_amount: Math.round(amount * 100) / 100, p_idempotency_key: cashbackKey.current } as any);
      
      if (error) throw new Error(cashbackErrorText(error.message));
      
      const result = data as { success: boolean; error?: string; amount?: number };
      if (!result.success) {
        throw new Error(result.error || "فشل السحب");
      }
      
      return result;
    },
    onSuccess: () => {
      cashbackKey.current = crypto.randomUUID();
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

  // Bank withdrawal mutation
  const bankWithdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; bank_name: string; account_holder_name: string; iban: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      // First deduct from cashback balance
      const { data: rpcResult, error: rpcError } = await supabase.rpc("cashback_request_bank_withdrawal" as any, {
        p_amount: Math.round(data.amount * 100) / 100, p_bank_name: data.bank_name, p_account_holder: data.account_holder_name,
        p_iban: data.iban, p_idempotency_key: cashbackKey.current,
      } as any);
      if (rpcError) throw new Error(cashbackErrorText(rpcError.message));
      const result = rpcResult as { success: boolean; error?: string };
      if (!result?.success) throw new Error("فشل السحب");
      
      return { success: true };
    },
    onSuccess: () => {
      cashbackKey.current = crypto.randomUUID();
      toast.success("تم إرسال طلب السحب البنكي بنجاح! سيتم التحويل خلال 1-3 أيام عمل.");
      queryClient.invalidateQueries({ queryKey: ["user-cashback"] });
      queryClient.invalidateQueries({ queryKey: ["cashback-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-withdrawal-requests"] });
      setWithdrawDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء إرسال طلب السحب");
    },
  });

  const resetForm = () => {
    setWithdrawAmount("");
    setBankName("");
    setAccountHolderName("");
    setIban("");
    setWithdrawType("balance");
  };

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

    if (withdrawType === "balance") {
      withdrawMutation.mutate(amount);
    } else {
      // Bank withdrawal
      if (amount < MIN_BANK_WITHDRAWAL) {
        toast.error(`الحد الأدنى للسحب البنكي هو ${MIN_BANK_WITHDRAWAL} ر.س`);
        return;
      }
      if (!bankName) {
        toast.error("الرجاء اختيار البنك");
        return;
      }
      if (!accountHolderName.trim()) {
        toast.error("الرجاء إدخال اسم صاحب الحساب");
        return;
      }
      if (!iban.trim() || iban.length < 20) {
        toast.error("الرجاء إدخال رقم IBAN صحيح");
        return;
      }
      bankWithdrawMutation.mutate({
        amount,
        bank_name: bankName,
        account_holder_name: accountHolderName,
        iban: iban.toUpperCase(),
      });
    }
  };

  const canWithdrawToBank = (cashbackData?.cashback_balance || 0) >= MIN_BANK_WITHDRAWAL;

  const displayedTransactions = showAllTransactions 
    ? transactions 
    : transactions?.slice(0, 5);

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 md:space-y-8 px-1" dir="rtl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl md:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 md:p-10"
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
                  className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Wallet className="w-6 h-6 md:w-10 md:h-10 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h1 className="text-xl md:text-4xl font-bold text-white mb-1 md:mb-2">محفظة الكاش باك</h1>
                  <p className="text-white/80 text-xs md:text-base max-w-xl">
                    احصل على {settings?.cashback_percentage || 5}% كاش باك تلقائي
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
                    {(cashbackData?.cashback_balance || 0).toFixed(2)} ر.س
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
                    {(cashbackData?.total_earned || 0).toFixed(2)} ر.س
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
                    {(cashbackData?.total_withdrawn || 0).toFixed(2)} ر.س
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
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  يمكنك سحب رصيد الكاش باك إلى رصيدك الرئيسي أو إلى حسابك البنكي
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Withdraw to Balance */}
                  <div className="p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">سحب للرصيد الرئيسي</h4>
                        <p className="text-xs text-muted-foreground">فوري ومتاح دائماً</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background mb-3">
                      <Gift className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">المتاح:</span>
                      <span className="font-bold text-emerald-500">
                        {(cashbackData?.cashback_balance || 0).toFixed(2)} ر.س
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        setWithdrawType("balance");
                        setWithdrawDialogOpen(true);
                      }}
                      disabled={!cashbackData || cashbackData.cashback_balance <= 0}
                      className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                      size="sm"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      سحب للرصيد
                    </Button>
                  </div>

                  {/* Option 2: Withdraw to Bank */}
                  <div className="p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors relative">
                    {!canWithdrawToBank && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10">
                        <div className="text-center p-4">
                          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <p className="text-sm font-medium">الحد الأدنى للسحب البنكي</p>
                          <p className="text-lg font-bold text-amber-500">{MIN_BANK_WITHDRAWAL} ر.س</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">سحب للحساب البنكي</h4>
                        <p className="text-xs text-muted-foreground">1-3 أيام عمل</p>
                      </div>
                      <Badge variant="outline" className="text-xs">جديد</Badge>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background mb-3">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">الحد الأدنى: {MIN_BANK_WITHDRAWAL} ر.س</span>
                    </div>
                    <Button
                      onClick={() => {
                        setWithdrawType("bank");
                        setWithdrawDialogOpen(true);
                      }}
                      disabled={!canWithdrawToBank}
                      variant="outline"
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Building2 className="w-4 h-4" />
                      سحب لحساب بنكي
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bank Withdrawal Requests */}
        {bankRequests && bankRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  طلبات السحب البنكي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bankRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          request.status === "completed" ? "bg-green-500/20 text-green-500" :
                          request.status === "rejected" ? "bg-red-500/20 text-red-500" :
                          "bg-amber-500/20 text-amber-500"
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{request.bank_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.created_at), "dd MMMM yyyy", { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{request.amount.toFixed(2)} ر.س</p>
                        <Badge variant={
                          request.status === "completed" ? "default" :
                          request.status === "rejected" ? "destructive" :
                          "secondary"
                        } className="text-xs">
                          {request.status === "pending" && "قيد المراجعة"}
                          {request.status === "processing" && "قيد التنفيذ"}
                          {request.status === "completed" && "مكتمل"}
                          {request.status === "rejected" && "مرفوض"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                    desc: "اسحب للرصيد فوراً أو للبنك عند تجاوز 100 ر.س",
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
        <Dialog open={withdrawDialogOpen} onOpenChange={(open) => {
          setWithdrawDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {withdrawType === "balance" ? (
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Building2 className="w-5 h-5 text-blue-500" />
                )}
                {withdrawType === "balance" ? "سحب للرصيد الرئيسي" : "سحب للحساب البنكي"}
              </DialogTitle>
              <DialogDescription>
                {withdrawType === "balance" 
                  ? "أدخل المبلغ الذي تريد سحبه إلى رصيدك الرئيسي"
                  : "أدخل بيانات حسابك البنكي لتحويل الكاش باك"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الرصيد المتاح</span>
                  <span className="font-bold text-emerald-500">
                    {(cashbackData?.cashback_balance || 0).toFixed(2)} ر.س
                  </span>
                </div>
                {withdrawType === "bank" && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">الحد الأدنى للسحب البنكي</span>
                    <span className="text-sm font-medium text-amber-500">{MIN_BANK_WITHDRAWAL} ر.س</span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">مبلغ السحب (ر.س)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="text-lg h-12"
                  step="0.01"
                  min={withdrawType === "bank" ? MIN_BANK_WITHDRAWAL : 0}
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

              {withdrawType === "bank" && (
                <>
                  <div className="border-t border-border/50 pt-4">
                    <h4 className="font-medium mb-3">بيانات الحساب البنكي</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm mb-2 block">البنك</Label>
                        <Select value={bankName} onValueChange={setBankName}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر البنك" />
                          </SelectTrigger>
                          <SelectContent>
                            {SAUDI_BANKS.map((bank) => (
                              <SelectItem key={bank} value={bank}>
                                {bank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm mb-2 block">اسم صاحب الحساب</Label>
                        <Input
                          placeholder="الاسم كما يظهر في الحساب البنكي"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="text-sm mb-2 block">رقم IBAN</Label>
                        <Input
                          placeholder="SA..."
                          value={iban}
                          onChange={(e) => setIban(e.target.value.toUpperCase())}
                          className="font-mono tracking-wider"
                          dir="ltr"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          يبدأ بـ SA ويتكون من 24 حرف ورقم
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                setWithdrawDialogOpen(false);
                resetForm();
              }}>
                إلغاء
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || bankWithdrawMutation.isPending}
                className={`gap-2 ${withdrawType === "balance" 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                  : "bg-gradient-to-r from-blue-500 to-cyan-500"
                }`}
              >
                {(withdrawMutation.isPending || bankWithdrawMutation.isPending) ? (
                  "جاري السحب..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {withdrawType === "balance" ? "تأكيد السحب" : "إرسال طلب السحب"}
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
