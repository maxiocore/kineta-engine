import { motion } from "framer-motion";
import { Target, Flame, Trophy, Clock, CheckCircle, ChevronLeft, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChallenges } from "@/hooks/useChallenges";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { differenceInHours, differenceInDays, format } from "date-fns";
import { ar } from "date-fns/locale";

interface ChallengeCardProps {
  challenge: any;
  userProgress: any;
  type: 'daily' | 'weekly';
}

const ChallengeCard = ({ challenge, userProgress, type }: ChallengeCardProps) => {
  const progress = userProgress 
    ? Math.min((userProgress.current_value / userProgress.target_value) * 100, 100)
    : 0;
  const isCompleted = userProgress?.is_completed || false;

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    if (type === 'daily') {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const hours = differenceInHours(endOfDay, now);
      return `${hours} ساعة`;
    } else {
      const endOfWeek = new Date(userProgress?.period_end || now);
      const days = differenceInDays(endOfWeek, now);
      return `${days} أيام`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-4 rounded-xl border transition-all relative overflow-hidden",
        isCompleted 
          ? "bg-success/10 border-success/30" 
          : "bg-secondary/30 border-border hover:border-primary/30"
      )}
    >
      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute top-2 left-2">
          <Badge className="bg-success text-white text-[10px]">
            <CheckCircle className="w-3 h-3 ml-1" />
            مكتمل
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div 
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
            isCompleted ? "opacity-50" : ""
          )}
          style={{ backgroundColor: `${challenge.color}20` }}
        >
          {challenge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className={cn(
              "font-semibold text-sm truncate",
              isCompleted && "line-through opacity-60"
            )}>
              {challenge.title_ar}
            </h4>
            <Badge 
              variant="outline" 
              className="shrink-0 text-[10px]"
              style={{ borderColor: challenge.color, color: challenge.color }}
            >
              +{challenge.reward_points}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {challenge.description_ar}
          </p>
          
          {!isCompleted && (
            <>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{userProgress?.current_value || 0} / {challenge.target_value}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getTimeRemaining()}
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-1.5"
              />
            </>
          )}

          {isCompleted && userProgress?.completed_at && (
            <p className="text-[10px] text-success flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              أكملت في {format(new Date(userProgress.completed_at), 'HH:mm', { locale: ar })}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ChallengesWidget = () => {
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-secondary/50 rounded w-1/3" />
            <div className="h-20 bg-secondary/50 rounded" />
            <div className="h-20 bg-secondary/50 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="pb-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              التحديات اليومية
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/challenges')}
              className="gap-1 text-xs h-8"
            >
              عرض الكل
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-3 mt-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Trophy className="w-3 h-3 text-warning" />
              {completedCount} مكتمل
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              +{totalPoints} نقطة
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 mb-3">
              <TabsTrigger value="daily" className="text-xs gap-1">
                <Flame className="w-3.5 h-3.5" />
                يومي ({dailyChallenges.length})
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs gap-1">
                <Trophy className="w-3.5 h-3.5" />
                أسبوعي ({weeklyChallenges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-0 space-y-2">
              {dailyChallenges.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">لا توجد تحديات يومية</p>
                </div>
              ) : (
                dailyChallenges.slice(0, 3).map((challenge, index) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userProgress={challenge.userProgress}
                    type="daily"
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="weekly" className="mt-0 space-y-2">
              {weeklyChallenges.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">لا توجد تحديات أسبوعية</p>
                </div>
              ) : (
                weeklyChallenges.slice(0, 3).map((challenge, index) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userProgress={challenge.userProgress}
                    type="weekly"
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ChallengesWidget;
