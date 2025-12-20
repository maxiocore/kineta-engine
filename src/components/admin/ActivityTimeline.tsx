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
      <CardHeader className="p-3 sm:p-4 sm:pb-2">
        <div className="flex flex-row-reverse items-center justify-between gap-2">
          <CardTitle className="flex flex-row-reverse items-center gap-2 text-sm sm:text-base lg:text-lg">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </motion.div>
            النشاط الأخير
            {activities.some(a => a.isNew) && (
              <Badge variant="secondary" className="bg-success/20 text-success text-[9px] sm:text-[10px] px-1.5 py-0.5">
                جديد
              </Badge>
            )}
          </CardTitle>
        </div>
        
        {/* Filters - Scrollable on mobile */}
        <div className="flex flex-row-reverse gap-1 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f.id)}
              className={cn(
                "text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 rounded-lg shrink-0",
                filter === f.id && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-0 space-y-0">
        <AnimatePresence mode="popLayout">
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا يوجد نشاط حديث</p>
            </motion.div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-[14px] sm:right-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
              
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
                    className="relative flex flex-row-reverse gap-2 sm:gap-3 py-2 group"
                  >
                    {/* Timeline Dot */}
                    <motion.div 
                      className={cn(
                        "relative z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0",
                        config.bgColor,
                        config.color,
                        "group-hover:scale-105 transition-transform"
                      )}
                      whileHover={{ rotate: 5 }}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {activity.isNew && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full animate-pulse ring-2 ring-card" />
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5 text-right">
                      <p className="text-[11px] sm:text-xs lg:text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {activity.message}
                      </p>
                      {activity.details && (
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 flex flex-row-reverse items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
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
