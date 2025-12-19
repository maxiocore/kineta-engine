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
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary/50 rounded w-1/3" />
            <div className="h-16 bg-secondary/50 rounded" />
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass border-border/50 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${currentTier?.color || '#6366f1'} 0%, transparent 50%)` 
          }}
        />
        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2 text-base sm:text-lg">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${currentTier?.color}20` }}
              >
                <Award className="w-5 h-5" style={{ color: currentTier?.color }} />
              </div>
              نقاط المكافآت
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/rewards')}
              className="gap-1 text-xs"
            >
              عرض الكل
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Points Display */}
          <div className="flex items-center justify-between">
            <div>
              <motion.p 
                className="text-3xl sm:text-4xl font-bold"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {userPoints?.available_points?.toLocaleString() || 0}
              </motion.p>
              <p className="text-xs sm:text-sm text-muted-foreground">نقطة متاحة</p>
            </div>
            <div className="text-left">
              <Badge 
                variant="outline"
                className="px-3 py-1 text-sm font-medium"
                style={{ 
                  borderColor: currentTier?.color,
                  color: currentTier?.color,
                  backgroundColor: `${currentTier?.color}10`
                }}
              >
                <Sparkles className="w-3 h-3 ml-1" />
                {currentTier?.name_ar || 'برونزي'}
              </Badge>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>التقدم نحو {nextTier.name_ar}</span>
                <span>{Math.round(progressToNext)}%</span>
              </div>
              <Progress 
                value={progressToNext} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {nextTier.min_points - (userPoints?.total_points || 0)} نقطة للوصول للمستوى التالي
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-success" />
              <p className="text-lg font-bold">{userPoints?.total_points?.toLocaleString() || 0}</p>
              <p className="text-[10px] text-muted-foreground">إجمالي المكتسب</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <Gift className="w-4 h-4 mx-auto mb-1 text-accent" />
              <p className="text-lg font-bold">{userPoints?.redeemed_points?.toLocaleString() || 0}</p>
              <p className="text-[10px] text-muted-foreground">تم استبدالها</p>
            </div>
          </div>

          {/* Redeem Button */}
          <Button 
            onClick={() => navigate('/dashboard/rewards')}
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={!userPoints?.available_points || userPoints.available_points < 100}
          >
            <Gift className="w-4 h-4 ml-2" />
            استبدال النقاط
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            100 نقطة = 1 ر.س رصيد
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RewardPointsCard;
