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
        "text-primary-foreground font-bold py-4 whitespace-nowrap cursor-pointer hover:bg-primary/80 transition-colors select-none",
        align === 'center' ? 'text-center' : 'text-right',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className={cn(
        "flex items-center gap-2",
        align === 'center' && "justify-center"
      )}>
        {children}
        <motion.div
          initial={false}
          animate={{ 
            opacity: isActive ? 1 : 0.5,
            scale: isActive ? 1 : 0.8
          }}
        >
          {isActive ? (
            direction === 'asc' ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5" />
          )}
        </motion.div>
      </div>
    </TableHead>
  );
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
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <SortableHeader 
                  field="order_number" 
                  currentSort={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  <Copy className="w-4 h-4" />
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
                <TableHead className="text-primary-foreground font-bold text-right py-4 whitespace-nowrap">الرابط</TableHead>
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
                <TableHead className="text-primary-foreground font-bold text-center py-4 whitespace-nowrap">عدد البدا</TableHead>
                <SortableHeader 
                  field="service" 
                  currentSort={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  الخدمة
                </SortableHeader>
                <TableHead className="text-primary-foreground font-bold text-center py-4 whitespace-nowrap">العدد المتبقي</TableHead>
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
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2"
          dir="rtl"
        >
          {/* Page Info & Size Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">عرض</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[70px] h-9">
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
              <span className="text-sm text-muted-foreground">من أصل {orders.length}</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              صفحة {currentPage} من {totalPages}
            </div>
          </div>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <Button
                  key={index}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ) : (
                <span key={index} className="px-2 text-muted-foreground">...</span>
              )
            ))}

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
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
