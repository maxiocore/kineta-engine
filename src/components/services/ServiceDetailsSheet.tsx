import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Hash,
  DollarSign,
  Shield,
  Clock,
  Star,
  Heart,
  ShoppingCart,
  Info,
  CheckCircle2,
  RefreshCw,
  Zap,
  TrendingUp,
} from "lucide-react";
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

interface ServiceDetailsSheetProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onOrder: (service: Service) => void;
  isFavorite: boolean;
  onToggleFavorite: (serviceId: string) => void;
}

const ServiceDetailsSheet = ({
  service,
  isOpen,
  onClose,
  onOrder,
  isFavorite,
  onToggleFavorite,
}: ServiceDetailsSheetProps) => {
  if (!service) return null;

  const features = Array.isArray(service.features) ? service.features : [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className="w-full sm:max-w-lg overflow-y-auto bg-background/95 backdrop-blur-xl border-r border-border/50"
      >
        <SheetHeader className="text-right pb-4">
          <div className="flex items-start justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(service.id)}
              className={cn(
                "shrink-0 rounded-full transition-all duration-300",
                isFavorite ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-500"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </Button>
            <SheetTitle className="text-xl font-bold text-right flex-1 leading-relaxed">
              {service.name}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-2">
          {/* Service ID & Category */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2"
          >
            {service.external_service_id && (
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-primary/5 border-primary/20">
                <Hash className="w-3.5 h-3.5" />
                <span className="font-mono">{service.external_service_id}</span>
              </Badge>
            )}
            <Badge className="gap-1.5 px-3 py-1.5 bg-accent/10 text-accent-foreground border-accent/20">
              <Package className="w-3.5 h-3.5" />
              {service.category}
            </Badge>
          </motion.div>

          <Separator className="bg-border/50" />

          {/* Price Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-2xl p-5 border border-primary/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">السعر لكل 1000</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ${service.price.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className="bg-success/10 text-success border-success/20 gap-1">
                  <TrendingUp className="w-3 h-3" />
                  متاح
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Refill Info */}
          {service.refill_enabled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20"
            >
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-success">ضمان إعادة التعبئة</p>
                <p className="text-sm text-muted-foreground">
                  لمدة {service.refill_days || 30} يوم من تاريخ الطلب
                </p>
              </div>
              <RefreshCw className="w-5 h-5 text-success/60" />
            </motion.div>
          )}

          {/* Description */}
          {service.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>وصف الخدمة</span>
              </div>
              <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                {service.description}
              </p>
            </motion.div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>مميزات الخدمة</span>
              </div>
              <div className="grid gap-2">
                {features.map((feature: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Service Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">وقت البدء</p>
              <p className="font-medium text-sm">0-1 ساعة</p>
            </div>
            <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-accent" />
              <p className="text-xs text-muted-foreground">سرعة التنفيذ</p>
              <p className="font-medium text-sm">10K/يوم</p>
            </div>
          </motion.div>

          <Separator className="bg-border/50" />

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3 pb-4"
          >
            <Button
              size="lg"
              onClick={() => {
                onOrder(service);
                onClose();
              }}
              className="w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              طلب الخدمة الآن
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="w-full h-12 rounded-xl"
            >
              إغلاق
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ServiceDetailsSheet;
