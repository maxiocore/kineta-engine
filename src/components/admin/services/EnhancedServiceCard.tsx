import { motion } from "framer-motion";
import { Package, Eye, Edit2, Trash2, Zap, ShoppingCart, DollarSign, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatPrice } from "@/lib/utils";

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
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (serviceId: string) => void;
}

const EnhancedServiceCard = ({ 
  service, 
  index, 
  viewMode, 
  onEdit, 
  onDelete, 
  onView,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}: EnhancedServiceCardProps) => {
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

  // List View - Compact
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.02, 0.2) }}
        whileHover={{ x: 2 }}
        className="w-full"
      >
        <Card className={cn(
          "p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 hover:shadow-md transition-all border-border/40 group bg-card/80 backdrop-blur-sm",
          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/20"
        )}>
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect?.(service.id)}
                className="h-5 w-5"
              />
            </div>
          )}
          
          {/* Icon */}
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} p-1.5 shrink-0 shadow-sm`}>
            <Package className="w-full h-full text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold truncate">{service.name}</p>
                {isNew && (
                  <Badge className="bg-accent/15 text-accent text-[8px] px-1 py-0 h-4 shrink-0 border-0 flex flex-row-reverse items-center">
                    <Zap className="w-2 h-2 me-0.5" />
                    جديد
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{service.category}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <ShoppingCart className="w-3 h-3" />
                {service.orderCount || 0}
              </span>
              <span className="flex items-center gap-0.5 text-success">
                {(service.revenue || 0).toFixed(0)} ر.س
              </span>
            </div>
          </div>

          {/* Price & Status */}
          <div className="flex flex-row-reverse items-center gap-2 shrink-0">
            <Badge className={cn("text-[9px] px-1.5 py-0 h-5 border", statusConfig.className)}>
              {statusConfig.label}
            </Badge>
            <span className="text-sm font-bold text-primary min-w-[70px] text-end" dir="ltr">{formatPrice(service.price)}</span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(service)}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(service)}>
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => onDelete(service.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid View - Compact
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="w-full h-full"
    >
      <Card className={cn(
        "flex flex-col h-full p-3 border-border/40 hover:shadow-lg transition-all group overflow-hidden bg-card/80 backdrop-blur-sm relative",
        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/30"
      )}>
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div 
            className="absolute top-2 start-2 z-10" 
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(service.id)}
              className="h-5 w-5 bg-background"
            />
          </div>
        )}
        
        {/* Header Row */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} p-1.5 shrink-0 shadow-md`}>
            <Package className="w-full h-full text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight line-clamp-1">{service.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{service.category}</span>
              {isNew && (
                <Badge className="bg-accent/15 text-accent text-[8px] px-1 py-0 h-4 border-0 flex flex-row-reverse items-center">
                  <Zap className="w-2 h-2 me-0.5" />
                  جديد
                </Badge>
              )}
            </div>
          </div>
          <Badge className={cn("text-[9px] px-1.5 py-0 h-5 border shrink-0", statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Stats Mini Row */}
        <div className="flex items-center gap-3 text-[10px] bg-secondary/40 rounded-lg px-2.5 py-1.5 mb-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <ShoppingCart className="w-3 h-3" />
            <span>{service.orderCount || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-success">
            <span>{(service.revenue || 0).toFixed(0)} ر.س</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
          <span className="text-base font-bold text-primary">{formatPrice(service.price)}</span>
          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-60 hover:opacity-100"
              onClick={() => onView(service)}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(service)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
              onClick={() => onDelete(service.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedServiceCard;