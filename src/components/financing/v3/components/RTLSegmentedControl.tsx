/**
 * ASH HOLDING Financing System v3 - RTL Segmented Control
 * تحكم مقسم RTL بديل للتبويبات - أسلوب بنكي
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface SegmentItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface RTLSegmentedControlProps {
  items: SegmentItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RTLSegmentedControl({
  items,
  value,
  onChange,
  className,
}: RTLSegmentedControlProps) {
  const isMobile = useIsMobile();
  const activeIndex = items.findIndex(item => item.id === value);

  // Mobile: Vertical Bank-style list
  if (isMobile) {
    return (
      <div 
        className={cn(
          'flex flex-col gap-1.5 p-1.5 bg-muted/60 rounded-2xl border border-border/50 backdrop-blur-sm',
          className
        )}
        dir="rtl"
      >
        {items.map((item) => {
          const isActive = item.id === value;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active Background */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-primary rounded-xl shadow-md"
                  layoutId="activeSegmentMobile"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              {/* Content */}
              <span className="relative z-10 flex items-center gap-3">
                {Icon && <Icon className="w-5 h-5" />}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    isActive 
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                  )}>
                    {item.badge}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Desktop: Horizontal RTL segmented control
  return (
    <div 
      className={cn(
        'relative inline-flex items-center gap-1 p-1.5 bg-muted/60 rounded-2xl border border-border/50 backdrop-blur-sm',
        className
      )}
      dir="rtl"
    >
      {/* Animated indicator - moves from right to left for RTL */}
      <motion.div
        className="absolute h-[calc(100%-12px)] bg-primary rounded-xl shadow-md"
        initial={false}
        animate={{
          x: `${-activeIndex * 100}%`,
          width: `calc(${100 / items.length}% - 4px)`,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        style={{
          right: '6px',
          top: '6px',
        }}
      />

      {/* Segments */}
      {items.map((item) => {
        const isActive = item.id === value;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center',
                isActive 
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              )}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
