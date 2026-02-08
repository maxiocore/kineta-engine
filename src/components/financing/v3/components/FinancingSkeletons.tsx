/**
 * ASH HOLDING Financing System v3 - Loading Skeletons
 * هياكل تحميل للبيانات المالية
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════
// Hero Card Skeleton
// ═══════════════════════════════════════════════════════════════════

export function HeroCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-3xl bg-gradient-to-br from-muted to-muted/50 p-6 lg:p-8',
      className
    )}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left Section */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-28 rounded-xl" />
          </div>
        </div>

        {/* Right Section - Status */}
        <div className="flex flex-col items-end gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Stats Cards Skeleton
// ═══════════════════════════════════════════════════════════════════

export function StatsCardsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4', className)}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="p-4 lg:p-5 rounded-2xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Timeline Skeleton
// ═══════════════════════════════════════════════════════════════════

export function TimelineSkeleton({ 
  className,
  isMobile = false,
}: { 
  className?: string;
  isMobile?: boolean;
}) {
  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              {i < 4 && <Skeleton className="w-0.5 flex-1 min-h-[32px] mt-2" />}
            </div>
            <div className="flex-1 pb-6">
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('py-8', className)}>
      <div className="flex justify-between">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="h-4 w-16 mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Wallet Card Skeleton
// ═══════════════════════════════════════════════════════════════════

export function WalletCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-3xl bg-gradient-to-br from-muted to-muted/50 p-6 lg:p-8',
      className
    )}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background/50">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="p-4 rounded-xl bg-background/50">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Activity Log Skeleton
// ═══════════════════════════════════════════════════════════════════

export function ActivityLogSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/30">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Full Page Skeleton
// ═══════════════════════════════════════════════════════════════════

export function FinancingPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>

      {/* Hero Card */}
      <HeroCardSkeleton />

      {/* Stats */}
      <StatsCardsSkeleton />

      {/* Tabs */}
      <Skeleton className="h-14 w-full rounded-2xl" />

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-card border">
            <Skeleton className="h-6 w-32 mb-4" />
            <ActivityLogSkeleton />
          </div>
        </div>
        <div>
          <WalletCardSkeleton />
        </div>
      </div>
    </div>
  );
}
