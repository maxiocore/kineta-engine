import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Users,
  TrendingUp,
  Trophy,
  History,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BadgeType {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  icon: string;
  color: string;
  tier: number;
  min_spending: number;
  min_orders: number;
  is_active: boolean;
  created_at: string;
}

interface BadgeActivityLog {
  id: string;
  action: string;
  created_at: string;
  user_email: string | null;
  new_value: {
    badge_name?: string;
    user_email?: string;
    badge_id?: string;
    user_id?: string;
  } | null;
  old_value: {
    badge_name?: string;
    user_email?: string;
  } | null;
}

const EMOJI_OPTIONS = ["🌟", "⭐", "🥉", "🥈", "🥇", "💎", "👑", "🏆", "🎖️", "🔥", "💫", "✨", "🎯", "🚀", "💰"];

const COLOR_OPTIONS = [
  "#6B7280", // gray
  "#CD7F32", // bronze
  "#C0C0C0", // silver
  "#FFD700", // gold
  "#E5E4E2", // platinum
  "#B9F2FF", // diamond
  "#4169E1", // royal blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#10B981", // emerald
];

const AdminBadges = () => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [badgeUserCounts, setBadgeUserCounts] = useState<Record<string, number>>({});
  const [totalStats, setTotalStats] = useState({
    totalBadges: 0,
    activeBadges: 0,
    totalAwarded: 0,
    uniqueUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [saving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState<BadgeActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    icon: "🌟",
    color: "#6B7280",
    tier: 1,
    min_spending: 0,
    min_orders: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchBadges();
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    setLogsLoading(true);
    
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("table_name", "user_badges")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching activity logs:", error);
    } else {
      setActivityLogs((data || []).map(log => ({
        id: log.id,
        action: log.action,
        created_at: log.created_at,
        user_email: log.user_email,
        new_value: log.new_value as BadgeActivityLog['new_value'],
        old_value: log.old_value as BadgeActivityLog['old_value'],
      })));
    }
    
    setLogsLoading(false);
  };

  const fetchBadges = async () => {
    setLoading(true);
    
    // Fetch badges
    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .order("tier", { ascending: true });

    if (error) {
      toast.error("فشل في تحميل الشارات");
      console.error(error);
    } else {
      setBadges(data || []);
      setTotalStats(prev => ({
        ...prev,
        totalBadges: data?.length || 0,
        activeBadges: data?.filter(b => b.is_active).length || 0,
      }));
    }

    // Fetch user badge counts
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("badge_id, user_id");

    if (userBadges) {
      // Count users per badge
      const counts: Record<string, number> = {};
      userBadges.forEach(ub => {
        counts[ub.badge_id] = (counts[ub.badge_id] || 0) + 1;
      });
      setBadgeUserCounts(counts);

      // Calculate unique users
      const uniqueUserIds = new Set(userBadges.map(ub => ub.user_id));
      setTotalStats(prev => ({
        ...prev,
        totalAwarded: userBadges.length,
        uniqueUsers: uniqueUserIds.size,
      }));
    }

    setLoading(false);
  };

  const handleOpenForm = (badge?: BadgeType) => {
    if (badge) {
      setSelectedBadge(badge);
      setFormData({
        name: badge.name,
        name_ar: badge.name_ar,
        description: badge.description || "",
        description_ar: badge.description_ar || "",
        icon: badge.icon,
        color: badge.color,
        tier: badge.tier,
        min_spending: badge.min_spending,
        min_orders: badge.min_orders,
        is_active: badge.is_active,
      });
    } else {
      setSelectedBadge(null);
      setFormData({
        name: "",
        name_ar: "",
        description: "",
        description_ar: "",
        icon: "🌟",
        color: "#6B7280",
        tier: badges.length + 1,
        min_spending: 0,
        min_orders: 0,
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.name_ar) {
      toast.error("يرجى إدخال اسم الشارة");
      return;
    }

    setSaving(true);

    try {
      if (selectedBadge) {
        const { error } = await supabase
          .from("badges")
          .update({
            name: formData.name,
            name_ar: formData.name_ar,
            description: formData.description || null,
            description_ar: formData.description_ar || null,
            icon: formData.icon,
            color: formData.color,
            tier: formData.tier,
            min_spending: formData.min_spending,
            min_orders: formData.min_orders,
            is_active: formData.is_active,
          })
          .eq("id", selectedBadge.id);

        if (error) throw error;
        toast.success("تم تحديث الشارة بنجاح");
      } else {
        const { error } = await supabase.from("badges").insert({
          name: formData.name,
          name_ar: formData.name_ar,
          description: formData.description || null,
          description_ar: formData.description_ar || null,
          icon: formData.icon,
          color: formData.color,
          tier: formData.tier,
          min_spending: formData.min_spending,
          min_orders: formData.min_orders,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success("تم إنشاء الشارة بنجاح");
      }

      setIsFormOpen(false);
      fetchBadges();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBadge) return;

    try {
      const { error } = await supabase
        .from("badges")
        .delete()
        .eq("id", selectedBadge.id);

      if (error) throw error;
      toast.success("تم حذف الشارة بنجاح");
      setIsDeleteOpen(false);
      fetchBadges();
    } catch (error: any) {
      toast.error(error.message || "فشل في حذف الشارة");
    }
  };

  const toggleBadgeStatus = async (badge: BadgeType) => {
    try {
      const { error } = await supabase
        .from("badges")
        .update({ is_active: !badge.is_active })
        .eq("id", badge.id);

      if (error) throw error;
      toast.success(badge.is_active ? "تم تعطيل الشارة" : "تم تفعيل الشارة");
      fetchBadges();
    } catch (error: any) {
      toast.error("فشل في تحديث حالة الشارة");
    }
  };

  const filteredBadges = badges.filter(
    (badge) =>
      badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.name_ar.includes(searchQuery)
  );

  return (
    <AdminDashboardLayout>
      <div className="space-y-4 md:space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-3">
          <Button onClick={() => handleOpenForm()} size="sm" className="gap-1.5 text-xs sm:text-sm">
            <Plus className="w-3.5 h-3.5" />
            إضافة شارة
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              إدارة الشارات
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              إنشاء وتعديل شارات المكافآت للمستخدمين
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-primary/20">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{totalStats.totalBadges}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">إجمالي الشارات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/20">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{totalStats.activeBadges}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">شارات مفعّلة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{totalStats.totalAwarded}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">شارات ممنوحة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning/20">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{totalStats.uniqueUsers}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">حاصل على شارات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="badges" className="space-y-4">
          <TabsList>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="w-4 h-4" />
              الشارات
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <History className="w-4 h-4" />
              سجل العمليات
            </TabsTrigger>
          </TabsList>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الشارات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Badges Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredBadges.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">لا توجد شارات</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`relative overflow-hidden ${!badge.is_active && "opacity-60"}`}>
                      <div
                        className="absolute top-0 right-0 left-0 h-1"
                        style={{ backgroundColor: badge.color }}
                      />
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                              style={{ backgroundColor: `${badge.color}20` }}
                            >
                              {badge.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{badge.name_ar}</CardTitle>
                              <p className="text-sm text-muted-foreground">{badge.name}</p>
                            </div>
                          </div>
                          <Badge variant={badge.is_active ? "default" : "secondary"}>
                            المستوى {badge.tier}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {badge.description_ar && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {badge.description_ar}
                          </p>
                        )}

                        {/* User Count */}
                        <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/50">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {badgeUserCounts[badge.id] || 0} مستخدم
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {badge.min_spending > 0 && (
                            <Badge variant="outline" className="text-xs">
                              الحد الأدنى للإنفاق: ${badge.min_spending}
                            </Badge>
                          )}
                          {badge.min_orders > 0 && (
                            <Badge variant="outline" className="text-xs">
                              الحد الأدنى للطلبات: {badge.min_orders}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={badge.is_active}
                              onCheckedChange={() => toggleBadgeStatus(badge)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {badge.is_active ? "مفعّل" : "معطّل"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenForm(badge)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedBadge(badge);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  سجل عمليات منح وإزالة الشارات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="py-12 text-center">
                    <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">لا توجد عمليات مسجلة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          log.action === 'INSERT' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {log.action === 'INSERT' ? (
                            <UserPlus className="w-5 h-5" />
                          ) : (
                            <UserMinus className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={log.action === 'INSERT' ? 'default' : 'destructive'}>
                              {log.action === 'INSERT' ? 'منح شارة' : 'إزالة شارة'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(log.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {log.new_value?.badge_name && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">الشارة: </span>
                                <span className="font-medium">{log.new_value.badge_name}</span>
                              </p>
                            )}
                            {log.new_value?.user_email && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">المستخدم: </span>
                                <span className="font-medium">{log.new_value.user_email}</span>
                              </p>
                            )}
                            {log.old_value?.badge_name && log.action === 'DELETE' && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">الشارة المزالة: </span>
                                <span className="font-medium">{log.old_value.badge_name}</span>
                              </p>
                            )}
                            {log.user_email && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">بواسطة: </span>
                                <span className="font-medium">{log.user_email}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedBadge ? "تعديل الشارة" : "إضافة شارة جديدة"}
              </DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الشارة ومتطلبات الحصول عليها
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Preview */}
              <div className="flex justify-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {formData.icon}
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        formData.icon === emoji
                          ? "bg-primary/20 ring-2 ring-primary"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <Label>اللون</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color
                          ? "ring-2 ring-offset-2 ring-primary"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم (إنجليزي)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Badge Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, name_ar: e.target.value })
                    }
                    placeholder="اسم الشارة"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Badge description..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, description_ar: e.target.value })
                  }
                  placeholder="وصف الشارة..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>المستوى</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.tier}
                    onChange={(e) =>
                      setFormData({ ...formData, tier: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأدنى للإنفاق ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.min_spending}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_spending: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأدنى للطلبات</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.min_orders}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_orders: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>الشارة مفعّلة</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                {selectedBadge ? "حفظ التغييرات" : "إنشاء الشارة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف الشارة "{selectedBadge?.name_ar}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminBadges;
