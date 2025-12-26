import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, ShoppingCart, Ticket, Filter, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Activity {
  id: string;
  type: "order" | "user" | "ticket";
  message: string;
  details?: string;
  time: string;
  isNew?: boolean;
}

interface ActivityFeedCardProps {
  activities: Activity[];
}

const filterOptions = [
  { id: "all", label: "الكل", icon: Filter },
  { id: "orders", label: "الطلبات", icon: ShoppingCart },
  { id: "users", label: "المستخدمين", icon: Users },
  { id: "support", label: "الدعم", icon: Ticket },
];

const getActivityConfig = (type: string) => {
  switch (type) {
    case "order":
      return {
        icon: ShoppingCart,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
      };
    case "user":
      return {
        icon: Users,
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/20",
      };
    case "ticket":
      return {
        icon: Ticket,
        color: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/20",
      };
    default:
      return {
        icon: Clock,
        color: "text-muted-foreground",
        bg: "bg-muted",
        border: "border-border",
      };
  }
};

const ActivityFeedCard = ({ activities }: ActivityFeedCardProps) => {
  const [filter, setFilter] = useState("all");

  const filteredActivities = activities.filter((a) => {
    if (filter === "all") return true;
    if (filter === "orders") return a.type === "order";
    if (filter === "users") return a.type === "user";
    if (filter === "support") return a.type === "ticket";
    return true;
  });

  return (
    <Card className="border-border/50 h-full overflow-hidden bg-gradient-to-bl from-card to-card/80" dir="rtl">
      <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex items-center justify-between flex-row-reverse">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            النشاط الأخير
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filteredActivities.length} نشاط
          </Badge>
        </div>
        {/* Filter Buttons */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 flex-row-reverse">
          {filterOptions.map((option) => (
            <Button
              key={option.id}
              variant={filter === option.id ? "default" : "outline"}
              size="sm"
              className="h-7 text-[10px] sm:text-xs px-2 sm:px-3 gap-1 shrink-0 flex-row-reverse"
              onClick={() => setFilter(option.id)}
            >
              <option.icon className="w-3 h-3" />
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
        <ScrollArea className="h-[300px] sm:h-[320px] -mx-2 px-2">
          <AnimatePresence mode="popLayout">
            {filteredActivities.length > 0 ? (
              <div className="space-y-2">
                {filteredActivities.map((activity, index) => {
                  const config = getActivityConfig(activity.type);
                  const IconComponent = config.icon;

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 2 }}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all hover:bg-secondary/30 cursor-pointer group flex-row-reverse",
                        config.border,
                        "bg-gradient-to-l from-transparent to-secondary/10"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                        <IconComponent className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-start justify-between gap-2 flex-row-reverse">
                          <p className="text-sm font-medium truncate">{activity.message}</p>
                          {activity.isNew && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary border-0"
                            >
                              جديد
                            </Badge>
                          )}
                        </div>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {activity.details}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">لا يوجد نشاط حتى الآن</p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeedCard;
