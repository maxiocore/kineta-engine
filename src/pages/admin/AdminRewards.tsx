import { useState } from "react";
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
} from "lucide-react";
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

interface RewardTier {
  id: string;
  name: string;
  name_ar: string;
  min_points: number;
  points_multiplier: number;
  icon: string;
  color: string;
  benefits: string[];
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    min_points: 0,
    points_multiplier: 1,
    icon: "Star",
    color: "#6366f1",
    benefits: [] as string[],
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
            benefits: data.benefits,
            is_active: data.is_active,
          })
          .eq("id", editingTier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reward_tiers").insert({
          name: data.name,
          name_ar: data.name_ar,
          min_points: data.min_points,
          points_multiplier: data.points_multiplier,
          icon: data.icon,
          color: data.color,
          benefits: data.benefits,
          is_active: data.is_active,
        });
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

  const handleOpenDialog = (tier?: RewardTier) => {
    if (tier) {
      setEditingTier(tier);
      setFormData({
        name: tier.name,
        name_ar: tier.name_ar,
        min_points: tier.min_points,
        points_multiplier: tier.points_multiplier,
        icon: tier.icon,
        color: tier.color,
        benefits: tier.benefits || [],
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
        benefits: [],
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
        benefits: [...formData.benefits, newBenefit.trim()],
      });
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
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
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              نظام المكافآت
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة مستويات المكافآت والنقاط
            </p>
          </div>

          <Button
            onClick={() => handleOpenDialog()}
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Plus className="w-4 h-4" />
            إضافة مستوى
          </Button>
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

                        {tier.benefits && tier.benefits.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">
                              المميزات:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {tier.benefits.slice(0, 2).map((benefit, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {benefit}
                                </Badge>
                              ))}
                              {tier.benefits.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{tier.benefits.length - 2}
                                </Badge>
                              )}
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

              <div className="space-y-2">
                <Label>المميزات</Label>
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
                  {formData.benefits.map((benefit, index) => (
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
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminRewards;
