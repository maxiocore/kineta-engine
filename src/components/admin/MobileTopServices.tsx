import { motion } from "framer-motion";
import { Star, TrendingUp, ChevronLeft, Trophy, Medal, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface TopService {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend?: number;
}

interface MobileTopServicesProps {
  services: TopService[];
}

// ترجمة الكلمات الإنجليزية الشائعة
const translateEnglishTokens = (text: string): string => {
  const translations: Record<string, string> = {
    'NO REFILL': 'بدون تعويض',
    'REFILL': 'تعويض',
    'INSTANT': 'فوري',
    'FAST': 'سريع',
    'SLOW': 'بطيء',
    'HIGH QUALITY': 'جودة عالية',
    'LOW QUALITY': 'جودة منخفضة',
    'PREMIUM': 'مميز',
    'REAL': 'حقيقي',
    'BOT': 'آلي',
    'MIXED': 'مختلط',
    'GUARANTEED': 'مضمون',
    'LIFETIME': 'مدى الحياة',
    'DROP': 'انخفاض',
    'NO DROP': 'بدون انخفاض',
  };
  
  let result = text;
  Object.entries(translations).forEach(([en, ar]) => {
    result = result.replace(new RegExp(en, 'gi'), ar);
  });
  
  return result;
};

interface ParsedPart {
  text: string;
  type: 'arabic' | 'english' | 'range';
}

// Parser محسّن لتفكيك النص
const parseServiceName = (name: string): ParsedPart[] => {
  const translatedName = translateEnglishTokens(name);
  const parts: ParsedPart[] = [];
  
  const rangePattern = /(\d+[\d,]*\s*[-–]\s*\d+[\d,]*)/g;
  const englishPattern = /([A-Za-z][A-Za-z\s]*[A-Za-z])/g;
  
  const markers: Array<{start: number; end: number; text: string; type: 'english' | 'range'}> = [];
  
  let match;
  while ((match = rangePattern.exec(translatedName)) !== null) {
    markers.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'range'
    });
  }
  
  while ((match = englishPattern.exec(translatedName)) !== null) {
    const overlaps = markers.some(m => 
      (match!.index >= m.start && match!.index < m.end) ||
      (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
    );
    if (!overlaps) {
      markers.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: 'english'
      });
    }
  }
  
  markers.sort((a, b) => a.start - b.start);
  
  let lastEnd = 0;
  markers.forEach(marker => {
    if (marker.start > lastEnd) {
      const arabicText = translatedName.substring(lastEnd, marker.start).trim();
      if (arabicText) {
        parts.push({ text: arabicText, type: 'arabic' });
      }
    }
    parts.push({ text: marker.text, type: marker.type });
    lastEnd = marker.end;
  });
  
  if (lastEnd < translatedName.length) {
    const remainingText = translatedName.substring(lastEnd).trim();
    if (remainingText) {
      parts.push({ text: remainingText, type: 'arabic' });
    }
  }
  
  if (parts.length === 0) {
    parts.push({ text: translatedName, type: 'arabic' });
  }
  
  return parts;
};

// مكون لعرض اسم الخدمة المفكك
const ServiceNameDisplay = ({ name, className }: { name: string; className?: string }) => {
  const parts = parseServiceName(name);
  
  return (
    <div className={cn("mixed-line text-right min-w-0 truncate", className)}>
      {parts.map((part, index) => {
        if (part.type === 'arabic') {
          return <span key={index}>{part.text}</span>;
        }
        
        return (
          <span key={index} className="ltr mx-0.5">
            {part.text}
          </span>
        );
      })}
    </div>
  );
};

const MobileTopServices = ({ services }: MobileTopServicesProps) => {
  const max = Math.max(...services.map(s => s.revenue), 1);
  
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-3.5 h-3.5 text-yellow-500" />;
      case 1: return <Medal className="w-3.5 h-3.5 text-gray-400" />;
      case 2: return <Award className="w-3.5 h-3.5 text-amber-600" />;
      default: return <span className="text-[10px] font-bold text-muted-foreground">{index + 1}</span>;
    }
  };
  
  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "from-yellow-500/20 to-amber-600/10 border-yellow-500/30";
      case 1: return "from-slate-400/20 to-slate-500/10 border-slate-400/30";
      case 2: return "from-amber-600/20 to-orange-700/10 border-amber-600/30";
      default: return "from-muted/20 to-muted-foreground/10 border-border/50";
    }
  };

  const getProgressColor = (index: number) => {
    switch (index) {
      case 0: return "bg-gradient-to-l from-yellow-500 to-amber-500";
      case 1: return "bg-gradient-to-l from-slate-400 to-slate-500";
      case 2: return "bg-gradient-to-l from-amber-600 to-orange-600";
      default: return "bg-primary";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border/40 overflow-hidden"
    >
      {/* Header - RTL Layout */}
      <div className="flex flex-row-reverse items-center justify-between p-3 border-b border-border/30">
        {/* العنوان على اليمين */}
        <div className="flex flex-row-reverse items-center gap-2">
          <span className="text-sm font-semibold">أفضل الخدمات</span>
          <div className="p-1.5 rounded-lg bg-warning/10">
            <Star className="w-4 h-4 text-warning" />
          </div>
        </div>
        {/* زر عرض الكل على اليسار */}
        <Link 
          to="/admin/services"
          className="flex flex-row-reverse items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <span>عرض الكل</span>
          <ChevronLeft className="w-3 h-3 rtl-flip" />
        </Link>
      </div>
      
      {/* Services List */}
      <div className="divide-y divide-border/30">
        {services.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">لا توجد خدمات بعد</p>
          </div>
        ) : (
          services.slice(0, 4).map((service, index) => {
            const percentage = (service.revenue / max) * 100;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "p-3 cursor-pointer transition-colors",
                  "hover:bg-secondary/20 active:bg-secondary/40"
                )}
              >
                {/* Service Row - RTL Layout */}
                <div className="flex flex-row-reverse items-center gap-2 mb-1.5">
                  {/* Rank Badge - على اليمين */}
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center border bg-gradient-to-br shrink-0",
                    getRankColor(index)
                  )}>
                    {getRankIcon(index)}
                  </div>
                  
                  {/* Service Info - وسط */}
                  <div className="flex-1 min-w-0">
                    <ServiceNameDisplay 
                      name={service.name} 
                      className="text-xs font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">
                      <span className="ltr">{service.orders.toLocaleString('en-US')}</span>
                      <span> طلب</span>
                    </p>
                  </div>
                  
                  {/* Trend */}
                  {service.trend && service.trend > 0 && (
                    <div className="flex flex-row-reverse items-center gap-0.5 text-[9px] text-success shrink-0">
                      <TrendingUp className="w-2.5 h-2.5 ms-0.5" />
                      <span className="ltr">{service.trend}٪</span>
                    </div>
                  )}
                  
                  {/* Revenue - على اليسار */}
                  <div className="shrink-0 text-start">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-success">
                        <span className="ltr">{service.revenue.toLocaleString("en-US")}</span>
                      </span>
                      <span className="text-[9px] text-muted-foreground">ر.س</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar - RTL (يبدأ من اليمين) */}
                <div className="h-1 rounded-full bg-secondary overflow-hidden ms-9 rtl-progress">
                  <motion.div
                    className={cn("h-full rounded-full", getProgressColor(index))}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default MobileTopServices;