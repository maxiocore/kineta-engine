import { motion } from "framer-motion";
import { Star, TrendingUp, Eye, Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface TopService {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend: number;
}

interface TopServicesCardProps {
  services: TopService[];
}

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case 1:
      return <Medal className="w-4 h-4 text-gray-400" />;
    case 2:
      return <Award className="w-4 h-4 text-amber-600" />;
    default:
      return <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>;
  }
};

const getRankBg = (index: number) => {
  switch (index) {
    case 0:
      return "bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/30";
    case 1:
      return "bg-gradient-to-br from-gray-400/20 to-gray-500/10 border-gray-400/30";
    case 2:
      return "bg-gradient-to-br from-amber-600/20 to-amber-700/10 border-amber-600/30";
    default:
      return "bg-secondary/50 border-border/50";
  }
};

const TopServicesCard = ({ services }: TopServicesCardProps) => {
  const navigate = useNavigate();
  const maxRevenue = Math.max(...services.map((s) => s.revenue), 1);

  return (
    <Card className="border-border/50 h-full overflow-hidden bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-warning/10">
              <Star className="w-4 h-4 text-warning" />
            </div>
            أفضل الخدمات أداءً
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 gap-1.5 hover:bg-primary/10"
            onClick={() => navigate("/admin/services")}
          >
            <Eye className="w-3.5 h-3.5" />
            عرض الكل
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-3">
        {services.length > 0 ? (
          services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative p-3 rounded-xl border transition-all hover:scale-[1.01]",
                getRankBg(index)
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center border border-border/50">
                  {getRankIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{service.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {service.orders} طلب
                    </span>
                    {service.trend > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-success">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {service.trend}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{service.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">ر.س</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-2">
                <Progress
                  value={(service.revenue / maxRevenue) * 100}
                  className="h-1.5"
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            لا توجد خدمات بعد
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopServicesCard;
