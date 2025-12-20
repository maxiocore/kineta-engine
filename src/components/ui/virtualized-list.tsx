import React, { useRef, memo, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  gap?: number;
  horizontal?: boolean;
}

function VirtualizedListInner<T>({
  items,
  renderItem,
  estimateSize = 120,
  overscan = 5,
  className,
  itemClassName,
  gap = 16,
  horizontal = false,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    horizontal,
    gap,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn(
        "overflow-auto",
        horizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden",
        className
      )}
    >
      <div
        style={{
          height: horizontal ? '100%' : `${virtualizer.getTotalSize()}px`,
          width: horizontal ? `${virtualizer.getTotalSize()}px` : '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            className={itemClassName}
            style={{
              position: 'absolute',
              top: horizontal ? 0 : 0,
              left: horizontal ? `${virtualItem.start}px` : 0,
              width: horizontal ? `${virtualItem.size}px` : '100%',
              height: horizontal ? '100%' : `${virtualItem.size}px`,
              transform: horizontal ? undefined : `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;

// Grid virtualization component
interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  estimateRowHeight?: number;
  overscan?: number;
  className?: string;
  gap?: number;
}

function VirtualizedGridInner<T>({
  items,
  renderItem,
  columns = 3,
  estimateRowHeight = 300,
  overscan = 3,
  className,
  gap = 16,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    gap,
  });

  const virtualRows = virtualizer.getVirtualItems();

  const getItemsForRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * columns;
    const endIndex = Math.min(startIndex + columns, items.length);
    return items.slice(startIndex, endIndex);
  }, [items, columns]);

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowItems = getItemsForRow(virtualRow.index);
          const startIndex = virtualRow.index * columns;
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div 
                className="grid h-full"
                style={{ 
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gap: `${gap}px`,
                }}
              >
                {rowItems.map((item, colIndex) => (
                  <div key={startIndex + colIndex} className="h-full">
                    {renderItem(item, startIndex + colIndex)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const VirtualizedGrid = memo(VirtualizedGridInner) as typeof VirtualizedGridInner;

export default VirtualizedList;
