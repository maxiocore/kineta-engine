/**
 * Step Transition Animation Hook
 * Provides smooth transitions between wizard steps
 */

import { Variants } from "framer-motion";

export type TransitionDirection = "forward" | "backward";

interface StepTransitionConfig {
  direction?: TransitionDirection;
  enableBlur?: boolean;
  duration?: number;
}

export function useStepTransition(config: StepTransitionConfig = {}) {
  const { 
    direction = "forward", 
    enableBlur = true, 
    duration = 0.35 
  } = config;

  const isForward = direction === "forward";

  // Main content variants with slide + fade + optional blur
  const stepVariants: Variants = {
    initial: {
      opacity: 0,
      x: isForward ? 40 : -40,
      filter: enableBlur ? "blur(4px)" : "blur(0px)",
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.08,
      },
    },
    exit: {
      opacity: 0,
      x: isForward ? -40 : 40,
      filter: enableBlur ? "blur(4px)" : "blur(0px)",
      scale: 0.98,
      transition: {
        duration: duration * 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  // Child element stagger variants
  const itemVariants: Variants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  // Card reveal variants
  const cardVariants: Variants = {
    initial: {
      opacity: 0,
      y: 30,
      scale: 0.9,
    },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
  };

  return {
    stepVariants,
    itemVariants,
    cardVariants,
  };
}

// Preset animation configurations
export const ANIMATION_PRESETS = {
  // Smooth slide for main content
  slideSmooth: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  
  // Fade with slight scale
  fadeScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.25 },
  },
  
  // Pop effect for success states
  popIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  },
  
  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },
};
