/**
 * Loading States - Skeletons & Progress Indicators
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Skeleton with shimmer effect
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className, 
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "h-4 rounded";
      case "circular":
        return "rounded-full aspect-square";
      case "rectangular":
        return "rounded-lg";
      default:
        return "rounded-lg";
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        getVariantClasses(),
        className
      )}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 1.5,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Full page loading skeleton for wizard
export function WizardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      
      {/* Cards skeleton */}
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-4">
                <Skeleton variant="rectangular" className="w-16 h-16" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Button skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
    </div>
  );
}

// Circular progress indicator
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className="text-primary stroke-current"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {/* Value text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{Math.round(value)}%</span>
      </div>
    </div>
  );
}

// Linear progress with animated steps
interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepProgress({ currentStep, totalSteps, className }: StepProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={cn("relative h-2 bg-muted rounded-full overflow-hidden", className)}>
      <motion.div
        className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ 
          duration: 0.5, 
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
      
      {/* Shimmer effect on progress */}
      <motion.div
        className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{ x: ["0%", "500%"] }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 2,
          ease: "linear",
        }}
        style={{ right: `${100 - progress}%` }}
      />
    </div>
  );
}

// Dots loading indicator
export function DotsLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Processing overlay
interface ProcessingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function ProcessingOverlay({ isVisible, message = "جاري المعالجة..." }: ProcessingOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border rounded-2xl p-8 shadow-2xl text-center space-y-4"
      >
        <div className="relative mx-auto w-16 h-16">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
        <p className="text-muted-foreground">{message}</p>
      </motion.div>
    </motion.div>
  );
}
