import * as React from "react";
import { motion } from "framer-motion";
import { Package, Edit, Trash2, Eye, TrendingUp, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
  ({ service, index, viewMode, onEdit, onDelete, onView }, ref) => {
    const getStatusBadge = (status: string) => {
      switch (status) {
        case "active":
          return <Badge className="bg-success/20 text-success text-[9px] h-4 px-1.5">نشط</Badge>;
        case "inactive":
          return <Badge variant="secondary" className="text-[9px] h-4 px-1.5">غير نشط</Badge>;
        case "archived":
          return <Badge variant="outline" className="text-[9px] h-4 px-1.5">مؤرشف</Badge>;
        default:
          return <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{status}</Badge>;
      }
    };

    const getCategoryColor = (category: string) => {
      const colors: Record<string, string> = {
        "التصميم": "from-primary to-cyan-400",
        "التسويق": "from-accent to-purple-400",
        "الإعلانات": "from-warning to-orange-400",
        "التطوير": "from-success to-emerald-400",
        "الاستشارات": "from-destructive to-pink-400",
      };
      return colors[category] || "from-primary to-cyan-400";
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className="border-border/50 overflow-hidden">
          <div className={`h-0.5 bg-gradient-to-l ${getCategoryColor(service.category)}`} />
          <CardContent className="p-3">
            {/* Row 1: Icon + Name + Status */}
            <div className="flex items-start gap-2.5 mb-2">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryColor(service.category)} p-2 shrink-0`}>
                <Package className="w-full h-full text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-semibold text-sm truncate flex-1">{service.name}</h3>
                  {getStatusBadge(service.status)}
                </div>
                <p className="text-[10px] text-muted-foreground">{service.category}</p>
              </div>
            </div>

            {/* Row 2: Price + Stats */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-primary">
                {service.price.toLocaleString()} <span className="text-xs text-muted-foreground">ر.س</span>
              </span>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <ShoppingCart className="w-3 h-3" />
                  {service.orderCount || 0}
                </span>
                <span className="flex items-center gap-0.5 text-success">
                  <TrendingUp className="w-3 h-3" />
                  {(service.revenue || 0).toFixed(0)}
                </span>
              </div>
            </div>

            {/* Row 3: Action Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => onView(service)}
              >
                <Eye className="w-3.5 h-3.5 ml-1" />
                عرض
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => onEdit(service)}
              >
                <Edit className="w-3.5 h-3.5 ml-1" />
                تعديل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(service.id)}
              >
                <Trash2 className="w-3.5 h-3.5 ml-1" />
                حذف
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export default ServiceCard;
