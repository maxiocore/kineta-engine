import { motion } from "framer-motion";
import { Bell, CheckCircle, AlertCircle, Info, X, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info";
  time: string;
  isRead: boolean;
}

interface SmartNotificationsProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
}

const SmartNotifications = ({ notifications, onMarkAsRead }: SmartNotificationsProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "success":
        return "border-r-success bg-success/5";
      case "warning":
        return "border-r-warning bg-warning/5";
      default:
        return "border-r-primary bg-primary/5";
    }
  };

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="card-elevated border-border/30 h-full">
        <CardHeader className="flex flex-row-reverse items-center justify-between pb-1 sm:pb-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center relative">
              <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary-foreground" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 bg-destructive rounded-full text-[8px] sm:text-[9px] md:text-[10px] text-destructive-foreground flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
            الإشعارات الذكية
          </CardTitle>
          <Link to="/dashboard/notifications">
            <Button variant="ghost" size="sm" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">
              الكل
              <ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-1.5 sm:space-y-2 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
          {notifications.length === 0 ? (
            <div className="text-center py-4 sm:py-6">
              <Bell className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2 text-muted-foreground/30" />
              <p className="text-xs sm:text-sm text-muted-foreground">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.slice(0, 3).map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-2 sm:p-2.5 md:p-3 rounded-md sm:rounded-lg border-r-2 sm:border-r-4 ${getTypeStyle(notification.type)} ${
                  !notification.isRead ? "ring-1 ring-primary/20" : ""
                }`}
              >
                <div className="flex flex-row-reverse items-start gap-1.5 sm:gap-2 md:gap-3">
                  <div className="shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[11px] sm:text-xs md:text-sm">{notification.title}</p>
                    <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1">{notification.time}</p>
                  </div>
                  {onMarkAsRead && !notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SmartNotifications;
