import { motion } from "framer-motion";
import { Package, Eye, Edit2, Trash2, Zap, ShoppingCart, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
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
        return { label: "نشط", className: "bg-success/10 text-success border-success/20" };
      case "inactive":
        return { label: "متوقف", className: "bg-warning/10 text-warning border-warning/20" };
      case "archived":
        return { label: "مؤرشف", className: "bg-muted text-muted-foreground border-border" };
      default:
        return { label: status, className: "bg-secondary text-secondary-foreground border-border" };
    }
  };

  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      "Instagram": "from-pink-500 to-orange-400",
      "Facebook": "from-blue-600 to-blue-400",
      "Youtube": "from-red-600 to-red-400",
      "Twitter": "from-sky-500 to-sky-400",
      "TikTok": "from-pink-500 to-cyan-400",
      "Telegram": "from-sky-500 to-blue-500",
      "LinkedIn": "from-blue-700 to-blue-500",
      "Spotify": "from-green-500 to-green-400",
    };
    return gradients[category] || "from-primary to-accent";
  };

  const statusConfig = getStatusConfig(service.status);
  const isNew = service.created_at && 
    new Date(service.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const gradient = getCategoryGradient(service.category);

  // List View
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.3) }}
        whileHover={{ scale: 1.005 }}
        className="w-full"
      >
        <Card className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-lg hover:border-primary/20 transition-all border-border/50 group">
          {/* Icon */}
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} p-2.5 shrink-0 shadow-md`}>
            <Package className="w-full h-full text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-4 items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm sm:text-base font-semibold truncate">{service.name}</p>
                {isNew && (
                  <Badge className="bg-accent/10 text-accent text-[10px] px-1.5 py-0 shrink-0">
                    <Zap className="w-2.5 h-2.5 ml-0.5" />
                    جديد
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{service.category}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{service.orderCount || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-success">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{(service.revenue || 0).toFixed(0)}</span>
              </div>
            </div>

            {/* Price & Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge className={cn("text-[10px] sm:text-xs px-2 py-0.5 border", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
              <span className="text-sm sm:text-base font-bold text-primary">${service.price.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(service)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(service)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => onDelete(service.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -4 }}
      className="w-full h-full"
    >
      <Card className="flex flex-col h-full min-h-[200px] p-4 border-border/50 hover:shadow-xl hover:border-primary/30 transition-all group overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} p-2.5 shrink-0 shadow-lg`}>
            <Package className="w-full h-full text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight line-clamp-1">{service.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{service.category}</p>
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge className={cn("text-[10px] px-2 py-0.5 border", statusConfig.className)}>
            {statusConfig.label}
          </Badge>
          {isNew && (
            <Badge className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 border border-accent/20">
              <Zap className="w-2.5 h-2.5 ml-0.5" />
              جديد
            </Badge>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs bg-secondary/50 rounded-lg px-3 py-2 mb-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{service.orderCount || 0} طلب</span>
          </div>
          <div className="flex items-center gap-1 text-success font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{(service.revenue || 0).toFixed(0)}</span>
          </div>
        </div>

        {/* Price & Actions - pushed to bottom */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <span className="text-lg font-bold text-primary">${service.price.toFixed(2)}</span>
          <div className="flex items-center gap-1">
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 text-xs px-3 gap-1.5"
              onClick={() => onView(service)}
            >
              <Eye className="w-3.5 h-3.5" />
              عرض
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(service)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedServiceCard;