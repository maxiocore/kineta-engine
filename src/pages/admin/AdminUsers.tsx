import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Trash2,
  ShieldCheck,
  ShieldOff,
  Download,
  RefreshCw,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Activity,
  Ban,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  is_verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  avatar_url: string | null;
  role?: string;
  orders_count?: number;
  total_spent?: number;
}

interface UserStats {
  total: number;
  verified: number;
  unverified: number;
  admins: number;
  newThisMonth: number;
}

type SortField = "created_at" | "full_name" | "orders_count" | "total_spent";
type SortOrder = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [stats, setStats] = useState<UserStats>({ total: 0, verified: 0, unverified: 0, admins: 0, newThisMonth: 0 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"single" | "bulk">("single");
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ open: boolean; user: User | null; newRole: string }>({
    open: false,
    user: null,
    newRole: ""
  });

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel("users-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchUsers();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, total_price");

      const usersWithDetails: User[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
        const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
        
        return {
          ...profile,
          role: userRole?.role || "user",
          orders_count: userOrders.length,
          total_spent: totalSpent,
        };
      });

      setUsers(usersWithDetails);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const adminsCount = roles?.filter(r => r.role === "admin").length || 0;
      const newUsersThisMonth = usersWithDetails.filter(u => 
        u.created_at && new Date(u.created_at) >= startOfMonth
      ).length;

      setStats({
        total: usersWithDetails.length,
        verified: usersWithDetails.filter(u => u.is_verified).length,
        unverified: usersWithDetails.filter(u => !u.is_verified).length,
        admins: adminsCount,
        newThisMonth: newUsersThisMonth,
      });
    } catch (error) {
      toast.error("خطأ في جلب المستخدمين");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const handleRoleChange = async () => {
    if (!roleChangeDialog.user) return;
    
    setUpdating(true);
    try {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", roleChangeDialog.user.id);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: roleChangeDialog.user.id, 
          role: roleChangeDialog.newRole as "admin" | "user"
        });

      if (insertError) throw insertError;

      toast.success(roleChangeDialog.newRole === "admin" ? "تم ترقية المستخدم لمشرف" : "تم إزالة صلاحيات المشرف");
      fetchUsers();
    } catch (error) {
      toast.error("خطأ في تغيير الصلاحيات");
    } finally {
      setUpdating(false);
      setRoleChangeDialog({ open: false, user: null, newRole: "" });
    }
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
        await supabase.from("coupon_usages").delete().eq("user_id", deletingId);
        await supabase.from("orders").delete().eq("user_id", deletingId);
        await supabase.from("notifications").delete().eq("user_id", deletingId);
        await supabase.from("ticket_messages").delete().eq("sender_id", deletingId);
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
          await supabase.from("coupon_usages").delete().eq("user_id", userId);
          await supabase.from("orders").delete().eq("user_id", userId);
          await supabase.from("notifications").delete().eq("user_id", userId);
          await supabase.from("ticket_messages").delete().eq("sender_id", userId);
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

  const exportUsers = () => {
    const csvContent = [
      ["الاسم", "البريد", "الدور", "الحالة", "الطلبات", "إجمالي المشتريات", "تاريخ التسجيل"].join(","),
      ...filteredUsers.map(u => [
        u.full_name || "بدون اسم",
        u.email || "-",
        u.role === "admin" ? "مشرف" : "عميل",
        u.is_verified ? "موثق" : "غير موثق",
        u.orders_count || 0,
        u.total_spent || 0,
        u.created_at ? format(new Date(u.created_at), "yyyy-MM-dd") : "-"
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("تم تصدير البيانات بنجاح");
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "verified" && user.is_verified) ||
        (statusFilter === "unverified" && !user.is_verified);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && user.role === "admin") ||
        (roleFilter === "user" && user.role === "user");
      
      return matchesSearch && matchesStatus && matchesRole;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "full_name":
          comparison = (a.full_name || "").localeCompare(b.full_name || "");
          break;
        case "orders_count":
          comparison = (a.orders_count || 0) - (b.orders_count || 0);
          break;
        case "total_spent":
          comparison = (a.total_spent || 0) - (b.total_spent || 0);
          break;
        case "created_at":
        default:
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [users, searchQuery, statusFilter, roleFilter, sortField, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedUsers.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const statsData = [
    { label: "إجمالي المستخدمين", value: stats.total, icon: Users, gradient: "from-primary/20 to-primary/5", iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: "مستخدمين موثّقين", value: stats.verified, icon: UserCheck, gradient: "from-success/20 to-success/5", iconBg: "bg-success/10", iconColor: "text-success" },
    { label: "في انتظار التوثيق", value: stats.unverified, icon: Clock, gradient: "from-warning/20 to-warning/5", iconBg: "bg-warning/10", iconColor: "text-warning" },
    { label: "مشرفين", value: stats.admins, icon: Shield, gradient: "from-accent/20 to-accent/5", iconBg: "bg-accent/10", iconColor: "text-accent" },
    { label: "جدد هذا الشهر", value: stats.newThisMonth, icon: UserPlus, gradient: "from-cyan-500/20 to-cyan-500/5", iconBg: "bg-cyan-500/10", iconColor: "text-cyan-500" },
  ];

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "؟";
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-3 sm:space-y-4 lg:space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 flex items-center gap-2"
            >
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              إدارة المستخدمين
            </motion.h1>
            <p className="text-muted-foreground text-xs sm:text-sm">عرض وإدارة جميع المستخدمين</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="gap-1.5 h-8 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportUsers}
              className="gap-1.5 h-8 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تصدير</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className={`relative overflow-hidden border-border/30 bg-gradient-to-br ${stat.gradient}`}>
                <CardContent className="p-2.5 sm:p-3 lg:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${stat.iconBg}`}>
                      <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg lg:text-xl font-bold">{stat.value.toLocaleString("ar-SA")}</p>
                      <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-border/30">
          <CardContent className="p-2.5 sm:p-3 lg:p-4">
            <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="البحث بالاسم أو البريد..." 
                  className="pr-9 bg-background h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-28 sm:w-36 bg-background h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="حالة التوثيق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="verified">موثّقين</SelectItem>
                    <SelectItem value="unverified">غير موثّقين</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-24 sm:w-32 bg-background h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأدوار</SelectItem>
                    <SelectItem value="admin">مشرفين</SelectItem>
                    <SelectItem value="user">عملاء</SelectItem>
                  </SelectContent>
                </Select>
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={openBulkDeleteDialog}
                    className="gap-1.5 h-9 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف ({selectedIds.length})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-border/30">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                قائمة المستخدمين
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{filteredUsers.length}</Badge>
              </CardTitle>
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                صفحة {currentPage} من {totalPages || 1}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm mb-1">لا يوجد مستخدمين</p>
                <p className="text-xs text-muted-foreground/70">جرب تغيير معايير البحث</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10 text-right">
                          <Checkbox
                            checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort("full_name")}
                            className="gap-1 -mr-2 hover:bg-transparent text-xs sm:text-sm h-8"
                          >
                            المستخدم
                            <ArrowUpDown className="w-3 h-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden sm:table-cell">الدور</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">الحالة</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort("orders_count")}
                            className="gap-1 -mr-2 hover:bg-transparent text-xs sm:text-sm h-8"
                          >
                            الطلبات
                            <ArrowUpDown className="w-3 h-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort("total_spent")}
                            className="gap-1 -mr-2 hover:bg-transparent text-xs sm:text-sm h-8"
                          >
                            المشتريات
                            <ArrowUpDown className="w-3 h-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSort("created_at")}
                            className="gap-1 -mr-3 hover:bg-transparent"
                          >
                            التسجيل
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right w-20">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {paginatedUsers.map((user, index) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedIds.includes(user.id) ? "bg-primary/5" : ""}`}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(user.id)}
                                onCheckedChange={() => toggleSelect(user.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-border">
                                  <AvatarImage src={user.avatar_url || ""} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                                    {getInitials(user.full_name, user.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium flex items-center gap-1.5">
                                    {user.full_name || "بدون اسم"}
                                    {user.role === "admin" && (
                                      <Shield className="w-3.5 h-3.5 text-primary" />
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.role === "admin" ? "default" : "secondary"}
                                className={user.role === "admin" ? "bg-primary/10 text-primary border border-primary/20" : ""}
                              >
                                {user.role === "admin" ? "مشرف" : "عميل"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                user.is_verified 
                                  ? "bg-success/10 text-success" 
                                  : "bg-warning/10 text-warning"
                              }`}>
                                {user.is_verified ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {user.is_verified ? "موثّق" : "قيد الانتظار"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="font-medium">{user.orders_count || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-success">
                                {(user.total_spent || 0).toFixed(2)} ر.س
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {user.created_at 
                                ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ar })
                                : "-"
                              }
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                                    <Eye className="w-4 h-4 ml-2" />
                                    عرض الملف الكامل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                    <Activity className="w-4 h-4 ml-2" />
                                    معاينة سريعة
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.is_verified ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleVerifyUser(user.id, false)}
                                      className="text-warning focus:text-warning"
                                    >
                                      <XCircle className="w-4 h-4 ml-2" />
                                      إلغاء التوثيق
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleVerifyUser(user.id, true)}
                                      className="text-success focus:text-success"
                                    >
                                      <CheckCircle className="w-4 h-4 ml-2" />
                                      توثيق الحساب
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {user.role === "admin" ? (
                                    <DropdownMenuItem 
                                      onClick={() => setRoleChangeDialog({ open: true, user, newRole: "user" })}
                                      className="text-warning focus:text-warning"
                                    >
                                      <ShieldOff className="w-4 h-4 ml-2" />
                                      إزالة صلاحيات المشرف
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => setRoleChangeDialog({ open: true, user, newRole: "admin" })}
                                    >
                                      <ShieldCheck className="w-4 h-4 ml-2" />
                                      ترقية لمشرف
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(user.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    حذف المستخدم
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                    <div className="text-sm text-muted-foreground">
                      عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} من {filteredUsers.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                تفاصيل المستخدم
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20 border-4 border-border">
                    <AvatarImage src={selectedUser.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-bold">
                      {getInitials(selectedUser.full_name, selectedUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{selectedUser.full_name || "بدون اسم"}</h3>
                      {selectedUser.role === "admin" && (
                        <Badge className="bg-primary/10 text-primary border border-primary/20">
                          <Shield className="w-3 h-3 ml-1" />
                          مشرف
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground" dir="ltr">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.is_verified 
                          ? "bg-success/10 text-success" 
                          : "bg-warning/10 text-warning"
                      }`}>
                        {selectedUser.is_verified ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {selectedUser.is_verified ? "موثّق" : "قيد الانتظار"}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold">{selectedUser.orders_count || 0}</p>
                    <p className="text-xs text-muted-foreground">الطلبات</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" />
                    <p className="text-xl font-bold text-success">{(selectedUser.total_spent || 0).toFixed(2)} ر.س</p>
                    <p className="text-xs text-muted-foreground">إجمالي المشتريات</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-bold">
                      {selectedUser.created_at 
                        ? format(new Date(selectedUser.created_at), "d MMM yyyy", { locale: ar })
                        : "-"
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">تاريخ التسجيل</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Activity className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-bold">
                      {selectedUser.updated_at 
                        ? formatDistanceToNow(new Date(selectedUser.updated_at), { addSuffix: true, locale: ar })
                        : "-"
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">آخر تحديث</p>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {selectedUser.is_verified ? (
                    <Button 
                      variant="outline" 
                      className="flex-1 text-warning border-warning/30 hover:bg-warning/10"
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
                  {selectedUser.role === "admin" ? (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedUser(null);
                        setRoleChangeDialog({ open: true, user: selectedUser, newRole: "user" });
                      }}
                    >
                      <ShieldOff className="w-4 h-4 ml-2" />
                      إزالة صلاحيات المشرف
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedUser(null);
                        setRoleChangeDialog({ open: true, user: selectedUser, newRole: "admin" });
                      }}
                    >
                      <ShieldCheck className="w-4 h-4 ml-2" />
                      ترقية لمشرف
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Role Change Confirmation */}
        <ConfirmDialog
          open={roleChangeDialog.open}
          onOpenChange={(open) => setRoleChangeDialog({ ...roleChangeDialog, open })}
          title={roleChangeDialog.newRole === "admin" ? "ترقية لمشرف" : "إزالة صلاحيات المشرف"}
          description={roleChangeDialog.newRole === "admin" 
            ? `هل أنت متأكد من ترقية "${roleChangeDialog.user?.full_name || roleChangeDialog.user?.email}" إلى مشرف؟ سيحصل على صلاحيات كاملة للوحة التحكم.`
            : `هل أنت متأكد من إزالة صلاحيات المشرف من "${roleChangeDialog.user?.full_name || roleChangeDialog.user?.email}"؟`
          }
          confirmText={roleChangeDialog.newRole === "admin" ? "ترقية" : "إزالة"}
          onConfirm={handleRoleChange}
          loading={updating}
          variant="warning"
        />

        {/* Delete Confirmation */}
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
