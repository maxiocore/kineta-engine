import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle, AlertCircle, XCircle, Loader2, 
  Copy, Check, Zap, RotateCcw, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  created_at: string;
  link: string | null;
  quantity: number | null;
  external_status: string | null;
  external_order_id: string | null;
  service: {
    name: string;
    category: string;
  };
}

interface ModernOrdersTableProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": 
      return { 
        label: "قيد الانتظار", 
        bgColor: "bg-amber-500",
        textColor: "text-white",
        icon: Clock,
      };
    case "processing": 
      return { 
        label: "قيد المعالجة", 
        bgColor: "bg-blue-500",
        textColor: "text-white",
        icon: Loader2,
        animate: true
      };
    case "in_progress": 
      return { 
        label: "قيد التنفيذ", 
        bgColor: "bg-purple-500",
        textColor: "text-white",
        icon: Zap,
        animate: true
      };
    case "completed": 
      return { 
        label: "مكتمل", 
        bgColor: "bg-emerald-500",
        textColor: "text-white",
        icon: CheckCircle,
      };
    case "partial": 
      return { 
        label: "مكتمل جزئي", 
        bgColor: "bg-orange-500",
        textColor: "text-white",
        icon: AlertCircle,
      };
    case "cancelled": 
      return { 
        label: "ملغي", 
        bgColor: "bg-red-500",
        textColor: "text-white",
        icon: XCircle,
      };
    case "refunded": 
      return { 
        label: "مسترجع", 
        bgColor: "bg-purple-500",
        textColor: "text-white",
        icon: RotateCcw,
      };
    default: 
      return { 
        label: status, 
        bgColor: "bg-muted",
        textColor: "text-muted-foreground",
        icon: Clock,
      };
  }
};

const OrderTableRow = memo(({ order, index, onClick }: { 
  order: Order; 
  index: number; 
  onClick: () => void 
}) => {
  const [copied, setCopied] = useState(false);
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const copyOrderNumber = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    toast.success("تم نسخ رقم الطلب");
    setTimeout(() => setCopied(false), 2000);
  }, [order.order_number]);

  const copyLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.link) {
      navigator.clipboard.writeText(order.link);
      toast.success("تم نسخ الرابط");
    }
  }, [order.link]);

  const truncateLink = (link: string, maxLength: number = 35) => {
    if (link.length <= maxLength) return link;
    return link.substring(0, maxLength) + '...';
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50"
    >
      {/* Order Number */}
      <TableCell className="py-4">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copyOrderNumber}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </motion.button>
          <code className="font-mono font-bold text-sm text-primary">
            {order.order_number}
          </code>
        </div>
      </TableCell>

      {/* Date */}
      <TableCell className="py-4">
        <div className="text-sm text-foreground">
          {format(new Date(order.created_at), "yyyy-MM-dd", { locale: ar })}
        </div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(order.created_at), "HH:mm:ss")}
        </div>
      </TableCell>

      {/* Link */}
      <TableCell className="py-4 max-w-[200px]">
        {order.link ? (
          <div className="flex items-center gap-2">
            <span 
              className="text-sm text-muted-foreground truncate cursor-pointer hover:text-primary transition-colors"
              onClick={copyLink}
              title={order.link}
            >
              {truncateLink(order.link)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/50">-</span>
        )}
      </TableCell>

      {/* Quantity */}
      <TableCell className="py-4 text-center">
        <span className="font-bold text-sm">
          {order.quantity?.toLocaleString() || 1}
        </span>
      </TableCell>

      {/* Price */}
      <TableCell className="py-4 text-center">
        <span className="font-bold text-sm">
          {order.total_price.toFixed(4)}
        </span>
      </TableCell>

      {/* Start Count (placeholder) */}
      <TableCell className="py-4 text-center">
        <span className="text-sm text-muted-foreground">-</span>
      </TableCell>

      {/* Service Name */}
      <TableCell className="py-4">
        <div className="text-sm font-medium line-clamp-2 max-w-[200px]">
          {order.service?.name}
        </div>
      </TableCell>

      {/* Remaining (placeholder) */}
      <TableCell className="py-4 text-center">
        <span className="text-sm">0</span>
      </TableCell>

      {/* Status */}
      <TableCell className="py-4">
        <Badge 
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-lg gap-1.5",
            statusConfig.bgColor,
            statusConfig.textColor
          )}
        >
          <StatusIcon className={cn(
            "w-3.5 h-3.5",
            statusConfig.animate && "animate-spin"
          )} style={statusConfig.animate ? { animationDuration: '2s' } : {}} />
          {statusConfig.label}
        </Badge>
      </TableCell>
    </motion.tr>
  );
});

OrderTableRow.displayName = "OrderTableRow";

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <TableRow key={i} className="border-b border-border/50">
        {[...Array(9)].map((_, j) => (
          <TableCell key={j} className="py-4">
            <Skeleton className="h-6 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

export const ModernOrdersTable = memo(({ 
  orders, 
  loading, 
  onViewOrder,
  emptyTitle = "لا توجد طلبات",
  emptyDescription = "ابدأ بإنشاء طلبك الأول"
}: ModernOrdersTableProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/90 hover:bg-primary/90">
              <TableHead className="text-primary-foreground font-bold text-right py-4">الرقم</TableHead>
              <TableHead className="text-primary-foreground font-bold text-right py-4">تاريخ الطلب</TableHead>
              <TableHead className="text-primary-foreground font-bold text-right py-4">الرابط</TableHead>
              <TableHead className="text-primary-foreground font-bold text-center py-4">الكمية</TableHead>
              <TableHead className="text-primary-foreground font-bold text-center py-4">الثمن</TableHead>
              <TableHead className="text-primary-foreground font-bold text-center py-4">عدد البدا</TableHead>
              <TableHead className="text-primary-foreground font-bold text-right py-4">الخدمة</TableHead>
              <TableHead className="text-primary-foreground font-bold text-center py-4">العدد المتبقي</TableHead>
              <TableHead className="text-primary-foreground font-bold text-right py-4">حالة الطلب</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Clock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground text-sm">{emptyDescription}</p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground font-bold text-right py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  الرقم
                </div>
              </TableHead>
              <TableHead className="text-primary-foreground font-bold text-right py-4 whitespace-nowrap">تاريخ الطلب</TableHead>
              <TableHead className="text-primary-foreground font-bold text-right py-4 whitespace-nowrap">الرابط</TableHead>
              <TableHead className="text-primary-foreground font-bold text-center py-4 whitespace-nowrap">الكمية</TableHead>
              <TableHead className="text-primary-foreground font-bold text-center py-4 whitespace-nowrap">الثمن</TableHead>
              <TableHead className="text-primary-foreground font-bold text-center py-4 whitespace-nowrap">عدد البدا</TableHead>
              <TableHead className="text-primary-foreground font-bold text-right py-4 whitespace-nowrap">الخدمة</TableHead>
              <TableHead className="text-primary-foreground font-bold text-center py-4 whitespace-nowrap">العدد المتبقي</TableHead>
              <TableHead className="text-primary-foreground font-bold text-right py-4 whitespace-nowrap">حالة الطلب</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => (
                <OrderTableRow
                  key={order.id}
                  order={order}
                  index={index}
                  onClick={() => onViewOrder(order)}
                />
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

ModernOrdersTable.displayName = "ModernOrdersTable";

export default ModernOrdersTable;
