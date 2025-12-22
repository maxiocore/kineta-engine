import { motion } from "framer-motion";
import { Package, Edit, Trash2, Eye, ShoppingCart, Star, Zap } from "lucide-react";
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

  // List View - Compact for mobile
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className="group border-border/50 overflow-hidden hover:shadow-md transition-all">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-2.5">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryGradient(service.category)} p-2 shrink-0 shadow-sm`}>
                <Package className="w-full h-full text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{service.name}</h3>
                <p className="text-[10px] text-muted-foreground">{service.category}</p>
              </div>

              {/* Price */}
              <div className="text-left shrink-0">
                <p className="text-base font-bold text-primary">${service.price.toFixed(2)}</p>
              </div>

              {/* Actions */}
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onView(service)}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Grid View - Compact cards
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group h-full"
    >
      <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all h-full flex flex-col">
        {/* Top gradient bar */}
        <div className={`h-1 bg-gradient-to-l ${getCategoryGradient(service.category)}`} />
        
        {/* Badge for new/popular */}
        {(isPopular || isNew) && (
          <div className="absolute top-2.5 left-2 z-10">
            {isNew ? (
              <Badge className="bg-success/90 text-success-foreground text-[8px] shadow-sm px-1.5 py-0.5">
                <Zap className="w-2 h-2 ml-0.5" />
                جديد
              </Badge>
            ) : isPopular ? (
              <Badge className="bg-warning/90 text-warning-foreground text-[8px] shadow-sm px-1.5 py-0.5">
                <Star className="w-2 h-2 ml-0.5 fill-current" />
                شائع
              </Badge>
            ) : null}
          </div>
        )}

        <CardContent className="p-3 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-start gap-2.5 mb-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryGradient(service.category)} p-2 shrink-0 shadow-md`}>
              <Package className="w-full h-full text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs leading-tight line-clamp-2 mb-0.5">{service.name}</h3>
              <p className="text-[10px] text-muted-foreground">{service.category}</p>
            </div>
          </div>

          {/* Description - Only show on larger screens */}
          {service.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2 hidden sm:block">
              {service.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between mb-2.5 px-2 py-1.5 rounded-md bg-secondary/50 text-[10px]">
            <div className="flex items-center gap-1">
              <ShoppingCart className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium">{service.orderCount || 0}</span>
            </div>
            <Badge className={cn("text-[8px] px-1.5 py-0", statusConfig.className)}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Price */}
          <div className="mb-2.5 mt-auto">
            <span className="text-lg font-bold text-primary">
              ${service.price.toFixed(2)}
            </span>
          </div>

          {/* Actions - Single row for mobile */}
          <div className="flex items-center gap-1.5">
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1 h-8 text-[10px] font-medium gap-1"
              onClick={() => onView(service)}
            >
              <Eye className="w-3 h-3" />
              عرض
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onEdit(service)}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(service.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedServiceCard;
