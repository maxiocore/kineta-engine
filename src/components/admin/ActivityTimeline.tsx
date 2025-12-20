import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  ShoppingBag, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Package,
  MessageSquare,
  LucideIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface Activity {
  id: string;
  type: "order" | "user" | "ticket" | "service" | "message";
  message: string;
  time: string;
  timestamp: Date;
  details?: string;
  isNew?: boolean;
}

interface ActivityTimelineProps {
  activities: Activity[];
  maxItems?: number;
  onViewAll?: () => void;
}

const activityConfig: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  order: { icon: ShoppingBag, color: "text-success", bgColor: "bg-success/10" },
  user: { icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
  ticket: { icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10" },
  service: { icon: Package, color: "text-accent", bgColor: "bg-accent/10" },
  message: { icon: MessageSquare, color: "text-primary", bgColor: "bg-primary/10" },
};

const ActivityTimeline = ({ activities, maxItems = 5, onViewAll }: ActivityTimelineProps) => {
  const [filter, setFilter] = useState<string>("all");
  
  const filters = [
    { id: "all", label: "الكل" },
    { id: "order", label: "الطلبات" },
    { id: "user", label: "المستخدمين" },
    { id: "ticket", label: "الدعم" },
  ];

  const filteredActivities = activities
    .filter(a => filter === "all" || a.type === filter)
    .slice(0, maxItems);

  return (
    <Card className="border-border/30 h-full" dir="rtl">
      <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-2">
        <div className="flex flex-row-reverse items-center justify-between gap-1.5">
          <CardTitle className="flex flex-row-reverse items-center gap-1.5 text-xs sm:text-sm lg:text-base">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </motion.div>
            النشاط الأخير
            {activities.some(a => a.isNew) && (
              <Badge variant="secondary" className="bg-success/20 text-success text-[8px] sm:text-[9px] px-1 py-0">
                جديد
              </Badge>
            )}
          </CardTitle>
        </div>
        
        {/* Filters - Scrollable on mobile */}
        <div className="flex flex-row-reverse gap-0.5 sm:gap-1 mt-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {filters.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f.id)}
              className={cn(
                "text-[9px] sm:text-[10px] h-6 sm:h-7 px-1.5 sm:px-2 rounded-md shrink-0",
                filter === f.id && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-3 pt-0 space-y-0">
        <AnimatePresence mode="popLayout">
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 text-muted-foreground"
            >
              <Clock className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
              <p className="text-xs">لا يوجد نشاط حديث</p>
            </motion.div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-[12px] sm:right-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
              
              {filteredActivities.map((activity, index) => {
                const config = activityConfig[activity.type];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={activity.id}
                    layout
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative flex flex-row-reverse gap-1.5 sm:gap-2 py-1.5 group"
                  >
                    {/* Timeline Dot */}
                    <motion.div 
                      className={cn(
                        "relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center shrink-0",
                        config.bgColor,
                        config.color,
                        "group-hover:scale-105 transition-transform"
                      )}
                      whileHover={{ rotate: 5 }}
                    >
                      <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {activity.isNew && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full animate-pulse ring-1 ring-card" />
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0 text-right">
                      <p className="text-[10px] sm:text-[11px] font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {activity.message}
                      </p>
                      {activity.details && (
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0 line-clamp-1">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0 flex flex-row-reverse items-center gap-0.5">
                        <Clock className="w-2 h-2" />
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {onViewAll && activities.length > maxItems && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4"
          >
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={onViewAll}
            >
              عرض كل النشاطات
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
