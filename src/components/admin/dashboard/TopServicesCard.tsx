import { motion } from "framer-motion";
import { Star, TrendingUp, Trophy, Medal, Crown, ChevronLeft, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 1:
      return <Trophy className="w-4 h-4 text-gray-400" />;
    case 2:
      return <Medal className="w-4 h-4 text-amber-600" />;
    default:
      return <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>;
  }
};

const getRankBg = (index: number) => {
  switch (index) {
    case 0:
      return "bg-gradient-to-l from-yellow-500/20 via-orange-500/10 to-transparent border-yellow-500/30 hover:border-yellow-500/50";
    case 1:
      return "bg-gradient-to-l from-gray-400/20 via-gray-500/10 to-transparent border-gray-400/30 hover:border-gray-400/50";
    case 2:
      return "bg-gradient-to-l from-amber-600/20 via-amber-700/10 to-transparent border-amber-600/30 hover:border-amber-600/50";
    default:
      return "bg-gradient-to-l from-secondary/50 to-transparent border-border/50 hover:border-border";
  }
};

const getProgressColor = (index: number) => {
  switch (index) {
    case 0:
      return "bg-gradient-to-l from-yellow-500 to-amber-500";
    case 1:
      return "bg-gradient-to-l from-slate-400 to-slate-500";
    case 2:
      return "bg-gradient-to-l from-amber-600 to-orange-600";
    default:
      return "bg-primary";
  }
};

// دالة لمعالجة النص المختلط (عربي + إنجليزي + أرقام)
const formatMixedText = (text: string) => {
  // تقسيم النص حسب الأنماط: أرقام مع شرطات، كلمات إنجليزية كاملة
  const parts = text.split(/(\d+[\d,.-]*\d*|[A-Za-z]+(?:\s+[A-Za-z]+)*)/g);
  
  return parts.map((part, index) => {
    if (!part) return null;
    
    // إذا كان الجزء يحتوي على أرقام أو كلمات إنجليزية
    const isLtr = /^[\d,.\-\s]+$/.test(part) || /^[A-Za-z\s]+$/.test(part);
    
    if (isLtr && part.trim()) {
      return (
        <span key={index} dir="ltr" className="bidi-ltr">
          {part}
        </span>
      );
    }
    
    return part;
  });
};

const TopServicesCard = ({ services }: TopServicesCardProps) => {
  const navigate = useNavigate();
  const maxRevenue = Math.max(...services.map((s) => s.revenue), 1);

  return (
    <Card className="border-border/50 h-full overflow-hidden bg-gradient-to-br from-card to-card/80 relative" dir="rtl">
      {/* Background decorations */}
      <div className="absolute top-0 end-0 w-32 h-32 bg-warning/5 rounded-full blur-2xl" />
      <div className="absolute bottom-0 start-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />

      <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex flex-row-reverse items-center justify-between">
          {/* العنوان على اليمين */}
          <CardTitle className="text-sm sm:text-base flex flex-row-reverse items-center gap-2">
            <span>أفضل الخدمات أداءً</span>
            <motion.div 
              className="p-2 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 border border-warning/20"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <Star className="w-4 h-4 text-warning" />
            </motion.div>
          </CardTitle>
          {/* زر عرض الكل على اليسار */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 gap-1.5 hover:bg-primary/10 flex flex-row-reverse items-center"
            onClick={() => navigate("/admin/services")}
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-3.5 h-3.5 scale-x-[-1]" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-3">
        {services.length > 0 ? (
          services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01, x: 3 }}
              className={cn(
                "relative p-3 sm:p-4 rounded-xl border transition-all cursor-pointer group",
                getRankBg(index),
                "hover:shadow-lg"
              )}
            >
              {/* Service Row - RTL Layout */}
              <div className="flex flex-row-reverse items-center gap-3">
                {/* Rank Badge - على اليمين */}
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center border border-border/50 shadow-sm shrink-0"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  {getRankIcon(index)}
                </motion.div>

                {/* Service Info - وسط */}
                <div className="flex-1 min-w-0 text-right bidi-rtl">
                  <p className="text-sm font-semibold truncate" dir="rtl">
                    {formatMixedText(service.name)}
                  </p>
                  <div className="flex flex-row-reverse items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      <span dir="ltr" className="bidi-ltr">{service.orders.toLocaleString('en-US')}</span>
                      <span className="me-1">طلب</span>
                    </Badge>
                    {service.trend > 0 && (
                      <span className="flex flex-row-reverse items-center gap-0.5 text-[10px] text-success">
                        <TrendingUp className="w-2.5 h-2.5" />
                        <span dir="ltr" className="bidi-ltr">+{service.trend}٪</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Revenue - على اليسار */}
                <div className="shrink-0 text-start">
                  <p className="text-base sm:text-lg font-bold" dir="ltr">
                    {service.revenue.toLocaleString('en-US')}
                  </p>
                  <p className="text-[10px] text-muted-foreground text-start">ر.س</p>
                </div>
              </div>

              {/* Progress Bar - RTL (يبدأ من اليمين) */}
              <div className="mt-3">
                <div 
                  className="h-1.5 rounded-full bg-secondary overflow-hidden"
                  style={{ direction: 'rtl' }}
                >
                  <motion.div
                    className={cn("h-full rounded-full", getProgressColor(index))}
                    initial={{ width: 0 }}
                    animate={{ width: `${(service.revenue / maxRevenue) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.6, ease: "easeOut" }}
                    style={{ marginRight: 0, marginLeft: 'auto' }}
                  />
                </div>
              </div>

              {/* Hover indicator - على اليسار */}
              <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute start-3 top-3" />
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">لا توجد خدمات بعد</p>
            <p className="text-xs mt-1">ابدأ بإضافة خدمات لعرضها هنا</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopServicesCard;