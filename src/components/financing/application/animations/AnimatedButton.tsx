/**
 * Animated Button with Micro-interactions
 * Touch-friendly with haptic-like feedback
 */

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AnimatedButtonProps extends Omit<ButtonProps, "ref"> {
  isLoading?: boolean;
  loadingText?: string;
  successState?: boolean;
  pulseOnHover?: boolean;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    children, 
    className, 
    isLoading, 
    loadingText,
    successState,
    pulseOnHover = false,
    disabled,
    ...props 
  }, ref) => {
    return (
      <motion.div
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className="relative"
      >
        <Button
          ref={ref}
          disabled={disabled || isLoading}
          className={cn(
            "relative overflow-hidden transition-all duration-200",
            pulseOnHover && !disabled && "hover:shadow-lg hover:shadow-primary/25",
            successState && "bg-emerald-600 hover:bg-emerald-700",
            className
          )}
          {...props}
        >
          {/* Ripple effect layer */}
          <motion.span
            className="absolute inset-0 bg-white/20"
            initial={{ scale: 0, opacity: 0.5 }}
            whileTap={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ borderRadius: "inherit" }}
          />
          
          {/* Content */}
          <span className="relative flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingText || "جاري التحميل..."}</span>
              </>
            ) : (
              children
            )}
          </span>
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

// Icon Button with micro-interaction
interface AnimatedIconButtonProps extends Omit<ButtonProps, "ref"> {
  icon: React.ReactNode;
}

export function AnimatedIconButton({ 
  icon, 
  className, 
  disabled,
  ...props 
}: AnimatedIconButtonProps) {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.1, rotate: 5 } : undefined}
      whileTap={!disabled ? { scale: 0.9 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
    >
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={cn(
          "relative transition-colors",
          className
        )}
        {...props}
      >
        {icon}
      </Button>
    </motion.div>
  );
}
