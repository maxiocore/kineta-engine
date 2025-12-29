import { motion } from "framer-motion";
import { Sparkles, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface MobileDashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const MobileDashboardHeader = ({ onRefresh, isRefreshing }: MobileDashboardHeaderProps) => {
  const currentDate = format(new Date(), "EEEE، d MMMM", { locale: ar });

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-l from-primary/10 via-accent/5 to-transparent border border-border/40 p-2.5 sm:p-3"
      dir="rtl"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full blur-xl" />
      
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <motion.div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 shrink-0"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold truncate">لوحة التحكم</h1>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
              <Calendar className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-none">{currentDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <motion.div 
            className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-success/10 border border-success/20"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] sm:text-[10px] text-success font-medium">مباشر</span>
          </motion.div>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-primary/10 hover:border-primary/30"
          >
            <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileDashboardHeader;
