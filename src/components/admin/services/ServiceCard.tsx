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
        return <Badge className="bg-success/20 text-success border-success/30 text-[10px] px-1.5 py-0.5">نشط</Badge>;
      case "inactive":
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">غير نشط</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0.5">مؤرشف</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">{status}</Badge>;
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

  // Mobile-optimized compact card for list view
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Card className="glass border-border/50 hover:border-primary/30 transition-all">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryGradient(service.category)} p-2 shrink-0`}>
                <Package className="w-full h-full text-primary-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-sm truncate">{service.name}</h3>
                  {getStatusBadge(service.status)}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{service.category}</span>
                  <span className="text-primary font-bold">{service.price.toLocaleString()} ر.س</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuItem onClick={() => onView(service)}>
                    <Eye className="w-4 h-4 ms-2" />
                    عرض التفاصيل
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(service)}>
                    <Edit className="w-4 h-4 ms-2" />
                    تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(service.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4 ms-2" />
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
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 120 }}
      className="group"
    >
      <Card className="glass border-border/50 hover:border-primary/30 transition-all h-full overflow-hidden">
        {/* Top Gradient Bar */}
        <div className={`h-1 bg-gradient-to-l ${getCategoryGradient(service.category)}`} />
        
        <CardContent className="p-3">
          {/* Header: Icon, Name, Status */}
          <div className="flex items-start gap-2.5 mb-3">
            <motion.div 
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryGradient(service.category)} p-2 shadow-md shrink-0`}
              whileHover={{ scale: 1.05 }}
            >
              <Package className="w-full h-full text-primary-foreground" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1">{service.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{service.category}</span>
                {getStatusBadge(service.status)}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-lg font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent mb-2">
            {service.price.toLocaleString()} ر.س
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <ShoppingCart className="w-3 h-3" />
              <span>{service.orderCount || 0} طلب</span>
            </div>
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="w-3 h-3" />
              <span>{(service.revenue || 0).toLocaleString()} ر.س</span>
            </div>
          </div>

          {/* Action Buttons - Two rows on mobile */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-[11px] gap-1" 
                onClick={() => onView(service)}
              >
                <Eye className="w-3.5 h-3.5" />
                عرض
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-[11px] gap-1" 
                onClick={() => onEdit(service)}
              >
                <Edit className="w-3.5 h-3.5" />
                تعديل
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-[11px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onDelete(service.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ServiceCard;
