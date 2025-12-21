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
        return <Badge className="bg-success/20 text-success border-success/30">نشط</Badge>;
      case "inactive":
        return <Badge variant="secondary">غير نشط</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-muted-foreground">مؤرشف</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="glass border-border/50 hover:border-primary/30 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(service.category)} p-3 shrink-0`}>
                <Package className="w-full h-full text-primary-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold truncate">{service.name}</h3>
                  {getStatusBadge(service.status)}
                </div>
                <p className="text-sm text-muted-foreground truncate">{service.category}</p>
              </div>

              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">السعر</p>
                  <p className="font-bold text-primary">{service.price.toLocaleString()} ر.س</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">الطلبات</p>
                  <p className="font-bold">{service.orderCount || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">الإيرادات</p>
                  <p className="font-bold text-success">{(service.revenue || 0).toLocaleString()} ر.س</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="glass border-border/50 hover:border-primary/30 transition-all h-full overflow-hidden">
        {/* Top Gradient Bar */}
        <div className={`h-1 sm:h-1.5 bg-gradient-to-l ${getCategoryGradient(service.category)}`} />
        
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <motion.div 
              className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${getCategoryGradient(service.category)} p-2 sm:p-2.5 lg:p-3.5 shadow-lg shrink-0`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Package className="w-full h-full text-primary-foreground" />
            </motion.div>
            {getStatusBadge(service.status)}
          </div>

          <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-0.5 sm:mb-1 line-clamp-2">{service.name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{service.category}</p>
          
          {service.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4 line-clamp-2 hidden sm:block">{service.description}</p>
          )}

          <div className="flex items-center justify-between mb-2 sm:mb-4 pt-2 sm:pt-4 border-t border-border/50">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
              {service.price.toLocaleString()} ر.س
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{service.orderCount || 0} طلب</span>
            </div>
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{(service.revenue || 0).toLocaleString()} ر.س</span>
            </div>
          </div>

          {/* Actions - Always visible on mobile */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 sm:h-9 text-[10px] sm:text-xs gap-1" 
              onClick={() => onEdit(service)}
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>تعديل</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 sm:h-9 text-[10px] sm:text-xs gap-1" 
              onClick={() => onView(service)}
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>عرض</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 h-8 sm:h-9 text-[10px] sm:text-xs gap-1"
              onClick={() => onDelete(service.id)}
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>حذف</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ServiceCard;
