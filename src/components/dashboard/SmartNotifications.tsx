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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="card-elevated border-border/30 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-white" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
            الإشعارات الذكية
          </CardTitle>
          <Link to="/dashboard/notifications">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              الكل
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.slice(0, 3).map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-3 rounded-lg border-r-4 ${getTypeStyle(notification.type)} ${
                  !notification.isRead ? "ring-1 ring-primary/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                  {onMarkAsRead && !notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <X className="w-3 h-3" />
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
