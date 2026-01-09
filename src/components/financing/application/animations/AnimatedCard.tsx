/**
 * Animated Card with Selection States
 * Touch-friendly with smooth transitions
 */

import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface AnimatedCardProps {
  children: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  index?: number;
  className?: string;
  showCheckmark?: boolean;
  hoverEffect?: "lift" | "glow" | "border" | "none";
}

const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const checkmarkVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
    },
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export function AnimatedCard({
  children,
  isSelected = false,
  onClick,
  disabled = false,
  index = 0,
  className,
  showCheckmark = true,
  hoverEffect = "lift",
}: AnimatedCardProps) {
  const getHoverClass = () => {
    if (disabled) return "";
    switch (hoverEffect) {
      case "lift":
        return "hover:-translate-y-1 hover:shadow-lg";
      case "glow":
        return "hover:shadow-lg hover:shadow-primary/20";
      case "border":
        return "hover:border-primary/50";
      case "none":
        return "";
      default:
        return "";
    }
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className="relative"
    >
      <Card
        onClick={!disabled ? onClick : undefined}
        className={cn(
          "cursor-pointer transition-all duration-300 overflow-hidden",
          getHoverClass(),
          isSelected && "ring-2 ring-primary bg-primary/5 border-primary/30",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <CardContent className="relative p-0">
          {children}
          
          {/* Selection checkmark */}
          {showCheckmark && isSelected && (
            <motion.div
              variants={checkmarkVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
            >
              <Check className="w-4 h-4 text-primary-foreground" />
            </motion.div>
          )}
        </CardContent>
      </Card>
      
      {/* Selection ring animation */}
      {isSelected && (
        <motion.div
          layoutId="selection-ring"
          className="absolute inset-0 rounded-xl ring-2 ring-primary pointer-events-none"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </motion.div>
  );
}

// Skeleton Card for loading states
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 bg-muted rounded-full w-16" />
            <div className="h-6 bg-muted rounded-full w-20" />
            <div className="h-6 bg-muted rounded-full w-14" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
