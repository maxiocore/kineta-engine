import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, Truck, Check, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  orderNumber: string;
  serviceName: string;
  status: string;
  createdAt: string;
}

interface LatestOrderTrackerProps {
  order: Order | null;
}

const LatestOrderTracker = ({ order }: LatestOrderTrackerProps) => {
  const steps = [
    { key: "pending", label: "تم الاستلام", icon: Package },
    { key: "confirmed", label: "تم التأكيد", icon: Check },
    { key: "in_progress", label: "قيد التنفيذ", icon: Truck },
    { key: "completed", label: "مكتمل", icon: CheckCircle },
  ];

  const getStepStatus = (stepKey: string, orderStatus: string) => {
    const statusOrder = ["pending", "confirmed", "in_progress", "completed"];
    const currentIndex = statusOrder.indexOf(orderStatus);
    const stepIndex = statusOrder.indexOf(stepKey);
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  if (!order) {
    return (
      <motion.div
        dir="rtl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="card-elevated border-border/30">
          <CardContent className="p-4 sm:p-5 md:p-6 text-center">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-xs sm:text-sm">لا توجد طلبات نشطة</p>
            <Link to="/dashboard/services">
              <Button variant="outline" className="mt-2 sm:mt-3 h-8 sm:h-9 text-xs sm:text-sm">
                اطلب الآن
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="card-elevated border-border/30">
        <CardHeader className="flex flex-row-reverse items-center justify-between pb-1 sm:pb-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center">
              <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary-foreground" />
            </div>
            تتبع آخر طلب
          </CardTitle>
          <Link to={`/dashboard/orders`}>
            <Button variant="ghost" size="sm" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">
              التفاصيل
              <ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
          {/* Order Info */}
          <div className="flex flex-row-reverse items-center justify-between mb-3 sm:mb-4 p-2 sm:p-2.5 md:p-3 rounded-md sm:rounded-lg bg-secondary/30 gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[11px] sm:text-xs md:text-sm truncate">{order.serviceName}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">#{order.orderNumber}</p>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground shrink-0">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {order.createdAt}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-3 sm:top-4 md:top-5 right-3 sm:right-4 md:right-5 left-3 sm:left-4 md:left-5 h-0.5 bg-border" />
            
            {/* Steps */}
            <div className="relative flex flex-row-reverse justify-between">
              {steps.map((step, index) => {
                const status = getStepStatus(step.key, order.status);
                const Icon = step.icon;
                
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`
                        w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center z-10
                        transition-all duration-300
                        ${status === "completed" 
                          ? "bg-success text-success-foreground" 
                          : status === "current" 
                            ? "bg-primary text-primary-foreground ring-2 sm:ring-4 ring-primary/20" 
                            : "bg-secondary text-muted-foreground"
                        }
                      `}
                    >
                      {status === "completed" ? (
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      ) : (
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      )}
                    </div>
                    <span className={`
                      mt-1 sm:mt-1.5 md:mt-2 text-[8px] sm:text-[10px] md:text-xs text-center leading-tight
                      ${status === "current" ? "font-medium text-primary" : "text-muted-foreground"}
                    `}>
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LatestOrderTracker;
