import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  Calendar,
  CalendarDays,
  ShoppingCart,
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  type: string;
  challenge_type: string;
  target_value: number;
  reward_points: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
}

interface ChallengeFormData {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  type: string;
  challenge_type: string;
  target_value: number;
  reward_points: number;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

const defaultFormData: ChallengeFormData = {
  title: "",
  title_ar: "",
  description: "",
  description_ar: "",
  type: "daily",
  challenge_type: "orders",
  target_value: 1,
  reward_points: 10,
  icon: "🎯",
  color: "#6366f1",
  is_active: true,
  display_order: 0,
};

const iconOptions = ["🎯", "🏆", "⭐", "🔥", "💎", "🎁", "🚀", "💪", "👑", "🌟"];

const AdminChallenges = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState<ChallengeFormData>(defaultFormData);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: challenges, isLoading } = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Challenge[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-challenges-stats"],
    queryFn: async () => {
      const { data: completions } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("is_completed", true);

      const { data: activeUsers } = await supabase
        .from("user_challenges")
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const uniqueUsers = new Set(activeUsers?.map((u) => u.user_id) || []);

      return {
        totalCompletions: completions?.length || 0,
        activeUsers: uniqueUsers.size,
        totalPointsAwarded: completions?.reduce((sum, c) => sum + (c.points_awarded || 0), 0) || 0,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChallengeFormData) => {
      const { error } = await supabase.from("challenges").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      toast.success("تم إضافة التحدي بنجاح");
      setIsDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChallengeFormData> }) => {
      const { error } = await supabase.from("challenges").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      toast.success("تم تحديث التحدي بنجاح");
      setIsDialogOpen(false);
      setEditingChallenge(null);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      toast.success("تم حذف التحدي بنجاح");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("challenges").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      toast.success("تم تحديث حالة التحدي");
    },
  });

  const handleOpenDialog = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setFormData({
        title: challenge.title,
        title_ar: challenge.title_ar,
        description: challenge.description || "",
        description_ar: challenge.description_ar || "",
        type: challenge.type,
        challenge_type: challenge.challenge_type,
        target_value: challenge.target_value,
        reward_points: challenge.reward_points,
        icon: challenge.icon || "🎯",
        color: challenge.color || "#6366f1",
        is_active: challenge.is_active,
        display_order: challenge.display_order || 0,
      });
    } else {
      setEditingChallenge(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.title_ar) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingChallenge) {
      updateMutation.mutate({ id: editingChallenge.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const dailyChallenges = challenges?.filter((c) => c.type === "daily") || [];
  const weeklyChallenges = challenges?.filter((c) => c.type === "weekly") || [];

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-7 h-7 text-primary" />
              إدارة التحديات
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              إضافة وتعديل التحديات اليومية والأسبوعية
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة تحدي جديد
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalCompletions || 0}</p>
                <p className="text-sm text-muted-foreground">تحدي مكتمل</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
                <p className="text-sm text-muted-foreground">مستخدم نشط</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalPointsAwarded || 0}</p>
                <p className="text-sm text-muted-foreground">نقطة موزعة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Challenges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              التحديات اليومية
              <Badge variant="secondary" className="mr-2">
                {dailyChallenges.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : dailyChallenges.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد تحديات يومية</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التحدي</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الهدف</TableHead>
                      <TableHead className="text-right">المكافأة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyChallenges.map((challenge) => (
                      <TableRow key={challenge.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{challenge.icon}</span>
                            <div>
                              <p className="font-medium">{challenge.title_ar}</p>
                              <p className="text-xs text-muted-foreground">{challenge.description_ar}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {challenge.challenge_type === "orders" ? (
                              <>
                                <ShoppingCart className="w-3 h-3" />
                                طلبات
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-3 h-3" />
                                إنفاق
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">{challenge.target_value}</span>
                          {challenge.challenge_type === "spending" && (
                            <span className="text-muted-foreground text-xs"> ر.س</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-primary">{challenge.reward_points}</span>
                          <span className="text-muted-foreground text-xs"> نقطة</span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={challenge.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: challenge.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(challenge)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteId(challenge.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Challenges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-accent" />
              التحديات الأسبوعية
              <Badge variant="secondary" className="mr-2">
                {weeklyChallenges.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : weeklyChallenges.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد تحديات أسبوعية</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التحدي</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الهدف</TableHead>
                      <TableHead className="text-right">المكافأة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyChallenges.map((challenge) => (
                      <TableRow key={challenge.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{challenge.icon}</span>
                            <div>
                              <p className="font-medium">{challenge.title_ar}</p>
                              <p className="text-xs text-muted-foreground">{challenge.description_ar}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {challenge.challenge_type === "orders" ? (
                              <>
                                <ShoppingCart className="w-3 h-3" />
                                طلبات
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-3 h-3" />
                                إنفاق
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">{challenge.target_value}</span>
                          {challenge.challenge_type === "spending" && (
                            <span className="text-muted-foreground text-xs"> ر.س</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-primary">{challenge.reward_points}</span>
                          <span className="text-muted-foreground text-xs"> نقطة</span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={challenge.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: challenge.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(challenge)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteId(challenge.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingChallenge ? "تعديل التحدي" : "إضافة تحدي جديد"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العنوان (إنجليزي)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Daily Order Challenge"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان (عربي) *</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    placeholder="تحدي الطلب اليومي"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الوصف (إنجليزي)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Complete an order today"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف (عربي)</Label>
                  <Textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder="أكمل طلباً اليوم"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع التحدي</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نوع المهمة</Label>
                  <Select
                    value={formData.challenge_type}
                    onValueChange={(value) => setFormData({ ...formData, challenge_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orders">عدد الطلبات</SelectItem>
                      <SelectItem value="spending">مبلغ الإنفاق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الهدف المطلوب</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.target_value}
                    onChange={(e) =>
                      setFormData({ ...formData, target_value: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>نقاط المكافأة</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.reward_points}
                    onChange={(e) =>
                      setFormData({ ...formData, reward_points: parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الأيقونة</Label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                          formData.icon === icon
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>اللون</Label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <Label className="cursor-pointer">التحدي مفعل</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                )}
                {editingChallenge ? "حفظ التغييرات" : "إضافة التحدي"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              هل أنت متأكد من حذف هذا التحدي؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminChallenges;
