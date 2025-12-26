import React, { memo, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle, AlertCircle, XCircle, Loader2, 
  Copy, Check, Zap, RotateCcw, ChevronRight, ChevronLeft,
  ArrowUpDown, ArrowUp, ArrowDown
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  start_count?: number | null;
  remains?: number | null;
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

type SortField = 'order_number' | 'created_at' | 'quantity' | 'total_price' | 'status' | 'service' | null;
type SortDirection = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = {
  pending: 1,
  processing: 2,
  in_progress: 3,
  partial: 4,
  completed: 5,
  cancelled: 6,
  refunded: 7,
};

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

interface SortableHeaderProps {
  field: SortField;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  className?: string;
  align?: 'right' | 'center';
}

const SortableHeader = ({ field, currentSort, direction, onSort, children, className, align = 'right' }: SortableHeaderProps) => {
  const isActive = currentSort === field;
  
  return (
    <TableHead 
      className={cn(
        "text-primary-foreground/95 font-semibold py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-primary/90 transition-all duration-200 select-none text-sm",
        align === 'center' ? 'text-center' : 'text-right',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className={cn(
        "flex items-center gap-1.5",
        align === 'center' && "justify-center"
      )}>
        {children}
        <motion.div
          initial={false}
          animate={{ 
            opacity: isActive ? 1 : 0.4,
            scale: isActive ? 1 : 0.85
          }}
          transition={{ duration: 0.15 }}
        >
          {isActive ? (
            direction === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3" />
          )}
        </motion.div>
      </div>
    </TableHead>
  );
};

// Mobile Card Component
const OrderCard = memo(({ order, index, onClick }: { 
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

  const executed = order.start_count !== null && order.remains !== null && order.quantity
    ? Math.max(0, (order.quantity || 0) - (order.remains || 0))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onClick}
      className="bg-card border border-border/50 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {/* Header: Order Number & Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copyOrderNumber}
            className="p-1.5 rounded-md hover:bg-accent/20 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </motion.button>
          <code className="text-xs font-mono text-primary font-bold">
            {order.order_number}
          </code>
        </div>
        <Badge 
          className={cn(
            "text-[10px] font-medium px-2 py-1 rounded-md gap-1",
            statusConfig.bgColor,
            statusConfig.textColor
          )}
        >
          <StatusIcon className={cn(
            "w-2.5 h-2.5",
            statusConfig.animate && "animate-spin"
          )} style={statusConfig.animate ? { animationDuration: '2s' } : {}} />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Service Name */}
      <div className="mb-2">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {order.service?.name}
        </p>
      </div>

      {/* Link */}
      {order.link && (
        <div 
          className="mb-2 text-xs text-muted-foreground truncate cursor-pointer hover:text-primary transition-colors"
          onClick={copyLink}
        >
          {order.link}
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <Clock className="w-3 h-3" />
        <span>{format(new Date(order.created_at), "yyyy-MM-dd HH:mm", { locale: ar })}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">الكمية</p>
          <p className="text-sm font-semibold">{order.quantity?.toLocaleString() || 1}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">السعر</p>
          <p className="text-sm font-semibold">{order.total_price.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">المنفذ</p>
          <p className="text-sm font-semibold text-emerald-500">
            {executed !== null ? executed.toLocaleString() : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">المتبقي</p>
          <p className="text-sm font-semibold">
            {order.remains !== null ? order.remains.toLocaleString() : '-'}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

OrderCard.displayName = "OrderCard";

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

  const truncateLink = (link: string, maxLength: number = 30) => {
    if (link.length <= maxLength) return link;
    return link.substring(0, maxLength) + '...';
  };

  // Format order number for display
  const formatOrderNumber = (orderNum: string) => {
    const parts = orderNum.split('-');
    if (parts.length >= 2) {
      return (
        <span className="flex flex-col items-start leading-tight">
          <span className="text-primary font-bold text-sm tracking-wide">{parts[0]}-</span>
          <span className="text-primary font-bold text-sm tracking-wide">{parts.slice(1).join('-')}</span>
        </span>
      );
    }
    return <span className="text-primary font-bold text-sm">{orderNum}</span>;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onClick={onClick}
      className="cursor-pointer group hover:bg-accent/5 transition-all duration-200 border-b border-border/30"
    >
      {/* Order Number */}
      <TableCell className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copyOrderNumber}
            className="p-1.5 rounded-md hover:bg-accent/20 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-muted-foreground" />
            )}
          </motion.button>
          <code className="font-mono">
            {formatOrderNumber(order.order_number)}
          </code>
        </div>
      </TableCell>

      {/* Date */}
      <TableCell className="py-3.5 px-4">
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-foreground">
            {format(new Date(order.created_at), "yyyy-MM-dd", { locale: ar })}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {format(new Date(order.created_at), "HH:mm:ss")}
          </span>
        </div>
      </TableCell>

      {/* Link */}
      <TableCell className="py-3.5 px-4 max-w-[180px]">
        {order.link ? (
          <span 
            className="text-xs text-muted-foreground/80 truncate block cursor-pointer hover:text-primary transition-colors font-mono"
            onClick={copyLink}
            title={order.link}
          >
            {truncateLink(order.link)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/40 text-center block">-</span>
        )}
      </TableCell>

      {/* Quantity */}
      <TableCell className="py-3.5 px-4 text-center">
        <span className="font-semibold text-sm text-foreground tabular-nums">
          {order.quantity?.toLocaleString() || 1}
        </span>
      </TableCell>

      {/* Price */}
      <TableCell className="py-3.5 px-4 text-center">
        <span className="font-semibold text-sm text-foreground tabular-nums">
          {order.total_price.toFixed(4)}
        </span>
      </TableCell>

      {/* Start Count */}
      <TableCell className="py-3.5 px-4 text-center">
        <span className="text-sm text-foreground tabular-nums">
          {order.start_count !== null && order.start_count !== undefined 
            ? order.start_count.toLocaleString() 
            : '-'}
        </span>
      </TableCell>

      {/* Service Name */}
      <TableCell className="py-3.5 px-4">
        <div className="text-sm font-medium text-foreground/90 line-clamp-2 max-w-[180px]">
          {order.service?.name}
        </div>
      </TableCell>

      {/* Delivered/Executed */}
      <TableCell className="py-3.5 px-4 text-center">
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {order.start_count !== null && order.remains !== null && order.quantity
            ? Math.max(0, (order.quantity || 0) - (order.remains || 0)).toLocaleString()
            : '-'}
        </span>
      </TableCell>

      {/* Remaining */}
      <TableCell className="py-3.5 px-4 text-center">
        <span className="text-sm text-foreground tabular-nums">
          {order.remains !== null && order.remains !== undefined 
            ? order.remains.toLocaleString() 
            : '-'}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell className="py-3.5 px-4">
        <Badge 
          className={cn(
            "text-xs font-medium px-3 py-1.5 rounded-md gap-1.5 shadow-sm",
            statusConfig.bgColor,
            statusConfig.textColor
          )}
        >
          <StatusIcon className={cn(
            "w-3 h-3",
            statusConfig.animate && "animate-spin"
          )} style={statusConfig.animate ? { animationDuration: '2s' } : {}} />
          {statusConfig.label}
        </Badge>
      </TableCell>
    </motion.tr>
  );
});

OrderTableRow.displayName = "OrderTableRow";

// Mobile Cards Skeleton
const CardsSkeleton = () => (
  <div className="grid gap-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-card border border-border/50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-3 w-32 mb-3" />
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="text-center">
              <Skeleton className="h-3 w-12 mx-auto mb-1" />
              <Skeleton className="h-5 w-10 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <TableRow key={i} className="border-b border-border/50">
        {[...Array(10)].map((_, j) => (
          <TableCell key={j} className="py-4">
            <Skeleton className="h-6 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const ModernOrdersTable = memo(({ 
  orders, 
  loading, 
  onViewOrder,
  emptyTitle = "لا توجد طلبات",
  emptyDescription = "ابدأ بإنشاء طلبك الأول"
}: ModernOrdersTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  }, [sortField]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    if (!sortField) return orders;

    return [...orders].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'order_number':
          comparison = a.order_number.localeCompare(b.order_number);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
        case 'total_price':
          comparison = a.total_price - b.total_price;
          break;
        case 'status':
          comparison = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
          break;
        case 'service':
          comparison = (a.service?.name || '').localeCompare(b.service?.name || '');
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [orders, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const paginatedOrders = useMemo(() => {
    return sortedOrders.slice(startIndex, endIndex);
  }, [sortedOrders, startIndex, endIndex]);

  // Reset to first page when orders change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [orders.length, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div dir="rtl">
        {/* Mobile: Cards Skeleton */}
        <div className="md:hidden">
          <CardsSkeleton />
        </div>
        
        {/* Desktop: Table Skeleton */}
        <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary border-none">
                <TableHead className="text-primary-foreground/95 font-semibold text-right py-3.5 px-4 text-sm">الرقم</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-right py-3.5 px-4 text-sm">تاريخ الطلب</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-right py-3.5 px-4 text-sm">الرابط</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-center py-3.5 px-4 text-sm">الكمية</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-center py-3.5 px-4 text-sm">الثمن</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-center py-3.5 px-4 text-sm">عدد البدء</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-right py-3.5 px-4 text-sm">الخدمة</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-center py-3.5 px-4 text-sm">المنفذ</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-center py-3.5 px-4 text-sm">المتبقي</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-right py-3.5 px-4 text-sm">حالة الطلب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton />
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 md:py-20 text-center"
        dir="rtl"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted/50 flex items-center justify-center mb-3 md:mb-4">
          <Clock className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
        </div>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-1 md:mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground text-xs md:text-sm">{emptyDescription}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4" dir="rtl">
      {/* Mobile: Cards View */}
      <div className="md:hidden">
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {paginatedOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                onClick={() => onViewOrder(order)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary border-none">
                <SortableHeader 
                  field="order_number" 
                  currentSort={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  <Copy className="w-3.5 h-3.5" />
                  الرقم
                </SortableHeader>
                <SortableHeader 
                  field="created_at" 
                  currentSort={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  تاريخ الطلب
                </SortableHeader>
                <TableHead className="text-primary-foreground/95 font-semibold text-right py-3.5 px-4 whitespace-nowrap text-sm">الرابط</TableHead>
                <SortableHeader 
                  field="quantity" 
                  currentSort={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                  align="center"
                >
                  الكمية
                </SortableHeader>
                <SortableHeader 
                  field="total_price" 
                  currentSort={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                  align="center"
                >
                  الثمن
                </SortableHeader>
                <TableHead className="text-primary-foreground/95 font-semibold text-center py-3.5 px-4 whitespace-nowrap text-sm">عدد البدء</TableHead>
                <SortableHeader 
                  field="service" 
                  currentSort={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  الخدمة
                </SortableHeader>
                <TableHead className="text-primary-foreground/95 font-semibold text-center py-3.5 px-4 whitespace-nowrap text-sm">المنفذ</TableHead>
                <TableHead className="text-primary-foreground/95 font-semibold text-center py-3.5 px-4 whitespace-nowrap text-sm">المتبقي</TableHead>
                <SortableHeader 
                  field="status" 
                  currentSort={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  حالة الطلب
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {paginatedOrders.map((order, index) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1"
        >
          {/* Page Info & Size Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-muted-foreground">عرض</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[60px] md:w-[70px] h-8 md:h-9 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs md:text-sm text-muted-foreground">من {orders.length}</span>
            </div>
            
            <div className="text-xs md:text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </div>
          </div>

          {/* Page Numbers */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                  <Button
                    key={index}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9 text-xs md:text-sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={index} className="px-1.5 text-muted-foreground text-sm">...</span>
                )
              ))}
            </div>

            {/* Mobile: Simple page indicator */}
            <div className="sm:hidden px-3 text-sm font-medium">
              {currentPage}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
});

ModernOrdersTable.displayName = "ModernOrdersTable";

export default ModernOrdersTable;
