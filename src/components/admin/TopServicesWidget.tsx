import { motion } from "framer-motion";
import { Package, ChevronLeft, TrendingUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface TopService {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend?: number;
}

interface TopServicesWidgetProps {
  services: TopService[];
  maxRevenue?: number;
}

interface ParsedServiceName {
  parts: Array<{
    text: string;
    type: 'arabic' | 'english' | 'range' | 'separator';
  }>;
}

// Parser لتفكيك النص إلى أجزاء منفصلة
const parseServiceName = (name: string): ParsedServiceName => {
  const parts: ParsedServiceName['parts'] = [];
  
  // Regex patterns
  const rangePattern = /(\d+[\d,]*\s*[-–]\s*\d+[\d,]*)/g;
  const englishPattern = /([A-Z][A-Z\s]+[A-Z])/g;
  const singleEnglishPattern = /\b([A-Za-z]{2,})\b/g;
  
  const ranges = [...name.matchAll(rangePattern)];
  const englishWords = [...name.matchAll(englishPattern)];
  const singleWords = [...name.matchAll(singleEnglishPattern)];
  
  const markers: Array<{start: number; end: number; text: string; type: 'english' | 'range'}> = [];
  
  ranges.forEach(match => {
    if (match.index !== undefined) {
      markers.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: 'range'
      });
    }
  });
  
  englishWords.forEach(match => {
    if (match.index !== undefined) {
      markers.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: 'english'
      });
    }
  });
  
  singleWords.forEach(match => {
    if (match.index !== undefined) {
      const overlaps = markers.some(m => 
        (match.index! >= m.start && match.index! < m.end) ||
        (match.index! + match[0].length > m.start && match.index! + match[0].length <= m.end)
      );
      if (!overlaps && /^[A-Z]/.test(match[0])) {
        markers.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: 'english'
        });
      }
    }
  });
  
  markers.sort((a, b) => a.start - b.start);
  
  let lastEnd = 0;
  markers.forEach(marker => {
    if (marker.start > lastEnd) {
      const arabicText = name.substring(lastEnd, marker.start).trim();
      if (arabicText) {
        parts.push({ text: arabicText, type: 'arabic' });
      }
    }
    parts.push({ text: marker.text, type: marker.type });
    lastEnd = marker.end;
  });
  
  if (lastEnd < name.length) {
    const remainingText = name.substring(lastEnd).trim();
    if (remainingText) {
      parts.push({ text: remainingText, type: 'arabic' });
    }
  }
  
  if (parts.length === 0) {
    parts.push({ text: name, type: 'arabic' });
  }
  
  return { parts };
};

// مكون لعرض اسم الخدمة المفكك
const ServiceNameDisplay = ({ name, className }: { name: string; className?: string }) => {
  const { parts } = parseServiceName(name);
  
  return (
    <div dir="rtl" className={cn("bidi-isolate-rtl text-right min-w-0 truncate", className)}>
      {parts.map((part, index) => {
        if (part.type === 'arabic') {
          return <span key={index}>{part.text}</span>;
        }
        
        if (part.type === 'range' || part.type === 'english') {
          return (
            <span 
              key={index} 
              dir="ltr" 
              className="bidi-isolate-ltr mx-0.5"
            >
              {part.text}
            </span>
          );
        }
        
        return <span key={index} className="mx-0.5">{part.text}</span>;
      })}
    </div>
  );
};

const TopServicesWidget = ({ services, maxRevenue }: TopServicesWidgetProps) => {
  const max = maxRevenue || Math.max(...services.map(s => s.revenue), 1);
  
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "from-yellow-500 to-amber-600";
      case 1:
        return "from-slate-400 to-slate-500";
      case 2:
        return "from-amber-600 to-orange-700";
      default:
        return "from-primary/50 to-primary/30";
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

  return (
    <Card className="border-border/30 h-full" dir="rtl">
      <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-2">
        <div className="flex flex-row-reverse items-center justify-between">
          {/* العنوان على اليمين */}
          <CardTitle className="text-xs sm:text-sm lg:text-base flex flex-row-reverse items-center gap-1.5">
            <span>أفضل الخدمات</span>
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning" />
          </CardTitle>
          {/* زر عرض الكل على اليسار - السهم معكوس */}
          <Link to="/admin/services">
            <Button variant="ghost" size="sm" className="gap-1 text-[9px] sm:text-[10px] h-6 sm:h-7 flex flex-row-reverse items-center">
              <span>عرض الكل</span>
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 scale-x-[-1]" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-3 pt-0 space-y-1.5 sm:space-y-2">
        {services.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
            <p className="text-xs">لا توجد خدمات بعد</p>
          </div>
        ) : (
          services.map((service, index) => {
            const percentage = (service.revenue / max) * 100;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group"
              >
                {/* Service Row - RTL Layout */}
                <div className="flex flex-row-reverse items-center gap-2 sm:gap-3 mb-1">
                  {/* Rank Badge - على اليمين */}
                  <motion.span 
                    className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-sm shrink-0",
                      index < 3 
                        ? `bg-gradient-to-br ${getRankStyle(index)} text-white`
                        : "bg-secondary text-muted-foreground"
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    {index + 1}
                  </motion.span>
                  
                  {/* Service Name & Orders - وسط */}
                  <div className="flex-1 min-w-0">
                    {/* اسم الخدمة مع تفكيك النص المختلط */}
                    <ServiceNameDisplay 
                      name={service.name} 
                      className="font-medium text-[9px] sm:text-[10px] lg:text-xs group-hover:text-primary transition-colors"
                    />
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground text-right">
                      <span dir="ltr" className="bidi-isolate-ltr">{service.orders.toLocaleString("en-US")}</span>
                      <span> طلب</span>
                    </p>
                  </div>
                  
                  {/* Trend */}
                  {service.trend && service.trend > 0 && (
                    <span className="flex flex-row-reverse items-center text-[8px] sm:text-[9px] text-success shrink-0">
                      <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 ms-0.5" />
                      <span dir="ltr" className="bidi-isolate-ltr">{service.trend}٪</span>
                    </span>
                  )}
                  
                  {/* Revenue - على اليسار */}
                  <div className="shrink-0 text-start">
                    <span className="font-bold text-[9px] sm:text-[10px] lg:text-xs text-success" dir="ltr">
                      <span className="bidi-isolate-ltr">{service.revenue.toLocaleString("en-US")}</span>
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-muted-foreground ms-0.5">ر.س</span>
                  </div>
                </div>
                
                {/* Progress Bar - RTL (يبدأ من اليمين) */}
                <div className="ms-6 sm:ms-7 lg:ms-8">
                  <motion.div
                    className="h-0.5 sm:h-1 rounded-full bg-secondary overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ direction: 'rtl' }}
                  >
                    <motion.div
                      className={cn("h-full rounded-full", getProgressColor(index))}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.08 + 0.2, duration: 0.6, ease: "easeOut" }}
                      style={{ marginRight: 0, marginLeft: 'auto' }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default TopServicesWidget;