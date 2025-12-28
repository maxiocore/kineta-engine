import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Share2, Megaphone, Palette, Code, ChevronLeft, 
  TrendingUp, Clock, CheckCircle, Sparkles, ArrowUpRight,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminOrderType = "all" | "social" | "marketing" | "design" | "dev";

interface AdminOrdersSectionCardsProps {
  activeSection: AdminOrderType | null;
  onSectionClick: (section: AdminOrderType) => void;
  counts: {
    all: number;
    social: number;
    marketing: number;
    design: number;
    dev: number;
  };
}

const sections = [
  {
    id: "all" as AdminOrderType,
    label: "جميع الطلبات",
    labelEn: "All Orders",
    icon: Package,
    gradient: "from-slate-500 via-slate-600 to-slate-700",
    bgGlow: "bg-slate-500/20",
    borderColor: "border-slate-500/30",
    description: "عرض جميع الطلبات من كل الأقسام",
    features: ["إدارة شاملة", "فلترة متقدمة", "تتبع كامل"]
  },
  {
    id: "social" as AdminOrderType,
    label: "مواقع التواصل",
    labelEn: "Social Media",
    icon: Share2,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    bgGlow: "bg-pink-500/20",
    borderColor: "border-pink-500/30",
    description: "إنستجرام، تويتر، تيك توك، يوتيوب",
    features: ["زيادة المتابعين", "تفاعل حقيقي", "نتائج سريعة"]
  },
  {
    id: "marketing" as AdminOrderType,
    label: "التسويق الرقمي",
    labelEn: "Digital Marketing",
    icon: Megaphone,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgGlow: "bg-orange-500/20",
    borderColor: "border-orange-500/30",
    description: "حملات إعلانية، SEO، تحليلات",
    features: ["حملات مستهدفة", "تحسين الظهور", "تحليل الأداء"]
  },
  {
    id: "design" as AdminOrderType,
    label: "خدمات التصميم",
    labelEn: "Design Services",
    icon: Palette,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    bgGlow: "bg-violet-500/20",
    borderColor: "border-violet-500/30",
    description: "شعارات، بنرات، هوية بصرية",
    features: ["تصاميم احترافية", "تعديلات مجانية", "جودة عالية"]
  },
  {
    id: "dev" as AdminOrderType,
    label: "خدمات البرمجة",
    labelEn: "Development",
    icon: Code,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    bgGlow: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    description: "مواقع، تطبيقات، أنظمة",
    features: ["كود نظيف", "دعم فني", "أداء عالي"]
  }
];

export const AdminOrdersSectionCards = ({ 
  activeSection, 
  onSectionClick, 
  counts 
}: AdminOrdersSectionCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {sections.map((section, index) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const count = counts[section.id];
        
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.08,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            whileHover={{ 
              y: -8,
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSectionClick(section.id)}
            className={cn(
              "relative cursor-pointer rounded-2xl p-4 transition-all duration-300 overflow-hidden group",
              "border-2",
              isActive 
                ? `${section.borderColor} bg-gradient-to-br ${section.gradient} text-white shadow-2xl` 
                : "border-border/50 bg-card hover:border-primary/30 hover:shadow-xl"
            )}
          >
            {/* Background Glow Effect */}
            <div className={cn(
              "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-opacity duration-300",
              section.bgGlow,
              isActive ? "opacity-60" : "opacity-0 group-hover:opacity-30"
            )} />
            
            {/* Sparkle Effect for Active */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute top-3 left-3"
                >
                  <Sparkles className="w-4 h-4 text-white/70 animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative flex items-start justify-between mb-3">
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                  isActive 
                    ? "bg-white/20 backdrop-blur-sm" 
                    : `bg-gradient-to-br ${section.gradient}`
                )}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon className={cn(
                  "w-6 h-6",
                  isActive ? "text-white" : "text-white"
                )} />
              </motion.div>
              
              {/* Order Count Badge */}
              <motion.div 
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : `bg-gradient-to-r ${section.gradient} text-white`
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.08 + 0.2, type: "spring" }}
              >
                {count} طلب
              </motion.div>
            </div>

            {/* Title & Description */}
            <div className="relative space-y-1 mb-3">
              <h3 className={cn(
                "text-base font-bold",
                isActive ? "text-white" : "text-foreground"
              )}>
                {section.label}
              </h3>
              <p className={cn(
                "text-xs line-clamp-1",
                isActive ? "text-white/80" : "text-muted-foreground"
              )}>
                {section.description}
              </p>
            </div>

            {/* Action Indicator */}
            <div className="relative flex items-center justify-between">
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-medium",
                isActive ? "text-white/80" : "text-muted-foreground"
              )}>
                {count > 0 ? (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>عرض الطلبات</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>لا توجد طلبات</span>
                  </>
                )}
              </div>
              
              <motion.div
                animate={{ x: isActive ? 0 : -5 }}
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full transition-colors",
                  isActive 
                    ? "bg-white/20" 
                    : "bg-muted group-hover:bg-primary/10"
                )}
              >
                <ChevronLeft className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-primary",
                  "group-hover:-translate-x-1"
                )} />
              </motion.div>
            </div>

            {/* Active Border Animation */}
            {isActive && (
              <motion.div
                layoutId="activeAdminOrderSection"
                className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Section Content Header with Instructions
interface AdminSectionHeaderProps {
  section: AdminOrderType;
  count: number;
  onBack: () => void;
}

export const AdminSectionHeader = ({ section, count, onBack }: AdminSectionHeaderProps) => {
  const sectionData = sections.find(s => s.id === section);
  if (!sectionData) return null;

  const Icon = sectionData.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 border-2",
        sectionData.borderColor,
        `bg-gradient-to-l ${sectionData.gradient}`
      )}
    >
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowUpRight className="w-5 h-5 rotate-180" />
          </motion.button>

          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              {sectionData.label}
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm">
                {count} طلب
              </span>
            </h2>
            <p className="text-white/80 text-xs mt-0.5">{sectionData.description}</p>
          </div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm"
        >
          <TrendingUp className="w-5 h-5 text-white/70" />
          <span className="text-white/90 text-sm">
            إدارة وتتبع جميع الطلبات
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};
