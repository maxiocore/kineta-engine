import { motion } from "framer-motion";
import { 
  Package, 
  CheckCircle, 
  TrendingUp, 
  ShoppingCart, 
  Calendar,
  DollarSign,
  Tag,
  FileText,
  BarChart3
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

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

interface ServiceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const ServiceDetailsDialog = ({ isOpen, onClose, service }: ServiceDetailsDialogProps) => {
  if (!service) return null;

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

  // Mock conversion rate (you can calculate this from real data)
  const conversionRate = service.orderCount ? Math.min((service.orderCount / 100) * 100, 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with gradient */}
        <div className={`relative h-32 bg-gradient-to-l ${getCategoryGradient(service.category)}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 right-6 left-6">
            <div className="flex items-end gap-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-xl bg-background shadow-lg p-3"
              >
                <Package className="w-full h-full text-primary" />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-foreground">{service.name}</h2>
                  {getStatusBadge(service.status)}
                </div>
                <p className="text-sm text-muted-foreground">{service.category}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-4 rounded-xl bg-secondary/50"
            >
              <DollarSign className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{service.price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">ر.س / السعر</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-4 rounded-xl bg-secondary/50"
            >
              <ShoppingCart className="w-5 h-5 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{service.orderCount || 0}</p>
              <p className="text-xs text-muted-foreground">طلب</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 rounded-xl bg-secondary/50"
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-success">{(service.revenue || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">ر.س / الإيرادات</p>
            </motion.div>
          </div>

          {/* Description */}
          {service.description && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">الوصف</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed p-4 rounded-lg bg-secondary/30">
                {service.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Features */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">مميزات الخدمة</h3>
              <Badge variant="secondary" className="ms-auto">
                {service.features?.length || 0} ميزة
              </Badge>
            </div>
            
            {service.features && service.features.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-2">
                {service.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30"
                  >
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد مميزات مضافة
              </p>
            )}
          </div>

          <Separator />

          {/* Performance */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">أداء الخدمة</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">معدل التحويل</span>
                  <span className="font-medium">{conversionRate.toFixed(1)}%</span>
                </div>
                <Progress value={conversionRate} className="h-2" />
              </div>
            </div>
          </div>

          {/* Created Date */}
          {service.created_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border/50">
              <Calendar className="w-4 h-4" />
              <span>تم الإنشاء: {new Date(service.created_at).toLocaleDateString('ar-SA')}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailsDialog;
