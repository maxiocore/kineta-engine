import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Twitter, 
  Send, 
  Linkedin, 
  Music2, 
  Globe, 
  LayoutGrid,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface SocialNetworkGridProps {
  selectedCategory: string;
  onCategoryChange: (categorySlug: string) => void;
  serviceCounts?: Record<string, number>;
}

// Static icon map for common icons
const iconMap: Record<string, React.ComponentType<any>> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Youtube: Youtube,
  Twitter: Twitter,
  Send: Send,
  Linkedin: Linkedin,
  Music2: Music2,
  Globe: Globe,
  LayoutGrid: LayoutGrid,
  Layers: Layers,
};

// Dynamic icon component for less common icons
interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  // Check static map first
  const StaticIcon = iconMap[name];
  if (StaticIcon) {
    return <StaticIcon {...props} />;
  }
  
  // Try dynamic import
  const iconName = name.toLowerCase().replace(/\s+/g, '-') as keyof typeof dynamicIconImports;
  
  if (!dynamicIconImports[iconName]) {
    return <Layers {...props} />;
  }
  
  const LucideIcon = lazy(dynamicIconImports[iconName]);
  
  return (
    <Suspense fallback={<div className="w-5 h-5 rounded bg-muted/50 animate-pulse" />}>
      <LucideIcon {...props} />
    </Suspense>
  );
};

const SocialNetworkGrid = ({ 
  selectedCategory, 
  onCategoryChange,
  serviceCounts = {}
}: SocialNetworkGridProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const totalServices = Object.values(serviceCounts).reduce((a, b) => a + b, 0);

  const containerVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 },
        staggerChildren: 0.03
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">اختر منصة التواصل</h3>
            <p className="text-xs text-muted-foreground">
              {totalServices} خدمة متاحة في {categories.length} منصة
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline">إخفاء</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span className="hidden sm:inline">إظهار</span>
            </>
          )}
        </Button>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3"
          >
            {/* All Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onCategoryChange("all")}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                selectedCategory === "all"
                  ? "bg-gradient-to-br from-primary via-primary to-accent border-primary/50 text-primary-foreground shadow-xl shadow-primary/20"
                  : "bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:bg-card"
              )}
            >
              {/* Glow effect */}
              {selectedCategory === "all" && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
              
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all",
                selectedCategory === "all" 
                  ? "bg-white/20" 
                  : "bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20"
              )}>
                <LayoutGrid className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 transition-colors",
                  selectedCategory === "all" ? "text-white" : "text-primary"
                )} />
              </div>
              <span className="font-bold text-xs sm:text-sm">الكل</span>
              <span className={cn(
                "absolute -top-0.5 -left-0.5 min-w-6 h-6 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-md",
                selectedCategory === "all" 
                  ? "bg-white text-primary" 
                  : "bg-gradient-to-br from-primary to-accent text-white"
              )}>
                {totalServices}
              </span>
            </motion.button>

            {/* Category Buttons */}
            {loading ? (
              // Skeleton loaders
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border-2 border-border/50 bg-card/50"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted animate-pulse" />
                  <div className="w-12 h-3 rounded bg-muted animate-pulse" />
                </motion.div>
              ))
            ) : (
              categories.map((category) => {
                const isSelected = selectedCategory === category.slug;
                const count = serviceCounts[category.slug] || 0;

                return (
                  <motion.button
                    key={category.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onCategoryChange(category.slug)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                      isSelected
                        ? `bg-gradient-to-br ${category.color} border-transparent text-white shadow-xl`
                        : "bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:bg-card"
                    )}
                    style={isSelected ? { 
                      boxShadow: `0 10px 40px -10px hsl(var(--primary) / 0.3)` 
                    } : undefined}
                  >
                    {/* Shine effect on selected */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                    
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-white/20" 
                        : `bg-gradient-to-br ${category.color} bg-opacity-10`
                    )}>
                      <DynamicIcon 
                        name={category.icon} 
                        className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6 transition-all",
                          isSelected ? "text-white" : ""
                        )}
                        style={!isSelected ? { 
                          color: 'hsl(var(--primary))' 
                        } : undefined}
                      />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-center leading-tight">
                      {category.name_ar}
                    </span>
                    
                    {/* Count badge */}
                    {count > 0 && (
                      <span className={cn(
                        "absolute -top-0.5 -left-0.5 min-w-6 h-6 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-md transition-all",
                        isSelected 
                          ? "bg-white text-foreground" 
                          : "bg-gradient-to-br from-primary to-accent text-white"
                      )}>
                        {count}
                      </span>
                    )}
                    
                    {/* Hover indicator for non-selected */}
                    {!isSelected && count > 0 && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </motion.button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected category indicator */}
      {!isExpanded && selectedCategory !== "all" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20"
        >
          <span className="text-sm text-muted-foreground">التصنيف المحدد:</span>
          <span className="font-bold text-primary">
            {categories.find(c => c.slug === selectedCategory)?.name_ar || selectedCategory}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCategoryChange("all")}
            className="mr-auto text-xs h-7"
          >
            إلغاء التصفية
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default SocialNetworkGrid;
