import { motion } from "framer-motion";
import { 
  Clock, 
  Loader2, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RotateCcw,
  Copy,
  ExternalLink,
  Eye,
  Trash2,
  MoreVertical,
  User,
  Package,
  LinkIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  quantity: number | null;
  link: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  external_order_id: string | null;
  external_status: string | null;
  service: { id: string; name: string; category: string } | null;
  profile: { full_name: string | null; email: string | null } | null;
}

interface OrderRowProps {
  order: Order;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (order: Order) => void;
  onDelete: (id: string) => void;
  onCancel: (order: Order) => void;
  index: number;
}

const statusConfig: Record<string, { label: string; icon: any; bgColor: string; textColor: string; borderColor: string }> = {
  pending: { label: "انتظار", icon: Clock, bgColor: "bg-amber-500/10", textColor: "text-amber-500", borderColor: "border-amber-500/30" },
  processing: { label: "معالجة", icon: Loader2, bgColor: "bg-blue-500/10", textColor: "text-blue-500", borderColor: "border-blue-500/30" },
  in_progress: { label: "تنفيذ", icon: Activity, bgColor: "bg-violet-500/10", textColor: "text-violet-500", borderColor: "border-violet-500/30" },
  completed: { label: "مكتمل", icon: CheckCircle, bgColor: "bg-emerald-500/10", textColor: "text-emerald-500", borderColor: "border-emerald-500/30" },
  partial: { label: "جزئي", icon: AlertCircle, bgColor: "bg-orange-500/10", textColor: "text-orange-500", borderColor: "border-orange-500/30" },
  cancelled: { label: "ملغي", icon: XCircle, bgColor: "bg-red-500/10", textColor: "text-red-500", borderColor: "border-red-500/30" },
  refunded: { label: "مسترد", icon: RotateCcw, bgColor: "bg-slate-500/10", textColor: "text-slate-500", borderColor: "border-slate-500/30" },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { 
    label: status, 
    icon: Clock, 
    bgColor: "bg-muted/50", 
    textColor: "text-muted-foreground", 
    borderColor: "border-muted" 
  };
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("تم النسخ");
};

const OrderRow = ({ order, isSelected, onSelect, onView, onDelete, onCancel, index }: OrderRowProps) => {
  const config = getStatusConfig(order.status);
  const StatusIcon = config.icon;
  const canCancel = !['cancelled', 'refunded', 'completed'].includes(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "p-3 sm:p-4 border-b border-border/30 hover:bg-secondary/30 transition-colors",
        isSelected && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3 flex-row-reverse">
        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(order)}
            className="h-8 w-8"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onView(order)} className="gap-2 flex-row-reverse">
                <Eye className="w-4 h-4" />
                عرض التفاصيل
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyToClipboard(order.order_number)} className="gap-2 flex-row-reverse">
                <Copy className="w-4 h-4" />
                نسخ رقم الطلب
              </DropdownMenuItem>
              {order.link && (
                <DropdownMenuItem asChild>
                  <a href={order.link} target="_blank" rel="noopener noreferrer" className="gap-2 flex-row-reverse">
                    <ExternalLink className="w-4 h-4" />
                    فتح الرابط
                  </a>
                </DropdownMenuItem>
              )}
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onCancel(order)} className="gap-2 flex-row-reverse text-orange-600">
                    <RotateCcw className="w-4 h-4" />
                    إلغاء واسترداد الرصيد
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(order.id)} className="gap-2 flex-row-reverse text-destructive">
                <Trash2 className="w-4 h-4" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2 text-right">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 flex-row-reverse">
            <div className="flex items-center gap-2 flex-wrap flex-row-reverse">
              <button 
                onClick={() => copyToClipboard(order.order_number)}
                className="font-mono text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1 flex-row-reverse"
              >
                {order.order_number}
                <Copy className="w-3 h-3 opacity-50" />
              </button>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] h-5 gap-1 rounded-md flex-row-reverse",
                  config.bgColor, 
                  config.textColor, 
                  config.borderColor
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}
            </span>
          </div>

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground justify-end flex-row-reverse">
            <div className="flex items-center gap-1 flex-row-reverse">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[120px]">
                {order.profile?.full_name || order.profile?.email || "غير معروف"}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-row-reverse">
              <Package className="w-3 h-3" />
              <span className="truncate max-w-[150px]">
                {order.service?.name || "غير محدد"}
              </span>
            </div>
            {order.link && (
              <a 
                href={order.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline flex-row-reverse"
              >
                <LinkIcon className="w-3 h-3" />
                الرابط
              </a>
            )}
          </div>

          {/* Price & Quantity */}
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-3 flex-row-reverse">
              <span className="font-semibold text-sm">{order.total_price.toFixed(2)} ر.س</span>
              {order.quantity && (
                <span className="text-xs text-muted-foreground">
                  الكمية: {order.quantity.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(order.id)}
          className="mt-1"
        />
      </div>
    </motion.div>
  );
};

export default OrderRow;
export { getStatusConfig, statusConfig };
