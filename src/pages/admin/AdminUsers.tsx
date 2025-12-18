import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Mail, 
  Loader2,
  UserCheck,
  UserX,
  Eye,
  MoreVertical,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  is_verified: boolean | null;
  created_at: string | null;
  avatar_url: string | null;
  role?: string;
  orders_count?: number;
}

interface UserStats {
  total: number;
  verified: number;
  unverified: number;
  admins: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<UserStats>({ total: 0, verified: 0, unverified: 0, admins: 0 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"single" | "bulk">("single");
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel("users-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);

    // Fetch profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب المستخدمين");
      setLoading(false);
      return;
    }

    // Fetch user roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Fetch orders count for each user
    const { data: orders } = await supabase
      .from("orders")
      .select("user_id");

    const usersWithDetails: User[] = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.id);
      const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
      
      return {
        ...profile,
        role: userRole?.role || "user",
        orders_count: userOrders.length,
      };
    });

    setUsers(usersWithDetails);

    // Calculate stats
    const adminsCount = roles?.filter(r => r.role === "admin").length || 0;
    setStats({
      total: usersWithDetails.length,
      verified: usersWithDetails.filter(u => u.is_verified).length,
      unverified: usersWithDetails.filter(u => !u.is_verified).length,
      admins: adminsCount,
    });

    setLoading(false);
  };

  const handleVerifyUser = async (userId: string, verify: boolean) => {
    setUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: verify })
      .eq("id", userId);

    if (error) {
      toast.error("خطأ في تحديث حالة المستخدم");
    } else {
      toast.success(verify ? "تم توثيق المستخدم بنجاح" : "تم إلغاء توثيق المستخدم");
      fetchUsers();
    }
    setUpdating(false);
    setSelectedUser(null);
  };

  const openDeleteDialog = (userId: string) => {
    setDeletingId(userId);
    setDeleteType("single");
    setDeleteDialogOpen(true);
  };

  const openBulkDeleteDialog = () => {
    if (selectedIds.length === 0) return;
    setDeleteType("bulk");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteType === "single" && deletingId) {
        await supabase.from("orders").delete().eq("user_id", deletingId);
        await supabase.from("notifications").delete().eq("user_id", deletingId);
        await supabase.from("support_tickets").delete().eq("user_id", deletingId);
        await supabase.from("user_roles").delete().eq("user_id", deletingId);
        const { error } = await supabase.from("profiles").delete().eq("id", deletingId);

        if (error) throw error;
        toast.success("تم حذف المستخدم بنجاح");
        setSelectedIds(prev => prev.filter(id => id !== deletingId));
      } else if (deleteType === "bulk") {
        setDeleteProgress({ current: 0, total: selectedIds.length });
        for (let i = 0; i < selectedIds.length; i++) {
          const userId = selectedIds[i];
          await supabase.from("orders").delete().eq("user_id", userId);
          await supabase.from("notifications").delete().eq("user_id", userId);
          await supabase.from("support_tickets").delete().eq("user_id", userId);
          await supabase.from("user_roles").delete().eq("user_id", userId);
          await supabase.from("profiles").delete().eq("id", userId);
          setDeleteProgress({ current: i + 1, total: selectedIds.length });
        }
        toast.success(`تم حذف ${selectedIds.length} مستخدم بنجاح`);
        setSelectedIds([]);
      }
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user(s):", error);
      toast.error("فشل في حذف المستخدم");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeleteProgress({ current: 0, total: 0 });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "verified" && user.is_verified) ||
      (statusFilter === "unverified" && !user.is_verified) ||
      (statusFilter === "admin" && user.role === "admin");
    
    return matchesSearch && matchesStatus;
  });

  const statsData = [
    { label: "إجمالي المستخدمين", value: stats.total, color: "from-primary to-cyan-400", icon: Users },
    { label: "مستخدمين موثّقين", value: stats.verified, color: "from-success to-emerald-400", icon: UserCheck },
    { label: "في انتظار التوثيق", value: stats.unverified, color: "from-warning to-orange-400", icon: UserX },
    { label: "مشرفين", value: stats.admins, color: "from-accent to-pink-400", icon: Shield },
  ];

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3"
            >
              <Users className="w-8 h-8 text-primary" />
              إدارة المستخدمين
            </motion.h1>
            <p className="text-muted-foreground">عرض وإدارة جميع المستخدمين</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="card-elevated border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} p-2.5 shadow-lg`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value.toLocaleString("ar-SA")}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter */}
        <Card className="card-elevated border-border/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="البحث بالاسم أو البريد..." 
                  className="pr-10 bg-secondary/50 border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-secondary/50 border-border/50">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="فلترة الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  <SelectItem value="verified">موثّقين</SelectItem>
                  <SelectItem value="unverified">غير موثّقين</SelectItem>
                  <SelectItem value="admin">مشرفين</SelectItem>
                </SelectContent>
              </Select>
              {filteredUsers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="gap-2"
                >
                  {selectedIds.length === filteredUsers.length ? "إلغاء التحديد" : "تحديد الكل"}
                </Button>
              )}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} محدد
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={openBulkDeleteDialog}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف المحدد
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="card-elevated border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              قائمة المستخدمين
              <Badge variant="secondary" className="mr-2">{filteredUsers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-10 h-10 text-primary" />
                </motion.div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg">لا يوجد مستخدمين</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground w-12">
                        <Checkbox
                          checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">المستخدم</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الدور</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الطلبات</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">تاريخ التسجيل</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${selectedIds.includes(user.id) ? "bg-primary/5" : ""}`}
                        >
                          <td className="py-4 px-4">
                            <Checkbox
                              checked={selectedIds.includes(user.id)}
                              onCheckedChange={() => toggleSelect(user.id)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || "؟"}
                              </div>
                              <div>
                                <p className="font-medium">{user.full_name || "بدون اسم"}</p>
                                <p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role === "admin" && <Shield className="w-3 h-3 ml-1" />}
                              {user.role === "admin" ? "مشرف" : "عميل"}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              user.is_verified 
                                ? "bg-success/10 text-success border border-success/20" 
                                : "bg-warning/10 text-warning border border-warning/20"
                            }`}>
                              {user.is_verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {user.is_verified ? "موثّق" : "غير موثّق"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium">{user.orders_count || 0}</span>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-sm">
                            {user.created_at 
                              ? format(new Date(user.created_at), "d MMMM yyyy", { locale: ar })
                              : "-"
                            }
                          </td>
                          <td className="py-4 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                {user.is_verified ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleVerifyUser(user.id, false)}
                                    className="text-warning"
                                  >
                                    <XCircle className="w-4 h-4 ml-2" />
                                    إلغاء التوثيق
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleVerifyUser(user.id, true)}
                                    className="text-success"
                                  >
                                    <CheckCircle className="w-4 h-4 ml-2" />
                                    توثيق الحساب
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(user.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 ml-2" />
                                  حذف المستخدم
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                تفاصيل المستخدم
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0) || "؟"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.full_name || "بدون اسم"}</h3>
                    <p className="text-muted-foreground" dir="ltr">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">الحالة</p>
                    <p className={`font-bold ${selectedUser.is_verified ? "text-success" : "text-warning"}`}>
                      {selectedUser.is_verified ? "موثّق" : "غير موثّق"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">الدور</p>
                    <p className="font-bold">{selectedUser.role === "admin" ? "مشرف" : "عميل"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">عدد الطلبات</p>
                    <p className="font-bold">{selectedUser.orders_count || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">تاريخ التسجيل</p>
                    <p className="font-bold text-sm">
                      {selectedUser.created_at 
                        ? format(new Date(selectedUser.created_at), "d MMMM yyyy", { locale: ar })
                        : "-"
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedUser.is_verified ? (
                    <Button 
                      variant="outline" 
                      className="flex-1 text-warning border-warning/30"
                      onClick={() => handleVerifyUser(selectedUser.id, false)}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <XCircle className="w-4 h-4 ml-2" />}
                      إلغاء التوثيق
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => handleVerifyUser(selectedUser.id, true)}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                      توثيق الحساب
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={deleteType === "bulk" ? `حذف ${selectedIds.length} مستخدم` : "حذف المستخدم"}
          description={deleteType === "bulk" 
            ? `هل أنت متأكد من حذف ${selectedIds.length} مستخدم؟ سيتم حذف جميع بياناتهم ولا يمكن التراجع.`
            : "هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع بياناته ولا يمكن التراجع."
          }
          onConfirm={handleConfirmDelete}
          loading={deleting}
          progress={deleteType === "bulk" && deleting ? deleteProgress : undefined}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminUsers;
