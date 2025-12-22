import { motion } from "framer-motion";
import { Package, Edit, Trash2, Eye, TrendingUp, ShoppingCart, Star, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  features: string[];
  image_url: string | null;
  orderCount?: number;
  revenue?: number;
  created_at?: string;
}

interface EnhancedServiceCardProps {
  service: Service;
  index: number;
  viewMode: "grid" | "list";
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onView: (service: Service) => void;
}

const EnhancedServiceCard = ({ service, index, viewMode, onEdit, onDelete, onView }: EnhancedServiceCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { 
          label: "نشط", 
          className: "bg-success/10 text-success border-success/20",
          dotColor: "bg-success"
        };
      case "inactive":
        return { 
          label: "غير نشط", 
          className: "bg-warning/10 text-warning border-warning/20",
          dotColor: "bg-warning"
        };
      case "archived":
        return { 
          label: "مؤرشف", 
          className: "bg-muted text-muted-foreground border-muted",
          dotColor: "bg-muted-foreground"
        };
      default:
        return { 
          label: status, 
          className: "bg-secondary text-secondary-foreground",
          dotColor: "bg-secondary-foreground"
        };
    }
  };

  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      "Instagram": "from-pink-500 via-purple-500 to-orange-500",
      "Facebook": "from-blue-600 to-blue-400",
      "Youtube": "from-red-600 to-red-400",
      "Twitter": "from-sky-500 to-sky-400",
      "TikTok": "from-black via-pink-500 to-cyan-400",
      "Telegram": "from-sky-500 to-blue-500",
      "LinkedIn": "from-blue-700 to-blue-500",
      "Spotify": "from-green-500 to-green-400",
      "التصميم": "from-primary to-cyan-400",
      "التسويق": "from-accent to-purple-400",
      "الإعلانات": "from-warning to-orange-400",
      "التطوير": "from-success to-emerald-400",
      "الاستشارات": "from-destructive to-pink-400",
    };
    return gradients[category] || "from-primary to-cyan-400";
  };

  const statusConfig = getStatusConfig(service.status);
  const isPopular = (service.orderCount || 0) > 10;
  const isNew = service.created_at && 
    new Date(service.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className="group border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
              {/* Icon */}
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${getCategoryGradient(service.category)} p-2 sm:p-3 shrink-0 shadow-lg`}>
                <Package className="w-full h-full text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{service.name}</h3>
                  {isPopular && (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[8px] sm:text-[10px] shrink-0 hidden xs:flex">
                      <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 ml-0.5 fill-current" />
                      شائع
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{service.category}</p>
              </div>

              {/* Stats - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                <div className="text-center">
                  <p className="font-bold text-foreground">{service.orderCount || 0}</p>
                  <p className="text-[10px]">طلب</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-success">${(service.revenue || 0).toFixed(0)}</p>
                  <p className="text-[10px]">إيرادات</p>
                </div>
              </div>

              {/* Price */}
              <div className="text-left shrink-0">
                <p className="text-base sm:text-xl font-bold text-primary">${service.price.toFixed(2)}</p>
                <Badge className={cn("text-[8px] sm:text-[10px] hidden sm:flex", statusConfig.className)}>
                  <span className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ml-1", statusConfig.dotColor)} />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onView(service)}>
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onEdit(service)}>
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive" onClick={() => onDelete(service.id)}>
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:border-primary/30 hover:-translate-y-1">
        {/* Top gradient bar */}
        <div className={`h-1 sm:h-1.5 bg-gradient-to-l ${getCategoryGradient(service.category)}`} />
        
        {/* Badges */}
        <div className="absolute top-3 sm:top-4 left-2 sm:left-3 flex flex-col gap-1 sm:gap-1.5 z-10">
          {isPopular && (
            <Badge className="bg-warning/90 text-warning-foreground text-[8px] sm:text-[10px] shadow-sm px-1.5 sm:px-2">
              <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 ml-0.5 fill-current" />
              شائع
            </Badge>
          )}
          {isNew && (
            <Badge className="bg-success/90 text-success-foreground text-[8px] sm:text-[10px] shadow-sm px-1.5 sm:px-2">
              <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5 ml-0.5" />
              جديد
            </Badge>
          )}
        </div>

        <CardContent className="p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${getCategoryGradient(service.category)} p-2 sm:p-2.5 shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Package className="w-full h-full text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm truncate mb-0.5">{service.name}</h3>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">{service.category}</p>
                </div>
                <Badge className={cn("text-[8px] sm:text-[10px] shrink-0", statusConfig.className)}>
                  <span className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ml-0.5 sm:ml-1 animate-pulse", statusConfig.dotColor)} />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Description - Hidden on very small screens */}
          {service.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mb-3 sm:mb-4 hidden xs:block">
              {service.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 p-2 sm:p-2.5 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1">
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs font-medium">{service.orderCount || 0}</span>
            </div>
            <div className="h-3 sm:h-4 w-px bg-border" />
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">${(service.revenue || 0).toFixed(0)}</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
              ${service.price.toFixed(2)}
            </span>
            {service.features && service.features.length > 0 && (
              <Badge variant="outline" className="text-[8px] sm:text-[10px]">
                {service.features.length} ميزة
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 sm:h-9 text-[10px] sm:text-xs font-medium"
              onClick={() => onView(service)}
            >
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 sm:ml-1" />
              <span className="hidden xs:inline">عرض</span>
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 sm:h-9 text-[10px] sm:text-xs font-medium"
              onClick={() => onEdit(service)}
            >
              <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 sm:ml-1" />
              <span className="hidden xs:inline">تعديل</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 sm:h-9 text-[10px] sm:text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(service.id)}
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 sm:ml-1" />
              <span className="hidden xs:inline">حذف</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedServiceCard;
