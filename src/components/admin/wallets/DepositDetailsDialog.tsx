import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  DollarSign,
  Gift,
  User,
  Calendar,
  FileText,
  Hash,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  total_credited: number;
  bonus_amount: number | null;
  fee_amount: number | null;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
  payment_methods?: {
    name: string;
    name_ar: string;
  } | null;
}

interface DepositDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deposit: Deposit | null;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "completed":
      return { 
        label: "مكتمل", 
        color: "text-emerald-500", 
        bg: "bg-emerald-500/10 border-emerald-500/30",
        icon: CheckCircle
      };
    case "pending":
      return { 
        label: "قيد الانتظار", 
        color: "text-yellow-500", 
        bg: "bg-yellow-500/10 border-yellow-500/30",
        icon: Clock
      };
    case "rejected":
      return { 
        label: "مرفوض", 
        color: "text-red-500", 
        bg: "bg-red-500/10 border-red-500/30",
        icon: XCircle
      };
    default:
      return { 
        label: status, 
        color: "text-muted-foreground", 
        bg: "bg-muted",
        icon: Clock
      };
  }
};

const InfoRow = ({ icon: Icon, label, value, valueColor }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number | null; 
  valueColor?: string;
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
    <span className={`font-medium ${valueColor || ''}`}>
      {value || '-'}
    </span>
  </div>
);

export const DepositDetailsDialog = ({
  isOpen,
  onClose,
  deposit,
  onApprove,
  onReject,
  isLoading,
}: DepositDetailsDialogProps) => {
  if (!deposit) return null;

  const statusConfig = getStatusConfig(deposit.status);
  const StatusIcon = statusConfig.icon;
  const initials = deposit.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "؟؟";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            تفاصيل الإيداع
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${statusConfig.bg}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                <span className={`font-semibold ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <Badge variant="outline" className={statusConfig.bg}>
                #{deposit.id.slice(0, 8)}
              </Badge>
            </div>
          </motion.div>

          {/* User Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {deposit.profile?.full_name || "مستخدم غير معروف"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {deposit.profile?.email || "لا يوجد بريد"}
              </p>
            </div>
          </div>

          {/* Amount Details */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">المبلغ المطلوب</p>
              <p className="text-3xl font-bold text-primary">
                {deposit.amount.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
              </p>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">الرسوم</p>
                <p className="font-semibold text-orange-500">
                  {deposit.fee_amount?.toLocaleString('ar-SA') || 0} ر.س
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">البونص</p>
                <p className="font-semibold text-purple-500">
                  {deposit.bonus_amount?.toLocaleString('ar-SA') || 0} ر.س
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المبلغ الكلي</p>
                <p className="font-semibold text-emerald-500">
                  {deposit.total_credited.toLocaleString('ar-SA')} ر.س
                </p>
              </div>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-0 divide-y divide-border/50">
            <InfoRow 
              icon={CreditCard} 
              label="طريقة الدفع" 
              value={deposit.payment_methods?.name_ar || 'غير محدد'} 
            />
            <InfoRow 
              icon={Hash} 
              label="رقم المعاملة" 
              value={deposit.transaction_id} 
            />
            <InfoRow 
              icon={Calendar} 
              label="تاريخ الإنشاء" 
              value={format(new Date(deposit.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })} 
            />
            {deposit.completed_at && (
              <InfoRow 
                icon={CheckCircle} 
                label="تاريخ الإكمال" 
                value={format(new Date(deposit.completed_at), "dd MMMM yyyy - HH:mm", { locale: ar })} 
                valueColor="text-emerald-500"
              />
            )}
            {deposit.notes && (
              <InfoRow 
                icon={FileText} 
                label="ملاحظات" 
                value={deposit.notes} 
              />
            )}
          </div>

          {/* Action Buttons */}
          {deposit.status === 'pending' && (
            <div className="flex gap-3">
              <Button
                onClick={onApprove}
                disabled={isLoading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 ml-2" />
                    قبول الإيداع
                  </>
                )}
              </Button>
              <Button
                onClick={onReject}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 ml-2" />
                    رفض الإيداع
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositDetailsDialog;
