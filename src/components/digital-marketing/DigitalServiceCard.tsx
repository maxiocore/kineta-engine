import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Megaphone, 
  LineChart, 
  PieChart, 
  Rocket,
  Check,
  Clock,
  Shield,
  Eye,
  ShoppingCart,
  Flame,
  Gauge
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  status: string;
  features: any;
  refill_enabled?: boolean | null;
}

interface DigitalServiceCardProps {
  service: Service;
  index: number;
  onOrder?: (service: Service) => void;
  onViewDetails?: (service: Service) => void;
  isPopular?: boolean;
  variant?: "default" | "compact";
}

const iconList = [TrendingUp, BarChart3, Target, Megaphone, LineChart, Gauge, PieChart, Rocket];

export const DigitalServiceCard = ({ 
  service, 
  index, 
  onOrder, 
  onViewDetails,
  isPopular = false,
  variant = "default"
}: DigitalServiceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = iconList[index % iconList.length];
  const features = Array.isArray(service.features) ? service.features.slice(0, 3) : [];

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="group"
      >
        <Card className="relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 rounded-xl hover:shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shrink-0">
                <IconComponent className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-blue-500 transition-colors">
                    {service.name}
                  </h3>
                  <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent shrink-0">
                    {service.price.toFixed(0)} ر.س
                  </span>
                </div>
                
                {service.description && (
                  <p className="text-xs text-muted-foreground/70 line-clamp-1 mb-2">
                    {service.description}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isPopular && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                        <Flame className="w-2.5 h-2.5 ml-0.5" />
                        شائع
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      نتائج مضمونة
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(service)}
                        className="h-8 px-2 text-xs rounded-lg hover:bg-blue-500/10"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {onOrder && (
                      <Button
                        size="sm"
                        onClick={() => onOrder(service)}
                        className="h-8 px-3 bg-gradient-to-r from-blue-500 to-violet-500 hover:opacity-90 text-white rounded-lg text-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 ml-1" />
                        اطلب
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group h-full"
    >
      <Card className="h-full relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-500 rounded-2xl hover:shadow-xl hover:shadow-blue-500/5">
        {/* Gradient Overlay on Hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-violet-500/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Animated particles on hover */}
        {isHovered && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-blue-400/40"
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: "100%",
                  opacity: 0 
                }}
                animate={{ 
                  y: "-20%",
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
              />
            ))}
          </>
        )}

        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="relative z-10 p-4 sm:p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Icon */}
            <motion.div 
              animate={{ rotate: isHovered ? 5 : 0, scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            </motion.div>

            {/* Price & Badges */}
            <div className="text-left flex flex-col items-end gap-2">
              <motion.div 
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="flex items-baseline gap-1"
              >
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                  {service.price.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">ر.س</span>
              </motion.div>
              
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {isPopular && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    شائع
                  </Badge>
                )}
                {service.refill_enabled && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                    <Shield className="w-2.5 h-2.5" />
                    ضمان
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Service Name */}
          <h3 className="font-bold text-sm sm:text-base leading-snug mb-2 group-hover:text-blue-500 transition-colors line-clamp-2">
            {service.name}
          </h3>

          {/* Description */}
          {service.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed flex-grow">
              {service.description}
            </p>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-green-500" />
                  </div>
                  <span className="text-muted-foreground truncate">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Results Info */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-4 mt-auto">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span>نتائج مضمونة</span>
            <span className="mx-1">•</span>
            <Clock className="w-3.5 h-3.5" />
            <span>بدء فوري</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(service)}
                className="flex-1 rounded-xl h-9 sm:h-10 text-xs border-border/50 hover:border-blue-500/50 hover:bg-blue-500/5"
              >
                <Eye className="w-3.5 h-3.5 ml-1.5" />
                التفاصيل
              </Button>
            )}
            {onOrder && (
              <Button
                size="sm"
                onClick={() => onOrder(service)}
                className="flex-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 hover:opacity-90 text-white rounded-xl h-9 sm:h-10 text-xs shadow-md hover:shadow-lg transition-shadow"
              >
                <ShoppingCart className="w-3.5 h-3.5 ml-1.5" />
                اطلب الآن
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
