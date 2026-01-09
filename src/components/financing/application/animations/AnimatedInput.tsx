/**
 * Animated Input with Focus States & Micro-interactions
 */

import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ 
    label, 
    error, 
    success, 
    hint,
    icon,
    className, 
    id,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        {label && (
          <Label 
            htmlFor={id}
            className={cn(
              "transition-colors duration-200",
              isFocused && "text-primary",
              error && "text-destructive"
            )}
          >
            {label}
          </Label>
        )}
        
        <div className="relative">
          {/* Input container with animated border */}
          <motion.div
            animate={{
              boxShadow: isFocused 
                ? "0 0 0 3px hsl(var(--primary) / 0.15)" 
                : "0 0 0 0px transparent",
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative rounded-lg overflow-hidden",
              error && "ring-2 ring-destructive/50"
            )}
          >
            {icon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                {icon}
              </div>
            )}
            
            <Input
              ref={ref}
              id={id}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
              className={cn(
                "transition-all duration-200",
                icon && "pr-10",
                success && "border-emerald-500 pr-10",
                error && "border-destructive",
                className
              )}
              {...props}
            />
            
            {/* Success indicator */}
            <AnimatePresence>
              {success && !error && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Error message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 mt-1.5 text-sm text-destructive"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Hint text */}
          {hint && !error && (
            <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
          )}
        </div>
      </motion.div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";
