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
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-border/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold">لوحة التحكم</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-success font-medium">مباشر</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboardHeader;
