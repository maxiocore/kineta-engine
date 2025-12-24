import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, Gift, TrendingUp, Sparkles, History, 
  ArrowDownRight, ArrowUpRight, Crown, Medal, Gem,
  CheckCircle, Loader2, Trophy, Star, Target, Zap,
  ChevronLeft, Lock, Unlock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useRewardPoints } from "@/hooks/useRewardPoints";
import { useUserBadges } from "@/hooks/useUserBadges";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  Award,
  Crown,
  Medal,
  Gem,
  Sparkles,
  Star,
  Trophy,
  Target,
  Zap
};

const ClientRewardsHub = () => {
  const { user } = useAuth();
  const { userPoints, transactions, tiers, loading: pointsLoading, getNextTier, getProgressToNextTier, refetch } = useRewardPoints();
  const { badges, userBadges, loading: badgesLoading, checkAndAwardBadges } = useUserBadges(user?.id);
  
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [userStats, setUserStats] = useState({ totalSpending: 0, totalOrders: 0 });

  const loading = pointsLoading || badgesLoading;
  const currentTier = userPoints?.tier || tiers[0];
  const nextTier = getNextTier();
  const progressToNext = getProgressToNextTier();

  // Fetch user stats for badges
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;
      
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_price, status')
          .eq('user_id', user.id);

        if (orders) {
          const completedOrders = orders.filter(o => o.status === 'completed');
          const totalSpending = completedOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
          setUserStats({
            totalSpending,
            totalOrders: completedOrders.length
          });
          checkAndAwardBadges(totalSpending, completedOrders.length);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [user?.id, checkAndAwardBadges]);

  // Setup realtime subscription for points
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('rewards-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_points',
        filter: `user_id=eq.${user.id}`
      }, () => {
        refetch();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'points_transactions',
        filter: `user_id=eq.${user.id}`
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const earnedBadges = badges.filter(b => earnedBadgeIds.has(b.id));
  const unearnedBadges = badges.filter(b => !earnedBadgeIds.has(b.id));

  const getProgressToNextBadge = (badge: typeof badges[0]) => {
    const spendingProgress = badge.min_spending > 0 
      ? Math.min((userStats.totalSpending / badge.min_spending) * 100, 100) 
      : 100;
    const ordersProgress = badge.min_orders > 0 
      ? Math.min((userStats.totalOrders / badge.min_orders) * 100, 100) 
      : 100;
    return Math.min(spendingProgress, ordersProgress);
  };

  const handleRedeem = async () => {
    const points = parseInt(pointsToRedeem);
    if (isNaN(points) || points < 100) {
      toast.error("الحد الأدنى للاستبدال 100 نقطة");
      return;
    }

    if (points > (userPoints?.available_points || 0)) {
      toast.error("لا تملك نقاط كافية");
      return;
    }

    setRedeeming(true);

    try {
      const balanceToAdd = points / 100;

      const { error: transactionError } = await supabase
        .from("points_transactions")
        .insert({
          user_id: user?.id,
          points: -points,
          type: "redeemed",
          description: `Redeemed ${points} points for ${balanceToAdd} SAR`,
          description_ar: `تم استبدال ${points} نقطة مقابل ${balanceToAdd} ر.س`
        });

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from("user_points")
        .update({
          available_points: (userPoints?.available_points || 0) - points,
          redeemed_points: (userPoints?.redeemed_points || 0) + points,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user?.id);

      if (updateError) throw updateError;

      const { data: balanceData } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", user?.id)
        .maybeSingle();

      const currentBalance = balanceData?.balance || 0;

      await supabase
        .from("user_balances")
        .upsert({
          user_id: user?.id,
          balance: currentBalance + balanceToAdd,
          updated_at: new Date().toISOString()
        });

      toast.success(`تم إضافة ${balanceToAdd.toFixed(2)} ر.س إلى رصيدك!`);
      setRedeemDialogOpen(false);
      setPointsToRedeem("");
      refetch();
    } catch (error) {
      console.error("Error redeeming points:", error);
      toast.error("حدث خطأ أثناء استبدال النقاط");
    } finally {
      setRedeeming(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earned": return ArrowUpRight;
      case "redeemed": return ArrowDownRight;
      case "bonus": return Sparkles;
      default: return History;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "earned": return "text-success";
      case "redeemed": return "text-accent";
      case "bonus": return "text-warning";
      default: return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">جاري تحميل بيانات المكافآت...</p>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              الشارات والمكافآت
            </h1>
            <p className="text-muted-foreground mt-1">اكسب النقاط واجمع الشارات واستبدلها بمكافآت حصرية</p>
          </div>
        </motion.div>

        {/* Overview Stats - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userPoints?.available_points?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">نقطة متاحة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{earnedBadges.length}</p>
                    <p className="text-xs text-muted-foreground">شارة مكتسبة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.totalSpending.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">ر.س إجمالي الإنفاق</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">طلب مكتمل</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Points & Tier Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="glass border-border/50 overflow-hidden h-full">
              <div 
                className="absolute inset-0 opacity-10"
                style={{ 
                  background: `linear-gradient(135deg, ${currentTier?.color || '#6366f1'} 0%, transparent 50%)` 
                }}
              />
              <CardContent className="p-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                      style={{ backgroundColor: `${currentTier?.color}20` }}
                    >
                      <Crown className="w-8 h-8" style={{ color: currentTier?.color }} />
                      <div 
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: currentTier?.color }}
                      >
                        x{currentTier?.points_multiplier || 1}
                      </div>
                    </div>
                    <div>
                      <Badge 
                        variant="outline"
                        className="mb-2 text-sm"
                        style={{ 
                          borderColor: currentTier?.color,
                          color: currentTier?.color,
                          backgroundColor: `${currentTier?.color}10`
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                        {currentTier?.name_ar || 'برونزي'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">مستواك الحالي</p>
                    </div>
                  </div>
                  <motion.div 
                    className="text-center sm:text-left"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <p className="text-4xl sm:text-5xl font-bold">
                      {userPoints?.available_points?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">نقطة متاحة</p>
                  </motion.div>
                </div>

                {/* Progress to Next Tier */}
                {nextTier && (
                  <div className="space-y-2 mb-6 p-4 bg-secondary/20 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span className="text-muted-foreground">التقدم نحو {nextTier.name_ar}</span>
                      </div>
                      <span className="font-medium">{Math.round(progressToNext)}%</span>
                    </div>
                    <Progress value={progressToNext} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      تحتاج <span className="font-bold text-primary">{(nextTier.min_points - (userPoints?.total_points || 0)).toLocaleString()}</span> نقطة إضافية للترقية
                    </p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-secondary/30 rounded-xl p-3 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" />
                    <p className="text-lg font-bold">{userPoints?.total_points?.toLocaleString() || 0}</p>
                    <p className="text-[10px] text-muted-foreground">إجمالي المكتسب</p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-3 text-center">
                    <Gift className="w-5 h-5 mx-auto mb-1 text-accent" />
                    <p className="text-lg font-bold">{userPoints?.redeemed_points?.toLocaleString() || 0}</p>
                    <p className="text-[10px] text-muted-foreground">تم استبدالها</p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-3 text-center">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-warning" />
                    <p className="text-lg font-bold">{(userPoints?.available_points || 0) / 100}</p>
                    <p className="text-[10px] text-muted-foreground">ر.س قابلة للاستبدال</p>
                  </div>
                </div>

                {/* Redeem Button */}
                <Button 
                  onClick={() => setRedeemDialogOpen(true)}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 h-12 text-base"
                  disabled={!userPoints?.available_points || userPoints.available_points < 100}
                >
                  <Gift className="w-5 h-5 ml-2" />
                  استبدال النقاط برصيد
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  الحد الأدنى 100 نقطة = 1 ر.س
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Tier Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-warning" />
                  مزايا {currentTier?.name_ar || 'مستواك'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentTier?.benefits && typeof currentTier.benefits === 'object' && !Array.isArray(currentTier.benefits) && (
                  <>
                    {(currentTier.benefits as any).discount_percentage > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="font-medium">خصم {(currentTier.benefits as any).discount_percentage}% على جميع الطلبات</span>
                      </div>
                    )}
                    {(currentTier.benefits as any).priority_support && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">أولوية في الدعم الفني</span>
                      </div>
                    )}
                    {(currentTier.benefits as any).exclusive_services && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">وصول لخدمات حصرية</span>
                      </div>
                    )}
                    {(currentTier.benefits as any).free_refills && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">إعادة تعبئة مجانية</span>
                      </div>
                    )}
                    {(currentTier.benefits as any).bonus_points > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">+{(currentTier.benefits as any).bonus_points} نقطة إضافية لكل طلب</span>
                      </div>
                    )}
                  </>
                )}
                {currentTier?.benefits && Array.isArray(currentTier.benefits) && currentTier.benefits.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}

                {/* Upgrade hint */}
                {nextTier && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">عند الترقية إلى {nextTier.name_ar}:</p>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: nextTier.color, color: nextTier.color }}>
                      x{nextTier.points_multiplier} مضاعف نقاط
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="badges" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="badges" className="gap-1.5">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">الشارات</span>
            </TabsTrigger>
            <TabsTrigger value="tiers" className="gap-1.5">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">المستويات</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1.5">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">التقدم</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">السجل</span>
            </TabsTrigger>
          </TabsList>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earned Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Unlock className="w-5 h-5 text-success" />
                    الشارات المكتسبة ({earnedBadges.length})
                  </CardTitle>
                  <CardDescription>الشارات التي حصلت عليها</CardDescription>
                </CardHeader>
                <CardContent>
                  {earnedBadges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>لم تحصل على أي شارات بعد</p>
                      <p className="text-sm">أكمل طلباتك للحصول على شاراتك الأولى!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {earnedBadges.map((badge, index) => (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => setSelectedBadge(badge)}
                          className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-all cursor-pointer hover:scale-105"
                        >
                          <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2"
                            style={{ backgroundColor: `${badge.color}20` }}
                          >
                            {badge.icon}
                          </div>
                          <span className="font-semibold text-center text-sm">{badge.name_ar}</span>
                          <Badge variant="secondary" className="mt-2 text-[10px]">
                            المستوى {badge.tier}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Locked Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    الشارات المتبقية ({unearnedBadges.length})
                  </CardTitle>
                  <CardDescription>شارات يمكنك الحصول عليها</CardDescription>
                </CardHeader>
                <CardContent>
                  {unearnedBadges.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
                      <p className="text-lg font-semibold">تهانينا! 🎉</p>
                      <p className="text-muted-foreground">حصلت على جميع الشارات</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {unearnedBadges.map((badge, index) => {
                        const progress = getProgressToNextBadge(badge);
                        return (
                          <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedBadge(badge)}
                            className="relative flex flex-col items-center p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-all cursor-pointer opacity-60 hover:opacity-100"
                          >
                            <div 
                              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2"
                              style={{ backgroundColor: `${badge.color}10` }}
                            >
                              {badge.icon}
                            </div>
                            <span className="font-semibold text-center text-sm">{badge.name_ar}</span>
                            <Progress value={progress} className="w-full h-1.5 mt-2" />
                            <span className="text-[10px] text-muted-foreground mt-1">{progress.toFixed(0)}%</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value="tiers">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((tier, index) => {
                const TierIcon = iconMap[tier.icon] || Award;
                const isCurrentTier = tier.id === userPoints?.tier_id;
                const isUnlocked = (userPoints?.total_points || 0) >= tier.min_points;
                
                return (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "relative overflow-hidden transition-all h-full",
                      isCurrentTier && "ring-2 ring-offset-2 ring-primary",
                      !isUnlocked && "opacity-50"
                    )}>
                      {isCurrentTier && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="text-[10px]" style={{ backgroundColor: tier.color }}>
                            مستواك
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-6 pt-8 text-center">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                          style={{ backgroundColor: `${tier.color}20` }}
                        >
                          <TierIcon className="w-8 h-8" style={{ color: tier.color }} />
                        </div>
                        <h3 className="font-bold text-xl mb-1">{tier.name_ar}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {tier.min_points.toLocaleString()}+ نقطة
                        </p>
                        <Badge variant="outline" className="mb-4">
                          x{tier.points_multiplier} مضاعف
                        </Badge>
                        <div className="space-y-1 text-xs text-muted-foreground text-right">
                          {tier.benefits && typeof tier.benefits === 'object' && !Array.isArray(tier.benefits) && (
                            <>
                              {(tier.benefits as any).discount_percentage > 0 && (
                                <p className="flex items-center gap-1 justify-end text-amber-500 font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  خصم {(tier.benefits as any).discount_percentage}%
                                </p>
                              )}
                              {(tier.benefits as any).priority_support && (
                                <p className="flex items-center gap-1 justify-end">
                                  <CheckCircle className="w-3 h-3 text-success" />
                                  أولوية دعم
                                </p>
                              )}
                              {(tier.benefits as any).free_refills && (
                                <p className="flex items-center gap-1 justify-end">
                                  <CheckCircle className="w-3 h-3 text-success" />
                                  إعادة تعبئة مجانية
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        {!isUnlocked && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              تحتاج {(tier.min_points - (userPoints?.total_points || 0)).toLocaleString()} نقطة
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  تقدمك نحو الشارات القادمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {unearnedBadges.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-semibold">أحسنت! 🎉</p>
                    <p className="text-muted-foreground">لقد حصلت على جميع الشارات المتاحة</p>
                  </div>
                ) : (
                  unearnedBadges.slice(0, 5).map((badge, index) => {
                    const progress = getProgressToNextBadge(badge);
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${badge.color}20` }}
                          >
                            {badge.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{badge.name_ar}</span>
                              <Badge variant="outline" className="text-xs">
                                المستوى {badge.tier}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {badge.description_ar || badge.description}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>التقدم</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex flex-wrap gap-3 mt-2">
                            {badge.min_spending > 0 && (
                              <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                💰 الإنفاق: {userStats.totalSpending.toFixed(0)} / {badge.min_spending}
                              </span>
                            )}
                            {badge.min_orders > 0 && (
                              <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                📦 الطلبات: {userStats.totalOrders} / {badge.min_orders}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  سجل معاملات النقاط
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد معاملات بعد</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {transactions.map((transaction, index) => {
                          const Icon = getTransactionIcon(transaction.type);
                          return (
                            <motion.div
                              key={transaction.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center",
                                  transaction.type === "earned" && "bg-success/10",
                                  transaction.type === "redeemed" && "bg-accent/10",
                                  transaction.type === "bonus" && "bg-warning/10"
                                )}>
                                  <Icon className={cn("w-5 h-5", getTransactionColor(transaction.type))} />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {transaction.description_ar || transaction.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(transaction.created_at), "d MMM yyyy - HH:mm", { locale: ar })}
                                  </p>
                                </div>
                              </div>
                              <span className={cn(
                                "font-bold text-lg",
                                transaction.points > 0 ? "text-success" : "text-accent"
                              )}>
                                {transaction.points > 0 ? "+" : ""}{transaction.points.toLocaleString()}
                              </span>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Redeem Dialog */}
        <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                استبدال النقاط
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">رصيدك من النقاط</p>
                <p className="text-4xl font-bold">{userPoints?.available_points?.toLocaleString() || 0}</p>
              </div>
              
              <div className="space-y-2">
                <Label>عدد النقاط للاستبدال</Label>
                <Input
                  type="number"
                  placeholder="أدخل عدد النقاط (الحد الأدنى 100)"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  min={100}
                  max={userPoints?.available_points || 0}
                  className="text-center text-lg"
                />
              </div>

              {pointsToRedeem && parseInt(pointsToRedeem) >= 100 && (
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-1">ستحصل على</p>
                  <p className="text-3xl font-bold text-success">
                    {(parseInt(pointsToRedeem) / 100).toFixed(2)} ر.س
                  </p>
                  <p className="text-xs text-muted-foreground">رصيد في حسابك</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap justify-center">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setPointsToRedeem(String(Math.min(amount, userPoints?.available_points || 0)))}
                    disabled={(userPoints?.available_points || 0) < amount}
                  >
                    {amount} نقطة
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPointsToRedeem(String(userPoints?.available_points || 0))}
                  disabled={!userPoints?.available_points}
                >
                  الكل
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRedeemDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleRedeem}
                disabled={redeeming || !pointsToRedeem || parseInt(pointsToRedeem) < 100}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {redeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الاستبدال...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 ml-2" />
                    تأكيد الاستبدال
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Badge Details Dialog */}
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent className="sm:max-w-md">
            {selectedBadge && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 justify-center">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                      style={{ backgroundColor: `${selectedBadge.color}20` }}
                    >
                      {selectedBadge.icon}
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-4 py-4">
                  <div>
                    <h3 className="text-xl font-bold">{selectedBadge.name_ar}</h3>
                    <Badge variant="outline" className="mt-2" style={{ borderColor: selectedBadge.color, color: selectedBadge.color }}>
                      المستوى {selectedBadge.tier}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {selectedBadge.description_ar || selectedBadge.description}
                  </p>
                  <div className="space-y-2 p-4 bg-secondary/30 rounded-xl">
                    <p className="text-sm font-medium mb-2">متطلبات الحصول:</p>
                    {selectedBadge.min_spending > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span>إجمالي الإنفاق</span>
                        <span className="font-bold">{selectedBadge.min_spending} ر.س</span>
                      </div>
                    )}
                    {selectedBadge.min_orders > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span>عدد الطلبات</span>
                        <span className="font-bold">{selectedBadge.min_orders} طلب</span>
                      </div>
                    )}
                  </div>
                  {earnedBadgeIds.has(selectedBadge.id) ? (
                    <Badge className="bg-success text-white">
                      <CheckCircle className="w-4 h-4 ml-1" />
                      تم الحصول عليها
                    </Badge>
                  ) : (
                    <div className="space-y-2">
                      <Progress value={getProgressToNextBadge(selectedBadge)} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        التقدم: {getProgressToNextBadge(selectedBadge).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientRewardsHub;
