import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Users, 
  ShoppingCart, 
  Ticket, 
  Filter, 
  ArrowLeft,
  Sparkles,
  CheckCircle
} from "lucide-react";
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
        glow: "shadow-primary/5",
      };
    case "user":
      return {
        icon: Users,
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/20",
        glow: "shadow-success/5",
      };
    case "ticket":
      return {
        icon: Ticket,
        color: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/20",
        glow: "shadow-warning/5",
      };
    default:
      return {
        icon: Clock,
        color: "text-muted-foreground",
        bg: "bg-muted",
        border: "border-border",
        glow: "",
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
    <Card className="border-border/50 h-full overflow-hidden bg-gradient-to-bl from-card to-card/80 relative" dir="rtl">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full blur-xl" />

      <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex flex-row-reverse items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex flex-row-reverse items-center gap-2">
            <motion.div 
              className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Clock className="w-4 h-4 text-primary" />
            </motion.div>
            <span>النشاط الأخير</span>
          </CardTitle>
          <Badge variant="secondary" className="text-xs px-2 py-1 flex flex-row-reverse items-center">
            <Sparkles className="w-3 h-3 me-1" />
            {filteredActivities.length} نشاط
          </Badge>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-row-reverse gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map((option) => (
            <Button
              key={option.id}
              variant={filter === option.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-[10px] sm:text-xs px-2 sm:px-3 gap-1 shrink-0 transition-all flex flex-row-reverse",
                filter === option.id && "shadow-md"
              )}
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
              <div className="space-y-2.5">
                {filteredActivities.map((activity, index) => {
                  const config = getActivityConfig(activity.type);
                  const IconComponent = config.icon;

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10, x: 20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, y: -10, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4, scale: 1.01 }}
                      className={cn(
                        "relative flex flex-row-reverse items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                        config.border,
                        config.glow,
                        "bg-gradient-to-r from-transparent to-secondary/10",
                        "hover:shadow-md hover:bg-secondary/20"
                      )}
                    >
                      {/* Icon */}
                      <motion.div 
                        className={cn("p-2.5 rounded-xl shrink-0", config.bg)}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <IconComponent className={cn("w-4 h-4", config.color)} />
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex flex-row-reverse items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.message}</p>
                            {activity.details && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {activity.details}
                              </p>
                            )}
                          </div>
                          {activity.isNew && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border-0"
                            >
                              جديد
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 flex flex-row-reverse items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {activity.time}
                        </p>
                      </div>

                      {/* Hover indicator */}
                      <ArrowLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center scale-x-[-1]" />

                      {/* New indicator dot */}
                      {activity.isNew && (
                        <motion.div
                          className="absolute -top-1 -end-1 w-3 h-3 bg-primary rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              >
                <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">لا يوجد نشاط حتى الآن</p>
                <p className="text-xs mt-1">ستظهر الأنشطة الجديدة هنا</p>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeedCard;
