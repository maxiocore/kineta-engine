import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DesignOrderCard } from "./DesignOrderCard";

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

interface DesignOrdersListProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

const OrderSkeleton = () => (
  <div className="rounded-3xl border border-border/50 bg-card overflow-hidden">
    <div className="h-1 bg-gradient-to-l from-violet-500/50 via-fuchsia-500/50 to-pink-500/50" />
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <Skeleton className="h-2.5 rounded-full w-full" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <div className="flex justify-between pt-4 border-t border-border/30">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </div>
);

export const DesignOrdersList = memo(({ 
  orders, 
  loading, 
  onViewOrder,
  emptyTitle = "لا توجد طلبات تصميم",
  emptyDescription = "اطلب خدمات التصميم الآن"
}: DesignOrdersListProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <OrderSkeleton key={i} />
        ))}
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
        <motion.div 
          className="relative mb-6"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <Palette className="w-12 h-12 text-white" />
          </div>
          <motion.div 
            className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
        </motion.div>
        <h3 className="text-xl font-bold text-foreground mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground text-sm max-w-xs">{emptyDescription}</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <AnimatePresence mode="popLayout">
        {orders.map((order, index) => (
          <DesignOrderCard
            key={order.id}
            order={order}
            index={index}
            onClick={() => onViewOrder(order)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

DesignOrdersList.displayName = "DesignOrdersList";

export default DesignOrdersList;
