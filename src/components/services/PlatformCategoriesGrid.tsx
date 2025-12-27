import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Twitter, 
  MessageCircle,
  Linkedin,
  Music,
  Globe,
  Layers,
  Music2,
  Camera,
  Users,
  Heart,
  Eye,
  ThumbsUp,
  Share2,
  MessageSquare,
  Bookmark,
  Play,
  Send,
  ChevronRight,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface PlatformCategoriesGridProps {
  onCategoryChange: (categoryId: string | null, categorySlug: string) => void;
  selectedCategoryId: string | null;
  serviceCounts: Record<string, number>;
}

interface MainCategory {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string | null;
  color: string | null;
  subcategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string | null;
  color: string | null;
  parent_id: string;
}

// Map icons
const iconMap: Record<string, LucideIcon> = {
  "Instagram": Instagram,
  "Facebook": Facebook,
  "Youtube": Youtube,
  "Twitter": Twitter,
  "Send": Send,
  "Linkedin": Linkedin,
  "Music2": Music2,
  "Music": Music,
  "Globe": Globe,
  "Layers": Layers,
  "Camera": Camera,
  "Users": Users,
  "Heart": Heart,
  "Eye": Eye,
  "ThumbsUp": ThumbsUp,
  "Share2": Share2,
  "MessageCircle": MessageCircle,
  "MessageSquare": MessageSquare,
  "Bookmark": Bookmark,
  "Play": Play,
  "MoreHorizontal": Layers,
  "Sparkles": Sparkles,
};

// Platform gradient colors
const platformGradients: Record<string, string> = {
  "instagram": "from-pink-500 via-purple-500 to-orange-400",
  "facebook": "from-blue-600 to-blue-400",
  "youtube": "from-red-600 to-red-400",
  "twitter": "from-sky-500 to-sky-400",
  "tiktok": "from-slate-900 via-pink-500 to-cyan-400",
  "telegram": "from-sky-500 to-blue-500",
  "linkedin": "from-blue-700 to-blue-500",
  "spotify": "from-green-500 to-green-400",
  "soundcloud": "from-orange-500 to-orange-400",
  "website-traffic": "from-emerald-500 to-teal-500",
  "snapchat": "from-yellow-400 to-yellow-500",
  "other": "from-gray-500 to-gray-400",
};

