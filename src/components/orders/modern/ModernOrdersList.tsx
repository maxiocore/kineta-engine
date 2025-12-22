import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import ModernOrderCard from "./ModernOrderCard";

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

interface ModernOrdersListProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ModernOrdersList = ({ 
  orders, 
  loading, 
  onViewOrder,
  emptyTitle = "لا توجد طلبات",
  emptyDescription = "ابدأ بإنشاء طلبك الأول"
}: ModernOrdersListProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
        >
          <Package className="w-6 h-6 text-white" />
        </motion.div>
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
          className="w-24 h-24 rounded-3xl bg-muted/50 flex items-center justify-center mb-6"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ShoppingBag className="w-12 h-12 text-muted-foreground/50" />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{emptyDescription}</p>
        
        <Button
          onClick={() => navigate('/dashboard/our-services')}
          className="gap-2 rounded-xl"
        >
          <ShoppingBag className="w-4 h-4" />
          طلب جديد
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-1">
        <AnimatePresence mode="popLayout">
          {orders.map((order, index) => (
            <ModernOrderCard
              key={order.id}
              order={order}
              index={index}
              onClick={() => onViewOrder(order)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};

export default ModernOrdersList;
