import { motion } from "framer-motion";
import { 
  Clock, 
  ShoppingBag, 
  Users, 
  AlertCircle, 
  Package,
  MessageSquare,
  ChevronLeft,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Activity {
  id: string;
  type: "order" | "user" | "ticket" | "service" | "message";
  message: string;
  time: string;
  timestamp: Date;
  details?: string;
  isNew?: boolean;
}

interface MobileActivityListProps {
  activities: Activity[];
  onViewAll?: () => void;
}

const activityConfig: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  order: { icon: ShoppingBag, color: "text-success", bgColor: "bg-success/10" },
  user: { icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
  ticket: { icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10" },
  service: { icon: Package, color: "text-accent", bgColor: "bg-accent/10" },
  message: { icon: MessageSquare, color: "text-primary", bgColor: "bg-primary/10" },
};

const MobileActivityList = ({ activities, onViewAll }: MobileActivityListProps) => {
  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">النشاط الأخير</span>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            عرض الكل
            <ChevronLeft className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {/* Activities */}
      <div className="divide-y divide-border/30">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">لا يوجد نشاط حديث</p>
          </div>
        ) : (
          activities.slice(0, 4).map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  config.bgColor, config.color
                )}>
                  <Icon className="w-4 h-4" />
                  {activity.isNew && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs font-medium truncate">{activity.message}</p>
                  {activity.details && (
                    <p className="text-[10px] text-muted-foreground truncate">{activity.details}</p>
                  )}
                </div>
                
                <span className="text-[10px] text-muted-foreground shrink-0">{activity.time}</span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MobileActivityList;
