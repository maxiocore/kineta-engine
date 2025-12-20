import { motion } from "framer-motion";
import { 
  Star, 
  Shield, 
  Clock, 
  ShoppingCart, 
  Eye,
  CheckCircle2,
  Zap,
  Award,
  LucideIcon
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
  category_id?: string | null;
  status: string;
  features: any;
  refill_enabled: boolean | null;
  external_service_id: string | null;
}

interface EnhancedServiceCardProps {
  service: Service;
  index: number;
  icon: LucideIcon;
  gradientFrom: string;
  gradientVia?: string;
  gradientTo: string;
  onOrder: (service: Service) => void;
  onViewDetails?: (service: Service) => void;
  showBestSeller?: boolean;
  viewMode?: "grid" | "list";
}

const featureIcons = [CheckCircle2, Star, Zap, Award, Shield];

const EnhancedServiceCard = ({
  service,
  index,
  icon: IconComponent,
  gradientFrom,
  gradientVia,
  gradientTo,
  onOrder,
  onViewDetails,
  showBestSeller = false,
  viewMode = "grid"
}: EnhancedServiceCardProps) => {
  const getFeatures = (): string[] => {
    if (Array.isArray(service.features)) return service.features.slice(0, 3);
    return [];
  };

  const features = getFeatures();
  const gradientClass = gradientVia 
    ? `from-${gradientFrom} via-${gradientVia} to-${gradientTo}`
    : `from-${gradientFrom} to-${gradientTo}`;

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
        whileHover={{ y: -4, scale: 1.01 }}
        className="group"
      >
        <Card className="relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl">
          <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
          
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Icon */}
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}
              >
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <motion.h3 
                    className="font-bold text-lg sm:text-xl truncate group-hover:text-primary transition-colors"
                  >
                    {service.name}
                  </motion.h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {showBestSeller && index === 0 && (
                      <Badge className={`bg-gradient-to-r ${gradientClass} text-white border-0 text-xs`}>
                        <Star className="w-3 h-3 ml-1 fill-current" />
                        الأكثر طلباً
                      </Badge>
                    )}
                    {service.refill_enabled && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="w-3 h-3 ml-1" />
                        ضمان
                      </Badge>
                    )}
                  </div>
                </div>
                
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                    {service.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <span className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
                      {service.price.toFixed(0)} ر.س
                    </span>
                  </motion.div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(service)}
                        className="flex-1 sm:flex-none rounded-xl"
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        التفاصيل
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => onOrder(service)}
                      className={`flex-1 sm:flex-none bg-gradient-to-r ${gradientClass} hover:opacity-90 text-white rounded-xl`}
                    >
                      <ShoppingCart className="w-4 h-4 ml-2" />
                      اطلب الآن
                    </Button>
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
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group h-full"
    >
      <Card className="h-full relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl sm:rounded-3xl">
        {/* Animated Background Gradient */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700`}
        />
        
        {/* Decorative Orbs */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradientClass} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-all duration-700`} />
        <div className={`absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-tr ${gradientClass} rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-all duration-700 delay-100`} />

        <CardContent className="relative z-10 p-4 sm:p-5 lg:p-6 h-full flex flex-col">
          {/* Header: Icon & Price */}
          <div className="flex items-start justify-between mb-4">
            {/* Service Icon with Glow */}
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
              <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
            </motion.div>

            {/* Price */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-right"
            >
              <motion.p 
                className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}
              >
                {service.price.toFixed(0)}
              </motion.p>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">ر.س</span>
            </motion.div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {showBestSeller && index === 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg gap-1 px-2 py-1 text-xs">
                  <Star className="w-3 h-3 fill-current" />
                  الأكثر طلباً
                </Badge>
              </motion.div>
            )}
            {service.refill_enabled && (
              <Badge variant="secondary" className="gap-1 text-xs px-2 py-1">
                <Shield className="w-3 h-3" />
                ضمان
              </Badge>
            )}
          </div>

          {/* Service Name */}
          <motion.h3 
            className="font-bold text-base sm:text-lg lg:text-xl leading-tight mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            {service.name}
          </motion.h3>

          {/* Description */}
          {service.description && (
            <motion.p 
              className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {service.description}
            </motion.p>
          )}

          {/* Features */}
          {features.length > 0 && (
            <motion.div 
              className="space-y-1.5 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.4 }}
            >
              {features.map((feature, i) => {
                const FeatureIcon = featureIcons[i % featureIcons.length];
                return (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                    <FeatureIcon className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span className="text-muted-foreground truncate">{feature}</span>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Delivery Time */}
          <motion.div 
            className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 mt-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.5 }}
          >
            <Clock className="w-4 h-4" />
            <span>التسليم: 24-72 ساعة</span>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.6 }}
          >
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(service)}
                className="flex-1 rounded-xl h-10 sm:h-11 text-sm border-border/50 hover:border-primary/50 hover:bg-primary/5"
              >
                <Eye className="w-4 h-4 ml-2" />
                <span className="hidden xs:inline">التفاصيل</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onOrder(service)}
              className={`flex-1 bg-gradient-to-r ${gradientClass} hover:opacity-90 text-white rounded-xl h-10 sm:h-11 text-sm shadow-lg group/btn overflow-hidden relative`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                <span>اطلب الآن</span>
              </span>
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedServiceCard;
