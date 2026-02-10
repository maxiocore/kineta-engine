import { useState } from "react";
import { motion } from "framer-motion";
import FinancingCTA from "@/components/FinancingCTA";
import {
  Check,
  Star,
  Clock,
  ShoppingCart,
  Eye,
  Shield,
  Sparkles,
  Wallet,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  features: any;
  refill_enabled: boolean | null;
}

interface ProfessionalServiceCardProps {
  service: Service;
  index: number;
  onOrder: (service: Service) => void;
  onViewDetails: (service: Service) => void;
  icon?: React.ElementType;
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
  hoverBorderColor?: string;
  shadowColor?: string;
  isFeatured?: boolean;
}

const getDeliveryTime = (features: any): string => {
  if (!Array.isArray(features)) return "24-48 ساعة";
  
  for (const feature of features) {
    if (typeof feature === 'string') {
      const hourMatch = feature.match(/(\d+)\s*ساع/);
      if (hourMatch) {
        const hours = parseInt(hourMatch[1]);
        if (hours <= 24) return `${hours} ساعة`;
        return `${Math.ceil(hours / 24)} أيام`;
      }
      
      const dayMatch = feature.match(/(\d+)\s*(يوم|أيام)/);
      if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        return days === 1 ? "يوم واحد" : `${days} أيام`;
      }
      
      if (feature.includes("تسليم سريع")) return "24 ساعة";
      if (feature.includes("تسليم فوري")) return "12 ساعة";
    }
  }
  
  return "24-48 ساعة";
};

const ProfessionalServiceCard = ({
  service,
  index,
  onOrder,
  onViewDetails,
  icon: IconComponent = Sparkles,
  gradientFrom = "from-primary",
  gradientTo = "to-accent",
  gradientVia = "via-primary/80",
  hoverBorderColor = "hover:border-primary/30",
  shadowColor = "hover:shadow-primary/10",
  isFeatured = false,
}: ProfessionalServiceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const features = Array.isArray(service.features) ? service.features.slice(0, 3) : [];
  const deliveryTime = getDeliveryTime(service.features);
  const showFinancingButton = service.price > 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group h-full"
    >
      <Card className={cn(
        "h-full relative overflow-hidden border-2 border-border/50 bg-card/95 backdrop-blur-sm transition-all duration-500 rounded-2xl",
        hoverBorderColor,
        shadowColor,
        "hover:shadow-2xl"
      )}>
        {/* Gradient Background on Hover */}
        <motion.div 
          className={cn("absolute inset-0 bg-gradient-to-br opacity-0", gradientFrom, gradientTo)}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.03 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Top Gradient Line */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          gradientFrom, gradientVia, gradientTo
        )} />

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className={cn(
              "bg-gradient-to-r text-white border-0 shadow-lg gap-1",
              gradientFrom, gradientTo
            )}>
              <Star className="w-3 h-3 fill-current" />
              مميز
            </Badge>
          </div>
        )}

        <CardContent className="relative z-10 p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Icon */}
            <motion.div 
              animate={{ rotate: isHovered ? 5 : 0, scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br blur-lg opacity-30 group-hover:opacity-50 transition-opacity",
                gradientFrom, gradientTo
              )} />
              <div className={cn(
                "relative w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                gradientFrom, gradientVia, gradientTo
              )}>
                <IconComponent className="w-7 h-7 text-white" />
              </div>
            </motion.div>

            {/* Price */}
            <div className="text-left flex flex-col items-end gap-2">
              <motion.div 
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="flex items-baseline gap-1"
              >
                <span className={cn(
                  "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  gradientFrom, gradientTo
                )}>
                  {service.price.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">ر.س</span>
              </motion.div>
              
              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {index < 3 && !isFeatured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    الأكثر طلباً
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

          {/* Title */}
          <h3 className={cn(
            "font-bold text-base leading-snug mb-2 transition-colors line-clamp-2",
            isHovered && "text-primary"
          )}>
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
                <motion.div 
                  key={i} 
                  className="flex items-center gap-2 text-xs"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                    "bg-success/10"
                  )}>
                    <Check className="w-2.5 h-2.5 text-success" />
                  </div>
                  <span className="text-muted-foreground truncate">{feature}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Delivery Time */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-4 mt-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>التسليم: {deliveryTime}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(service)}
                className={cn(
                  "flex-1 rounded-xl h-10 text-xs border-border/50",
                  hoverBorderColor.replace("hover:", ""),
                  "hover:bg-primary/5"
                )}
              >
                <Eye className="w-3.5 h-3.5 ml-1.5" />
                التفاصيل
              </Button>
              <Button
                size="sm"
                onClick={() => onOrder(service)}
                className={cn(
                  "flex-1 bg-gradient-to-r hover:opacity-90 text-white rounded-xl h-10 text-xs shadow-md hover:shadow-lg transition-shadow",
                  gradientFrom, gradientVia, gradientTo
                )}
              >
                <ShoppingCart className="w-3.5 h-3.5 ml-1.5" />
                اطلب الآن
              </Button>
            </div>

            {/* Financing Button */}
            {showFinancingButton && (
              <FinancingCTA
                serviceId={service.id}
                variant="compact"
                className="w-full"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfessionalServiceCard;
