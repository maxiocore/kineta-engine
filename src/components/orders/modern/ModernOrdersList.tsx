import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ShoppingBag, ArrowLeft, Sparkles, Search, Filter } from "lucide-react";
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

// Stagger container animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

// Loading skeleton component
const OrderSkeleton = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-card/50 rounded-3xl border border-border/50 p-6 space-y-4"
  >
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-muted animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-24 bg-muted rounded-lg animate-pulse" />
        <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
      </div>
    </div>
    <div className="h-5 w-3/4 bg-muted rounded-lg animate-pulse" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-16 bg-muted rounded-xl animate-pulse" />
      <div className="h-16 bg-muted rounded-xl animate-pulse" />
    </div>
    <div className="h-2.5 bg-muted rounded-full animate-pulse" />
    <div className="h-4 w-1/2 bg-muted rounded-lg animate-pulse" />
  </motion.div>
);

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
      <div className="space-y-6">
        {/* Loading Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-4 py-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30">
              <Package className="w-8 h-8 text-white" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
          <div className="text-right">
            <h3 className="font-bold text-lg">جاري التحميل</h3>
            <p className="text-sm text-muted-foreground">يتم جلب طلباتك...</p>
          </div>
        </motion.div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <OrderSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative flex flex-col items-center justify-center py-24 text-center overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Main Icon */}
        <motion.div 
          className="relative mb-8"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-xl">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/40" />
          </div>
          
          {/* Floating Elements */}
          <motion.div
            className="absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          
          <motion.div
            className="absolute -bottom-2 -left-2 w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
          >
            <Search className="w-4 h-4 text-white" />
          </motion.div>
        </motion.div>
        
        <motion.h3 
          className="text-2xl font-bold text-foreground mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {emptyTitle}
        </motion.h3>
        
        <motion.p 
          className="text-muted-foreground mb-8 max-w-sm text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {emptyDescription}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => navigate('/dashboard/our-services')}
            size="lg"
            className="gap-3 rounded-2xl px-8 py-6 text-lg shadow-xl shadow-primary/30 bg-gradient-to-l from-primary to-accent hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300"
          >
            <ShoppingBag className="w-5 h-5" />
            اطلب الآن
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>
        
        {/* Hint Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-sm text-muted-foreground flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          أو جرب تغيير الفلاتر لرؤية طلبات أخرى
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Orders Count Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          <span>عرض <strong className="text-foreground">{orders.length}</strong> طلب</span>
        </div>
      </motion.div>

      <ScrollArea className="h-[calc(100vh-450px)] min-h-[400px]">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
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
        </motion.div>
      </ScrollArea>
    </div>
  );
};

export default ModernOrdersList;
