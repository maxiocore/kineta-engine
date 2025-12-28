import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  FileSignature,
  Building2,
  Hash,
  Receipt,
  Wallet,
  BanknoteIcon,
  Landmark
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface FinancingStatusCardProps {
  application: {
    id: string;
    application_number: string;
    full_name: string;
    national_id: string;
    phone: string;
    email: string;
    address?: string | null;
    company_name?: string | null;
    requested_amount: number;
    approved_amount: number | null;
    status: string;
    submitted_at: string;
    approved_at?: string | null;
    contract_number?: string | null;
    promissory_note_url?: string | null;
    financing_plans?: {
      name_ar: string;
      installments_count: number;
      duration_months?: number;
    };
  };
  installments?: {
    id: string;
    installment_number: number;
    amount: number;
    due_date: string;
    status: string;
    paid_at: string | null;
  }[];
  showClientInfo?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bgGradient: string }> = {
  pending: { 
    label: "قيد المراجعة", 
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", 
    icon: <Clock className="h-4 w-4" />,
    bgGradient: "from-yellow-500/10 to-orange-500/10"
  },
  under_review: { 
    label: "قيد المراجعة", 
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30", 
    icon: <Clock className="h-4 w-4" />,
    bgGradient: "from-blue-500/10 to-indigo-500/10"
  },
  documents_required: { 
    label: "مستندات مطلوبة", 
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30", 
    icon: <FileText className="h-4 w-4" />,
    bgGradient: "from-orange-500/10 to-amber-500/10"
  },
  awaiting_contract: { 
    label: "بانتظار توقيع العقد", 
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30", 
    icon: <FileSignature className="h-4 w-4" />,
    bgGradient: "from-purple-500/10 to-violet-500/10"
  },
  awaiting_signature: { 
    label: "بانتظار توقيع الكمبيالة", 
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", 
    icon: <FileSignature className="h-4 w-4" />,
    bgGradient: "from-indigo-500/10 to-blue-500/10"
  },
  approved: { 
    label: "موافق عليه", 
    color: "bg-green-500/20 text-green-400 border-green-500/30", 
    icon: <CheckCircle2 className="h-4 w-4" />,
    bgGradient: "from-green-500/10 to-emerald-500/10"
  },
  active: { 
    label: "نشط", 
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", 
    icon: <TrendingUp className="h-4 w-4" />,
    bgGradient: "from-emerald-500/10 to-teal-500/10"
  },
  completed: { 
    label: "مكتمل", 
    color: "bg-primary/20 text-primary border-primary/30", 
    icon: <CheckCircle2 className="h-4 w-4" />,
    bgGradient: "from-primary/10 to-primary/5"
  },
  rejected: { 
    label: "مرفوض", 
    color: "bg-red-500/20 text-red-400 border-red-500/30", 
    icon: <AlertTriangle className="h-4 w-4" />,
    bgGradient: "from-red-500/10 to-rose-500/10"
  },
  defaulted: { 
    label: "متعثر", 
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30", 
    icon: <AlertTriangle className="h-4 w-4" />,
    bgGradient: "from-orange-500/10 to-red-500/10"
  },
};

