import { motion, AnimatePresence } from "framer-motion";
import { translateCategory, translateServiceName } from "@/lib/categoryTranslation";
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
  Sparkles,
  Target,
  Users,
  Timer,
  Award,
  ArrowLeft,
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
  },
};

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
  
  // Parse features object
  const featuresObj = (() => {
    try {
      if (typeof service.features === 'string') {
        return JSON.parse(service.features);
      }
      if (typeof service.features === 'object' && !Array.isArray(service.features)) {
        return service.features;
      }
      return {};
    } catch {
      return {};
    }
  })();

  const minQuantity = featuresObj.min || 10;
  const maxQuantity = featuresObj.max || 1000000;
  const ratePerHour = featuresObj.rate || 10000;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className="w-full sm:max-w-xl overflow-hidden p-0 bg-background border-l-0"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
            className="flex flex-col h-full"
          >
            {/* Header with Gradient */}
            <motion.div 
              variants={itemVariants}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
              <div className="absolute top-0 left-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
              
              <SheetHeader className="relative p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleFavorite(service.id)}
                      className={cn(
                        "shrink-0 rounded-full h-12 w-12 transition-all duration-300",
                        isFavorite 
                          ? "text-red-500 bg-red-500/15 hover:bg-red-500/25 shadow-lg shadow-red-500/20" 
                          : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      )}
                    >
                      <Heart className={cn("w-6 h-6", isFavorite && "fill-current")} />
                    </Button>
                  </motion.div>
                  
                  <div className="flex-1 text-right">
                    <SheetTitle className="text-xl sm:text-2xl font-bold leading-relaxed mb-2">
                      {translateServiceName(service.name)}
                    </SheetTitle>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {service.external_service_id && (
                        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-card/50 border-primary/30">
                          <Hash className="w-3.5 h-3.5 text-primary" />
                          <span className="font-mono">{service.external_service_id}</span>
                        </Badge>
                      )}
                      <Badge className="gap-1.5 px-3 py-1.5 bg-accent/15 text-accent border-accent/30">
                        <Package className="w-3.5 h-3.5" />
                        {translateCategory(service.category)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>
            </motion.div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
              {/* Price Card */}
              <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative p-5 border border-primary/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                      >
                        <DollarSign className="w-7 h-7 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">السعر لكل 1000</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                          {service.price.toFixed(4)} ر.س
                        </p>
                      </div>
                    </div>
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge className="bg-success/15 text-success border-success/30 gap-1.5 px-3 py-2">
                        <Sparkles className="w-4 h-4" />
                        متاح الآن
                      </Badge>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats Grid */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                <motion.div 
                  whileHover={{ y: -3 }}
                  className="p-4 rounded-xl bg-card/80 border border-border/50 text-center group hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">الحد الأدنى</p>
                  <p className="font-bold text-sm">{minQuantity.toLocaleString()}</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -3 }}
                  className="p-4 rounded-xl bg-card/80 border border-border/50 text-center group hover:border-accent/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-accent/20 transition-colors">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">الحد الأقصى</p>
                  <p className="font-bold text-sm">{maxQuantity >= 1000000 ? '1M+' : maxQuantity.toLocaleString()}</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -3 }}
                  className="p-4 rounded-xl bg-card/80 border border-border/50 text-center group hover:border-success/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-success/20 transition-colors">
                    <Timer className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">السرعة/ساعة</p>
                  <p className="font-bold text-sm">{ratePerHour >= 1000 ? `${ratePerHour/1000}K` : ratePerHour}</p>
                </motion.div>
              </motion.div>

              {/* Refill Guarantee */}
              {service.refill_enabled && (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-success/5" />
                  <div className="relative flex items-center gap-4 p-4 border border-success/30 rounded-2xl">
                    <motion.div 
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center"
                    >
                      <Shield className="w-6 h-6 text-success" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-bold text-success text-base">ضمان إعادة التعبئة</p>
                      <p className="text-sm text-muted-foreground">
                        لمدة {service.refill_days || 30} يوم من تاريخ الطلب
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-success/40" />
                  </div>
                </motion.div>
              )}

              {/* Service Info */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-card/60 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">وقت البدء</span>
                  </div>
                  <p className="font-bold">0-1 ساعة</p>
                </div>
                <div className="p-4 rounded-xl bg-card/60 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <span className="text-xs text-muted-foreground">جودة الخدمة</span>
                  </div>
                  <p className="font-bold">عالية الجودة</p>
                </div>
              </motion.div>

              {/* Description */}
              {service.description && (
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>وصف الخدمة</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm leading-relaxed">{service.description}</p>
                  </div>
                </motion.div>
              )}

              {/* Features List */}
              {features.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    <span>مميزات الخدمة</span>
                  </div>
                  <div className="grid gap-2">
                    {features.map((feature: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                        whileHover={{ x: -5 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 transition-all"
                      >
                        <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </div>
                        <span className="text-sm flex-1">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Fixed Bottom Actions */}
            <motion.div
              variants={itemVariants}
              className="p-6 border-t border-border/50 bg-card/80 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={() => {
                      onOrder(service);
                      onClose();
                    }}
                    className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl shadow-primary/25 gap-3"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    طلب الخدمة الآن
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </motion.div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                  className="w-full h-12 rounded-xl"
                >
                  إغلاق
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default ServiceDetailsSheet;
