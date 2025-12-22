import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  CreditCard,
  Gift,
  DollarSign
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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
    avatar_url?: string | null;
  } | null;
  payment_methods?: {
    name: string;
    name_ar: string;
  } | null;
}

interface DepositCardProps {
  deposit: Deposit;
  onApprove: (deposit: Deposit) => void;
  onReject: (deposit: Deposit) => void;
  onViewDetails: (deposit: Deposit) => void;
  index: number;
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

export const DepositCard = ({
  deposit,
  onApprove,
  onReject,
  onViewDetails,
  index,
}: DepositCardProps) => {
  const initials = deposit.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "؟؟";

  const statusConfig = getStatusConfig(deposit.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="group"
    >
      <div className={`relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-300 ${
        deposit.status === 'pending' 
          ? 'border-yellow-500/30 hover:border-yellow-500/50 shadow-yellow-500/5' 
          : 'border-border/50 hover:border-primary/30'
      } hover:shadow-lg`}>
        {/* Pending Indicator */}
        {deposit.status === 'pending' && (
          <motion.div 
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        <div className="relative flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={deposit.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {deposit.profile?.full_name || "مستخدم غير معروف"}
              </h3>
              <Badge variant="outline" className={`text-[10px] h-5 ${statusConfig.bg} ${statusConfig.color}`}>
                <StatusIcon className="w-3 h-3 ml-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {deposit.profile?.email || "لا يوجد بريد"}
            </p>
          </div>

          {/* Amount Display */}
          <div className="text-left">
            <div className="flex items-center gap-1 justify-end">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-lg font-bold text-emerald-500">
                {deposit.amount.toLocaleString('ar-SA', { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-muted-foreground">ر.س</span>
            </div>
            {deposit.bonus_amount && deposit.bonus_amount > 0 && (
              <div className="flex items-center gap-1 text-xs text-purple-500 justify-end">
                <Gift className="w-3 h-3" />
                <span>+ {deposit.bonus_amount.toLocaleString('ar-SA')} بونص</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {deposit.status === 'pending' && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                  onClick={() => onApprove(deposit)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => onReject(deposit)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onViewDetails(deposit)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {deposit.payment_methods && (
              <div className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                <span>{deposit.payment_methods.name_ar}</span>
              </div>
            )}
            {deposit.transaction_id && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground/70">#{deposit.transaction_id.slice(0, 8)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(deposit.created_at), { addSuffix: true, locale: ar })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DepositCard;
