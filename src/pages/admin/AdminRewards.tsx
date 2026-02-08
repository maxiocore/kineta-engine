import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Star,
  Gift,
  TrendingUp,
  Users,
  Sparkles,
  BarChart3,
  Send,
  Search,
  User,
  Loader2,
  Minus,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import PointsTransactionsLog from "@/components/admin/PointsTransactionsLog";
import { sendPointsEarnedSms, sendPointsDeductedSms } from "@/utils/sendRewardSms";

interface TierBenefits {
  discount_percentage?: number;
  priority_support?: boolean;
  exclusive_services?: boolean;
  free_refills?: boolean;
  bonus_points?: number;
  custom_benefits?: string[];
}

interface RewardTier {
  id: string;
  name: string;
  name_ar: string;
  min_points: number;
  points_multiplier: number;
  icon: string;
  color: string;
  benefits: TierBenefits;
  is_active: boolean;
}

const iconOptions = ["Star", "Award", "Gift", "Crown", "Gem", "Trophy"];
const colorOptions = [
  "#6366f1",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
];

const AdminRewards = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [deductDialogOpen, setDeductDialogOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; full_name: string | null } | null>(null);
  const [pointsToGrant, setPointsToGrant] = useState("");
  const [pointsToDeduct, setPointsToDeduct] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [deductReason, setDeductReason] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userResults, setUserResults] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    min_points: 0,
    points_multiplier: 1,
    icon: "Star",
    color: "#6366f1",
    benefits: {
      discount_percentage: 0,
      priority_support: false,
      exclusive_services: false,
      free_refills: false,
      bonus_points: 0,
      custom_benefits: [] as string[],
    } as TierBenefits,
    is_active: true,
  });
  const [newBenefit, setNewBenefit] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["reward-tiers-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_tiers")
        .select("*")
        .order("min_points", { ascending: true });

      if (error) throw error;
      return data as RewardTier[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["rewards-stats"],
    queryFn: async () => {
      const { data: userPoints } = await supabase
        .from("user_points")
        .select("total_points, available_points");

      const totalPoints =
        userPoints?.reduce((sum, u) => sum + u.total_points, 0) || 0;
      const availablePoints =
        userPoints?.reduce((sum, u) => sum + u.available_points, 0) || 0;
      const totalUsers = userPoints?.length || 0;

      const { data: transactions } = await supabase
        .from("points_transactions")
        .select("points, type");

      const earnedPoints =
        transactions
          ?.filter((t) => t.type === "earned")
          .reduce((sum, t) => sum + t.points, 0) || 0;
      const redeemedPoints =
        transactions
          ?.filter((t) => t.type === "redeemed")
          .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      return {
        totalPoints,
        availablePoints,
        totalUsers,
        earnedPoints,
        redeemedPoints,
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const benefitsJson = JSON.parse(JSON.stringify(data.benefits));
      if (editingTier) {
        const { error } = await supabase
          .from("reward_tiers")
          .update({
            name: data.name,
            name_ar: data.name_ar,
            min_points: data.min_points,
            points_multiplier: data.points_multiplier,
            icon: data.icon,
            color: data.color,
            benefits: benefitsJson,
            is_active: data.is_active,
          })
          .eq("id", editingTier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reward_tiers").insert([{
          name: data.name,
          name_ar: data.name_ar,
          min_points: data.min_points,
          points_multiplier: data.points_multiplier,
          icon: data.icon,
          color: data.color,
          benefits: benefitsJson,
          is_active: data.is_active,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward-tiers-admin"] });
      toast({
        title: editingTier ? "تم التحديث" : "تمت الإضافة",
        description: editingTier
          ? "تم تحديث مستوى المكافأة بنجاح"
          : "تمت إضافة مستوى المكافأة بنجاح",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reward_tiers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward-tiers-admin"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف مستوى المكافأة بنجاح",
      });
      setDeleteDialogOpen(false);
      setTierToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Grant points mutation
  const grantPointsMutation = useMutation({
    mutationFn: async ({ userId, points, reason }: { userId: string; points: number; reason: string }) => {
      // Insert transaction
      const { error: transactionError } = await supabase
        .from("points_transactions")
        .insert({
          user_id: userId,
          points: points,
          type: "bonus",
          description: `Admin granted: ${reason}`,
          description_ar: `منحة من الإدارة: ${reason}`
        });

      if (transactionError) throw transactionError;

      // Update user points
      const { data: existingPoints } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingPoints) {
        const { error: updateError } = await supabase
          .from("user_points")
          .update({
            total_points: existingPoints.total_points + points,
            available_points: existingPoints.available_points + points,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_points")
          .insert({
            user_id: userId,
            total_points: points,
            available_points: points
          });

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rewards-stats"] });
      // Send SMS notification
      sendPointsEarnedSms(variables.userId, variables.points, variables.reason);
      toast({
        title: "تم منح النقاط",
        description: `تم منح ${pointsToGrant} نقطة بنجاح`,
      });
      handleCloseGrantDialog();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء منح النقاط",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Search users
  const handleSearchUsers = async (search: string) => {
    setUserSearch(search);
    if (search.length < 2) {
      setUserResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
        .limit(10);

      if (!error && data) {
        setUserResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleCloseGrantDialog = () => {
    setGrantDialogOpen(false);
    setSelectedUser(null);
    setPointsToGrant("");
    setGrantReason("");
    setUserSearch("");
    setUserResults([]);
  };

  const handleCloseDeductDialog = () => {
    setDeductDialogOpen(false);
    setSelectedUser(null);
    setPointsToDeduct("");
    setDeductReason("");
    setUserSearch("");
    setUserResults([]);
  };

  // Deduct points mutation
  const deductPointsMutation = useMutation({
    mutationFn: async ({ userId, points, reason }: { userId: string; points: number; reason: string }) => {
      // Check if user has enough points
      const { data: existingPoints } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingPoints || existingPoints.available_points < points) {
        throw new Error("المستخدم ليس لديه نقاط كافية للخصم");
      }

      // Insert transaction (negative points)
      const { error: transactionError } = await supabase
        .from("points_transactions")
        .insert({
          user_id: userId,
          points: -points,
          type: "deducted",
          description: `Admin deducted: ${reason}`,
          description_ar: `خصم من الإدارة: ${reason}`
        });

      if (transactionError) throw transactionError;

      // Update user points
      const { error: updateError } = await supabase
        .from("user_points")
        .update({
          available_points: existingPoints.available_points - points,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rewards-stats"] });
      // Send SMS notification
      sendPointsDeductedSms(variables.userId, variables.points, variables.reason);
      toast({
        title: "تم خصم النقاط",
        description: `تم خصم ${pointsToDeduct} نقطة بنجاح`,
      });
      handleCloseDeductDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء خصم النقاط",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleGrantPoints = () => {
    const points = parseInt(pointsToGrant);
    if (!selectedUser || isNaN(points) || points <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مستخدم وإدخال عدد نقاط صحيح",
        variant: "destructive",
      });
      return;
    }
    grantPointsMutation.mutate({
      userId: selectedUser.id,
      points,
      reason: grantReason || "منحة إدارية"
    });
  };

  const handleDeductPoints = () => {
    const points = parseInt(pointsToDeduct);
    if (!selectedUser || isNaN(points) || points <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مستخدم وإدخال عدد نقاط صحيح",
        variant: "destructive",
      });
      return;
    }
    deductPointsMutation.mutate({
      userId: selectedUser.id,
      points,
      reason: deductReason || "خصم إداري"
    });
  };

  const handleOpenDialog = (tier?: RewardTier) => {
    if (tier) {
      setEditingTier(tier);
      const tierBenefits = tier.benefits as TierBenefits || {};
      setFormData({
        name: tier.name,
        name_ar: tier.name_ar,
        min_points: tier.min_points,
        points_multiplier: tier.points_multiplier,
        icon: tier.icon,
        color: tier.color,
        benefits: {
          discount_percentage: tierBenefits.discount_percentage || 0,
          priority_support: tierBenefits.priority_support || false,
          exclusive_services: tierBenefits.exclusive_services || false,
          free_refills: tierBenefits.free_refills || false,
          bonus_points: tierBenefits.bonus_points || 0,
          custom_benefits: tierBenefits.custom_benefits || [],
        },
        is_active: tier.is_active,
      });
    } else {
      setEditingTier(null);
      setFormData({
        name: "",
        name_ar: "",
        min_points: 0,
        points_multiplier: 1,
        icon: "Star",
        color: "#6366f1",
        benefits: {
          discount_percentage: 0,
          priority_support: false,
          exclusive_services: false,
          free_refills: false,
          bonus_points: 0,
          custom_benefits: [],
        },
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTier(null);
    setNewBenefit("");
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: {
          ...formData.benefits,
          custom_benefits: [...(formData.benefits.custom_benefits || []), newBenefit.trim()],
        },
      });
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: {
        ...formData.benefits,
        custom_benefits: (formData.benefits.custom_benefits || []).filter((_, i) => i !== index),
      },
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.name_ar) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Award":
        return Award;
      case "Gift":
        return Gift;
      case "Star":
      default:
        return Star;
    }
  };

  return (
    <AdminDashboardLayout>
      <motion.div
        className="space-y-4 md:space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap order-1 sm:order-none">
            <Button
              variant="outline"
              onClick={() => setGrantDialogOpen(true)}
              size="sm"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">منح نقاط</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeductDialogOpen(true)}
              size="sm"
              className="gap-1.5 text-xs sm:text-sm text-destructive hover:text-destructive"
            >
              <Minus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خصم نقاط</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/rewards/reports")}
              size="sm"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">التقارير</span>
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              size="sm"
              className="gap-1.5 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إضافة مستوى</span>
            </Button>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              نظام المكافآت
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              إدارة مستويات المكافآت والنقاط
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي النقاط</p>
                  <p className="text-xl font-bold">
                    {stats?.totalPoints.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نقاط متاحة</p>
                  <p className="text-xl font-bold">
                    {stats?.availablePoints.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نقاط مستبدلة</p>
                  <p className="text-xl font-bold">
                    {stats?.redeemedPoints.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مستخدمين نشطين</p>
                  <p className="text-xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tiers Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {tiers?.map((tier, index) => {
                const IconComponent = getIconComponent(tier.icon);
                return (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                      style={{
                        borderColor: `${tier.color}30`,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-5"
                        style={{
                          background: `linear-gradient(135deg, ${tier.color}, transparent)`,
                        }}
                      />
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${tier.color}20` }}
                            >
                              <IconComponent
                                className="w-6 h-6"
                                style={{ color: tier.color }}
                              />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {tier.name_ar}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {tier.name}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={tier.is_active ? "default" : "secondary"}
                          >
                            {tier.is_active ? "نشط" : "معطل"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            الحد الأدنى:
                          </span>
                          <span className="font-medium">
                            {tier.min_points.toLocaleString()} نقطة
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            مضاعف النقاط:
                          </span>
                          <span className="font-medium">
                            {tier.points_multiplier}x
                          </span>
                        </div>

                        {/* Show tier benefits */}
                        {tier.benefits && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">
                              المميزات:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(tier.benefits as TierBenefits).discount_percentage && (tier.benefits as TierBenefits).discount_percentage! > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  خصم {(tier.benefits as TierBenefits).discount_percentage}%
                                </Badge>
                              )}
                              {(tier.benefits as TierBenefits).priority_support && (
                                <Badge variant="outline" className="text-xs">
                                  دعم أولوية
                                </Badge>
                              )}
                              {(tier.benefits as TierBenefits).free_refills && (
                                <Badge variant="outline" className="text-xs">
                                  إعادة تعبئة مجانية
                                </Badge>
                              )}
                              {((tier.benefits as TierBenefits).custom_benefits || []).slice(0, 1).map((benefit, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleOpenDialog(tier)}
                          >
                            <Edit2 className="w-3 h-3 ml-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setTierToDelete(tier.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Points Transactions Log */}
        <PointsTransactionsLog />

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTier ? "تعديل مستوى" : "إضافة مستوى جديد"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم (English)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, name_ar: e.target.value })
                    }
                    placeholder="ذهبي"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأدنى من النقاط</Label>
                  <Input
                    type="number"
                    value={formData.min_points}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_points: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>مضاعف النقاط</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.points_multiplier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        points_multiplier: parseFloat(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>اللون</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              {/* Tier Benefits Section */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">مكافآت المستوى</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">نسبة الخصم التلقائي (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.benefits.discount_percentage || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          benefits: {
                            ...formData.benefits,
                            discount_percentage: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">نقاط إضافية لكل طلب</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.benefits.bonus_points || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          benefits: {
                            ...formData.benefits,
                            bonus_points: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">أولوية في الدعم الفني</Label>
                    <Switch
                      checked={formData.benefits.priority_support || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          benefits: {
                            ...formData.benefits,
                            priority_support: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">خدمات حصرية</Label>
                    <Switch
                      checked={formData.benefits.exclusive_services || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          benefits: {
                            ...formData.benefits,
                            exclusive_services: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">إعادة تعبئة مجانية</Label>
                    <Switch
                      checked={formData.benefits.free_refills || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          benefits: {
                            ...formData.benefits,
                            free_refills: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Custom Benefits */}
              <div className="space-y-2">
                <Label>مميزات إضافية</Label>
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="أضف ميزة..."
                    onKeyPress={(e) => e.key === "Enter" && handleAddBenefit()}
                  />
                  <Button type="button" onClick={handleAddBenefit} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.benefits.custom_benefits || []).map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {benefit}
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(index)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>نشط</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                إلغاء
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-orange-500"
              >
                {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="حذف مستوى المكافأة"
          description="هل أنت متأكد من حذف هذا المستوى؟ لا يمكن التراجع عن هذا الإجراء."
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          onConfirm={() => tierToDelete && deleteMutation.mutate(tierToDelete)}
        />

        {/* Grant Points Dialog */}
        <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                منح نقاط لمستخدم
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* User Search */}
              <div className="space-y-2">
                <Label>البحث عن مستخدم</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="ابحث بالبريد الإلكتروني أو الاسم..."
                    className="pr-10"
                  />
                </div>

                {/* Search Results */}
                {userSearch.length >= 2 && (
                  <div className="border rounded-lg overflow-hidden">
                    {searchingUsers ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                      </div>
                    ) : userResults.length > 0 ? (
                      <ScrollArea className="max-h-48">
                        {userResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setUserSearch("");
                              setUserResults([]);
                            }}
                            className="w-full p-3 text-right hover:bg-muted/50 transition-colors flex items-center gap-3 border-b last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{u.full_name || "بدون اسم"}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </ScrollArea>
                    ) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        لم يتم العثور على نتائج
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Selected User */}
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.full_name || "بدون اسم"}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                    className="text-destructive hover:text-destructive"
                  >
                    إزالة
                  </Button>
                </motion.div>
              )}

              {/* Points Amount */}
              <div className="space-y-2">
                <Label>عدد النقاط</Label>
                <Input
                  type="number"
                  min={1}
                  value={pointsToGrant}
                  onChange={(e) => setPointsToGrant(e.target.value)}
                  placeholder="مثال: 500"
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>السبب (اختياري)</Label>
                <Input
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="مثال: مكافأة ولاء العميل"
                />
              </div>

              {/* Preview */}
              {selectedUser && pointsToGrant && parseInt(pointsToGrant) > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg bg-success/10 border border-success/20 text-center"
                >
                  <p className="text-sm text-muted-foreground">سيتم منح</p>
                  <p className="text-2xl font-bold text-success">
                    {parseInt(pointsToGrant).toLocaleString()} نقطة
                  </p>
                  <p className="text-xs text-muted-foreground">
                    = {(parseInt(pointsToGrant) / 100).toFixed(2)} ر.س
                  </p>
                </motion.div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseGrantDialog}>
                إلغاء
              </Button>
              <Button
                onClick={handleGrantPoints}
                disabled={!selectedUser || !pointsToGrant || grantPointsMutation.isPending}
                className="bg-gradient-to-r from-primary to-accent gap-2"
              >
                {grantPointsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري المنح...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    منح النقاط
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deduct Points Dialog */}
        <Dialog open={deductDialogOpen} onOpenChange={setDeductDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Minus className="w-5 h-5 text-destructive" />
                خصم نقاط من مستخدم
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* User Search */}
              <div className="space-y-2">
                <Label>البحث عن مستخدم</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="ابحث بالبريد الإلكتروني أو الاسم..."
                    className="pr-10"
                  />
                </div>

                {/* Search Results */}
                {userSearch.length >= 2 && (
                  <div className="border rounded-lg overflow-hidden">
                    {searchingUsers ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                      </div>
                    ) : userResults.length > 0 ? (
                      <ScrollArea className="max-h-48">
                        {userResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setUserSearch("");
                              setUserResults([]);
                            }}
                            className="w-full p-3 text-right hover:bg-muted/50 transition-colors flex items-center gap-3 border-b last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{u.full_name || "بدون اسم"}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </ScrollArea>
                    ) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        لم يتم العثور على نتائج
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Selected User */}
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.full_name || "بدون اسم"}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                    className="text-destructive hover:text-destructive"
                  >
                    إزالة
                  </Button>
                </motion.div>
              )}

              {/* Points Amount */}
              <div className="space-y-2">
                <Label>عدد النقاط للخصم</Label>
                <Input
                  type="number"
                  min={1}
                  value={pointsToDeduct}
                  onChange={(e) => setPointsToDeduct(e.target.value)}
                  placeholder="مثال: 100"
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>السبب</Label>
                <Input
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  placeholder="مثال: إلغاء طلب، استرداد..."
                />
              </div>

              {/* Preview */}
              {selectedUser && pointsToDeduct && parseInt(pointsToDeduct) > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center"
                >
                  <p className="text-sm text-muted-foreground">سيتم خصم</p>
                  <p className="text-2xl font-bold text-destructive">
                    -{parseInt(pointsToDeduct).toLocaleString()} نقطة
                  </p>
                  <p className="text-xs text-muted-foreground">
                    = {(parseInt(pointsToDeduct) / 100).toFixed(2)} ر.س
                  </p>
                </motion.div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDeductDialog}>
                إلغاء
              </Button>
              <Button
                onClick={handleDeductPoints}
                disabled={!selectedUser || !pointsToDeduct || deductPointsMutation.isPending}
                variant="destructive"
                className="gap-2"
              >
                {deductPointsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الخصم...
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4" />
                    خصم النقاط
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminRewards;
