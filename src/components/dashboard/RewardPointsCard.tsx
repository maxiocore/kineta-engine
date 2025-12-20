import { motion } from "framer-motion";
import { Award, Gift, TrendingUp, Sparkles, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useRewardPoints } from "@/hooks/useRewardPoints";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const RewardPointsCard = () => {
  const navigate = useNavigate();
  const { userPoints, tiers, loading, getNextTier, getProgressToNextTier } = useRewardPoints();

  if (loading) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="animate-pulse space-y-3 sm:space-y-4">
            <div className="h-6 sm:h-8 bg-secondary/50 rounded w-1/3" />
            <div className="h-12 sm:h-16 bg-secondary/50 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTier = userPoints?.tier || tiers[0];
  const nextTier = getNextTier();
  const progressToNext = getProgressToNextTier();

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass border-border/50 overflow-hidden h-full">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${currentTier?.color || '#6366f1'} 0%, transparent 50%)` 
          }}
        />
        <CardHeader className="pb-1 sm:pb-2 relative px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex flex-row-reverse items-center justify-between">
            <CardTitle className="font-display flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
              <div 
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${currentTier?.color}20` }}
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" style={{ color: currentTier?.color }} />
              </div>
              نقاط المكافآت
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/rewards')}
              className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
            >
              عرض الكل
              <ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 md:space-y-4 relative px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          {/* Points Display */}
          <div className="flex flex-row-reverse items-center justify-between">
            <div>
              <motion.p 
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {userPoints?.available_points?.toLocaleString() || 0}
              </motion.p>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">نقطة متاحة</p>
            </div>
            <div className="text-left">
              <Badge 
                variant="outline"
                className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs md:text-sm font-medium"
                style={{ 
                  borderColor: currentTier?.color,
                  color: currentTier?.color,
                  backgroundColor: `${currentTier?.color}10`
                }}
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" />
                {currentTier?.name_ar || 'برونزي'}
              </Badge>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                <span>التقدم نحو {nextTier.name_ar}</span>
                <span>{Math.round(progressToNext)}%</span>
              </div>
              <Progress 
                value={progressToNext} 
                className="h-1.5 sm:h-2"
              />
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                {nextTier.min_points - (userPoints?.total_points || 0)} نقطة للوصول للمستوى التالي
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 pt-1 sm:pt-2">
            <div className="bg-secondary/30 rounded-md sm:rounded-lg p-2 sm:p-2.5 md:p-3 text-center">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mx-auto mb-0.5 sm:mb-1 text-success" />
              <p className="text-sm sm:text-base md:text-lg font-bold">{userPoints?.total_points?.toLocaleString() || 0}</p>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground">إجمالي المكتسب</p>
            </div>
            <div className="bg-secondary/30 rounded-md sm:rounded-lg p-2 sm:p-2.5 md:p-3 text-center">
              <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mx-auto mb-0.5 sm:mb-1 text-accent" />
              <p className="text-sm sm:text-base md:text-lg font-bold">{userPoints?.redeemed_points?.toLocaleString() || 0}</p>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground">تم استبدالها</p>
            </div>
          </div>

          {/* Redeem Button */}
          <Button 
            onClick={() => navigate('/dashboard/rewards')}
            className="w-full bg-gradient-primary hover:opacity-90 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
            disabled={!userPoints?.available_points || userPoints.available_points < 100}
          >
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            استبدال النقاط
          </Button>
          <p className="text-[8px] sm:text-[9px] md:text-[10px] text-center text-muted-foreground">
            100 نقطة = 1 ر.س رصيد
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RewardPointsCard;
