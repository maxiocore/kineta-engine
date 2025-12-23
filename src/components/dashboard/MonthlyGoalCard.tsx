import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  TrendingUp, 
  Settings2, 
  Award,
  Flame,
  Star,
  Gift,
  ChevronLeft,
  Sparkles,
  Trophy,
  Zap,
  Crown,
  Rocket
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MonthlyGoalCardProps {
  completedThisMonth: number;
  monthlyGoal: number;
  onEditGoal: () => void;
  currentStreak?: number;
  bonusPoints?: number;
  isGoalAchieved?: boolean;
}

const MonthlyGoalCard = ({
  completedThisMonth,
  monthlyGoal,
  onEditGoal,
  currentStreak = 0,
  bonusPoints = 0,
  isGoalAchieved = false
}: MonthlyGoalCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const progressPercentage = Math.min((completedThisMonth / monthlyGoal) * 100, 100);
  const remainingOrders = Math.max(monthlyGoal - completedThisMonth, 0);
  const exceededBy = Math.max(completedThisMonth - monthlyGoal, 0);
  
  // Calculate milestone rewards
  const milestones = [
    { threshold: 25, label: "بداية موفقة", icon: Star, color: "text-amber-500", points: 10 },
    { threshold: 50, label: "في منتصف الطريق", icon: Zap, color: "text-blue-500", points: 25 },
    { threshold: 75, label: "على وشك النجاح", icon: Flame, color: "text-orange-500", points: 50 },
    { threshold: 100, label: "هدف محقق!", icon: Trophy, color: "text-emerald-500", points: 100 },
  ];
  
  const currentMilestone = milestones.reduce((acc, milestone) => {
    if (progressPercentage >= milestone.threshold) return milestone;
    return acc;
  }, milestones[0]);
  
  const nextMilestone = milestones.find(m => m.threshold > progressPercentage);

  // Achievement badges
  const achievements = [
    { 
      id: "streak", 
      label: "سلسلة متتالية", 
      value: currentStreak,
      icon: Flame,
      color: "from-orange-500 to-red-500",
      show: currentStreak >= 2
    },
    { 
      id: "overachiever", 
      label: "تجاوز الهدف", 
      value: exceededBy,
      icon: Rocket,
      color: "from-purple-500 to-pink-500",
      show: exceededBy > 0
    },
    { 
      id: "bonus", 
      label: "نقاط إضافية", 
      value: bonusPoints,
      icon: Gift,
      color: "from-amber-500 to-yellow-500",
      show: bonusPoints > 0
    },
  ].filter(a => a.show);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="relative overflow-hidden border-border/30 bg-gradient-to-br from-card via-card to-card/95">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Gradient Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-primary/30 to-emerald-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-purple-500/20 to-pink-500/10 rounded-full blur-2xl"
          />
          
          {/* Celebration particles when goal achieved */}
          <AnimatePresence>
            {isGoalAchieved && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                      y: [0, -30, 0],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                    className="absolute"
                    style={{
                      left: `${15 + i * 15}%`,
                      top: `${20 + (i % 3) * 20}%`,
                    }}
                  >
                    <Sparkles className={cn(
                      "w-4 h-4",
                      i % 3 === 0 ? "text-amber-400" : i % 3 === 1 ? "text-emerald-400" : "text-primary"
                    )} />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </div>

        <CardContent className="relative z-10 p-4 sm:p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
            {/* Left: Icon and Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div
                animate={isGoalAchieved ? { 
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{ duration: 0.5, repeat: isGoalAchieved ? Infinity : 0, repeatDelay: 2 }}
                className={cn(
                  "relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg",
                  isGoalAchieved 
                    ? "bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500" 
                    : "bg-gradient-to-br from-primary via-primary to-purple-600"
                )}
              >
                {isGoalAchieved ? (
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                ) : (
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                )}
                
                {/* Pulse ring */}
                <motion.div
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn(
                    "absolute inset-0 rounded-2xl",
                    isGoalAchieved ? "bg-emerald-500" : "bg-primary"
                  )}
                />
              </motion.div>
              
              <div>
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  تقدم الطلبات هذا الشهر
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                  <span>{format(new Date(), "MMMM yyyy", { locale: ar })}</span>
                  {currentMilestone && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] sm:text-xs py-0 px-1.5 gap-1",
                        currentMilestone.color
                      )}
                    >
                      <currentMilestone.icon className="w-3 h-3" />
                      {currentMilestone.label}
                    </Badge>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Stats and Edit Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-left">
                <div className="flex items-baseline gap-0.5">
                  <motion.span 
                    key={completedThisMonth}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "text-2xl sm:text-3xl font-bold",
                      isGoalAchieved ? "text-emerald-500" : "text-primary"
                    )}
                  >
                    {completedThisMonth}
                  </motion.span>
                  <span className="text-sm sm:text-base text-muted-foreground font-medium">/{monthlyGoal}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">طلب مكتمل</p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGoal();
                }}
                className="h-9 sm:h-10 gap-1.5 bg-background/50 backdrop-blur-sm hover:bg-background"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">تعديل الهدف</span>
              </Button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3 mb-5">
            {/* Progress Bar */}
            <div className="relative">
              <Progress 
                value={progressPercentage} 
                className={cn(
                  "h-3 sm:h-4 bg-muted/30",
                  isGoalAchieved && "overflow-hidden"
                )}
              />
              
              {/* Milestone markers */}
              <div className="absolute inset-0 flex items-center">
                {milestones.slice(0, -1).map((milestone) => (
                  <div
                    key={milestone.threshold}
                    className="absolute h-full flex items-center"
                    style={{ left: `${milestone.threshold}%` }}
                  >
                    <div className={cn(
                      "w-0.5 h-full",
                      progressPercentage >= milestone.threshold 
                        ? "bg-white/30" 
                        : "bg-muted-foreground/20"
                    )} />
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Info */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isGoalAchieved ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 text-emerald-500"
                  >
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-medium">
                      🎉 تهانينا! حققت هدف الشهر
                      {exceededBy > 0 && ` (+${exceededBy} إضافي)`}
                    </span>
                  </motion.div>
                ) : (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    باقي <span className="font-bold text-foreground">{remainingOrders}</span> طلب للوصول للهدف
                  </span>
                )}
              </div>
              
              <motion.span 
                key={progressPercentage}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={cn(
                  "text-sm sm:text-base font-bold",
                  isGoalAchieved ? "text-emerald-500" : "text-primary"
                )}
              >
                {Math.round(progressPercentage)}%
              </motion.span>
            </div>
          </div>

          {/* Rewards & Achievements Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Next Milestone Card */}
            {nextMilestone && !isGoalAchieved && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br from-primary/20 to-purple-500/20"
                  )}>
                    <nextMilestone.icon className={cn("w-5 h-5", nextMilestone.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">الإنجاز التالي</p>
                    <p className="text-sm font-semibold text-foreground">{nextMilestone.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      عند {nextMilestone.threshold}% • +{nextMilestone.points} نقطة
                    </p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.div>
            )}

            {/* Current Rewards Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "p-3 sm:p-4 rounded-xl border border-border/50",
                isGoalAchieved 
                  ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10" 
                  : "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isGoalAchieved 
                    ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                    : "bg-gradient-to-br from-amber-500 to-orange-500"
                )}>
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">المكافأة الحالية</p>
                  <p className="text-sm font-semibold text-foreground">
                    {currentMilestone?.points || 0} نقطة مكتسبة
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isGoalAchieved ? "تم تحقيق الهدف! 🎯" : `${currentMilestone?.label}`}
                  </p>
                </div>
                <Award className={cn(
                  "w-5 h-5",
                  isGoalAchieved ? "text-emerald-500" : "text-amber-500"
                )} />
              </div>
            </motion.div>

            {/* Goal Achieved Card - Full Width */}
            {isGoalAchieved && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sm:col-span-2 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        مبروك! أنت بطل الشهر! 🏆
                      </p>
                      <p className="text-xs text-muted-foreground">
                        حافظ على هذا المستوى للحصول على مكافآت إضافية
                      </p>
                    </div>
                  </div>
                  {exceededBy >= 5 && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      <Rocket className="w-3 h-3 ml-1" />
                      +25 نقطة إضافية
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Achievement Badges */}
          <AnimatePresence>
            {achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-border/30"
              >
                <p className="text-xs text-muted-foreground mb-2">إنجازاتك</p>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "gap-1.5 py-1 px-2.5 bg-gradient-to-r",
                          achievement.color,
                          "text-white border-0"
                        )}
                      >
                        <achievement.icon className="w-3.5 h-3.5" />
                        <span>{achievement.label}</span>
                        <span className="font-bold">({achievement.value})</span>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MonthlyGoalCard;
