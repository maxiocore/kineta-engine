import { motion } from "framer-motion";
import { Sparkles, RefreshCw, Calendar, Activity, Zap } from "lucide-react";
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
      
      {/* Animated particles */}
      <motion.div
        className="absolute top-2 left-1/4 w-1 h-1 bg-primary/50 rounded-full"
        animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      <div className="relative z-10 flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <div className="text-right">
            <h1 className="text-base font-bold">لوحة التحكم</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-row-reverse">
              <Calendar className="w-3 h-3" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-row-reverse">
          <motion.div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20 flex-row-reverse"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="w-3 h-3 text-success" />
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-success font-medium">مباشر</span>
          </motion.div>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 hover:bg-primary/10 hover:border-primary/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileDashboardHeader;
