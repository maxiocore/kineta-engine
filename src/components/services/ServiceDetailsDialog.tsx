import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Shield,
  Zap,
  Clock,
  Target,
  CreditCard,
  TrendingUp,
  Hash,
  Heart,
  ShoppingCart,
  CheckCircle2,
  Info,
  Sparkles,
  Package,
  RefreshCw,
  Calendar,
  ArrowRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  features: any;
  external_service_id: string | null;
  refill_enabled: boolean | null;
}

interface ServiceDetailsDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrder: (service: Service) => void;
  onToggleFavorite: (serviceId: string) => void;
  isFavorite: boolean;
}

// Feature item component
const FeatureItem = ({ icon: Icon, label, value, highlight = false }: { 
  icon: React.ComponentType<any>; 
  label: string; 
  value: string | number;
  highlight?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "p-4 rounded-2xl border transition-all duration-300",
      highlight 
        ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20" 
        : "bg-secondary/40 border-border/40 hover:border-primary/30"
    )}
  >
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        highlight 
          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30" 
          : "bg-background text-muted-foreground"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn(
          "font-bold text-lg",
          highlight && "text-primary"
        )}>{value}</p>
      </div>
    </div>
  </motion.div>
);

export default function ServiceDetailsDialog({
  service,
  open,
  onOpenChange,
  onOrder,
  onToggleFavorite,
  isFavorite
}: ServiceDetailsDialogProps) {
  if (!service) return null;

  const minQuantity = service.features?.min || 10;
  const maxQuantity = service.features?.max || 100000;
  const estimatedTime = service.features?.time || "1-24 ساعة";
  const quality = service.features?.quality || "جودة عالية";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-0 bg-gradient-to-b from-card to-background">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
        </div>

        {/* Header */}
        <DialogHeader className="relative p-6 pb-4 border-b border-border/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-[2px] shadow-xl shadow-primary/40"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              >
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
              </motion.div>
              <div>
                <DialogTitle className="text-xl font-bold leading-relaxed line-clamp-2">
                  {service.name}
                </DialogTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20 gap-1.5">
                    <Target className="w-3 h-3" />
                    {service.category}
                  </Badge>
                  {service.external_service_id && (
                    <Badge variant="outline" className="text-xs font-mono">
                      #{service.external_service_id}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleFavorite(service.id)}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
                  isFavorite 
                    ? "bg-destructive/10 text-destructive" 
                    : "bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                )}
              >
                <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
              </motion.button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="relative max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Description */}
            {service.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-5 rounded-2xl bg-secondary/40 border border-border/40"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">وصف الخدمة</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            )}

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              <FeatureItem 
                icon={CreditCard} 
                label="السعر لكل 1000" 
                value={`${service.price.toFixed(2)} ر.س`}
                highlight
              />
              <FeatureItem 
                icon={Clock} 
                label="وقت التنفيذ المتوقع" 
                value={estimatedTime}
              />
              <FeatureItem 
                icon={TrendingUp} 
                label="الحد الأدنى" 
                value={minQuantity.toLocaleString('ar-SA')}
              />
              <FeatureItem 
                icon={Hash} 
                label="الحد الأقصى" 
                value={maxQuantity.toLocaleString('ar-SA')}
              />
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-4"
            >
              <h4 className="font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                مميزات الخدمة
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-sm font-medium">تنفيذ سريع</span>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{quality}</span>
                </motion.div>
                
                {service.refill_enabled && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-warning" />
                    </div>
                    <span className="text-sm font-medium">ضمان التعويض</span>
                  </motion.div>
                )}
                
                {service.refill_enabled && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium">إعادة تعبئة مجانية</span>
                  </motion.div>
                )}
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/60 border border-border/40"
                >
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">بدء تلقائي</span>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/60 border border-border/40"
                >
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">دعم 24/7</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Price Calculator Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  حاسبة السعر السريعة
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[1000, 5000, 10000].map((qty) => (
                  <motion.div
                    key={qty}
                    whileHover={{ scale: 1.03 }}
                    className="p-4 rounded-xl bg-background/80 border border-border/50"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{qty.toLocaleString()} وحدة</p>
                    <p className="text-lg font-bold text-primary">
                      {((service.price / 1000) * qty).toFixed(2)} ر.س
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="relative p-6 pt-4 border-t border-border/40 bg-gradient-to-t from-muted/20 to-transparent">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl text-base"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5 ml-2" />
              إغلاق
            </Button>
            <Button
              className="flex-[2] h-14 rounded-2xl text-base bg-gradient-to-r from-primary via-primary to-accent shadow-xl shadow-primary/40 hover:opacity-90 transition-opacity"
              onClick={() => {
                onOrder(service);
                onOpenChange(false);
              }}
            >
              <ShoppingCart className="w-5 h-5 ml-2" />
              اطلب الآن
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
