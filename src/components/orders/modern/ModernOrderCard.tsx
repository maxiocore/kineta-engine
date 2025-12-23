import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle, AlertCircle, XCircle, Loader2, 
  Copy, Check, ExternalLink, Eye, MoreHorizontal,
  Hash, Calendar, Package, Sparkles, TrendingUp,
  RotateCcw, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface ModernOrderCardProps {
  order: {
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
  };
  index: number;
  onClick: () => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": 
      return { 
        label: "قيد الانتظار", 
        gradient: "from-amber-500 to-orange-500",
        bgLight: "bg-amber-500/10",
        textColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-500/30",
        dotColor: "bg-amber-500",
        icon: Clock,
        progress: 10,
        glowColor: "shadow-amber-500/30"
      };
    case "processing": 
      return { 
        label: "قيد المعالجة", 
        gradient: "from-blue-500 to-cyan-500",
        bgLight: "bg-blue-500/10",
        textColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-500/30",
        dotColor: "bg-blue-500",
        icon: Loader2,
        progress: 30,
        animate: true,
        glowColor: "shadow-blue-500/30"
      };
    case "in_progress": 
      return { 
        label: "قيد التنفيذ", 
        gradient: "from-primary to-accent",
        bgLight: "bg-primary/10",
        textColor: "text-primary",
        borderColor: "border-primary/30",
        dotColor: "bg-primary",
        icon: Zap,
        progress: 60,
        animate: true,
        glowColor: "shadow-primary/30"
      };
    case "completed": 
      return { 
        label: "مكتمل", 
        gradient: "from-emerald-500 to-green-500",
        bgLight: "bg-emerald-500/10",
        textColor: "text-emerald-600 dark:text-emerald-400",
        borderColor: "border-emerald-500/30",
        dotColor: "bg-emerald-500",
        icon: CheckCircle,
        progress: 100,
        glowColor: "shadow-emerald-500/30"
      };
    case "partial": 
      return { 
        label: "مكتمل جزئي", 
        gradient: "from-orange-500 to-yellow-500",
        bgLight: "bg-orange-500/10",
        textColor: "text-orange-600 dark:text-orange-400",
        borderColor: "border-orange-500/30",
        dotColor: "bg-orange-500",
        icon: AlertCircle,
        progress: 80,
        glowColor: "shadow-orange-500/30"
      };
    case "cancelled": 
      return { 
        label: "ملغي", 
        gradient: "from-red-500 to-rose-500",
        bgLight: "bg-red-500/10",
        textColor: "text-red-600 dark:text-red-400",
        borderColor: "border-red-500/30",
        dotColor: "bg-red-500",
        icon: XCircle,
        progress: 0,
        glowColor: "shadow-red-500/30"
      };
    case "refunded": 
      return { 
        label: "مسترجع", 
        gradient: "from-purple-500 to-violet-500",
        bgLight: "bg-purple-500/10",
        textColor: "text-purple-600 dark:text-purple-400",
        borderColor: "border-purple-500/30",
        dotColor: "bg-purple-500",
        icon: RotateCcw,
        progress: 0,
        glowColor: "shadow-purple-500/30"
      };
    default: 
      return { 
        label: status, 
        gradient: "from-muted to-muted",
        bgLight: "bg-muted",
        textColor: "text-muted-foreground",
        borderColor: "border-border",
        dotColor: "bg-muted-foreground",
        icon: Clock,
        progress: 0,
        glowColor: "shadow-muted/30"
      };
  }
};

