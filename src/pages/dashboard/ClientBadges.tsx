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
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            الشارات والمكافآت
          </h1>
          <p className="text-muted-foreground mt-2">
            اجمع الشارات واحصل على مكافآت حصرية بناءً على نشاطك
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الشارات المكتسبة</p>
                  <p className="text-2xl font-bold">{earnedBadges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الإنفاق</p>
                  <p className="text-2xl font-bold">${userStats.totalSpending.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <Star className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الطلبات المكتملة</p>
                  <p className="text-2xl font-bold">{userStats.totalOrders}</p>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                الشارات المكتسبة
              </CardTitle>
              <CardDescription>
                الشارات التي حصلت عليها بناءً على نشاطك
              </CardDescription>
            </CardHeader>
            <CardContent>
              {earnedBadges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>لم تحصل على أي شارات بعد</p>
                  <p className="text-sm">أكمل طلباتك للحصول على شاراتك الأولى!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {earnedBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-3"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        {badge.icon}
                      </div>
                      <span className="font-semibold text-center">{badge.name_ar}</span>
                      <Badge variant="secondary" className="mt-2 text-xs">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                الشارات القادمة
              </CardTitle>
              <CardDescription>
                تقدمك نحو الشارات التالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unearnedBadges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-semibold">تهانينا! حصلت على جميع الشارات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unearnedBadges.map((badge, index) => {
                    const progress = getProgressToNextBadge(badge);
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl opacity-50"
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
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {badge.min_spending > 0 && (
                              <span className="text-xs text-muted-foreground">
                                الإنفاق: ${userStats.totalSpending.toFixed(0)} / ${badge.min_spending}
                              </span>
                            )}
                            {badge.min_orders > 0 && (
                              <span className="text-xs text-muted-foreground">
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
