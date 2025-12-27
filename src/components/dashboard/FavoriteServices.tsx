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
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="card-elevated border-border/30 h-full">
        <CardHeader className="flex flex-row-reverse items-center justify-between pb-1 sm:pb-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary-foreground" />
            </div>
            الخدمات المفضلة
          </CardTitle>
          <Link to="/dashboard/favorites">
            <Button variant="ghost" size="sm" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">
              الكل
              <ArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-1.5 sm:space-y-2 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
          {services.length === 0 ? (
            <div className="text-center py-4 sm:py-6">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2 text-muted-foreground/30" />
              <p className="text-xs sm:text-sm text-muted-foreground">لا توجد خدمات مفضلة</p>
            </div>
          ) : (
            services.slice(0, 4).map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-row-reverse items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-md sm:rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[11px] sm:text-xs md:text-sm truncate">{service.name}</p>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">{service.category}</p>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground shrink-0">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-warning fill-warning" />
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
