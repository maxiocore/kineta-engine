import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  Coins,
  Settings,
  Percent,
  DollarSign,
  TrendingUp,
  Users,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowDownToLine,
  History,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CashbackSettings {
  id: string;
  cashback_percentage: number;
  min_deposit_amount: number;
  max_cashback_amount: number | null;
  is_active: boolean;
}

interface CashbackStats {
  totalUsers: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalBalance: number;
}

interface CashbackTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description_ar: string;
  created_at: string;
}

const AdminCashback = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CashbackSettings>>({});

  // Realtime subscription for cashback updates
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('admin-cashback-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cashback',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-cashback-stats"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashback_transactions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-cashback-transactions"] });
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
          queryClient.invalidateQueries({ queryKey: ["admin-cashback-settings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-cashback-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashback_settings")
        .select("*")
        .single();
      
      if (error) throw error;
      return data as CashbackSettings;
    },
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-cashback-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_cashback")
        .select("cashback_balance, total_earned, total_withdrawn");
      
      if (error) throw error;
      
      const totalUsers = data?.length || 0;
      const totalEarned = data?.reduce((sum, u) => sum + (u.total_earned || 0), 0) || 0;
      const totalWithdrawn = data?.reduce((sum, u) => sum + (u.total_withdrawn || 0), 0) || 0;
      const totalBalance = data?.reduce((sum, u) => sum + (u.cashback_balance || 0), 0) || 0;
      
      return { totalUsers, totalEarned, totalWithdrawn, totalBalance } as CashbackStats;
    },
  });

  // Fetch recent transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin-cashback-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashback_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as CashbackTransaction[];
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<CashbackSettings>) => {
      if (!settings?.id) throw new Error("No settings found");
      
      const { error } = await supabase
        .from("cashback_settings")
        .update({
          cashback_percentage: updates.cashback_percentage,
          min_deposit_amount: updates.min_deposit_amount,
          max_cashback_amount: updates.max_cashback_amount,
          is_active: updates.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ إعدادات الكاش باك بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-cashback-settings"] });
      setFormData({});
    },
    onError: (error: Error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const handleSave = () => {
    const updates = {
      cashback_percentage: formData.cashback_percentage ?? settings?.cashback_percentage,
      min_deposit_amount: formData.min_deposit_amount ?? settings?.min_deposit_amount,
      max_cashback_amount: formData.max_cashback_amount ?? settings?.max_cashback_amount,
      is_active: formData.is_active ?? settings?.is_active,
    };
    updateMutation.mutate(updates);
  };

  const hasChanges = Object.keys(formData).length > 0;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 lg:space-y-8" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              إعدادات الكاش باك
            </h1>
            <p className="text-muted-foreground mt-1">إدارة نظام الكاش باك والمكافآت</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500"
          >
            {updateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ التغييرات
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "المستخدمين",
              value: stats?.totalUsers || 0,
              icon: Users,
              color: "from-blue-500 to-cyan-500",
              suffix: "",
            },
            {
              title: "إجمالي الكاش باك الممنوح",
              value: stats?.totalEarned || 0,
              icon: TrendingUp,
              color: "from-green-500 to-emerald-500",
              suffix: "$",
            },
            {
              title: "إجمالي المسحوب",
              value: stats?.totalWithdrawn || 0,
              icon: ArrowDownToLine,
              color: "from-purple-500 to-pink-500",
              suffix: "$",
            },
            {
              title: "الرصيد المتاح",
              value: stats?.totalBalance || 0,
              icon: Coins,
              color: "from-amber-500 to-orange-500",
              suffix: "$",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {stat.suffix}{typeof stat.value === 'number' ? stat.value.toFixed(stat.suffix ? 2 : 0) : stat.value}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  إعدادات النظام
                </CardTitle>
                <CardDescription>
                  تحكم في نسبة الكاش باك وشروط الحصول عليه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        {(formData.is_active ?? settings?.is_active) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">تفعيل نظام الكاش باك</p>
                          <p className="text-sm text-muted-foreground">
                            عند التفعيل، سيحصل المستخدمون على كاش باك تلقائي
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.is_active ?? settings?.is_active ?? false}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>

                    {/* Percentage */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        نسبة الكاش باك (%)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.cashback_percentage ?? settings?.cashback_percentage ?? 5}
                        onChange={(e) => setFormData({ ...formData, cashback_percentage: parseFloat(e.target.value) })}
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        النسبة المئوية من مبلغ الإيداع التي تُضاف ككاش باك
                      </p>
                    </div>

                    {/* Min Deposit */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        الحد الأدنى للإيداع ($)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.min_deposit_amount ?? settings?.min_deposit_amount ?? 0}
                        onChange={(e) => setFormData({ ...formData, min_deposit_amount: parseFloat(e.target.value) })}
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        الحد الأدنى لمبلغ الإيداع للحصول على كاش باك
                      </p>
                    </div>

                    {/* Max Cashback */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-muted-foreground" />
                        الحد الأقصى للكاش باك ($)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="بدون حد أقصى"
                        value={formData.max_cashback_amount ?? settings?.max_cashback_amount ?? ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          max_cashback_amount: e.target.value ? parseFloat(e.target.value) : null 
                        })}
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        الحد الأقصى لمبلغ الكاش باك لكل عملية (اتركه فارغاً لعدم وجود حد)
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <p className="text-sm font-medium mb-2">معاينة:</p>
                      <p className="text-muted-foreground text-sm">
                        عند إيداع <span className="font-bold text-foreground">$100</span>، سيحصل المستخدم على{" "}
                        <span className="font-bold text-emerald-500">
                          ${((formData.cashback_percentage ?? settings?.cashback_percentage ?? 5) * 100 / 100).toFixed(2)}
                        </span>{" "}
                        كاش باك
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-muted-foreground" />
                  آخر المعاملات
                </CardTitle>
                <CardDescription>
                  آخر 20 معاملة كاش باك في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">لا توجد معاملات بعد</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === "earned"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-blue-500/20 text-blue-500"
                            }`}
                          >
                            {tx.type === "earned" ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <ArrowDownToLine className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{tx.description_ar}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.created_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={tx.amount > 0 ? "default" : "secondary"}
                          className={tx.amount > 0 ? "bg-green-500" : ""}
                        >
                          {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCashback;
