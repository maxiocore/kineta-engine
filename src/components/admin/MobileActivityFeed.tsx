import { motion } from "framer-motion";
import { Clock, Users, ShoppingCart, Ticket, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  type: "order" | "user" | "ticket";
  message: string;
  details?: string;
  time: string;
  isNew?: boolean;
}

interface MobileActivityFeedProps {
  activities: Activity[];
}

const getActivityConfig = (type: string) => {
  switch (type) {
    case "order":
      return { icon: ShoppingCart, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
    case "user":
      return { icon: Users, color: "text-success", bg: "bg-success/10", border: "border-success/20" };
    case "ticket":
      return { icon: Ticket, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" };
    default:
      return { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
  }
};

const MobileActivityFeed = ({ activities }: MobileActivityFeedProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg sm:rounded-xl border border-border/40 p-2 sm:p-3"
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-2 sm:mb-2.5 flex-row-reverse">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-row-reverse">
          <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <span className="text-xs sm:text-sm font-semibold">النشاط الأخير</span>
        </div>
        <Badge variant="secondary" className="text-[8px] sm:text-[10px] h-4 sm:h-5">
          {activities.length} نشاط
        </Badge>
      </div>

      <ScrollArea className="h-[200px] -mx-1 px-1">
        <div className="space-y-1.5">
          {activities.slice(0, 6).map((activity, index) => {
            const config = getActivityConfig(activity.type);
            const IconComponent = config.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                whileTap={{ scale: 0.98, x: -2 }}
                className={cn(
                  "flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer flex-row-reverse",
                  "bg-secondary/30 border hover:bg-secondary/50 active:bg-secondary/70",
                  config.border
                )}
              >
                <div className={cn("p-1.5 rounded-md shrink-0", config.bg)}>
                  <IconComponent className={cn("w-3.5 h-3.5", config.color)} />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-xs font-medium truncate">{activity.message}</p>
                  <p className="text-[10px] text-muted-foreground">{activity.time}</p>
                </div>
                {activity.isNew && (
                  <Badge className="h-4 text-[8px] px-1 bg-primary/10 text-primary border-0 shrink-0">جديد</Badge>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </motion.div>
            );
          })}
          {activities.length === 0 && (
            <div className="flex flex-col items-center py-6 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">لا يوجد نشاط حتى الآن</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export default MobileActivityFeed;
