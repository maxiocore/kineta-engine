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
    <Card className="card-elevated border-border/30 h-full">
      <CardHeader className="p-4 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </motion.div>
            النشاط الأخير
            {activities.some(a => a.isNew) && (
              <Badge variant="secondary" className="bg-success/20 text-success text-[10px] sm:text-xs px-1.5 py-0.5">
                جديد
              </Badge>
            )}
          </CardTitle>
        </div>
        
        {/* Filters - Scrollable on mobile */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {filters.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f.id)}
              className={cn(
                "text-xs h-8 px-3 rounded-lg shrink-0",
                filter === f.id && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-0">
        <AnimatePresence mode="popLayout">
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد نشاط حديث</p>
            </motion.div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-[18px] sm:right-5 top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
              
              {filteredActivities.map((activity, index) => {
                const config = activityConfig[activity.type];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={activity.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex gap-3 sm:gap-4 py-2.5 sm:py-3 group"
                  >
                    {/* Timeline Dot */}
                    <motion.div 
                      className={cn(
                        "relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                        config.bgColor,
                        config.color,
                        "group-hover:scale-105 transition-transform"
                      )}
                      whileHover={{ rotate: 5 }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      {activity.isNew && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full animate-pulse ring-2 ring-card" />
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                      <p className="text-xs sm:text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {activity.message}
                      </p>
                      {activity.details && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
