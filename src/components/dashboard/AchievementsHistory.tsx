import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Calendar, Star, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface Achievement {
  id: string;
  month: string;
  monthly_goal: number;
  completed_orders: number;
  goal_achieved: boolean;
  achieved_at: string | null;
  bonus_points_awarded: number;
  exceeded_by: number;
}

interface AchievementsHistoryProps {
  achievements: Achievement[];
  loading?: boolean;
}

const AchievementsHistory = ({ achievements, loading }: AchievementsHistoryProps) => {
  if (loading) {
    return (
      <Card dir="rtl" className="card-elevated border-border/30">
        <CardHeader className="py-2.5 sm:py-4 px-3 sm:px-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            سجل الإنجازات
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="animate-pulse space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 sm:h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card dir="rtl" className="card-elevated border-border/30">
        <CardHeader className="py-2.5 sm:py-4 px-3 sm:px-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            سجل الإنجازات
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="text-center py-6 sm:py-8">
            <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-xs sm:text-sm">لا توجد إنجازات بعد</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              أكمل طلباتك لتحقيق أهدافك الشهرية
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const achievedCount = achievements.filter((a) => a.goal_achieved).length;
  const totalPoints = achievements.reduce(
    (sum, a) => sum + (a.bonus_points_awarded || 0),
    0
  );

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="card-elevated border-border/30">
        <CardHeader className="py-2.5 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              سجل الإنجازات
            </CardTitle>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {achievedCount} هدف
              </Badge>
              <Badge variant="outline" className="gap-1 text-primary text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                +{totalPoints} نقطة
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 sm:px-6">
          <div className="space-y-1.5 sm:space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pl-1">
            {achievements.map((achievement, index) => {
              const monthDate = parseISO(achievement.month);
              const progressPercent = Math.min(
                (achievement.completed_orders / achievement.monthly_goal) * 100,
                100
              );

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-2 sm:p-3 rounded-lg border transition-colors ${
                    achievement.goal_achieved
                      ? "bg-success/5 border-success/20"
                      : "bg-secondary/30 border-border/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      <span className="font-medium text-xs sm:text-sm">
                        {format(monthDate, "MMMM yyyy", { locale: ar })}
                      </span>
                    </div>
                    {achievement.goal_achieved ? (
                      <Badge className="bg-success/20 text-success border-success/30 gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 py-0.5">
                        <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        محقق
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[10px] sm:text-xs px-1.5 py-0.5">
                        غير مكتمل
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] sm:text-sm">
                    <span className="text-muted-foreground">
                      {achievement.completed_orders} / {achievement.monthly_goal} طلب
                    </span>
                    <span
                      className={`font-medium ${
                        achievement.goal_achieved ? "text-success" : ""
                      }`}
                    >
                      {Math.round(progressPercent)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-1.5 sm:mt-2 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        achievement.goal_achieved
                          ? "bg-gradient-to-r from-success to-emerald-400"
                          : "bg-primary/50"
                      }`}
                    />
                  </div>

                  {achievement.goal_achieved && (
                    <div className="mt-1.5 sm:mt-2 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                      {achievement.bonus_points_awarded > 0 && (
                        <span className="text-primary flex items-center gap-0.5 sm:gap-1">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />+
                          {achievement.bonus_points_awarded} نقطة
                        </span>
                      )}
                      {achievement.exceeded_by > 0 && (
                        <span className="text-success flex items-center gap-0.5 sm:gap-1">
                          <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          تجاوز بـ {achievement.exceeded_by}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AchievementsHistory;
