import { motion } from "framer-motion";
import { Bell, Check, Trash2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";

const notifications = [
  { id: 1, title: "تم استلام طلبك", message: "تم استلام طلب #1234 بنجاح وسيتم البدء في العمل قريباً", time: "منذ 5 دقائق", read: false, type: "success" },
  { id: 2, title: "تحديث على الطلب", message: "تم تحديث حالة طلب #1233 إلى 'قيد التنفيذ'", time: "منذ ساعة", read: false, type: "info" },
  { id: 3, title: "رسالة من الدعم", message: "تم الرد على استفسارك بخصوص الخدمة", time: "منذ 3 ساعات", read: true, type: "message" },
  { id: 4, title: "طلب مكتمل!", message: "تهانينا! تم إكمال طلب #1230 بنجاح", time: "منذ يوم", read: true, type: "success" },
  { id: 5, title: "عرض خاص", message: "خصم 20% على جميع خدمات التسويق - لفترة محدودة", time: "منذ يومين", read: true, type: "promo" },
];

const getTypeStyles = (type: string) => {
  switch (type) {
    case "success": return "bg-success/10 border-success/20";
    case "info": return "bg-primary/10 border-primary/20";
    case "message": return "bg-accent/10 border-accent/20";
    case "promo": return "bg-warning/10 border-warning/20";
    default: return "bg-muted border-border";
  }
};

const ClientNotifications = () => {
  return (
    <ClientDashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold mb-2"
            >
              الإشعارات
            </motion.h1>
            <p className="text-muted-foreground">تابع جميع التحديثات والإشعارات</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Check className="w-4 h-4" />
              تعليم الكل كمقروء
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`glass border ${getTypeStyles(notification.type)} ${!notification.read ? "border-r-4 border-r-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.read ? "bg-muted" : "bg-primary/10"}`}>
                        <Bell className={`w-5 h-5 ${notification.read ? "text-muted-foreground" : "text-primary"}`} />
                      </div>
                      <div>
                        <h4 className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientNotifications;