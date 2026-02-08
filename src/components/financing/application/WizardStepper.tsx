/**
 * WizardStepper - Premium iOS-Inspired Stepper
 * RTL-first · Responsive · Animated
 */

import { motion, AnimatePresence } from "framer-motion";
import { Check, Save } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  icon: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  lastSavedAt: string | null;
}

export function WizardStepper({ steps, currentStep, lastSavedAt }: WizardStepperProps) {
  const visibleSteps = steps.slice(0, 7);
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40"
    >
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
        {/* Step counter + auto-save */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">
              الخطوة {currentStep + 1}
            </span>
            <span className="text-xs text-muted-foreground">
              من {visibleSteps.length}
            </span>
          </div>
          
          <AnimatePresence>
            {lastSavedAt && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.4 }}>
                  <Save className="w-3 h-3 text-primary/60" />
                </motion.div>
                <span>محفوظ {format(new Date(lastSavedAt), "p", { locale: ar })}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Bar - Sleek */}
        <div className="relative h-1.5 bg-muted/60 rounded-full overflow-hidden mb-3">
          <motion.div
            className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-primary via-primary to-primary/80"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>

        {/* Step indicators - Compact dots on mobile, full on desktop */}
        <div className="flex items-center justify-between gap-0.5">
          {visibleSteps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center flex-1 transition-all duration-300",
                  isFuture && "opacity-30"
                )}
              >
                {/* Step dot/icon */}
                <motion.div
                  className={cn(
                    "relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs",
                    "transition-all duration-300 border-2",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20",
                    isFuture && "bg-muted/50 border-border text-muted-foreground"
                  )}
                  animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ 
                    duration: 2, 
                    repeat: isCurrent ? Infinity : 0, 
                    repeatDelay: 1,
                    ease: "easeInOut" 
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="num"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="text-[10px] font-semibold"
                      >
                        {index + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active pulse ring */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                      animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                </motion.div>

                {/* Step title - hidden on mobile, shown on larger */}
                <span
                  className={cn(
                    "text-[9px] sm:text-[10px] mt-1 text-center leading-tight hidden sm:block whitespace-nowrap",
                    isCurrent && "text-primary font-semibold",
                    isCompleted && "text-muted-foreground",
                    isFuture && "text-muted-foreground/50"
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
