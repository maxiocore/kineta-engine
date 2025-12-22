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
    { id: "all", label: "الكل", icon: Layers },
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "facebook", label: "Facebook", icon: Facebook },
    { id: "youtube", label: "Youtube", icon: Youtube },
    { id: "twitter", label: "Twitter", icon: Twitter },
    { id: "tiktok", label: "TikTok", icon: Sparkles },
    { id: "telegram", label: "Telegram", icon: MessageCircle },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "spotify", label: "Spotify", icon: Music },
    { id: "website-traffic", label: "Traffic", icon: Globe },
  ];

  return (
    <ScrollArea className="w-full -mx-1 px-1">
      <div className="flex items-center gap-1.5 pb-1">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const count = category.id === "all" ? totalCount : (categoryCounts[category.id] || 0);
          const Icon = category.icon;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{category.label}</span>
              <span className={cn(
                "text-[9px] font-bold px-1 py-0.5 rounded min-w-[14px] text-center",
                isSelected ? "bg-white/20" : "bg-muted"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-0" />
    </ScrollArea>
  );
};

export default ServicesCategoryTabs;
