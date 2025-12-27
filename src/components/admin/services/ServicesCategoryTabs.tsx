import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Sparkles,
  Headphones,
  type LucideIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServicesCategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

interface CategoryItem {
  id: string;
  slug: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

// Map slugs to icons and colors
const categoryIconMap: Record<string, { icon: LucideIcon; color: string }> = {
  "instagram": { icon: Instagram, color: "from-pink-500 to-orange-400" },
  "facebook": { icon: Facebook, color: "from-blue-600 to-blue-400" },
  "youtube": { icon: Youtube, color: "from-red-600 to-red-400" },
  "twitter": { icon: Twitter, color: "from-sky-500 to-sky-400" },
  "tiktok": { icon: Sparkles, color: "from-pink-500 to-cyan-400" },
  "telegram": { icon: MessageCircle, color: "from-sky-500 to-blue-500" },
  "linkedin": { icon: Linkedin, color: "from-blue-700 to-blue-500" },
  "spotify": { icon: Music, color: "from-green-500 to-green-400" },
  "soundcloud": { icon: Headphones, color: "from-orange-500 to-orange-400" },
  "website-traffic": { icon: Globe, color: "from-gray-500 to-gray-400" },
  "social-media": { icon: Globe, color: "from-blue-500 to-purple-500" },
  "other": { icon: Layers, color: "from-gray-500 to-slate-400" },
};

const ServicesCategoryTabs = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  totalCount,
}: ServicesCategoryTabsProps) => {
  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: "all", slug: "all", label: "الكل", icon: Layers, color: "from-primary to-accent" }
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_ar, slug')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      if (data) {
        const mappedCategories: CategoryItem[] = [
          { id: "all", slug: "all", label: "الكل", icon: Layers, color: "from-primary to-accent" },
          ...data.map(cat => {
            const iconConfig = categoryIconMap[cat.slug] || { icon: Layers, color: "from-gray-500 to-gray-400" };
            return {
              id: cat.slug,
              slug: cat.slug,
              label: cat.name_ar || cat.name,
              icon: iconConfig.icon,
              color: iconConfig.color,
            };
          })
        ];
        setCategories(mappedCategories);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 pb-2 min-w-max">
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category.id;
          const count = category.id === "all" ? totalCount : (categoryCounts[category.id] || 0);
          const Icon = category.icon;
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0",
                isSelected
                  ? "bg-gradient-to-r text-white shadow-md"
                  : "bg-card border border-border/50 hover:border-primary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
              style={isSelected ? { backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` } : undefined}
            >
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                isSelected 
                  ? "bg-white/20" 
                  : `bg-gradient-to-br ${category.color}`
              )}>
                <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-white")} />
              </div>
              <span className="hidden sm:inline">{category.label}</span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center",
                isSelected ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
              )}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesCategoryTabs;