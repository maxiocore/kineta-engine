import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Flame, Trophy, Clock, CheckCircle, Star, 
  Sparkles, Gift, TrendingUp, Calendar, Zap, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useChallenges } from "@/hooks/useChallenges";
import { cn } from "@/lib/utils";
import { differenceInHours, differenceInDays, format, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface ChallengeCardProps {
  challenge: any;
  userProgress: any;
  type: 'daily' | 'weekly';
  index: number;
}

const ChallengeCard = ({ challenge, userProgress, type, index }: ChallengeCardProps) => {
  const progress = userProgress 
    ? Math.min((userProgress.current_value / userProgress.target_value) * 100, 100)
    : 0;
  const isCompleted = userProgress?.is_completed || false;

  const getTimeRemaining = () => {
    const now = new Date();
    if (type === 'daily') {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const hours = differenceInHours(endOfDay, now);
      return `${hours} ساعة متبقية`;
    } else {
      const endOfWeek = userProgress?.period_end 
        ? new Date(userProgress.period_end) 
        : addDays(now, 7);
      const days = differenceInDays(endOfWeek, now);
      return `${Math.max(days, 0)} أيام متبقية`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "p-5 rounded-2xl border transition-all relative overflow-hidden group",
        isCompleted 
          ? "bg-gradient-to-br from-success/10 to-success/5 border-success/30" 
          : "bg-gradient-to-br from-secondary/50 to-secondary/20 border-border hover:border-primary/40 hover:shadow-lg"
      )}
    >
      {/* Background glow */}
      <div 
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
        style={{ background: `radial-gradient(circle at top right, ${challenge.color}, transparent 70%)` }}
      />

      {/* Completed badge */}
      {isCompleted && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 left-3"
        >
          <Badge className="bg-success text-white gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            مكتمل
          </Badge>
        </motion.div>
      )}

      <div className="flex items-start gap-4 relative">
        <motion.div 
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg",
            isCompleted ? "opacity-60" : ""
          )}
          style={{ 
            backgroundColor: `${challenge.color}20`,
            boxShadow: `0 4px 20px ${challenge.color}30`
          }}
          whileHover={{ scale: 1.05 }}
        >
          {challenge.icon}
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className={cn(
              "font-bold text-lg",
              isCompleted && "line-through opacity-60"
            )}>
              {challenge.title_ar}
            </h4>
            <Badge 
              variant="outline" 
              className="shrink-0 text-sm font-bold gap-1"
              style={{ borderColor: challenge.color, color: challenge.color }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              +{challenge.reward_points}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {challenge.description_ar}
          </p>
          
          {!isCompleted ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {userProgress?.current_value || 0} / {challenge.target_value}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {getTimeRemaining()}
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-3"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(0)}% مكتمل</span>
                <span>
                  {challenge.challenge_type === 'orders' ? 'طلبات' : 
                   challenge.challenge_type === 'spending' ? 'إنفاق' : 'نقاط'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-success">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">
                حصلت على {userProgress?.points_awarded || challenge.reward_points} نقطة!
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ClientChallenges = () => {
  const { 
    loading, 
    getDailyChallenges, 
    getWeeklyChallenges,
    getCompletedChallengesCount,
    getTotalPointsEarned
  } = useChallenges();

  const dailyChallenges = getDailyChallenges();
  const weeklyChallenges = getWeeklyChallenges();
  const completedCount = getCompletedChallengesCount();
  const totalPoints = getTotalPointsEarned();

  const dailyCompleted = dailyChallenges.filter(c => c.userProgress?.is_completed).length;
  const weeklyCompleted = weeklyChallenges.filter(c => c.userProgress?.is_completed).length;

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">جاري تحميل التحديات...</p>
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
        >
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            التحديات اليومية والأسبوعية
          </h1>
          <p className="text-muted-foreground mt-2">
            أكمل التحديات واربح نقاط إضافية كل يوم!
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedCount}</p>
                    <p className="text-xs text-muted-foreground">تحدي مكتمل</p>
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
            <Card className="border-warning/20 bg-gradient-to-br from-warning/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">+{totalPoints}</p>
                    <p className="text-xs text-muted-foreground">نقطة مكتسبة</p>
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
            <Card className="border-success/20 bg-gradient-to-br from-success/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dailyCompleted}/{dailyChallenges.length}</p>
                    <p className="text-xs text-muted-foreground">يومي اليوم</p>
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
            <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{weeklyCompleted}/{weeklyChallenges.length}</p>
                    <p className="text-xs text-muted-foreground">أسبوعي هذا الأسبوع</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                  <span>أكمل طلباتك</span>
                </div>
                <Zap className="w-4 h-4 text-warning hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">2</div>
                  <span>يتم تحديث التقدم تلقائياً</span>
                </div>
                <Zap className="w-4 h-4 text-warning hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success font-bold">3</div>
                  <span>احصل على نقاط إضافية!</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Challenges Tabs */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md h-12">
            <TabsTrigger value="daily" className="gap-2 text-base">
              <Flame className="w-5 h-5" />
              التحديات اليومية
              <Badge variant="secondary" className="text-xs">{dailyChallenges.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2 text-base">
              <Trophy className="w-5 h-5" />
              التحديات الأسبوعية
              <Badge variant="secondary" className="text-xs">{weeklyChallenges.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        تحديات اليوم
                      </CardTitle>
                      <CardDescription>
                        تُجدد التحديات اليومية عند منتصف الليل
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(), 'd MMMM', { locale: ar })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dailyChallenges.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">لا توجد تحديات يومية حالياً</p>
                      <p className="text-sm">سيتم إضافة تحديات جديدة قريباً!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {dailyChallenges.map((challenge, index) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          userProgress={challenge.userProgress}
                          type="daily"
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="weekly">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        تحديات الأسبوع
                      </CardTitle>
                      <CardDescription>
                        تُجدد التحديات الأسبوعية كل يوم اثنين
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      الأسبوع الحالي
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weeklyChallenges.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">لا توجد تحديات أسبوعية حالياً</p>
                      <p className="text-sm">سيتم إضافة تحديات جديدة قريباً!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {weeklyChallenges.map((challenge, index) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          userProgress={challenge.userProgress}
                          type="weekly"
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">نصيحة للربح السريع</h4>
                  <p className="text-sm text-muted-foreground">
                    ركز على إكمال التحديات اليومية أولاً لأنها تتجدد كل يوم. 
                    التحديات الأسبوعية تعطيك نقاط أكثر لكنها تتطلب وقتاً أطول.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientChallenges;
