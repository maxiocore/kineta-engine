import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Twitter, 
  Send, 
  Linkedin, 
  Music2, 
  Globe, 
  MoreHorizontal,
  Layers,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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

const iconMap: Record<string, React.ComponentType<any>> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Youtube: Youtube,
  Twitter: Twitter,
  Send: Send,
  Linkedin: Linkedin,
  Music2: Music2,
  Globe: Globe,
  MoreHorizontal: MoreHorizontal,
  Layers: Layers,
};

const SocialNetworkGrid = ({ 
  selectedCategory, 
  onCategoryChange,
  serviceCounts = {}
}: SocialNetworkGridProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isVisible, setIsVisible] = useState(true);

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
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Layers;
  };

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">اختر شبكة اجتماعية</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className="gap-2"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {isVisible ? "إخفاء" : "إظهار"}
        </Button>
      </div>

      {/* Grid */}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3"
        >
          {/* All Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoryChange("all")}
            className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
              selectedCategory === "all"
                ? "bg-gradient-to-br from-primary to-accent border-primary text-primary-foreground shadow-lg"
                : "bg-card border-border hover:border-primary/50 hover:bg-secondary/50"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="font-medium text-sm">الكل</span>
          </motion.button>

          {/* Category Buttons */}
          {categories.map((category, index) => {
            const IconComponent = getIcon(category.icon);
            const isSelected = selectedCategory === category.slug;
            const count = serviceCounts[category.slug] || 0;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategoryChange(category.slug)}
                className={`relative flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `bg-gradient-to-br ${category.color} border-transparent text-white shadow-lg`
                    : "bg-card border-border hover:border-primary/50 hover:bg-secondary/50"
                }`}
              >
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="font-medium text-xs sm:text-sm">{category.name_ar}</span>
                {count > 0 && (
                  <span className={`absolute -top-1 -left-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-white text-foreground" : "bg-primary text-primary-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default SocialNetworkGrid;
