/**
 * Application Progress Bar Component
 */

import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between gap-1">
          {visibleSteps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center flex-1 ${
                  index > currentStep ? "opacity-40" : ""
                }`}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                    transition-all duration-300
                    ${isCompleted 
                      ? "bg-emerald-500 text-white" 
                      : isCurrent 
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>
                <span 
                  className={`
                    text-[10px] mt-1 text-center leading-tight hidden sm:block
                    ${isCurrent ? "text-primary font-medium" : "text-muted-foreground"}
                  `}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Auto-save indicator */}
        {lastSavedAt && (
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              تم الحفظ {format(new Date(lastSavedAt), "p", { locale: ar })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
