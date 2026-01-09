/**
 * Success/Fail Feedback Animations
 */

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackConfig {
  icon: typeof Check;
  color: string;
  bgColor: string;
  borderColor: string;
}

const FEEDBACK_CONFIG: Record<FeedbackType, FeedbackConfig> = {
  success: {
    icon: Check,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  error: {
    icon: X,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
};

// Animated feedback badge
interface FeedbackBadgeProps {
  type: FeedbackType;
  message: string;
  isVisible: boolean;
  onClose?: () => void;
}

export function FeedbackBadge({ type, message, isVisible, onClose }: FeedbackBadgeProps) {
  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border",
            config.bgColor,
            config.borderColor
          )}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
            className={cn("p-1 rounded-full", config.bgColor)}
          >
            <Icon className={cn("w-4 h-4", config.color)} />
          </motion.div>
          <span className="text-sm flex-1">{message}</span>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-background/50 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Success checkmark animation
export function SuccessCheckmark({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      {/* Circle */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        style={{ width: size, height: size }}
      >
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-emerald-500"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeLinecap: "round",
          }}
        />
      </motion.svg>
      
      {/* Checkmark */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        style={{ width: size, height: size }}
      >
        <motion.path
          d="M30 50 L45 65 L70 35"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-emerald-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          style={{
            strokeLinecap: "round",
            strokeLinejoin: "round",
          }}
        />
      </motion.svg>
      
      {/* Burst effect */}
      <motion.div
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute inset-0 rounded-full bg-emerald-500/20"
      />
    </motion.div>
  );
}

// Error X animation
export function ErrorCross({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      {/* Circle */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        style={{ width: size, height: size }}
      >
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-destructive"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ strokeLinecap: "round" }}
        />
      </motion.svg>
      
      {/* X mark */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        style={{ width: size, height: size }}
      >
        <motion.path
          d="M35 35 L65 65 M65 35 L35 65"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-destructive"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          style={{
            strokeLinecap: "round",
          }}
        />
      </motion.svg>
      
      {/* Shake effect */}
      <motion.div
        animate={{ x: [0, -5, 5, -5, 5, 0] }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="absolute inset-0"
      />
    </motion.div>
  );
}

// Inline validation indicator
interface ValidationIndicatorProps {
  isValid: boolean | null;
  className?: string;
}

export function ValidationIndicator({ isValid, className }: ValidationIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {isValid !== null && (
        <motion.div
          key={isValid ? "valid" : "invalid"}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center",
            isValid ? "bg-emerald-500" : "bg-destructive",
            className
          )}
        >
          {isValid ? (
            <Check className="w-3 h-3 text-white" />
          ) : (
            <X className="w-3 h-3 text-white" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
