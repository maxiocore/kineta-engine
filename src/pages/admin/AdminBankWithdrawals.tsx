import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  RefreshCw,
  Download,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface BankWithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  account_holder_name: string;
  iban: string;
  status: string;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const STATUS_CONFIG = {
  pending: {
    label: "قيد المراجعة",
    color: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    icon: Clock,
  },
  processing: {
    label: "قيد التنفيذ",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: RefreshCw,
  },
  completed: {
    label: "مكتمل",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "مرفوض",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: XCircle,
  },
};

const AdminBankWithdrawals = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<BankWithdrawalRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch withdrawal requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-bank-withdrawals", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("bank_withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((request) => ({
        ...request,
        profiles: profileMap.get(request.user_id) || null,
      })) as BankWithdrawalRequest[];
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("bank_withdrawal_requests")
        .update({
          status,
          admin_notes: notes || null,
          processed_at: status === "completed" || status === "rejected" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      // If rejected, refund the amount back to cashback
      if (status === "rejected" && selectedRequest) {
        // Get current cashback balance
        const { data: currentCashback } = await supabase
          .from("user_cashback")
          .select("cashback_balance, total_withdrawn")
          .eq("user_id", selectedRequest.user_id)
          .single();

        if (currentCashback) {
          await supabase
            .from("user_cashback")
            .update({
              cashback_balance: currentCashback.cashback_balance + selectedRequest.amount,
              total_withdrawn: Math.max(0, currentCashback.total_withdrawn - selectedRequest.amount),
            })
            .eq("user_id", selectedRequest.user_id);
        }

        // Add transaction record
        await supabase.from("cashback_transactions").insert({
          user_id: selectedRequest.user_id,
          amount: selectedRequest.amount,
          type: "refund",
          description: "Refund from rejected bank withdrawal",
          description_ar: "استرداد من طلب سحب بنكي مرفوض",
          reference_id: id,
        });

        // Create notification
        await supabase.from("notifications").insert({
          user_id: selectedRequest.user_id,
          title: "تم رفض طلب السحب البنكي",
          message: `تم رفض طلب السحب البنكي بقيمة ${selectedRequest.amount} ر.س. ${notes ? `السبب: ${notes}` : ""} تم إرجاع المبلغ لرصيد الكاش باك.`,
          type: "warning",
        });
      }

      // If completed, send success notification
      if (status === "completed" && selectedRequest) {
        await supabase.from("notifications").insert({
          user_id: selectedRequest.user_id,
          title: "تم تنفيذ السحب البنكي",
          message: `تم تحويل مبلغ ${selectedRequest.amount} ر.س إلى حسابك البنكي في ${selectedRequest.bank_name} بنجاح.`,
          type: "success",
        });
      }

      return { id, status };
    },
    onSuccess: (data) => {
      const statusText = data.status === "completed" ? "الموافقة على" : data.status === "rejected" ? "رفض" : "تحديث";
      toast.success(`تم ${statusText} الطلب بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["admin-bank-withdrawals"] });
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ");
    },
  });

  const handleAction = (request: BankWithdrawalRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes("");
    setActionDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedRequest || !actionType) return;
    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: actionType === "approve" ? "completed" : "rejected",
      notes: adminNotes,
    });
  };

  const filteredRequests = requests?.filter((request) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      request.bank_name.toLowerCase().includes(search) ||
      request.account_holder_name.toLowerCase().includes(search) ||
      request.iban.toLowerCase().includes(search) ||
      request.profiles?.full_name?.toLowerCase().includes(search) ||
      request.profiles?.email?.toLowerCase().includes(search)
    );
  });

  // Stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    completed: requests?.filter((r) => r.status === "completed").length || 0,
    totalAmount: requests?.reduce((sum, r) => sum + r.amount, 0) || 0,
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              طلبات السحب البنكي
            </h1>
            <p className="text-muted-foreground mt-1">
              مراجعة وإدارة طلبات سحب الكاش باك للحسابات البنكية
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-bank-withdrawals"] })}
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">قيد المراجعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">مكتمل</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalAmount.toFixed(0)} ر.س</p>
                    <p className="text-xs text-muted-foreground">إجمالي المبالغ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم، البنك، IBAN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="حالة الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="processing">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              قائمة الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !filteredRequests || filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد طلبات سحب بنكي</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">البنك</TableHead>
                      <TableHead className="text-right">IBAN</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => {
                      const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConfig.icon;

                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {request.profiles?.full_name || "مستخدم"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {request.profiles?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-emerald-500">
                              {request.amount.toFixed(2)} ر.س
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{request.bank_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono" dir="ltr">
                              {request.iban}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`gap-1 ${statusConfig.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(request.created_at), "dd MMM yyyy", { locale: ar })}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(request.created_at), "HH:mm")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="gap-1 bg-green-500 hover:bg-green-600"
                                  onClick={() => handleAction(request, "approve")}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  موافقة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-1"
                                  onClick={() => handleAction(request, "reject")}
                                >
                                  <XCircle className="w-3 h-3" />
                                  رفض
                                </Button>
                              </div>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4 ml-1" />
                                    عرض
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 ml-2" />
                                    عرض التفاصيل
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionType === "approve" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {actionType === "approve" ? "تأكيد الموافقة على السحب" : "تأكيد رفض السحب"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "سيتم تأكيد تحويل المبلغ للحساب البنكي"
                  : "سيتم رفض الطلب وإرجاع المبلغ لرصيد الكاش باك"}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المستخدم</span>
                    <span className="font-medium">{selectedRequest.profiles?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المبلغ</span>
                    <span className="font-bold text-emerald-500">{selectedRequest.amount.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">البنك</span>
                    <span className="font-medium">{selectedRequest.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">صاحب الحساب</span>
                    <span className="font-medium">{selectedRequest.account_holder_name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">IBAN</span>
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded" dir="ltr">
                      {selectedRequest.iban}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    ملاحظات {actionType === "reject" && "(سبب الرفض)"}
                  </label>
                  <Textarea
                    placeholder={actionType === "reject" ? "أدخل سبب الرفض..." : "ملاحظات إضافية (اختياري)"}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={confirmAction}
                disabled={updateStatusMutation.isPending}
                className={
                  actionType === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }
              >
                {updateStatusMutation.isPending
                  ? "جاري المعالجة..."
                  : actionType === "approve"
                  ? "تأكيد الموافقة"
                  : "تأكيد الرفض"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminBankWithdrawals;
