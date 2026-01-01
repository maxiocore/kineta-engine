import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { 
  Receipt, 
  Search, 
  Eye, 
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Download,
  ExternalLink,
  Banknote,
  Building2,
  User,
  Hash,
  FileDown,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { generatePaymentSchedulePDF } from "@/lib/pdfTemplates";

interface PaymentReceipt {
  id: string;
  application_id: string;
  user_id: string;
  receipt_url: string;
  amount: number;
  payment_date: string;
  bank_name: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  financing_applications?: {
    application_number: string;
    full_name: string;
    contract_number: string | null;
    approved_amount: number | null;
    financing_plans?: {
      name_ar: string;
    };
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: "قيد المراجعة", 
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: <Clock className="h-3 w-3" />
  },
  approved: { 
    label: "مقبول", 
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  rejected: { 
    label: "مرفوض", 
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: <XCircle className="h-3 w-3" />
  },
};

export default function ClientFinancingPayments() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch user's payment receipts
  const { data: receipts, isLoading } = useQuery({
    queryKey: ["my-financing-payment-receipts"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("financing_payment_receipts")
        .select(`
          *,
          financing_applications(
            application_number,
            full_name,
            contract_number,
            approved_amount,
            financing_plans(name_ar)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PaymentReceipt[];
    },
    enabled: !!user?.id,
  });

  // Filter receipts based on search
  const filteredReceipts = receipts?.filter(receipt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      receipt.financing_applications?.application_number?.toLowerCase().includes(query) ||
      receipt.financing_applications?.contract_number?.toLowerCase().includes(query) ||
      receipt.financing_applications?.full_name?.toLowerCase().includes(query) ||
      receipt.amount.toString().includes(query)
    );
  });

  // Calculate stats
  const totalPaid = receipts?.filter(r => r.status === "approved").reduce((sum, r) => sum + r.amount, 0) || 0;
  const pendingCount = receipts?.filter(r => r.status === "pending").length || 0;
  const approvedCount = receipts?.filter(r => r.status === "approved").length || 0;

  const handleViewReceipt = (receipt: PaymentReceipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptDialog(true);
  };

  // Generate Payment Schedule PDF
  const handleDownloadPaymentSchedule = async () => {
    if (!receipts || receipts.length === 0) {
      toast.error("لا توجد سدادات لتحميلها");
      return;
    }

    // Get the first application info (assuming all receipts are for same application)
    const firstReceipt = receipts.find(r => r.financing_applications);
    if (!firstReceipt?.financing_applications) {
      toast.error("لا توجد بيانات كافية لإنشاء الملف");
      return;
    }

    const app = firstReceipt.financing_applications;
    const approvedReceipts = receipts.filter(r => r.status === "approved");
    const approvedAmount = app.approved_amount || 0;

    setIsGeneratingPDF(true);
    try {
      await generatePaymentSchedulePDF({
        customerName: app.full_name,
        applicationNumber: app.application_number,
        contractNumber: app.contract_number || app.application_number,
        approvedAmount: approvedAmount,
        planName: app.financing_plans?.name_ar || "خطة تمويل",
        payments: approvedReceipts.map(r => ({
          date: r.payment_date,
          amount: r.amount,
          bankName: r.bank_name,
          status: r.status,
          receiptUrl: r.receipt_url,
        })),
        totalPaid: totalPaid,
        remainingAmount: Math.max(0, approvedAmount - totalPaid),
      });
      toast.success("تم تحميل جدول السدادات بنجاح");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("حدث خطأ أثناء إنشاء الملف");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 pb-8 px-1 sm:px-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30 mx-auto">
            <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-3xl font-bold">سجل سدادات التمويل</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            متابعة جميع عمليات السداد وحالة الإيصالات المرفوعة
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{totalPaid.toLocaleString("ar-SA")}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">إجمالي المدفوع (ر.س)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-sm border-yellow-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-400">{pendingCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">قيد المراجعة</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 backdrop-blur-sm border-purple-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-purple-400">{approvedCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">إيصالات مقبولة</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث برقم الطلب أو العقد أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-card/50 h-10 sm:h-11 text-sm"
            />
          </div>
          <Button 
            onClick={handleDownloadPaymentSchedule}
            disabled={isGeneratingPDF || !receipts?.length}
            variant="outline"
            className="h-10 sm:h-11 border-primary/50 hover:bg-primary/10"
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 ml-2" />
            )}
            تحميل جدول السدادات PDF
          </Button>
          <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 h-10 sm:h-11">
            <Link to="/dashboard/financing/payment">
              <Plus className="h-4 w-4 ml-2" />
              رفع إيصال جديد
            </Link>
          </Button>
        </motion.div>

        {/* Receipts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-5 w-5 text-primary" />
                سجل الإيصالات ({filteredReceipts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : filteredReceipts?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">لا توجد إيصالات</h3>
                  <p className="text-sm text-muted-foreground mb-4">لم تقم برفع أي إيصالات سداد بعد</p>
                  <Button asChild variant="outline">
                    <Link to="/dashboard/financing/payment">
                      <Plus className="h-4 w-4 ml-2" />
                      رفع إيصال جديد
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReceipts?.map((receipt, index) => (
                    <motion.div
                      key={receipt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 sm:p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Receipt Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm sm:text-base">
                                {receipt.amount.toLocaleString("ar-SA")} ر.س
                              </span>
                              <Badge className={`text-[10px] sm:text-xs ${statusConfig[receipt.status]?.color}`}>
                                {statusConfig[receipt.status]?.icon}
                                <span className="mr-1">{statusConfig[receipt.status]?.label}</span>
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {receipt.financing_applications?.full_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {receipt.financing_applications?.application_number}
                              </span>
                              {receipt.financing_applications?.contract_number && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  عقد: {receipt.financing_applications.contract_number}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {receipt.bank_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(receipt.created_at), "dd/MM/yyyy", { locale: ar })}
                              </span>
                            </div>

                            {receipt.admin_notes && receipt.status === "rejected" && (
                              <p className="text-xs text-red-400 mt-1">
                                ملاحظة: {receipt.admin_notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(receipt)}
                            className="h-8 text-xs"
                          >
                            <Eye className="h-3 w-3 ml-1" />
                            عرض
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 text-xs"
                          >
                            <a href={receipt.receipt_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 ml-1" />
                              فتح
                            </a>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Receipt Dialog */}
        <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                تفاصيل الإيصال
              </DialogTitle>
            </DialogHeader>
            
            {selectedReceipt && (
              <div className="space-y-4">
                {/* Receipt Image */}
                <div className="rounded-xl overflow-hidden border border-border bg-muted/50">
                  <img
                    src={selectedReceipt.receipt_url}
                    alt="إيصال السداد"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                </div>

                {/* Receipt Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">المبلغ</p>
                    <p className="font-bold text-lg text-emerald-400">
                      {selectedReceipt.amount.toLocaleString("ar-SA")} ر.س
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">الحالة</p>
                    <Badge className={`mt-1 ${statusConfig[selectedReceipt.status]?.color}`}>
                      {statusConfig[selectedReceipt.status]?.icon}
                      <span className="mr-1">{statusConfig[selectedReceipt.status]?.label}</span>
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">رقم الطلب</p>
                    <p className="font-medium">{selectedReceipt.financing_applications?.application_number}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">رقم العقد</p>
                    <p className="font-medium">{selectedReceipt.financing_applications?.contract_number || "-"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">الاسم</p>
                    <p className="font-medium">{selectedReceipt.financing_applications?.full_name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">البنك</p>
                    <p className="font-medium">{selectedReceipt.bank_name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                    <p className="text-xs text-muted-foreground">تاريخ الرفع</p>
                    <p className="font-medium">
                      {format(new Date(selectedReceipt.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}
                    </p>
                  </div>
                  {selectedReceipt.admin_notes && (
                    <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                      <p className="text-xs text-muted-foreground">ملاحظات الإدارة</p>
                      <p className="font-medium text-sm">{selectedReceipt.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href={selectedReceipt.receipt_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 ml-2" />
                      تحميل الإيصال
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/dashboard/financing/payment">
                      <Plus className="h-4 w-4 ml-2" />
                      رفع إيصال جديد
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
}
