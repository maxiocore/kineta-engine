/**
 * Application Progress Bar Component
 * With Enhanced Animations
 */

import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Save } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  icon: string;
}

interface ApplicationProgressProps {
  steps: Step[];
  currentStep: number;
  lastSavedAt: string | null;
}

export function ApplicationProgress({ steps, currentStep, lastSavedAt }: ApplicationProgressProps) {
  // Show only relevant steps (not result step)
  const visibleSteps = steps.slice(0, 7);
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50"
    >
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "400%"] }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 2,
              ease: "linear",
              repeatDelay: 1,
            }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between gap-1">
          {visibleSteps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex flex-col items-center flex-1 transition-opacity duration-300",
                  index > currentStep && "opacity-40"
                )}
              >
                <motion.div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                    "transition-all duration-300",
                    isCompleted && "bg-emerald-500 text-white",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        {step.icon}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
                <span 
                  className={cn(
                    "text-[10px] mt-1 text-center leading-tight hidden sm:block",
                    isCurrent && "text-primary font-medium",
                    !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Auto-save indicator */}
        <AnimatePresence>
          {lastSavedAt && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Save className="w-3 h-3" />
              </motion.div>
              <span>
                تم الحفظ {format(new Date(lastSavedAt), "p", { locale: ar })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
