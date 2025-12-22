import { motion } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  Sparkles
} from "lucide-react";

interface ServicesCategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

const ServicesCategoryTabs = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  totalCount,
}: ServicesCategoryTabsProps) => {
  const categories = [
    { id: "all", label: "الكل", icon: Layers, gradient: "from-slate-500 to-slate-400" },
    { id: "instagram", label: "Instagram", icon: Instagram, gradient: "from-pink-500 via-purple-500 to-orange-500" },
    { id: "facebook", label: "Facebook", icon: Facebook, gradient: "from-blue-600 to-blue-400" },
    { id: "youtube", label: "Youtube", icon: Youtube, gradient: "from-red-600 to-red-400" },
    { id: "twitter", label: "Twitter", icon: Twitter, gradient: "from-sky-500 to-sky-400" },
    { id: "tiktok", label: "TikTok", icon: Sparkles, gradient: "from-black via-pink-500 to-cyan-400" },
    { id: "telegram", label: "Telegram", icon: MessageCircle, gradient: "from-sky-500 to-blue-500" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, gradient: "from-blue-700 to-blue-500" },
    { id: "spotify", label: "Spotify", icon: Music, gradient: "from-green-500 to-green-400" },
    { id: "website-traffic", label: "Traffic", icon: Globe, gradient: "from-emerald-500 to-teal-400" },
  ];

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex items-center gap-2 pb-2">
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category.id;
          const count = category.id === "all" ? totalCount : (categoryCounts[category.id] || 0);
          const Icon = category.icon;
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shrink-0",
                isSelected
                  ? "bg-gradient-to-l text-white shadow-lg"
                  : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
              style={isSelected ? {
                backgroundImage: `linear-gradient(to left, var(--tw-gradient-stops))`,
              } : {}}
            >
              {/* Gradient background for selected */}
              {isSelected && (
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-l ${category.gradient} opacity-100`} />
              )}
              
              <div className="relative z-10 flex items-center gap-2">
                <Icon className={cn(
                  "w-4 h-4",
                  isSelected ? "text-white" : "text-muted-foreground"
                )} />
                <span className={isSelected ? "text-white" : ""}>{category.label}</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  isSelected 
                    ? "bg-white/20 text-white" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-1.5" />
    </ScrollArea>
  );
};

export default ServicesCategoryTabs;
