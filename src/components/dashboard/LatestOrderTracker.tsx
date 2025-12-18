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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="card-elevated border-border/30">
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">لا توجد طلبات نشطة</p>
            <Link to="/dashboard/services">
              <Button variant="outline" className="mt-3">
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="card-elevated border-border/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            تتبع آخر طلب
          </CardTitle>
          <Link to={`/dashboard/orders`}>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              التفاصيل
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {/* Order Info */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium text-sm">{order.serviceName}</p>
              <p className="text-xs text-muted-foreground">#{order.orderNumber}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {order.createdAt}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 right-5 left-5 h-0.5 bg-border" />
            
            {/* Steps */}
            <div className="relative flex justify-between">
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
                        w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10
                        transition-all duration-300
                        ${status === "completed" 
                          ? "bg-success text-white" 
                          : status === "current" 
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                            : "bg-secondary text-muted-foreground"
                        }
                      `}
                    >
                      {status === "completed" ? (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span className={`
                      mt-2 text-[10px] sm:text-xs text-center
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
