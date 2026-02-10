import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Heart,
  Shield,
  Zap,
  Eye,
  ShoppingCart,
  Hash,
  RefreshCw,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  category_id: string | null;
  price: number;
  status: string;
  features: any;
  external_service_id: string | null;
  refill_enabled: boolean | null;
  refill_days: number | null;
}

interface ServiceCardModernProps {
  service: Service;
  onOrder: () => void;
  onViewDetails: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  index: number;
  categoryNameAr?: string;
}

const ServiceCardModern = ({ 
  service, 
  onOrder, 
  onViewDetails, 
  isFavorite, 
  onToggleFavorite,
  index,
  categoryNameAr
}: ServiceCardModernProps) => {
  const navigate = useNavigate();
  const features = useMemo(() => {
    if (!service.features) return {};
    try {
      return typeof service.features === 'string' 
        ? JSON.parse(service.features) 
        : service.features;
    } catch {
      return {};
    }
  }, [service.features]);

  const hasRefill = features.refill !== false || service.refill_enabled;
  const minQuantity = features.min || 100;
  const maxQuantity = features.max || 10000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.4 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group h-full"
    >
      <div 
        className={cn(
          "relative h-full overflow-hidden rounded-2xl bg-card border transition-all duration-500 cursor-pointer",
          "border-border/40 hover:border-primary/40",
          "hover:shadow-xl hover:shadow-primary/5"
        )}
        onClick={onViewDetails}
      >
        {/* Top Gradient Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />

        <div className="relative p-4 sm:p-5 flex flex-col h-full">
          {/* Top Row: Favorite & Badges */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                isFavorite 
                  ? "bg-rose-500/15 text-rose-500 shadow-lg shadow-rose-500/20" 
                  : "bg-muted/50 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </motion.button>

            <div className="flex items-center gap-2">
              {hasRefill && (
                <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-1">
                  <RefreshCw className="w-3 h-3" />
                  <span className="text-[10px] font-bold">ضمان</span>
                  {service.refill_days && (
                    <span className="text-[10px]">{service.refill_days} يوم</span>
                  )}
                </Badge>
              )}
              <Badge variant="outline" className="font-mono text-xs bg-muted/30">
                <Hash className="w-3 h-3 ml-0.5" />
                {service.external_service_id || '-'}
              </Badge>
            </div>
          </div>

          {/* Category Badge */}
          {categoryNameAr && (
            <Badge variant="secondary" className="self-start mb-2 text-[10px]">
              {categoryNameAr}
            </Badge>
          )}

          {/* Service Name */}
          <h3 className="font-bold text-sm sm:text-base leading-relaxed mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {service.name}
          </h3>

          {/* Description Preview */}
          {service.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {service.description.substring(0, 100)}
            </p>
          )}

          {/* Features Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600">
              <span className="text-[10px]">الحد الأدنى: {minQuantity.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/10 text-violet-600">
              <span className="text-[10px]">الحد الأقصى: {maxQuantity.toLocaleString()}</span>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price & Speed */}
          <div className="flex items-end justify-between mb-4 pt-2 border-t border-border/30">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground mb-0.5">السعر لكل 1000</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {service.price.toFixed(2)}
                </span>
                <span className="text-sm font-medium text-muted-foreground">$</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-600 px-2.5 py-1.5 rounded-lg">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-medium">فوري</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                variant="ghost"
                className="h-11 px-4 rounded-xl text-sm hover:bg-muted font-medium gap-1.5"
              >
                <Eye className="w-4 h-4" />
                التفاصيل
              </Button>

              <motion.div 
                className="flex-1" 
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOrder();
                  }}
                  className="w-full h-11 rounded-xl font-bold text-sm gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                >
                  <ShoppingCart className="w-4 h-4" />
                  اطلب الآن
                </Button>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCardModern;
