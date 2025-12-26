import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Building2,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  replied_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "bg-blue-500" },
  read: { label: "مقروء", color: "bg-yellow-500" },
  replied: { label: "تم الرد", color: "bg-green-500" },
  archived: { label: "مؤرشف", color: "bg-gray-500" },
};

const AdminContactMessages = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["contact-messages", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ 
          status, 
          replied_at: status === "replied" ? new Date().toISOString() : null 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      toast.success("تم تحديث الحالة");
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      toast.success("تم حفظ الملاحظات");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      setSelectedIds([]);
      setDeleteDialogOpen(false);
      toast.success("تم حذف الرسائل");
    },
  });

  const filteredMessages = messages?.filter((msg) =>
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMessages?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMessages?.map((m) => m.id) || []);
    }
  };

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setAdminNotes(message.admin_notes || "");
    if (message.status === "new") {
      updateStatusMutation.mutate({ id: message.id, status: "read" });
    }
  };

  const stats = {
    total: messages?.length || 0,
    new: messages?.filter((m) => m.status === "new").length || 0,
    replied: messages?.filter((m) => m.status === "replied").length || 0,
    archived: messages?.filter((m) => m.status === "archived").length || 0,
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              رسائل التواصل
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              إدارة الرسائل الواردة من نموذج التواصل
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["contact-messages"] })}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">رسائل جديدة</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.new}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تم الرد</p>
                  <p className="text-2xl font-bold text-green-500">{stats.replied}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مؤرشف</p>
                  <p className="text-2xl font-bold text-gray-500">{stats.archived}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-gray-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الرسائل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="new">جديد</SelectItem>
                  <SelectItem value="read">مقروء</SelectItem>
                  <SelectItem value="replied">تم الرد</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف ({selectedIds.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredMessages?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد رسائل</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredMessages?.length && filteredMessages.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>المرسل</TableHead>
                    <TableHead className="hidden md:table-cell">الموضوع</TableHead>
                    <TableHead className="hidden sm:table-cell">الحالة</TableHead>
                    <TableHead className="hidden lg:table-cell">التاريخ</TableHead>
                    <TableHead className="w-20">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages?.map((msg) => (
                    <TableRow
                      key={msg.id}
                      className={msg.status === "new" ? "bg-blue-500/5" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(msg.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds([...selectedIds, msg.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== msg.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{msg.name}</p>
                          <p className="text-xs text-muted-foreground">{msg.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="truncate max-w-[200px]">
                          {msg.subject || "بدون موضوع"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="secondary"
                          className={`${statusConfig[msg.status]?.color} text-white`}
                        >
                          {statusConfig[msg.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(msg.created_at), "d MMM yyyy", {
                            locale: ar,
                          })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewMessage(msg)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Message Details Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                تفاصيل الرسالة
              </DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-6">
                {/* Sender Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">
                        {selectedMessage.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedMessage.name}</p>
                      <p className="text-xs text-muted-foreground">الاسم</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{selectedMessage.email}</p>
                      <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    </div>
                  </div>
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedMessage.phone}</p>
                        <p className="text-xs text-muted-foreground">الهاتف</p>
                      </div>
                    </div>
                  )}
                  {selectedMessage.company && (
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedMessage.company}</p>
                        <p className="text-xs text-muted-foreground">الشركة</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(selectedMessage.created_at), "d MMMM yyyy - h:mm a", {
                          locale: ar,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">تاريخ الإرسال</p>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                {selectedMessage.subject && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">الموضوع</p>
                    <p className="font-semibold">{selectedMessage.subject}</p>
                  </div>
                )}

                {/* Message */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">الرسالة</p>
                  <div className="p-4 bg-secondary/30 rounded-lg whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">تحديث الحالة</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([key, { label, color }]) => (
                      <Button
                        key={key}
                        variant={selectedMessage.status === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateStatusMutation.mutate({ id: selectedMessage.id, status: key });
                          setSelectedMessage({ ...selectedMessage, status: key });
                        }}
                        className={selectedMessage.status === key ? color : ""}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">ملاحظات الإدارة</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظات داخلية..."
                    rows={3}
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => updateNotesMutation.mutate({ id: selectedMessage.id, notes: adminNotes })}
                  >
                    حفظ الملاحظات
                  </Button>
                </div>

                {/* Quick Reply */}
                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => {
                      window.location.href = `mailto:${selectedMessage.email}?subject=رد: ${selectedMessage.subject || "رسالتك"}`;
                    }}
                  >
                    <Mail className="w-4 h-4 ml-2" />
                    الرد عبر البريد الإلكتروني
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="حذف الرسائل"
          description={`هل أنت متأكد من حذف ${selectedIds.length} رسالة؟ لا يمكن التراجع عن هذا الإجراء.`}
          onConfirm={() => deleteMutation.mutate(selectedIds)}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminContactMessages;
