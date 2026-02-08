/**
 * ASH HOLDING Financing System v3 - Page Transitions
 * انتقالات الصفحات بأسلوب Fade + Slide من اليمين (RTL)
 */

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════
// RTL Page Transition Variants
// ═══════════════════════════════════════════════════════════════════

export const rtlPageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 30, // Slide from right (positive for RTL)
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: -30, // Exit to left
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Tab Content Transition
// ═══════════════════════════════════════════════════════════════════

interface TabTransitionProps {
  children: ReactNode;
  tabKey: string;
  className?: string;
}

export function TabTransition({ children, tabKey, className }: TabTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        variants={rtlPageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Staggered Children Animation
// ═══════════════════════════════════════════════════════════════════

export const staggerContainerVariants: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="enter"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Success/Error Animation
// ═══════════════════════════════════════════════════════════════════

export const successVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
  },
  enter: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

export const errorShakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Pulse Animation for Current Step
// ═══════════════════════════════════════════════════════════════════

export const pulseVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 0 0 0 rgba(var(--primary-rgb), 0)',
  },
  pulse: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0 0 rgba(var(--primary-rgb), 0.4)',
      '0 0 0 10px rgba(var(--primary-rgb), 0)',
      '0 0 0 0 rgba(var(--primary-rgb), 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Card Hover Animation
// ═══════════════════════════════════════════════════════════════════

export const cardHoverVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  hover: {
    y: -4,
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};
