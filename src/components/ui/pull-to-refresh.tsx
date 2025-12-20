import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export const PullToRefresh = ({ 
  onRefresh, 
  children, 
  className = '',
  threshold = 80 
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const iconRotation = useTransform(y, [0, threshold], [0, 180]);
  const iconScale = useTransform(y, [0, threshold * 0.5, threshold], [0.5, 1, 1.2]);
  const opacity = useTransform(y, [0, threshold * 0.3], [0, 1]);

  const handlePanStart = useCallback(() => {
    if (containerRef.current?.scrollTop === 0) {
      setIsPulling(true);
    }
  }, []);

  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isPulling || isRefreshing) return;
    
    // Only allow pulling down from the top
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      setIsPulling(false);
      y.set(0);
      return;
    }

    const newY = Math.max(0, Math.min(info.offset.y, threshold * 1.5));
    y.set(newY);
  }, [isPulling, isRefreshing, y, threshold]);

  const handlePanEnd = useCallback(async () => {
    if (!isPulling) return;
    
    const currentY = y.get();
    
    if (currentY >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Animate to loading position
      y.set(threshold * 0.6);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    // Animate back to top
    y.set(0);
    setIsPulling(false);
  }, [isPulling, isRefreshing, y, threshold, onRefresh]);

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull indicator */}
      <motion.div
        style={{ opacity, y: useTransform(y, [0, threshold], [-40, 20]) }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
      >
        <motion.div
          className={`flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-md border shadow-lg ${
            isRefreshing 
              ? 'bg-primary/20 border-primary/30' 
              : 'bg-card/80 border-border/50'
          }`}
        >
          <motion.div
            style={{ 
              rotate: isRefreshing ? undefined : iconRotation,
              scale: iconScale
            }}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'text-primary' : 'text-muted-foreground'}`} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Pull text indicator */}
      <motion.div
        style={{ 
          opacity: useTransform(y, [threshold * 0.5, threshold], [0, 1]),
          y: useTransform(y, [0, threshold], [-20, 60])
        }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-40 pointer-events-none"
      >
        <span className="text-xs font-medium text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50">
          {isRefreshing ? 'جارٍ التحديث...' : 'اسحب للتحديث'}
        </span>
      </motion.div>

      {/* Content wrapper */}
      <motion.div
        style={{ y: isPulling || isRefreshing ? y : 0 }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
