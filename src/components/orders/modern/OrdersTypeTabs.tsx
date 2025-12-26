import React from "react";
import { motion } from "framer-motion";
import { 
  Share2, Palette, Code, LayoutGrid, 
  Instagram, Brush, Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderType = "all" | "social" | "design" | "dev";

interface OrdersTypeTabsProps {
  activeType: OrderType;
  onTypeChange: (type: OrderType) => void;
  counts: {
    all: number;
    social: number;
    design: number;
    dev: number;
  };
}

const tabs = [
  { 
    id: "all" as OrderType, 
    label: "جميع الطلبات", 
    icon: LayoutGrid,
    gradient: "from-primary to-accent",
    bg: "bg-primary/10",
    activeColor: "bg-primary text-primary-foreground"
  },
  { 
    id: "social" as OrderType, 
    label: "مواقع التواصل", 
    icon: Share2,
    subIcon: Instagram,
    gradient: "from-pink-500 to-rose-500",
    bg: "bg-pink-500/10",
    activeColor: "bg-gradient-to-br from-pink-500 to-rose-500 text-white"
  },
  { 
    id: "design" as OrderType, 
    label: "التصميم", 
    icon: Palette,
    subIcon: Brush,
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-500/10",
    activeColor: "bg-gradient-to-br from-violet-500 to-purple-500 text-white"
  },
  { 
    id: "dev" as OrderType, 
    label: "البرمجة", 
    icon: Code,
    subIcon: Terminal,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    activeColor: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
  },
];

export const OrdersTypeTabs = ({ activeType, onTypeChange, counts }: OrdersTypeTabsProps) => {
  return (
    <div className="w-full" dir="rtl">
      {/* Responsive Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        {tabs.map((tab, index) => {
          const isActive = activeType === tab.id;
          const TabIcon = tab.icon;
          const count = counts[tab.id];
          
          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTypeChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all duration-300",
                isActive 
                  ? "border-transparent shadow-lg" 
                  : "border-border/50 bg-card/50 hover:bg-card hover:border-primary/20"
              )}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={cn("absolute inset-0 rounded-xl md:rounded-2xl", tab.activeColor)}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-1 md:gap-2">
                <motion.div 
                  className={cn(
                    "w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-colors",
                    isActive ? "bg-white/20" : tab.bg
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <TabIcon className={cn(
                    "w-4 h-4 md:w-5 md:h-5",
                    isActive ? "text-white" : `text-${tab.gradient.split('-')[1]}-500`
                  )} />
                </motion.div>
                
                <div className="text-center">
                  <p className={cn(
                    "text-xs md:text-sm font-semibold whitespace-nowrap",
                    isActive ? "text-white" : "text-foreground"
                  )}>
                    {tab.label}
                  </p>
                  <motion.span 
                    className={cn(
                      "text-base md:text-lg font-bold",
                      isActive ? "text-white" : "text-primary"
                    )}
                    key={count}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {count}
                  </motion.span>
                </div>
              </div>

              {/* Glow effect */}
              {isActive && (
                <motion.div
                  className={cn(
                    "absolute -inset-1 rounded-xl md:rounded-2xl opacity-20 blur-lg -z-10",
                    tab.activeColor
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersTypeTabs;
