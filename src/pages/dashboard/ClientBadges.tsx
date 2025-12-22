import { motion } from "framer-motion";
import { Award, Trophy, Star, TrendingUp, Sparkles } from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserBadges } from "@/hooks/useUserBadges";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ClientBadges = () => {
  const { user } = useAuth();
  const { badges, userBadges, loading, checkAndAwardBadges } = useUserBadges(user?.id);
  const [userStats, setUserStats] = useState({ totalSpending: 0, totalOrders: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

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

          // Check for new badges
          checkAndAwardBadges(totalSpending, completedOrders.length);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [user?.id, checkAndAwardBadges]);

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

  if (loading || loadingStats) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-1 sm:px-0" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold flex items-center gap-2 sm:gap-3 flex-row-reverse justify-end">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            الشارات والمكافآت
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            اجمع الشارات واحصل على مكافآت حصرية بناءً على نشاطك
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-row-reverse">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">الشارات المكتسبة</p>
                  <p className="text-xl sm:text-2xl font-bold">{earnedBadges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-row-reverse">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">إجمالي الإنفاق</p>
                  <p className="text-xl sm:text-2xl font-bold">{userStats.totalSpending.toFixed(2)} ر.س</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-row-reverse">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">الطلبات المكتملة</p>
                  <p className="text-xl sm:text-2xl font-bold">{userStats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Earned Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-row-reverse justify-end">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                الشارات المكتسبة
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-right">
                الشارات التي حصلت عليها بناءً على نشاطك
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {earnedBadges.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                  <p className="text-sm sm:text-base">لم تحصل على أي شارات بعد</p>
                  <p className="text-xs sm:text-sm">أكمل طلباتك للحصول على شاراتك الأولى!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {earnedBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      <div 
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl mb-2 sm:mb-3"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        {badge.icon}
                      </div>
                      <span className="font-semibold text-center text-xs sm:text-sm">{badge.name_ar}</span>
                      <Badge variant="secondary" className="mt-1 sm:mt-2 text-[10px] sm:text-xs">
                        المستوى {badge.tier}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress to Next Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-row-reverse justify-end">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                الشارات القادمة
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-right">
                تقدمك نحو الشارات التالية
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {unearnedBadges.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
                  <p className="text-base sm:text-lg font-semibold">تهانينا! حصلت على جميع الشارات</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {unearnedBadges.map((badge, index) => {
                    const progress = getProgressToNextBadge(badge);
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3 flex-row-reverse">
                          <div 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl opacity-50"
                            style={{ backgroundColor: `${badge.color}20` }}
                          >
                            {badge.icon}
                          </div>
                          <div className="flex-1 text-right">
                            <div className="flex items-center justify-between flex-row-reverse">
                              <span className="font-semibold text-sm sm:text-base">{badge.name_ar}</span>
                              <Badge variant="outline" className="text-[10px] sm:text-xs">
                                المستوى {badge.tier}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {badge.description_ar || badge.description}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground flex-row-reverse">
                            <span>التقدم</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5 sm:h-2" />
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2 justify-end">
                            {badge.min_spending > 0 && (
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                الإنفاق: ${userStats.totalSpending.toFixed(0)} / ${badge.min_spending}
                              </span>
                            )}
                            {badge.min_orders > 0 && (
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                الطلبات: {userStats.totalOrders} / {badge.min_orders}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientBadges;
