import { motion } from "framer-motion";
import { Sparkles, RefreshCw, Calendar, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const DashboardHeader = ({ onRefresh, isRefreshing }: DashboardHeaderProps) => {
  const currentDate = format(new Date(), "EEEE، d MMMM yyyy", { locale: ar });

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-accent/5 to-transparent border border-border/50 p-4 sm:p-6"
      dir="rtl"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

      {/* Animated particles */}
      <motion.div
        className="absolute top-4 left-1/4 w-2 h-2 bg-primary/40 rounded-full"
        animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-4 right-1/3 w-1.5 h-1.5 bg-accent/40 rounded-full"
        animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row-reverse sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
          </motion.div>
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text">
              لوحة التحكم
            </h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-row-reverse sm:flex-row">
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="w-3 h-3 text-success" />
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">مباشر</span>
          </motion.div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">تحديث البيانات</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
