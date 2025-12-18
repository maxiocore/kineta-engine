import { motion } from "framer-motion";
import { Heart, Star, ArrowLeft, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Service {
  id: string;
  name: string;
  category: string;
  orderCount: number;
  price: number;
}

interface FavoriteServicesProps {
  services: Service[];
}

const FavoriteServices = ({ services }: FavoriteServicesProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="card-elevated border-border/30 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            الخدمات المفضلة
          </CardTitle>
          <Link to="/dashboard/favorites">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              الكل
              <ArrowLeft className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {services.length === 0 ? (
            <div className="text-center py-6">
              <Heart className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">لا توجد خدمات مفضلة</p>
            </div>
          ) : (
            services.slice(0, 4).map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.category}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span>{service.orderCount}</span>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FavoriteServices;
