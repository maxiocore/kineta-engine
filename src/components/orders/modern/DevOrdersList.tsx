import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DevOrderCard } from "./DevOrderCard";

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

interface DevOrdersListProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

const OrderSkeleton = () => (
  <div className="rounded-3xl border border-border/50 bg-card overflow-hidden">
    {/* Terminal Header */}
    <div className="bg-zinc-900 px-4 py-3 flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Skeleton className="w-3 h-3 rounded-full" />
        <Skeleton className="w-3 h-3 rounded-full" />
        <Skeleton className="w-3 h-3 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <Skeleton className="h-3 rounded-full w-full" />
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-20 rounded-xl" />
        <Skeleton className="flex-1 h-20 rounded-xl" />
      </div>
      <div className="flex justify-between pt-4 border-t border-zinc-700/50">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

export const DevOrdersList = memo(({ 
  orders, 
  loading, 
  onViewOrder,
  emptyTitle = "لا توجد طلبات برمجة",
  emptyDescription = "ابدأ مشروعك البرمجي معنا"
}: DevOrdersListProps) => {
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
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Code className="w-12 h-12 text-white" />
          </div>
          <motion.div 
            className="absolute -bottom-2 -left-2 w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
          </motion.div>
        </motion.div>
        <h3 className="text-xl font-bold text-foreground mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground text-sm max-w-xs">{emptyDescription}</p>
        
        {/* Decorative code lines */}
        <motion.div 
          className="mt-6 text-left bg-zinc-900/50 rounded-xl p-4 border border-zinc-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <code className="text-xs text-emerald-500/70 font-mono block">{"// ابدأ مشروعك الآن"}</code>
          <code className="text-xs text-cyan-500/70 font-mono block">{"const project = await create();"}</code>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <AnimatePresence mode="popLayout">
        {orders.map((order, index) => (
          <DevOrderCard
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

DevOrdersList.displayName = "DevOrdersList";

export default DevOrdersList;
