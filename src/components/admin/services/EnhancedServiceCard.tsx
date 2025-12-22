import { motion } from "framer-motion";
import { Package, Eye, MoreVertical, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        return { label: "نشط", className: "bg-success/10 text-success" };
      case "inactive":
        return { label: "متوقف", className: "bg-warning/10 text-warning" };
      case "archived":
        return { label: "مؤرشف", className: "bg-muted text-muted-foreground" };
      default:
        return { label: status, className: "bg-secondary text-secondary-foreground" };
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Instagram": "from-pink-500 to-orange-400",
      "Facebook": "from-blue-600 to-blue-400",
      "Youtube": "from-red-600 to-red-400",
      "Twitter": "from-sky-500 to-sky-400",
      "TikTok": "from-pink-500 to-cyan-400",
      "Telegram": "from-sky-500 to-blue-500",
      "LinkedIn": "from-blue-700 to-blue-500",
      "Spotify": "from-green-500 to-green-400",
    };
    return colors[category] || "from-primary to-accent";
  };

  const statusConfig = getStatusConfig(service.status);
  const isNew = service.created_at && 
    new Date(service.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // List View
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className="p-2.5 flex items-center gap-2.5 hover:shadow-md transition-shadow border-border/50">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getCategoryColor(service.category)} p-2 shrink-0`}>
            <Package className="w-full h-full text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{service.name}</p>
            <p className="text-[10px] text-muted-foreground">{service.category}</p>
          </div>
          
          <p className="text-sm font-bold text-primary shrink-0">${service.price.toFixed(2)}</p>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onView(service)}>
            <Eye className="w-4 h-4" />
          </Button>
        </Card>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="h-full"
    >
      <Card className="p-3 flex flex-col h-full border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getCategoryColor(service.category)} p-2 shrink-0 shadow-md`}>
              <Package className="w-full h-full text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate leading-tight">{service.name}</p>
              <p className="text-[10px] text-muted-foreground">{service.category}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(service)}>عرض</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(service)}>تعديل</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(service.id)} className="text-destructive">حذف</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Badge className={cn("text-[9px] px-1.5 py-0", statusConfig.className)}>
            {statusConfig.label}
          </Badge>
          {isNew && (
            <Badge className="bg-accent/10 text-accent text-[9px] px-1.5 py-0">
              <Zap className="w-2.5 h-2.5 ml-0.5" />
              جديد
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2.5 py-1.5 px-2 rounded-md bg-secondary/30">
          <span>{service.orderCount || 0} طلب</span>
          <span className="text-success font-medium">${(service.revenue || 0).toFixed(0)}</span>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
          <span className="text-base font-bold text-primary">${service.price.toFixed(2)}</span>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-[10px] px-2.5"
            onClick={() => onView(service)}
          >
            <Eye className="w-3 h-3 ml-1" />
            عرض
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedServiceCard;
