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
  type LucideIcon
} from "lucide-react";

interface ServicesCategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

interface CategoryItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const ServicesCategoryTabs = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  totalCount,
}: ServicesCategoryTabsProps) => {
  const categories: CategoryItem[] = [
    { id: "all", label: "الكل", icon: Layers, color: "from-primary to-accent" },
    { id: "instagram", label: "Instagram", icon: Instagram, color: "from-pink-500 to-orange-400" },
    { id: "facebook", label: "Facebook", icon: Facebook, color: "from-blue-600 to-blue-400" },
    { id: "youtube", label: "Youtube", icon: Youtube, color: "from-red-600 to-red-400" },
    { id: "twitter", label: "Twitter", icon: Twitter, color: "from-sky-500 to-sky-400" },
    { id: "tiktok", label: "TikTok", icon: Sparkles, color: "from-pink-500 to-cyan-400" },
    { id: "telegram", label: "Telegram", icon: MessageCircle, color: "from-sky-500 to-blue-500" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "from-blue-700 to-blue-500" },
    { id: "spotify", label: "Spotify", icon: Music, color: "from-green-500 to-green-400" },
    { id: "website-traffic", label: "Traffic", icon: Globe, color: "from-gray-500 to-gray-400" },
  ];

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