const PlatformCategoriesGrid = ({
  onCategoryChange,
  selectedCategoryId,
  serviceCounts,
}: PlatformCategoriesGridProps) => {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_ar, slug, icon, color, parent_id')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Separate main categories (no parent) and subcategories
        const mainCats: MainCategory[] = [];
        const subCats: SubCategory[] = [];

        data.forEach(cat => {
          if (!cat.parent_id) {
            // Skip social-media-services umbrella category
            if (cat.slug === 'social-media') return;
            // Skip snapchat sub-categories that are incorrectly marked as main
            if (cat.slug.includes('-followers') || cat.slug.includes('-views') || 
                cat.slug.includes('-likes') || cat.slug.includes('-members')) return;
            
            mainCats.push({
              ...cat,
              subcategories: []
            });
          } else {
            subCats.push(cat as SubCategory);
          }
        });

        // Attach subcategories to their parents
        mainCats.forEach(main => {
          main.subcategories = subCats.filter(sub => sub.parent_id === main.id);
        });

        setMainCategories(mainCats);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const getIcon = (iconName: string | null): LucideIcon => {
    if (!iconName) return Layers;
    return iconMap[iconName] || Layers;
  };

  const getGradient = (slug: string, color: string | null): string => {
    return platformGradients[slug] || color || "from-gray-500 to-gray-400";
  };

  const getPlatformCount = (platform: MainCategory): number => {
    // Count services for main category and all its subcategories
    let count = serviceCounts[platform.slug] || 0;
    platform.subcategories.forEach(sub => {
      count += serviceCounts[sub.slug] || 0;
    });
    return count;
  };

  const handlePlatformClick = (platform: MainCategory) => {
    if (selectedPlatform === platform.slug) {
      // If clicking same platform, deselect
      setSelectedPlatform(null);
      onCategoryChange(null, "all");
    } else {
      setSelectedPlatform(platform.slug);
      // Select all services from this platform
      onCategoryChange(platform.id, platform.slug);
    }
  };

  const handleSubcategoryClick = (sub: SubCategory) => {
    onCategoryChange(sub.id, sub.slug);
  };

  const selectedPlatformData = mainCategories.find(p => p.slug === selectedPlatform);

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="aspect-square rounded-2xl bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* All Button */}
      <div className="flex items-center gap-3 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSelectedPlatform(null);
            onCategoryChange(null, "all");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
            !selectedPlatform
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-card border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>جميع الخدمات</span>
          <Badge variant="secondary" className="text-xs">
            {Object.values(serviceCounts).reduce((a, b) => a + b, 0)}
          </Badge>
        </motion.button>
      </div>

      {/* Main Platforms Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
        {mainCategories.map((platform, index) => {
          const Icon = getIcon(platform.icon);
          const gradient = getGradient(platform.slug, platform.color);
          const count = getPlatformCount(platform);
          const isSelected = selectedPlatform === platform.slug;

          return (
            <motion.button
              key={platform.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlatformClick(platform)}
              className={cn(
                "relative group aspect-square rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 overflow-hidden",
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "hover:shadow-xl"
              )}
            >
              {/* Background Gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
                gradient,
                isSelected ? "opacity-100" : "opacity-80 group-hover:opacity-100"
              )} />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
              
              {/* Icon */}
              <div className={cn(
                "relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-300",
                "bg-white/20 backdrop-blur-sm",
                isSelected && "scale-110"
              )}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
              </div>
              
              {/* Name */}
              <span className="relative text-white font-bold text-xs sm:text-sm text-center leading-tight drop-shadow-md">
                {platform.name_ar}
              </span>
              
              {/* Count Badge */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-white/25 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-white">{count}</span>
              </div>

              {/* Arrow Indicator for platforms with subcategories */}
              {platform.subcategories.length > 0 && (
                <motion.div 
                  animate={{ rotate: isSelected ? 90 : 0 }}
                  className="absolute bottom-2 left-2"
                >
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Subcategories Section */}
      <AnimatePresence mode="wait">
        {selectedPlatformData && selectedPlatformData.subcategories.length > 0 && (
          <motion.div
            key={selectedPlatform}
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 p-4 sm:p-6">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                  getGradient(selectedPlatformData.slug, selectedPlatformData.color)
                )}>
                  {(() => {
                    const Icon = getIcon(selectedPlatformData.icon);
                    return <Icon className="w-5 h-5 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedPlatformData.name_ar}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlatformData.subcategories.length} قسم فرعي
                  </p>
                </div>
              </div>

              {/* Subcategories Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* All in this platform */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCategoryChange(selectedPlatformData.id, selectedPlatformData.slug)}
                  className={cn(
                    "p-3 sm:p-4 rounded-xl border transition-all duration-300 text-right",
                    selectedCategoryId === selectedPlatformData.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedCategoryId === selectedPlatformData.id
                        ? "bg-primary/20"
                        : "bg-muted/50"
                    )}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">الكل</p>
                      <p className="text-xs text-muted-foreground">
                        {getPlatformCount(selectedPlatformData)} خدمة
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Subcategories */}
                {selectedPlatformData.subcategories.map((sub, index) => {
                  const SubIcon = getIcon(sub.icon);
                  const subCount = serviceCounts[sub.slug] || 0;
                  const isSubSelected = selectedCategoryId === sub.id;

                  return (
                    <motion.button
                      key={sub.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSubcategoryClick(sub)}
                      className={cn(
                        "p-3 sm:p-4 rounded-xl border transition-all duration-300 text-right",
                        isSubSelected
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          isSubSelected
                            ? "bg-primary/20"
                            : "bg-muted/50"
                        )}>
                          <SubIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{sub.name_ar}</p>
                          <p className="text-xs text-muted-foreground">
                            {subCount} خدمة
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformCategoriesGrid;
