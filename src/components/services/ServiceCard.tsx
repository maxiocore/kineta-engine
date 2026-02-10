import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Hash, 
  DollarSign, 
  Shield, 
  Eye, 
  Heart, 
  ShoppingCart,
  Zap,
  Clock,
} from "lucide-react";
import FinancingCTA from "@/components/FinancingCTA";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  status: string;
  features: any;
  external_service_id: string | null;
  refill_enabled: boolean | null;
  refill_days: number | null;
}

interface ServiceCardProps {
  service: Service;
  index: number;
  isFavorite: boolean;
  onViewDetails: (service: Service) => void;
  onOrder: (service: Service) => void;
  onToggleFavorite: (serviceId: string) => void;
}

const ServiceCard = memo(({
  service,
  index,
  isFavorite,
  onViewDetails,
  onOrder,
  onToggleFavorite,
}: ServiceCardProps) => {
  // Show financing button for services priced above 1000 SAR (approximately 267 USD at 3.75 rate)
  const showFinancingButton = service.price > 267;

  const features = useMemo(() => {
    try {
      if (typeof service.features === 'string') {
        return JSON.parse(service.features);
      }
      return service.features || {};
    } catch {
      return {};
    }
  }, [service.features]);

  const minQuantity = features.min || 10;
  const maxQuantity = features.max || 1000000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      className="group relative"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all duration-500",
          "bg-gradient-to-br from-card via-card to-card/80",
          "border-border/50 hover:border-primary/40",
          "hover:shadow-xl hover:shadow-primary/10",
          "cursor-pointer"
        )}
        onClick={() => onViewDetails(service)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-accent/5 transition-all duration-500" />
        
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 blur-sm" />
        </div>

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <motion.div whileHover={{ scale: 1.05 }} className="shrink-0">
              <Badge 
                variant="outline" 
                className="font-mono text-xs sm:text-sm px-3 py-1.5 bg-muted/80 border-border hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <Hash className="w-3 h-3 ml-1.5 text-primary" />
                {service.external_service_id || "-"}
              </Badge>
            </motion.div>

            <div className="flex items-center gap-2">
              <div className="text-left">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20"
                >
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {service.price.toFixed(4)}
                  </span>
                </motion.div>
                <p className="text-[10px] text-muted-foreground mt-1 text-center">لكل 1000</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-base sm:text-lg leading-relaxed group-hover:text-primary transition-colors duration-300 line-clamp-2">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {service.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {service.refill_enabled && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Badge className="gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs bg-success/15 text-success border-success/30 hover:bg-success/20">
                  <Shield className="w-3 h-3" />
                  ضمان {service.refill_days || 30} يوم
                </Badge>
              </motion.div>
            )}
            
            <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs bg-accent/10 border-accent/20">
              <Zap className="w-3 h-3 text-accent" />
              {minQuantity.toLocaleString()} - {maxQuantity >= 1000000 ? '1M+' : maxQuantity.toLocaleString()}
            </Badge>

            <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs bg-primary/10 border-primary/20">
              <Clock className="w-3 h-3 text-primary" />
              فوري
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOrder(service);
                  }}
                  className="w-full h-10 sm:h-11 rounded-xl gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 font-bold text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  طلب الآن
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(service);
                  }}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(service.id);
                  }}
                  className={cn(
                    "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all",
                    isFavorite 
                      ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20" 
                      : "border-border/50 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                  )}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </Button>
              </motion.div>
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
        </div>
      </div>
    </motion.div>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;
