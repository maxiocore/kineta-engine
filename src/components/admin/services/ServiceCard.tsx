import { motion } from "framer-motion";
import { Package, Edit, Trash2, Eye, MoreVertical, TrendingUp, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

interface ServiceCardProps {
  service: Service;
  index: number;
  viewMode: "grid" | "list";
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onView: (service: Service) => void;
}

const ServiceCard = ({ service, index, viewMode, onEdit, onDelete, onView }: ServiceCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/30 text-[9px] px-1 py-0">نشط</Badge>;
      case "inactive":
        return <Badge variant="secondary" className="text-[9px] px-1 py-0">غير نشط</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-muted-foreground text-[9px] px-1 py-0">مؤرشف</Badge>;
      default:
        return <Badge variant="secondary" className="text-[9px] px-1 py-0">{status}</Badge>;
    }
  };

  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      "التصميم": "from-primary to-cyan-400",
      "التسويق": "from-accent to-purple-400",
      "الإعلانات": "from-warning to-orange-400",
      "التطوير": "from-success to-emerald-400",
      "الاستشارات": "from-destructive to-pink-400",
    };
    return gradients[category] || "from-primary to-cyan-400";
  };

  // List view - compact
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className="glass border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getCategoryGradient(service.category)} p-1.5 shrink-0`}>
                <Package className="w-full h-full text-primary-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xs truncate">{service.name}</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="text-primary font-semibold">{service.price.toLocaleString()} ر.س</span>
                  {getStatusBadge(service.status)}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuItem onClick={() => onView(service)}>
                    <Eye className="w-3.5 h-3.5 ms-2" />
                    عرض
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(service)}>
                    <Edit className="w-3.5 h-3.5 ms-2" />
                    تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(service.id)} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5 ms-2" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Grid view - Mobile optimized
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card className="glass border-border/50 h-full overflow-hidden">
        <div className={`h-1 bg-gradient-to-l ${getCategoryGradient(service.category)}`} />
        
        <CardContent className="p-2.5">
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getCategoryGradient(service.category)} p-1.5 shrink-0`}>
              <Package className="w-full h-full text-primary-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs leading-tight line-clamp-2 mb-0.5">{service.name}</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{service.category}</span>
                {getStatusBadge(service.status)}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-base font-bold text-primary mb-1.5">
            {service.price.toLocaleString()} <span className="text-xs">ر.س</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mb-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <ShoppingCart className="w-3 h-3" />
              {service.orderCount || 0} طلب
            </span>
            <span className="flex items-center gap-0.5 text-success">
              <TrendingUp className="w-3 h-3" />
              {(service.revenue || 0).toLocaleString()} ر.س
            </span>
          </div>

          {/* Actions - Simple 2 column grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 text-[10px] px-2" 
              onClick={() => onView(service)}
            >
              <Eye className="w-3 h-3 ml-1" />
              عرض
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 text-[10px] px-2" 
              onClick={() => onEdit(service)}
            >
              <Edit className="w-3 h-3 ml-1" />
              تعديل
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-[10px] mt-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(service.id)}
          >
            <Trash2 className="w-3 h-3 ml-1" />
            حذف
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ServiceCard;
