import { motion } from "framer-motion";
import { 
  Search, 
  Megaphone, 
  Globe, 
  BarChart3, 
  Share2, 
  Mail, 
  Target, 
  LineChart,
  Users,
  MousePointerClick,
  TrendingUp,
  PieChart,
  Layers
} from "lucide-react";

export interface DigitalCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ElementType;
  color: string;
  keywords: string[];
  description?: string;
}

export const digitalMarketingCategories: DigitalCategory[] = [
  { 
    id: "all", 
    name: "الكل", 
    nameEn: "All",
    icon: Layers, 
    color: "from-gray-500 to-slate-500",
    keywords: [],
    description: "جميع خدمات التسويق الرقمي"
  },
  { 
    id: "seo", 
    name: "تحسين محركات البحث", 
    nameEn: "SEO",
    icon: Search, 
    color: "from-emerald-500 to-teal-500",
    keywords: ["seo", "تحسين", "محركات", "البحث", "organic", "optimization"],
    description: "تصدر نتائج البحث"
  },
  { 
    id: "google-ads", 
    name: "إعلانات جوجل", 
    nameEn: "Google Ads",
    icon: Globe, 
    color: "from-blue-500 to-indigo-500",
    keywords: ["google", "ads", "جوجل", "قوقل", "ppc", "sem", "adwords"],
    description: "حملات إعلانية مدفوعة"
  },
  { 
    id: "social-ads", 
    name: "إعلانات السوشيال", 
    nameEn: "Social Ads",
    icon: Megaphone, 
    color: "from-pink-500 to-rose-500",
    keywords: ["facebook", "instagram", "tiktok", "snapchat", "سناب", "انستقرام", "فيسبوك", "تيك توك", "إعلان", "إعلانات"],
    description: "إعلانات منصات التواصل"
  },
  { 
    id: "content", 
    name: "تسويق المحتوى", 
    nameEn: "Content Marketing",
    icon: Share2, 
    color: "from-violet-500 to-purple-500",
    keywords: ["content", "محتوى", "كتابة", "مقالات", "blog", "copywriting"],
    description: "محتوى جذاب ومؤثر"
  },
  { 
    id: "email", 
    name: "التسويق بالبريد", 
    nameEn: "Email Marketing",
    icon: Mail, 
    color: "from-amber-500 to-orange-500",
    keywords: ["email", "بريد", "newsletter", "نشرة", "رسائل"],
    description: "حملات بريدية فعالة"
  },
  { 
    id: "analytics", 
    name: "التحليلات", 
    nameEn: "Analytics",
    icon: BarChart3, 
    color: "from-cyan-500 to-blue-500",
    keywords: ["analytics", "تحليل", "تحليلات", "تقارير", "data", "بيانات"],
    description: "تحليل البيانات والتقارير"
  },
  { 
    id: "conversion", 
    name: "تحسين التحويل", 
    nameEn: "CRO",
    icon: Target, 
    color: "from-red-500 to-orange-500",
    keywords: ["conversion", "cro", "تحويل", "landing", "هبوط"],
    description: "زيادة نسبة التحويل"
  },
  { 
    id: "campaign", 
    name: "إدارة الحملات", 
    nameEn: "Campaign Management",
    icon: LineChart, 
    color: "from-indigo-500 to-blue-500",
    keywords: ["campaign", "حملة", "حملات", "إدارة", "management"],
    description: "إدارة حملات متكاملة"
  },
  { 
    id: "influencer", 
    name: "تسويق المؤثرين", 
    nameEn: "Influencer Marketing",
    icon: Users, 
    color: "from-fuchsia-500 to-pink-500",
    keywords: ["influencer", "مؤثرين", "مشاهير", "ambassador"],
    description: "شراكات مع المؤثرين"
  },
];

interface DigitalCategoriesTabsProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categoryCounts?: Record<string, number>;
}

export const DigitalCategoriesTabs = ({ 
  selectedCategory, 
  onCategoryChange,
  categoryCounts = {}
}: DigitalCategoriesTabsProps) => {
  return (
    <div className="relative overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
      <div className="flex items-center gap-2 min-w-max">
        {digitalMarketingCategories.map((category, index) => {
          const isSelected = selectedCategory === category.id;
          const count = category.id === "all" 
            ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
            : categoryCounts[category.id] || 0;
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onCategoryChange(category.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap ${
                isSelected
                  ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                  : "bg-card hover:bg-accent text-foreground border border-border/50 hover:border-primary/30"
              }`}
            >
              <category.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{category.name}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isSelected 
                    ? "bg-white/20 text-white" 
                    : "bg-primary/10 text-primary"
                }`}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to categorize a service
export const categorizeService = (serviceName: string, serviceCategory: string, serviceDescription?: string | null): string => {
  const text = `${serviceName} ${serviceCategory} ${serviceDescription || ''}`.toLowerCase();
  
  for (const category of digitalMarketingCategories) {
    if (category.id === "all") continue;
    
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category.id;
      }
    }
  }
  
  return "other";
};

// Get category by ID
export const getCategoryById = (id: string): DigitalCategory | undefined => {
  return digitalMarketingCategories.find(cat => cat.id === id);
};
