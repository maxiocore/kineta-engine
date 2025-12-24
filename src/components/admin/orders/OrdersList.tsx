import { motion } from "framer-motion";
import { Package, Loader2, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import OrderRow from "./OrderRow";

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

interface OrdersListProps {
  orders: Order[];
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onCancelOrder: (order: Order) => void;
}

const OrdersList = ({
  orders,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewOrder,
  onDeleteOrder,
  onCancelOrder,
}: OrdersListProps) => {
  return (
    <Card className="border-border/40 overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between px-4 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-primary" />
          قائمة الطلبات
          <Badge variant="secondary" className="rounded-md text-xs">{orders.length}</Badge>
        </CardTitle>
        {orders.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">تحديد الكل</span>
            <Checkbox
              checked={selectedIds.length === orders.length && orders.length > 0}
              onCheckedChange={onToggleSelectAll}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-10 h-10 text-primary" />
            </motion.div>
            <p className="text-muted-foreground text-sm">جاري تحميل الطلبات...</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/30 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">لا توجد طلبات</p>
            <p className="text-xs text-muted-foreground/70">لم يتم العثور على طلبات تطابق البحث</p>
          </motion.div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div>
              {orders.map((order, index) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.includes(order.id)}
                  onSelect={onToggleSelect}
                  onView={onViewOrder}
                  onDelete={onDeleteOrder}
                  onCancel={onCancelOrder}
                  index={index}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersList;
