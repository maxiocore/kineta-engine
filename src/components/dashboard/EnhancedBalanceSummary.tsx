import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Gift, 
  Star,
  TrendingUp,
  TrendingDown,
  History,
  CreditCard,
  Sparkles,
  ChevronLeft,
  Eye,
  EyeOff,
  RefreshCw,
  PiggyBank,
  Coins,
  Receipt,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface BalanceData {
  balance: number;
  totalDeposited: number;
  totalSpent: number;
}

interface CashbackData {
  balance: number;
  totalEarned: number;
}

interface PointsData {
  available: number;
  total: number;
}

interface RecentTransaction {
  id: string;
  type: 'deposit' | 'order' | 'cashback' | 'refund';
  amount: number;
  description: string;
  created_at: string;
}

interface EnhancedBalanceSummaryProps {
  balanceData?: BalanceData;
  cashbackData?: CashbackData;
  pointsData?: PointsData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const EnhancedBalanceSummary = ({ 
  balanceData: propBalanceData,
  cashbackData: propCashbackData,
  pointsData: propPointsData,
  isLoading: propIsLoading,
  onRefresh 
}: EnhancedBalanceSummaryProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(propIsLoading ?? true);
  const [balanceData, setBalanceData] = useState<BalanceData>(propBalanceData || {
    balance: 0,
    totalDeposited: 0,
    totalSpent: 0,
  });
  const [cashbackData, setCashbackData] = useState<CashbackData>(propCashbackData || {
    balance: 0,
    totalEarned: 0,
  });
  const [pointsData, setPointsData] = useState<PointsData>(propPointsData || {
    available: 0,
    total: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Use props if provided
  useEffect(() => {
    if (propBalanceData) setBalanceData(propBalanceData);
    if (propCashbackData) setCashbackData(propCashbackData);
    if (propPointsData) setPointsData(propPointsData);
    if (propIsLoading !== undefined) setLoading(propIsLoading);
  }, [propBalanceData, propCashbackData, propPointsData, propIsLoading]);

  // Fetch data if not provided via props
  useEffect(() => {
    if (!propBalanceData && user) {
      fetchWalletData();
    }
  }, [user, propBalanceData]);

  const fetchWalletData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [balanceResult, cashbackResult, pointsResult, transactionsResult] = await Promise.all([
        supabase
          .from("user_balances")
          .select("balance, total_deposited, total_spent")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("user_cashback")
          .select("cashback_balance, total_earned")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_points")
          .select("available_points, total_points")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("balance_logs")
          .select("id, action_type, amount, notes, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (balanceResult.data) {
        setBalanceData({
          balance: balanceResult.data.balance || 0,
          totalDeposited: balanceResult.data.total_deposited || 0,
          totalSpent: balanceResult.data.total_spent || 0,
        });
      }

      if (cashbackResult.data) {
        setCashbackData({
          balance: cashbackResult.data.cashback_balance || 0,
          totalEarned: cashbackResult.data.total_earned || 0,
        });
      }

      if (pointsResult.data) {
        setPointsData({
          available: pointsResult.data.available_points || 0,
          total: pointsResult.data.total_points || 0,
        });
      }

      if (transactionsResult.data) {
        const transactions: RecentTransaction[] = transactionsResult.data.map((t: any) => ({
          id: t.id,
          type: t.action_type === 'deposit' ? 'deposit' : 
                t.action_type === 'order' ? 'order' : 
                t.action_type === 'cashback' ? 'cashback' : 'refund',
          amount: t.amount,
          description: t.notes || getTransactionDescription(t.action_type),
          created_at: t.created_at,
        }));
        setRecentTransactions(transactions);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      await fetchWalletData();
    }
    setRefreshing(false);
  };

  const getTransactionDescription = (type: string) => {
    switch (type) {
      case 'deposit': return 'إيداع رصيد';
      case 'order': return 'دفع طلب';
      case 'cashback': return 'كاش باك';
      case 'refund': return 'استرداد';
      case 'admin_add': return 'إضافة من الإدارة';
      case 'admin_deduct': return 'خصم من الإدارة';
      default: return 'معاملة';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpRight className="w-3.5 h-3.5" />;
      case 'order': return <ArrowDownRight className="w-3.5 h-3.5" />;
      case 'cashback': return <Gift className="w-3.5 h-3.5" />;
      case 'refund': return <RefreshCw className="w-3.5 h-3.5" />;
      default: return <Receipt className="w-3.5 h-3.5" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': 
      case 'cashback':
      case 'refund':
        return 'text-success bg-success/10';
      case 'order': 
        return 'text-destructive bg-destructive/10';
      default: 
        return 'text-muted-foreground bg-muted';
    }
  };

  const totalAssets = balanceData.balance + cashbackData.balance;
  const savingsRate = balanceData.totalDeposited > 0 
    ? ((balanceData.totalDeposited - balanceData.totalSpent) / balanceData.totalDeposited * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Card className="border-border/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-10 w-40 mb-4" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {/* Main Balance Card */}
      <Card className="card-elevated border-border/30 overflow-hidden relative">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        
        <CardContent className="p-4 sm:p-6 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">المحفظة</h3>
                <p className="text-[10px] text-muted-foreground">إجمالي أصولك</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setHideBalance(!hideBalance)}
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Main Balance */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-1">الرصيد المتاح</p>
            <motion.div 
              className="flex items-baseline gap-2"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                {hideBalance ? '••••••' : balanceData.balance.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">ر.س</span>
            </motion.div>
            
            {/* Total Assets Indicator */}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-[10px] gap-1">
                <PiggyBank className="w-3 h-3" />
                إجمالي الأصول: {hideBalance ? '••••' : totalAssets.toFixed(2)} ر.س
              </Badge>
              {Number(savingsRate) > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 text-success border-success/30">
                  <TrendingUp className="w-3 h-3" />
                  وفّرت {savingsRate}%
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Deposits */}
            <motion.div 
              className="bg-success/5 border border-success/20 rounded-xl p-3 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-success/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-success" />
              </div>
              <p className="text-[10px] text-muted-foreground mb-0.5">الإيداعات</p>
              <p className="font-bold text-sm text-success">
                {hideBalance ? '••••' : balanceData.totalDeposited.toFixed(0)}
              </p>
            </motion.div>

            {/* Spent */}
            <motion.div 
              className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-[10px] text-muted-foreground mb-0.5">المصروفات</p>
              <p className="font-bold text-sm text-destructive">
                {hideBalance ? '••••' : balanceData.totalSpent.toFixed(0)}
              </p>
            </motion.div>

            {/* Cashback */}
            <motion.div 
              className="bg-accent/5 border border-accent/20 rounded-xl p-3 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-accent/10 flex items-center justify-center">
                <Gift className="w-4 h-4 text-accent" />
              </div>
              <p className="text-[10px] text-muted-foreground mb-0.5">الكاش باك</p>
              <p className="font-bold text-sm text-accent">
                {hideBalance ? '••••' : cashbackData.balance.toFixed(0)}
              </p>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate("/dashboard/deposit")}
              className="flex-1 bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              شحن الرصيد
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/dashboard/financial-hub")}
              className="flex-1 gap-2"
            >
              <History className="w-4 h-4" />
              السجل المالي
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Points & Cashback Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Points Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/30 h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium">نقاط المكافآت</p>
                  <p className="text-[10px] text-muted-foreground">استبدلها بخصومات</p>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-amber-500">
                  {hideBalance ? '••••' : pointsData.available}
                </span>
                <span className="text-[10px] text-muted-foreground">نقطة</span>
              </div>
              {pointsData.total > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>الإجمالي: {pointsData.total}</span>
                    <span>{((pointsData.available / pointsData.total) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={(pointsData.available / pointsData.total) * 100} className="h-1.5" />
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-xs h-8 gap-1"
                onClick={() => navigate("/dashboard/rewards")}
              >
                استبدال النقاط
                <ChevronLeft className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cashback Details Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/30 h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium">الكاش باك</p>
                  <p className="text-[10px] text-muted-foreground">اكسب مع كل إيداع</p>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-500">
                  {hideBalance ? '••••' : cashbackData.balance.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground">ر.س</span>
              </div>
              {cashbackData.totalEarned > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  إجمالي المكتسب: <span className="text-success">{cashbackData.totalEarned.toFixed(2)} ر.س</span>
                </p>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-xs h-8 gap-1"
                onClick={() => navigate("/dashboard/financial-hub?tab=cashback")}
              >
                سحب الكاش باك
                <ChevronLeft className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/30">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  آخر المعاملات
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 gap-1"
                  onClick={() => navigate("/dashboard/financial-hub?tab=logs")}
                >
                  عرض الكل
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                <AnimatePresence>
                  {recentTransactions.slice(0, 4).map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{transaction.description}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.created_at), { 
                              addSuffix: true, 
                              locale: ar 
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${
                        transaction.amount >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}{hideBalance ? '••••' : transaction.amount.toFixed(2)}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-4 gap-2"
      >
        {[
          { icon: CreditCard, label: 'إيداع', path: '/dashboard/deposit', color: 'from-blue-500 to-cyan-500' },
          { icon: History, label: 'السجل', path: '/dashboard/financial-hub?tab=logs', color: 'from-purple-500 to-pink-500' },
          { icon: Gift, label: 'كاش باك', path: '/dashboard/financial-hub?tab=cashback', color: 'from-emerald-500 to-teal-500' },
          { icon: Star, label: 'مكافآت', path: '/dashboard/rewards', color: 'from-amber-500 to-orange-500' },
        ].map((action, index) => (
          <motion.div
            key={action.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={action.path}>
              <Card className="border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-3 text-center">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-medium">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default EnhancedBalanceSummary;