export const ModernOrderCard = memo(({ order, index, onClick }: ModernOrderCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const copyOrderNumber = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    toast.success("تم نسخ رقم الطلب");
    setTimeout(() => setCopied(false), 2000);
  }, [order.order_number]);

  const openLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.link) {
      window.open(order.link, "_blank");
    }
  }, [order.link]);

  const isAnimating = statusConfig.animate;

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        delay: index * 0.05, 
        type: "spring", 
        stiffness: 400, 
        damping: 30 
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative bg-card/80 backdrop-blur-sm rounded-3xl border overflow-hidden cursor-pointer",
        "transition-all duration-500",
        isHovered ? `border-transparent shadow-xl ${statusConfig.glowColor}` : "border-border/50 shadow-sm"
      )}
      onClick={onClick}
    >
      {/* Animated Background Gradient */}
      <motion.div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500",
          statusConfig.gradient
        )}
        animate={{ opacity: isHovered ? 0.05 : 0 }}
      />

      {/* Floating Particles Effect */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={cn("absolute w-2 h-2 rounded-full", statusConfig.dotColor)}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: Math.random() * 100,
                  y: Math.random() * 100
                }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  scale: [0, 1, 0],
                  y: -50
                }}
                transition={{ 
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity
                }}
                style={{
                  left: `${20 + i * 30}%`,
                  top: "80%"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      
      {/* Top Status Bar with Gradient */}
      <motion.div 
        className={cn(
          "absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l",
          statusConfig.gradient
        )}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
        style={{ originX: 1 }}
      />

      {/* Shimmer Effect on Hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.8 }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-4">
            {/* Animated Status Icon */}
            <motion.div 
              className={cn(
                "relative w-14 h-14 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br shadow-lg",
                statusConfig.gradient,
                statusConfig.glowColor
              )}
              animate={isAnimating ? { 
                boxShadow: [
                  `0 0 20px ${statusConfig.dotColor.replace('bg-', '')}`,
                  `0 0 40px ${statusConfig.dotColor.replace('bg-', '')}`,
                  `0 0 20px ${statusConfig.dotColor.replace('bg-', '')}`
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ rotate: [0, -10, 10, 0] }}
            >
              <StatusIcon className={cn(
                "w-7 h-7 text-white",
                isAnimating && "animate-pulse"
              )} />
              
              {/* Pulse Ring for Active Orders */}
              {isAnimating && (
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-2xl bg-gradient-to-br",
                    statusConfig.gradient
                  )}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Sparkle Badge for Completed */}
              {order.status === "completed" && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-lg flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 360] }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </motion.div>
              )}
            </motion.div>
            
            {/* Order Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <motion.code 
                  className="text-base font-mono font-bold text-foreground tracking-wide"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                >
                  {order.order_number}
                </motion.code>
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    onClick={copyOrderNumber}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.15 }}
              >
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-semibold px-3 py-1 rounded-full transition-all duration-300",
                    statusConfig.bgLight,
                    statusConfig.textColor,
                    statusConfig.borderColor
                  )}
                >
                  <motion.span 
                    className={cn("w-2 h-2 rounded-full ml-2", statusConfig.dotColor)}
                    animate={isAnimating ? { 
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.5, 1]
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  {statusConfig.label}
                </Badge>
              </motion.div>
            </div>
          </div>

          {/* Actions Menu */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
            className="flex items-center gap-2"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-9 w-9 rounded-xl transition-all duration-300",
                    "opacity-0 group-hover:opacity-100",
                    "hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl">
                <DropdownMenuItem onClick={copyOrderNumber} className="rounded-lg">
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ رقم الطلب
                </DropdownMenuItem>
                {order.link && (
                  <DropdownMenuItem onClick={openLink} className="rounded-lg">
                    <ExternalLink className="w-4 h-4 ml-2" />
                    فتح الرابط
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }} className="rounded-lg">
                  <Eye className="w-4 h-4 ml-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>

        {/* Service Name with Hover Effect */}
        <motion.h3 
          className="font-bold text-lg text-foreground mb-4 line-clamp-1 group-hover:text-primary transition-colors duration-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          {order.service?.name}
        </motion.h3>

        {/* Details Grid with Icons */}
        <motion.div 
          className="grid grid-cols-2 gap-4 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.25 }}
        >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الكمية</p>
              <p className="font-semibold">{order.quantity?.toLocaleString() || "-"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">السعر</p>
              <p className="font-bold text-primary">{order.total_price.toFixed(2)} <span className="text-xs text-muted-foreground">ر.س</span></p>
            </div>
          </div>
        </motion.div>

        {/* Animated Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground font-medium">تقدم الطلب</span>
            <motion.span 
              className={cn("font-bold", statusConfig.textColor)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.3 }}
            >
              {statusConfig.progress}%
            </motion.span>
          </div>
          <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                "absolute inset-y-0 right-0 rounded-full bg-gradient-to-l",
                statusConfig.gradient
              )}
              initial={{ width: 0 }}
              animate={{ width: `${statusConfig.progress}%` }}
              transition={{ 
                duration: 1.2, 
                delay: index * 0.06, 
                ease: [0.25, 0.1, 0.25, 1]
              }}
            />
            {/* Shimmer on Progress */}
            {statusConfig.progress > 0 && (
              <motion.div
                className="absolute inset-y-0 w-1/4 bg-gradient-to-l from-transparent via-white/40 to-transparent"
                animate={{ x: ["-100%", "400%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
              />
            )}
          </div>
        </div>

        {/* Footer with Date */}
        <motion.div 
          className="flex items-center justify-between pt-3 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.35 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(order.created_at), "d MMMM yyyy", { locale: ar })}</span>
          </div>
          
          <motion.div
            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full"
            whileHover={{ scale: 1.05 }}
          >
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}</span>
          </motion.div>
        </motion.div>

        {/* External Order ID if exists */}
        {order.external_order_id && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.4 }}
            className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Hash className="w-3 h-3" />
            <span className="font-mono">{order.external_order_id}</span>
          </motion.div>
        )}
      </div>

      {/* Hover Arrow Indicator */}
      <motion.div
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl",
          "bg-gradient-to-br flex items-center justify-center",
          "opacity-0 group-hover:opacity-100 transition-all duration-300",
          statusConfig.gradient
        )}
        initial={{ x: 20 }}
        animate={{ x: isHovered ? 0 : 20 }}
      >
        <Eye className="w-5 h-5 text-white" />
      </motion.div>
    </motion.div>
  );
});

ModernOrderCard.displayName = 'ModernOrderCard';

export default ModernOrderCard;
