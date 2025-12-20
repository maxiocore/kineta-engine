import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface ServicesPageSkeletonProps {
  title?: string;
  color?: 'purple' | 'emerald' | 'blue';
}

export const ServicesPageSkeleton = ({ 
  title = "الخدمات", 
  color = 'purple' 
}: ServicesPageSkeletonProps) => {
  const gradients = {
    purple: 'from-purple-500/20 to-pink-500/10',
    emerald: 'from-emerald-500/20 to-teal-500/10',
    blue: 'from-blue-500/20 to-cyan-500/10',
  };

  const iconBg = {
    purple: 'from-purple-500 to-pink-500',
    emerald: 'from-emerald-500 to-teal-500',
    blue: 'from-blue-500 to-cyan-500',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6" 
      dir="rtl"
    >
      {/* Header Skeleton */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[color]} border border-border/30 p-6`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl animate-pulse" />
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${iconBg[color]} rounded-xl blur-lg opacity-30`} />
              <Skeleton className="relative w-12 h-12 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-36 rounded-lg animate-pulse" />
              <Skeleton className="h-4 w-24 rounded-md animate-pulse" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-16 rounded-full animate-pulse" />
            <Skeleton className="h-6 w-20 rounded-full animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Search & Filters Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Skeleton className="h-11 w-full rounded-xl animate-pulse" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-11 rounded-xl animate-pulse" />
          <Skeleton className="h-11 w-11 rounded-xl animate-pulse" />
        </div>
      </motion.div>

      {/* Services Grid Skeleton */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <Card className="h-full relative overflow-hidden border border-border/50 bg-card/80">
              {/* Shimmer Effect */}
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              
              <CardContent className="p-5 space-y-4">
                {/* Header with icon and badge */}
                <div className="flex items-start justify-between">
                  <Skeleton className="w-12 h-12 rounded-xl animate-pulse" />
                  <Skeleton className="h-5 w-16 rounded-full animate-pulse" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full rounded-md animate-pulse" />
                  <Skeleton className="h-5 w-3/4 rounded-md animate-pulse" />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full rounded-md animate-pulse" />
                  <Skeleton className="h-3 w-5/6 rounded-md animate-pulse" />
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full animate-pulse" />
                  <Skeleton className="h-6 w-20 rounded-full animate-pulse" />
                  <Skeleton className="h-6 w-14 rounded-full animate-pulse" />
                </div>

                {/* Price & Button */}
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <Skeleton className="h-7 w-20 rounded-lg animate-pulse" />
                  <Skeleton className="h-9 w-24 rounded-xl animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ServicesPageSkeleton;
