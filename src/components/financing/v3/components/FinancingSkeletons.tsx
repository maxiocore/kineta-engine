/**
 * ASH HOLDING Financing System v3 - Skeletons
 * هياكل تحميل iOS-first
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function HeroCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-[28px] bg-muted p-6 lg:p-8', className)}>
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-12 w-44 mb-8" />
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function StatsCardsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-2.5', className)}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-card border border-border">
          <Skeleton className="w-9 h-9 rounded-xl mb-2.5" />
          <Skeleton className="h-3 w-16 mb-1.5" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

export function TimelineSkeleton({ className, isMobile = false }: { className?: string; isMobile?: boolean }) {
  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <Skeleton className="w-9 h-9 rounded-xl" />
              {i < 4 && <Skeleton className="w-0.5 flex-1 min-h-[28px] mt-1" />}
            </div>
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('py-6', className)}>
      <div className="flex justify-between">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5">
            <Skeleton className="w-11 h-11 rounded-xl" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WalletCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-card border border-border p-5', className)}>
      <div className="flex items-center gap-3 mb-5">
        <Skeleton className="w-11 h-11 rounded-2xl" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-10 w-36 mb-5" />
      <div className="flex gap-2.5">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function ActivityLogSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3.5 p-4 rounded-xl bg-muted/20">
          <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FinancingPageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" dir="rtl">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
      <HeroCardSkeleton />
      <StatsCardsSkeleton />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <ActivityLogSkeleton />
        </div>
        <WalletCardSkeleton />
      </div>
    </div>
  );
}