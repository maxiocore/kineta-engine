import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function FinancingStatusTimelineSkeleton() {
  return (
    <div className="w-full py-6" dir="rtl">
      <div className="relative flex items-center justify-between">
        {/* خط التقدم */}
        <div className="absolute top-5 right-5 left-5 h-0.5 bg-muted" />
        
        {[...Array(5)].map((_, i) => (
          <div key={i} className="relative flex flex-col items-center z-10">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-16 h-3 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinancingStatusCardSkeleton() {
  return (
    <Card dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function FinancingActivityLogSkeleton() {
  return (
    <div dir="rtl">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinancingStatusPageSkeleton() {
  return (
    <div className="space-y-6" dir="rtl">
      <FinancingStatusTimelineSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FinancingStatusCardSkeleton />
        </div>
        <div>
          <Card>
            <CardContent className="pt-6">
              <FinancingActivityLogSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
