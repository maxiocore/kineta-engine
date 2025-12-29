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
      className="relative overflow-hidden rounded-xl bg-gradient-to-l from-primary/10 via-accent/5 to-transparent border border-border/40 p-3"
      dir="rtl"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-accent/10 rounded-full blur-xl" />
      
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <motion.div
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 shrink-0"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">لوحة التحكم</h1>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{currentDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <motion.div 
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 border border-success/20"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-success font-medium">مباشر</span>
          </motion.div>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-7 w-7 hover:bg-primary/10 hover:border-primary/30"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileDashboardHeader;
