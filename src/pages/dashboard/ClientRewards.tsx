import { redeemPointsToWallet, newIdempotencyKey, walletErrorMessage } from "@/lib/walletPayments";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, Gift, TrendingUp, Sparkles, History, 
  ArrowDownRight, ArrowUpRight, Crown, Medal, Gem,
  CheckCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useRewardPoints } from "@/hooks/useRewardPoints";
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
  Sparkles
};

const ClientRewards = () => {
  const { user } = useAuth();
  const { userPoints, transactions, tiers, loading, getNextTier, getProgressToNextTier, refetch } = useRewardPoints();
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const currentTier = userPoints?.tier || tiers[0];
  const nextTier = getNextTier();
  const progressToNext = getProgressToNextTier();

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
      // Server-side atomic redemption: points deducted and wallet credited in one transaction
      const result = await redeemPointsToWallet(points, newIdempotencyKey());
      const balanceToAdd = Number(result.credit ?? points / 100);

      toast.success(`تم إضافة ${balanceToAdd.toFixed(2)} ر.س إلى رصيدك!`);
      setRedeemDialogOpen(false);
      setPointsToRedeem("");
      refetch();
    } catch (error) {
      console.error("Error redeeming points:", error);
      toast.error(walletErrorMessage(error));
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 md:space-y-6 px-1" dir="rtl">
        {/* Header - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-xl md:text-3xl font-bold mb-1 md:mb-2">
            نقاط المكافآت
          </h1>
          <p className="text-xs md:text-base text-muted-foreground">اكسب نقاط مع كل طلب واستبدلها برصيد</p>
        </motion.div>

        {/* Points Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
          {/* Main Points Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${currentTier?.color}20` }}
                    >
                      <Award className="w-8 h-8" style={{ color: currentTier?.color }} />
                    </div>
                    <div>
                      <Badge 
                        variant="outline"
                        className="mb-2"
                        style={{ 
                          borderColor: currentTier?.color,
                          color: currentTier?.color,
                          backgroundColor: `${currentTier?.color}10`
                        }}
                      >
                        <Sparkles className="w-3 h-3 ml-1" />
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
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">التقدم نحو {nextTier.name_ar}</span>
                      <span className="font-medium">{Math.round(progressToNext)}%</span>
                    </div>
                    <Progress value={progressToNext} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      تحتاج {(nextTier.min_points - (userPoints?.total_points || 0)).toLocaleString()} نقطة إضافية
                    </p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-secondary/30 rounded-xl p-4 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-2 text-success" />
                    <p className="text-xl font-bold">{userPoints?.total_points?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">إجمالي المكتسب</p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-4 text-center">
                    <Gift className="w-5 h-5 mx-auto mb-2 text-accent" />
                    <p className="text-xl font-bold">{userPoints?.redeemed_points?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">تم استبدالها</p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-4 text-center">
                    <Sparkles className="w-5 h-5 mx-auto mb-2 text-warning" />
                    <p className="text-xl font-bold">x{currentTier?.points_multiplier || 1}</p>
                    <p className="text-xs text-muted-foreground">مضاعف النقاط</p>
                  </div>
                </div>

                {/* Redeem Button */}
                <Button 
                  onClick={() => setRedeemDialogOpen(true)}
                  className="w-full mt-6 bg-gradient-primary hover:opacity-90 h-12"
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
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="w-5 h-5 text-warning" />
                  مزايا {currentTier?.name_ar || 'مستواك'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Structured Benefits */}
                {currentTier?.benefits && typeof currentTier.benefits === 'object' && !Array.isArray(currentTier.benefits) && (
                  <>
                    {(currentTier.benefits as any).discount_percentage > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Gift className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-sm font-medium">خصم {(currentTier.benefits as any).discount_percentage}% على جميع الطلبات</span>
                      </div>
                    )}
                    {(currentTier.benefits as any).priority_support && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">أولوية في الدعم الفني</span>
                      </div>
                    )}
                    {(currentTier.benefits as any).exclusive_services && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">وصول لخدمات حصرية</span>
                      </div>
                    )}
                    {(currentTier.benefits as any).free_refills && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">إعادة تعبئة مجانية</span>
                      </div>
                    )}
                    {(currentTier.benefits as any).bonus_points > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">+{(currentTier.benefits as any).bonus_points} نقطة إضافية لكل طلب</span>
                      </div>
                    )}
                    {((currentTier.benefits as any).custom_benefits || []).map((benefit: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </>
                )}
                {/* Legacy array format */}
                {currentTier?.benefits && Array.isArray(currentTier.benefits) && currentTier.benefits.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs: Tiers & History */}
        <Tabs defaultValue="tiers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tiers">مستويات المكافآت</TabsTrigger>
            <TabsTrigger value="history">سجل النقاط</TabsTrigger>
          </TabsList>

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
                      "relative overflow-hidden transition-all",
                      isCurrentTier && "ring-2 ring-offset-2 ring-primary",
                      !isUnlocked && "opacity-60"
                    )}
                    style={{ 
                      borderColor: isCurrentTier ? tier.color : undefined
                    }}
                    >
                      {isCurrentTier && (
                        <div className="absolute top-2 left-2">
                          <Badge className="text-[10px]" style={{ backgroundColor: tier.color }}>
                            مستواك
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-4 pt-6 text-center">
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                          style={{ backgroundColor: `${tier.color}20` }}
                        >
                          <TierIcon className="w-7 h-7" style={{ color: tier.color }} />
                        </div>
                        <h3 className="font-bold text-lg mb-1">{tier.name_ar}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {tier.min_points.toLocaleString()}+ نقطة
                        </p>
                        <Badge variant="outline" className="mb-3">
                          x{tier.points_multiplier} مضاعف
                        </Badge>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {tier.benefits && typeof tier.benefits === 'object' && !Array.isArray(tier.benefits) && (
                            <>
                              {(tier.benefits as any).discount_percentage > 0 && (
                                <p className="text-amber-500 font-medium">خصم {(tier.benefits as any).discount_percentage}%</p>
                              )}
                              {(tier.benefits as any).priority_support && <p>أولوية دعم</p>}
                              {(tier.benefits as any).free_refills && <p>إعادة تعبئة مجانية</p>}
                            </>
                          )}
                          {tier.benefits && Array.isArray(tier.benefits) && tier.benefits.slice(0, 2).map((benefit: string, i: number) => (
                            <p key={i}>{benefit}</p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  سجل المعاملات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد معاملات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {transactions.map((transaction, index) => {
                        const Icon = getTransactionIcon(transaction.type);
                        return (
                          <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
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
                              "font-bold",
                              transaction.points > 0 ? "text-success" : "text-accent"
                            )}>
                              {transaction.points > 0 ? "+" : ""}{transaction.points.toLocaleString()}
                            </span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
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
              <div className="text-center p-4 bg-secondary/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">رصيدك من النقاط</p>
                <p className="text-3xl font-bold">{userPoints?.available_points?.toLocaleString() || 0}</p>
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
                />
              </div>

              {pointsToRedeem && parseInt(pointsToRedeem) >= 100 && (
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-1">ستحصل على</p>
                  <p className="text-2xl font-bold text-success">
                    {(parseInt(pointsToRedeem) / 100).toFixed(2)} ر.س
                  </p>
                  <p className="text-xs text-muted-foreground">رصيد في حسابك</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {[100, 500, 1000].map((amount) => (
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
                className="bg-gradient-primary"
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
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientRewards;
