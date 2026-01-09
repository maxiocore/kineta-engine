/**
 * Bottom Sheet Component for Mobile
 * Touch-friendly sliding panel from bottom
 */

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
  className?: string;
  showHandle?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  className,
  showHandle = true,
}: BottomSheetProps) {
  const dragControls = useDragControls();

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged down more than 100px with velocity
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 40,
            }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl md:hidden",
              "max-h-[90vh] overflow-hidden",
              className
            )}
          >
            {/* Drag handle */}
            {showHandle && (
              <div 
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1.5 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <h3 className="font-semibold text-lg">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 -m-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain max-h-[calc(90vh-60px)]">
              <div className="px-4 py-4 pb-safe">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Bottom sheet option item
interface BottomSheetOptionProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  isSelected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function BottomSheetOption({
  icon,
  label,
  description,
  isSelected,
  onClick,
  disabled,
}: BottomSheetOptionProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl text-right transition-colors",
        "active:bg-accent",
        isSelected ? "bg-primary/10 border-2 border-primary" : "hover:bg-accent border-2 border-transparent",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon && (
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {icon}
        </div>
      )}
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-primary-foreground"
          >
            <motion.path
              d="M5 12l5 5L20 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </motion.button>
  );
}
