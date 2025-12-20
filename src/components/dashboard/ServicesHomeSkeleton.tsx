import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ServicesHomeSkeleton = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 lg:space-y-12" 
      dir="rtl"
    >
      {/* Header Skeleton */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/30 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Side */}
            <div className="flex items-start gap-4 sm:gap-5">
              <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl animate-pulse" />
              
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl blur-xl" />
                  <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32 rounded-lg animate-pulse" />
                  <Skeleton className="h-4 w-40 rounded-md animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right Side - Stats */}
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/80 border border-border/50">
                    <Skeleton className="w-10 h-10 rounded-xl animate-pulse" />
                    <Skeleton className="h-4 w-12 rounded-md animate-pulse" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Service Cards Skeleton */}
      <div className="grid gap-5 sm:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="group"
          >
            <Card className="h-full relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/95 to-card/90">
              {/* Animated shimmer overlay */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              
              <CardContent className="relative z-10 p-6 sm:p-7 flex flex-col h-full min-h-[280px]">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <Skeleton className="w-14 h-14 rounded-2xl animate-pulse" />
                  <Skeleton className="h-5 w-16 rounded-md animate-pulse" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-40 rounded-lg animate-pulse" />
                    <Skeleton className="h-6 w-10 rounded-full animate-pulse" />
                  </div>
                  <Skeleton className="h-4 w-32 rounded-md animate-pulse" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded-md animate-pulse" />
                    <Skeleton className="h-4 w-3/4 rounded-md animate-pulse" />
                  </div>
                </div>

                {/* Platforms */}
                <div className="flex items-center gap-2 mt-5 pt-5 border-t border-border/30">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="w-9 h-9 rounded-xl animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Features Skeleton */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="relative"
            >
              <div className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-card/80 border border-border/30">
                <Skeleton className="w-14 h-14 rounded-2xl animate-pulse" />
                <div className="text-center space-y-2">
                  <Skeleton className="h-4 w-20 mx-auto rounded-md animate-pulse" />
                  <Skeleton className="h-3 w-24 mx-auto rounded-md animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Banner Skeleton */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative overflow-hidden rounded-3xl"
      >
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-purple-600/10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Skeleton className="w-16 h-16 rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40 rounded-lg animate-pulse" />
                <Skeleton className="h-4 w-64 rounded-md animate-pulse" />
              </div>
            </div>
            <Skeleton className="h-12 w-32 rounded-2xl animate-pulse" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ServicesHomeSkeleton;
