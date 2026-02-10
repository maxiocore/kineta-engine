import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Clock,
  Check,
  Star,
  Sparkles,
  ShoppingCart,
  Wallet,
  Zap,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FinancingCTA from "@/components/FinancingCTA";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  features: any;
  refill_enabled: boolean | null;
}

interface ServiceDetailsDrawerProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrder: (service: Service) => void;
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
}

const ServiceDetailsDrawer = ({
  service,
  open,
  onOpenChange,
  onOrder,
  gradientFrom = "from-primary",
  gradientTo = "to-accent",
  gradientVia = "via-primary/80",
}: ServiceDetailsDrawerProps) => {

  if (!service) return null;

  const features = Array.isArray(service.features) ? service.features : [];
  const showFinancingButton = service.price > 1000;

  const highlights = [
    { icon: Zap, label: "تنفيذ سريع", color: "text-amber-500 bg-amber-500/10" },
    { icon: Shield, label: "ضمان الجودة", color: "text-emerald-500 bg-emerald-500/10" },
    { icon: Users, label: "دعم متواصل", color: "text-blue-500 bg-blue-500/10" },
    { icon: Award, label: "أعلى تقييم", color: "text-purple-500 bg-purple-500/10" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0" dir="rtl">
        {/* Header */}
        <div className={cn(
          "relative p-6 pb-8 bg-gradient-to-br text-white",
          gradientFrom, gradientTo
        )}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          </div>
          
          <SheetHeader className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {service.category}
                  </Badge>
                  {service.refill_enabled && (
                    <Badge className="bg-white/20 text-white border-0 text-xs gap-1">
                      <Shield className="w-3 h-3" />
                      مضمون
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-xl font-bold text-white text-right leading-tight">
                  {service.name}
                </SheetTitle>
              </div>
              
              <div className="text-left shrink-0 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-3xl font-bold">{service.price.toFixed(0)}</span>
                <span className="text-sm mr-1">ر.س</span>
              </div>
            </div>

            {/* Quick Highlights */}
            <div className="flex flex-wrap gap-2">
              {highlights.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              ))}
            </div>
          </SheetHeader>
        </div>

        <ScrollArea className="h-[calc(85vh-200px)] px-6 py-4">
          {/* Description */}
          {service.description && (
            <div className="mb-6">
              <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                وصف الخدمة
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description}
              </p>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                مميزات الخدمة
              </h3>
              <div className="grid gap-2">
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 bg-success/5 rounded-xl border border-success/10"
                  >
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "التقييم", value: "4.9", icon: Star, color: "text-amber-500" },
              { label: "الطلبات", value: "1.2K+", icon: TrendingUp, color: "text-emerald-500" },
              { label: "التسليم", value: "سريع", icon: Clock, color: "text-blue-500" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 bg-muted/30 rounded-xl">
                <stat.icon className={cn("w-5 h-5 mx-auto mb-1", stat.color)} />
                <p className="font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border/50">
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() => {
                onOpenChange(false);
                onOrder(service);
              }}
              className={cn(
                "w-full h-12 rounded-xl text-white bg-gradient-to-r shadow-lg",
                gradientFrom, gradientVia, gradientTo
              )}
            >
              <ShoppingCart className="w-5 h-5 ml-2" />
              اطلب الآن
            </Button>
            
            {showFinancingButton && (
              <FinancingCTA
                serviceId={service.id}
                variant="compact"
                className="w-full h-11"
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ServiceDetailsDrawer;