export default function FinancingStatusCard({ application, installments = [], showClientInfo = true }: FinancingStatusCardProps) {
  const config = statusConfig[application.status] || statusConfig.pending;
  
  // Calculate statistics
  const totalAmount = application.approved_amount || application.requested_amount;
  const paidInstallments = installments.filter(i => i.status === "paid");
  const pendingInstallments = installments.filter(i => i.status === "pending");
  const overdueInstallments = installments.filter(i => i.status === "overdue");
  const totalPaid = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const totalRemaining = installments.filter(i => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0);
  const nextInstallment = installments.find(i => i.status === "pending");
  const progressPercent = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  
  // Check if promissory note is signed
  const isPromissoryNoteSigned = !!application.promissory_note_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`overflow-hidden bg-gradient-to-br ${config.bgGradient}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">حالة التمويل</CardTitle>
                <p className="text-sm text-muted-foreground">#{application.application_number}</p>
              </div>
            </div>
            <Badge className={`${config.color} flex items-center gap-1.5 px-3 py-1.5`}>
              {config.icon}
              <span>{config.label}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6" dir="rtl">
          {/* Signature Status for awaiting_signature */}
          {application.status === "awaiting_signature" && (
            <div className={`p-4 rounded-xl border ${isPromissoryNoteSigned ? "bg-emerald-500/10 border-emerald-500/30" : "bg-indigo-500/10 border-indigo-500/30"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPromissoryNoteSigned ? "bg-emerald-500" : "bg-indigo-500"}`}>
                  {isPromissoryNoteSigned ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : (
                    <FileSignature className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <p className={`font-bold ${isPromissoryNoteSigned ? "text-emerald-400" : "text-indigo-400"}`}>
                    {isPromissoryNoteSigned ? "تم توقيع الكمبيالة ✓" : "بانتظار توقيع الكمبيالة"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPromissoryNoteSigned 
                      ? "بانتظار تفعيل التمويل من الإدارة" 
                      : "يرجى توقيع الكمبيالة لإتمام عملية التمويل"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Client Info */}
          {showClientInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  بيانات العميل
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{application.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{application.national_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{application.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{application.email}</span>
                  </div>
                  {application.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{application.address}</span>
                    </div>
                  )}
                  {application.company_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{application.company_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  تفاصيل التمويل
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">المبلغ المطلوب:</span>
                    <span className="font-bold">{application.requested_amount.toLocaleString()} ر.س</span>
                  </div>
                  {application.approved_amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">المبلغ الموافق عليه:</span>
                      <span className="font-bold text-emerald-400">{application.approved_amount.toLocaleString()} ر.س</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">خطة التمويل:</span>
                    <span>{application.financing_plans?.name_ar || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">عدد الأقساط:</span>
                    <span>{application.financing_plans?.installments_count || "-"} قسط</span>
                  </div>
                  {application.contract_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">رقم العقد:</span>
                      <span className="font-mono text-xs">{application.contract_number}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاريخ التقديم:</span>
                    <span>{format(new Date(application.submitted_at), "dd/MM/yyyy", { locale: ar })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics for Active/Completed financing */}
          {(application.status === "active" || application.status === "completed") && installments.length > 0 && (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">نسبة السداد</span>
                  <span className="font-bold">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">المدفوع</p>
                  <p className="text-lg font-bold text-emerald-400">{totalPaid.toLocaleString()} ر.س</p>
                  <p className="text-xs text-muted-foreground">{paidInstallments.length} قسط</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">المتبقي</p>
                  <p className="text-lg font-bold text-amber-400">{totalRemaining.toLocaleString()} ر.س</p>
                  <p className="text-xs text-muted-foreground">{pendingInstallments.length} قسط</p>
                </div>

                {overdueInstallments.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">متأخرة</p>
                    <p className="text-lg font-bold text-red-400">
                      {overdueInstallments.reduce((sum, i) => sum + i.amount, 0).toLocaleString()} ر.س
                    </p>
                    <p className="text-xs text-muted-foreground">{overdueInstallments.length} قسط</p>
                  </div>
                )}

                {nextInstallment && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">القسط القادم</p>
                    <p className="text-lg font-bold text-blue-400">{nextInstallment.amount.toLocaleString()} ر.س</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(nextInstallment.due_date), "dd MMM", { locale: ar })}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Payment Methods */}
          {(application.status === "active" || application.status === "completed" || 
            application.status === "awaiting_signature") && (
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                طرق سداد الأقساط
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">الرصيد الحالي</p>
                      <p className="text-xs text-muted-foreground">خصم تلقائي من رصيدك</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Landmark className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">تحويل بنكي</p>
                      <p className="text-xs text-muted-foreground">تحويل مباشر للحساب</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">بطاقة ائتمانية</p>
                      <p className="text-xs text-muted-foreground">فيزا / ماستركارد / مدى</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-400 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  موعد سداد الأقساط: يوم 30 من كل شهر ميلادي
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
