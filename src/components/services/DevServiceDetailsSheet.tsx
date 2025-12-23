import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  DollarSign,
  Shield,
  Clock,
  Heart,
  ShoppingCart,
  Info,
  CheckCircle2,
  Zap,
  TrendingUp,
  Sparkles,
  Award,
  ArrowLeft,
  Globe,
  Smartphone,
  Server,
  Database,
  Terminal,
  Layers,
  Calendar,
  Star,
  Users,
  X,
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

interface DevServiceDetailsSheetProps {
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
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Get category icon
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('web') || lowerCategory.includes('ويب')) return Globe;
  if (lowerCategory.includes('mobile') || lowerCategory.includes('جوال') || lowerCategory.includes('تطبيق')) return Smartphone;
  if (lowerCategory.includes('backend') || lowerCategory.includes('باك')) return Server;
  if (lowerCategory.includes('database') || lowerCategory.includes('قواعد')) return Database;
  if (lowerCategory.includes('api')) return Terminal;
  return Code;
};

const DevServiceDetailsSheet = ({
  service,
  isOpen,
  onClose,
  onOrder,
  isFavorite,
  onToggleFavorite,
}: DevServiceDetailsSheetProps) => {
  if (!service) return null;

  const features = Array.isArray(service.features) ? service.features : [];
  const CategoryIcon = getCategoryIcon(service.category);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className="w-full sm:max-w-lg md:max-w-xl overflow-hidden p-0 bg-background border-l-0"
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
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent" />
              <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl" />
              
              <SheetHeader className="relative p-5 sm:p-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Close Button - Mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="sm:hidden shrink-0 rounded-full h-10 w-10"
                  >
                    <X className="w-5 h-5" />
                  </Button>

                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleFavorite(service.id)}
                      className={cn(
                        "shrink-0 rounded-full h-10 w-10 sm:h-12 sm:w-12 transition-all duration-300",
                        isFavorite 
                          ? "text-red-500 bg-red-500/15 hover:bg-red-500/25 shadow-lg shadow-red-500/20" 
                          : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      )}
                    >
                      <Heart className={cn("w-5 h-5 sm:w-6 sm:h-6", isFavorite && "fill-current")} />
                    </Button>
                  </motion.div>
                  
                  <div className="flex-1 text-right">
                    <SheetTitle className="text-lg sm:text-xl md:text-2xl font-bold leading-relaxed mb-2 line-clamp-2">
                      {service.name}
                    </SheetTitle>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Badge className="gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        <CategoryIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="text-xs sm:text-sm">تطوير المواقع</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>
            </motion.div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
              {/* Price Card */}
              <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/5" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative p-4 sm:p-5 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <motion.div 
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                      >
                        <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">السعر للمشروع</p>
                        <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                          {service.price.toFixed(0)} ر.س
                        </p>
                      </div>
                    </div>
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">متاح الآن</span>
                      </Badge>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats Grid */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                <motion.div 
                  whileHover={{ y: -3 }}
                  className="p-3 sm:p-4 rounded-xl bg-card/80 border border-border/50 group hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">وقت البدء</span>
                  </div>
                  <p className="font-bold text-sm sm:text-base">0-1 ساعة</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -3 }}
                  className="p-3 sm:p-4 rounded-xl bg-card/80 border border-border/50 group hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">جودة الخدمة</span>
                  </div>
                  <p className="font-bold text-sm sm:text-base">عالية الجودة</p>
                </motion.div>
              </motion.div>

              {/* Project Stats */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 sm:gap-3">
                <motion.div 
                  whileHover={{ y: -3 }}
                  className="p-2.5 sm:p-3 rounded-xl bg-card/80 border border-border/50 text-center group hover:border-emerald-500/30 transition-all"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-1.5 group-hover:bg-emerald-500/20 transition-colors">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">مدة التسليم</p>
                  <p className="font-bold text-xs sm:text-sm">24-72 ساعة</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -3 }}
                  className="p-2.5 sm:p-3 rounded-xl bg-card/80 border border-border/50 text-center group hover:border-teal-500/30 transition-all"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-teal-500/10 flex items-center justify-center mx-auto mb-1.5 group-hover:bg-teal-500/20 transition-colors">
                    <Star className="w-4 h-4 text-teal-500" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">التقييم</p>
                  <p className="font-bold text-xs sm:text-sm">5/5</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -3 }}
                  className="p-2.5 sm:p-3 rounded-xl bg-card/80 border border-border/50 text-center group hover:border-cyan-500/30 transition-all"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-1.5 group-hover:bg-cyan-500/20 transition-colors">
                    <Users className="w-4 h-4 text-cyan-500" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">مشاريع منجزة</p>
                  <p className="font-bold text-xs sm:text-sm">+100</p>
                </motion.div>
              </motion.div>

              {/* Guarantee Badge */}
              {service.refill_enabled && (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5" />
                  <div className="relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-emerald-500/30 rounded-2xl">
                    <motion.div 
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0"
                    >
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">ضمان الجودة</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        ضمان لمدة {service.refill_days || 30} يوم
                      </p>
                    </div>
                    <Award className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500/40 shrink-0" />
                  </div>
                </motion.div>
              )}

              {/* Description */}
              {service.description && (
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>وصف الخدمة</span>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs sm:text-sm leading-relaxed">{service.description}</p>
                  </div>
                </motion.div>
              )}

              {/* Features List */}
              {features.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
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
                        transition={{ delay: 0.3 + index * 0.06 }}
                        whileHover={{ x: -5 }}
                        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/50 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                        </div>
                        <span className="text-xs sm:text-sm flex-1">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tech Stack (if no features) */}
              {features.length === 0 && (
                <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Layers className="w-4 h-4" />
                    <span>ما يتضمنه المشروع</span>
                  </div>
                  <div className="grid gap-2">
                    {[
                      "تصميم متجاوب مع جميع الأجهزة",
                      "كود نظيف وقابل للصيانة",
                      "أداء عالي وسرعة تحميل",
                      "دعم فني بعد التسليم"
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.06 }}
                        whileHover={{ x: -5 }}
                        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/50 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                        </div>
                        <span className="text-xs sm:text-sm flex-1">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Fixed Bottom Actions */}
            <motion.div
              variants={itemVariants}
              className="p-4 sm:p-6 border-t border-border/50 bg-card/80 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-2 sm:gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={() => {
                      onOrder(service);
                      onClose();
                    }}
                    className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-xl shadow-emerald-500/25 gap-2 sm:gap-3"
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    طلب الخدمة الآن
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </motion.div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                  className="w-full h-10 sm:h-12 rounded-xl text-sm sm:text-base"
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

export default DevServiceDetailsSheet;
