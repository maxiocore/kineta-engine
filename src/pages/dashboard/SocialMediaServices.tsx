import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Heart,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Send,
  Globe,
  Loader2,
  Ghost,
  Wallet,
  Star,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  Zap,
  CheckCircle2,
  ShoppingCart,
  TrendingUp,
  Clock,
  Shield,
  ChevronDown,
  Info,
  Plus,
  Minus,
  ArrowLeft,
  X,
  Package,
  FileText,
  Grid3X3,
  ArrowRight,
  Flame,
  Target,
  Award,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/adminNotifyService";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import ServicesPageSkeleton from "@/components/dashboard/ServicesPageSkeleton";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  category_id: string | null;
  price: number;
  status: string;
  features: any;
  external_service_id: string | null;
  refill_enabled: boolean | null;
  refill_days: number | null;
}

// Platform Icons
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

const socialNetworks = [
  { id: 'all', name: 'جميع المنصات', keywords: [], icon: Sparkles, gradient: 'from-primary to-accent', bgColor: 'bg-gradient-to-br from-primary to-accent' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]', bgColor: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك'], customIcon: TikTokIcon, gradient: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب'], icon: Youtube, gradient: 'from-[#FF0000] to-[#CC0000]', bgColor: 'bg-[#FF0000]' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك'], icon: Facebook, gradient: 'from-[#1877F2] to-[#0D65D9]', bgColor: 'bg-[#1877F2]' },
  { id: 'twitter', name: 'تويتر / X', keywords: ['twitter', 'تويتر', 'x ', 'اكس'], icon: X, gradient: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي'], customIcon: SpotifyIcon, gradient: 'from-[#1DB954] to-[#19A349]', bgColor: 'bg-[#1DB954]' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب'], icon: Ghost, gradient: 'from-[#FFFC00] to-[#FFE100]', bgColor: 'bg-[#FFFC00]', textColor: 'text-black' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام'], icon: Send, gradient: 'from-[#0088CC] to-[#0077B5]', bgColor: 'bg-[#0088CC]' },
  { id: 'discord', name: 'ديسكورد', keywords: ['discord', 'ديسكورد'], customIcon: DiscordIcon, gradient: 'from-[#5865F2] to-[#4752C4]', bgColor: 'bg-[#5865F2]' },
  { id: 'twitch', name: 'تويتش', keywords: ['twitch', 'تويتش'], customIcon: TwitchIcon, gradient: 'from-[#9146FF] to-[#7C2FE6]', bgColor: 'bg-[#9146FF]' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان'], icon: Linkedin, gradient: 'from-[#0A66C2] to-[#0855A5]', bgColor: 'bg-[#0A66C2]' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic'], icon: Globe, gradient: 'from-[#10B981] to-[#059669]', bgColor: 'bg-[#10B981]' },
  { id: 'reviews', name: 'تقييمات', keywords: ['review', 'تقييم', 'rating'], icon: Star, gradient: 'from-[#F59E0B] to-[#D97706]', bgColor: 'bg-[#F59E0B]' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const glowVariants = {
  glow: {
    boxShadow: [
      "0 0 20px hsl(var(--primary) / 0.2)",
      "0 0 40px hsl(var(--primary) / 0.4)",
      "0 0 20px hsl(var(--primary) / 0.2)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary/20"
        initial={{ 
          x: Math.random() * 100 + "%",
          y: Math.random() * 100 + "%",
          scale: Math.random() * 0.5 + 0.5,
        }}
        animate={{
          y: [null, "-20%", "120%"],
          x: [null, `${Math.random() * 20 - 10}%`],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: Math.random() * 4 + 4,
          repeat: Infinity,
          delay: Math.random() * 2,
          ease: "linear",
        }}
      />
    ))}
  </div>
);

// Interactive Service Card for Browse Tab
const BrowseServiceCard = ({ 
  service, 
  onOrder, 
  isFavorite,
  onToggleFavorite,
  parseFeatures,
  convertToSAR,
  index,
}: { 
  service: Service; 
  onOrder: (service: Service) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  parseFeatures: (features: any) => { min: number; max: number; refill: boolean };
  convertToSAR: (price: number) => number;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const features = parseFeatures(service.features);
  const pricePerK = convertToSAR(service.price);

  const getPlatform = () => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[1];
  };
  
  const platform = getPlatform();
  const Icon = platform.icon;
  const CustomIcon = (platform as any).customIcon;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ delay: index * 0.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={cn(
        "relative border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 rounded-xl group cursor-pointer",
        isHovered && "border-primary/50 shadow-lg shadow-primary/10"
      )}>
        {/* Animated gradient background on hover */}
        <motion.div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
            platform.gradient
          )}
          animate={{ opacity: isHovered ? 0.05 : 0 }}
        />
        
        {/* Glow effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Platform Icon with animation */}
            <motion.div 
              className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center shrink-0 relative overflow-hidden`}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              {CustomIcon ? (
                <div className={platform.textColor || "text-white"}>
                  <CustomIcon />
                </div>
              ) : Icon && (
                <Icon className={cn("w-6 h-6", platform.textColor || "text-white")} />
              )}
              {/* Shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                animate={isHovered ? { x: "100%" } : {}}
                transition={{ duration: 0.6 }}
              />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors duration-300">
                {service.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {service.external_service_id && (
                  <span className="font-mono">#{service.external_service_id}</span>
                )}
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {features.min.toLocaleString()}-{features.max.toLocaleString()}
                </span>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-2">
                {(service.refill_enabled || features.refill) && (
                  <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px] px-2 py-0.5 gap-1">
                    <RefreshCw className="w-2.5 h-2.5" />
                    ضمان
                  </Badge>
                )}
                {service.refill_days && (
                  <Badge className="bg-blue-500/15 text-blue-600 border-0 text-[10px] px-2 py-0.5">
                    {service.refill_days} يوم
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Price with animation */}
              <motion.div 
                className="text-left"
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              >
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {pricePerK.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground mr-1">ر.س</span>
              </motion.div>
              
              <div className="flex items-center gap-2">
                {/* Favorite button */}
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(service.id); }}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                    isFavorite ? "bg-rose-500/15 text-rose-500" : "bg-muted hover:bg-rose-500/10 hover:text-rose-500"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </motion.button>
                
                {/* Order button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    onClick={() => onOrder(service)}
                    className={cn(
                      "bg-gradient-to-r text-white rounded-lg h-9 px-4 text-xs font-semibold gap-1.5",
                      platform.gradient
                    )}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    اطلب الآن
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Platform selector with animations
const PlatformSelector = ({ 
  networks, 
  selected, 
  onSelect, 
  getServiceCount 
}: { 
  networks: typeof socialNetworks;
  selected: string;
  onSelect: (id: string) => void;
  getServiceCount: (id: string) => number;
}) => {
  return (
    <motion.div 
      className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {networks.slice(0, 7).map((network, index) => {
        const Icon = network.icon;
        const CustomIcon = (network as any).customIcon;
        const isSelected = selected === network.id;
        const count = getServiceCount(network.id);

        return (
          <motion.button
            key={network.id}
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(network.id)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-300",
              isSelected 
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                : "border-border/50 bg-card/50 hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            <motion.div 
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                isSelected ? network.bgColor : "bg-muted"
              )}
              animate={isSelected ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {CustomIcon ? (
                <div className={isSelected ? (network.textColor || "text-white") : "text-muted-foreground"}>
                  <CustomIcon />
                </div>
              ) : Icon && (
                <Icon className={cn("w-5 h-5", isSelected ? (network.textColor || "text-white") : "text-muted-foreground")} />
              )}
            </motion.div>
            <span className={cn(
              "text-[10px] font-medium text-center line-clamp-1",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}>
              {network.name}
            </span>
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

const SocialMediaServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { convertToSAR } = useExchangeRate();
  
  const [activeTab, setActiveTab] = useState("new-order");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [browseSearchQuery, setBrowseSearchQuery] = useState("");
  const [balance, setBalance] = useState(0);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // Fetch balance
  const { data: userBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("user_balances").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userBalance) setBalance(userBalance.balance);
  }, [userBalance]);

  // Fetch services
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ["services-social"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث الخدمات");
  };

  // Filter social media services
  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 'برمجة', 'تطوير', 'dev', 'development', 'app'];
  
  const socialMediaServices = useMemo(() => {
    return services.filter(service => {
      const text = `${service.category} ${service.name}`.toLowerCase();
      return !designDevKeywords.some(k => text.includes(k));
    });
  }, [services]);

  // Get services by category
  const getServicesByCategory = useCallback((categoryId: string) => {
    if (categoryId === 'all') return socialMediaServices;
    const network = socialNetworks.find(n => n.id === categoryId);
    if (!network || network.keywords.length === 0) return socialMediaServices;
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  // Filtered services
  const categoryServices = useMemo(() => {
    let filtered = getServicesByCategory(selectedCategory);
    if (serviceSearchQuery) {
      const query = serviceSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    return filtered;
  }, [selectedCategory, serviceSearchQuery, getServicesByCategory]);

  const browseServices = useMemo(() => {
    let filtered = socialMediaServices;
    if (browseSearchQuery) {
      const query = browseSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    return filtered;
  }, [browseSearchQuery, socialMediaServices]);

  // Parse features
  const parseFeatures = (features: any) => {
    const defaults = { min: 10, max: 100000, refill: false };
    if (!features) return defaults;
    try {
      const f = typeof features === 'string' ? JSON.parse(features) : features;
      return {
        min: parseInt(f.min || f.minQuantity) || defaults.min,
        max: parseInt(f.max || f.maxQuantity) || defaults.max,
        refill: f.refill === true || f.refill === 'true',
      };
    } catch {
      return defaults;
    }
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    const priceInUSD = (selectedService.price / 1000) * qty;
    return convertToSAR(priceInUSD);
  }, [selectedService, quantity, convertToSAR]);

  // Get link placeholder
  const getLinkPlaceholder = () => {
    if (!selectedService) return "https://...";
    const name = selectedService.name.toLowerCase();
    if (name.includes('instagram') || name.includes('انستقرام')) return "https://instagram.com/username";
    if (name.includes('tiktok') || name.includes('تيك توك')) return "https://tiktok.com/@username";
    if (name.includes('youtube') || name.includes('يوتيوب')) return "https://youtube.com/watch?v=...";
    if (name.includes('twitter') || name.includes('تويتر')) return "https://twitter.com/username";
    if (name.includes('facebook') || name.includes('فيسبوك')) return "https://facebook.com/...";
    return "https://...";
  };

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    const features = parseFeatures(service.features);
    setQuantity(features.min.toString());
    setServiceSearchOpen(false);
    setServiceSearchQuery("");
  };

  // Quantity controls
  const incrementQuantity = () => {
    if (!selectedService) return;
    const features = parseFeatures(selectedService.features);
    const current = parseInt(quantity) || features.min;
    const step = Math.max(100, Math.floor(features.min));
    const newQty = Math.min(current + step, features.max);
    setQuantity(newQty.toString());
  };

  const decrementQuantity = () => {
    if (!selectedService) return;
    const features = parseFeatures(selectedService.features);
    const current = parseInt(quantity) || features.min;
    const step = Math.max(100, Math.floor(features.min));
    const newQty = Math.max(current - step, features.min);
    setQuantity(newQty.toString());
  };

  // Submit order
  const handleSubmit = async () => {
    if (!user) { toast.error("يجب تسجيل الدخول"); return; }
    if (!selectedService || !link || !quantity) { toast.error("يرجى ملء جميع الحقول"); return; }
    
    const features = parseFeatures(selectedService.features);
    const qty = parseInt(quantity);
    
    if (qty < features.min || qty > features.max) {
      toast.error(`الكمية يجب أن تكون بين ${features.min} و ${features.max}`);
      return;
    }
    if (!link.startsWith('http')) {
      toast.error("الرابط يجب أن يبدأ بـ http أو https");
      return;
    }
    if (!userBalance || userBalance.balance < totalPrice) { 
      toast.error("رصيدك غير كافي"); 
      return; 
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const { data: orderData, error: orderError } = await supabase.from("orders").insert({
        user_id: user.id, 
        service_id: selectedService.id, 
        order_number: orderNumber, 
        quantity: qty, 
        link, 
        total_price: totalPrice, 
        status: "pending",
      }).select().single();
      
      if (orderError) throw orderError;
      
      await supabase.from("user_balances").update({ 
        balance: userBalance.balance - totalPrice, 
        total_spent: userBalance.total_spent + totalPrice 
      }).eq("user_id", user.id);
      
      await supabase.from("balance_logs").insert({
        user_id: user.id,
        action_type: 'order',
        amount: -totalPrice,
        balance_before: userBalance.balance,
        balance_after: userBalance.balance - totalPrice,
        reference_type: 'order',
        reference_id: orderData.id,
        notes: `خصم للطلب رقم ${orderData.order_number}`
      });
      
      if (selectedService.external_service_id) {
        try {
          await supabase.functions.invoke('provider-order', {
            body: { orderId: orderData.id, serviceId: selectedService.id, link, quantity: qty }
          });
        } catch {}
      }
      
      setShowOrderSuccess(true);
      setTimeout(() => setShowOrderSuccess(false), 3000);
      
      toast.success("تم إرسال الطلب بنجاح!", {
        description: `رقم الطلب: ${orderNumber}`,
        action: { label: "عرض الطلبات", onClick: () => navigate('/dashboard/orders') }
      });
      
      notifyNewOrder({
        orderNumber: orderData.order_number,
        userName: user.user_metadata?.full_name,
        userEmail: user.email || '',
        serviceName: selectedService.name,
        quantity: qty,
        totalPrice,
      });
      
      setLink("");
      setQuantity("");
      setSelectedService(null);
      refetchBalance();
      
    } catch { 
      toast.error("حدث خطأ أثناء إرسال الطلب"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Get platform for service
  const getServicePlatform = (service: Service) => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[1];
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات السوشيال ميديا" color="blue" />
      </ClientDashboardLayout>
    );
  }

  const currentFeatures = selectedService ? parseFeatures(selectedService.features) : null;
  const selectedPlatform = selectedService ? getServicePlatform(selectedService) : null;

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full w-full overflow-x-hidden overflow-y-auto">
        <div className="w-full min-w-0 max-w-full pb-8 px-2 sm:px-4 relative" dir="rtl">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
          <FloatingParticles />
          
          {/* Order Success Animation */}
          <AnimatePresence>
            {showOrderSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  className="bg-green-500 rounded-full p-8"
                >
                  <CheckCircle2 className="w-24 h-24 text-white" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header with animation */}
          <motion.div 
            className="flex items-center justify-between mb-6 pt-2 relative z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link to="/dashboard/our-services">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 backdrop-blur-sm">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  خدمات التواصل الاجتماعي
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  زد متابعيك وتفاعلك على جميع المنصات بأسعار منافسة
                </p>
              </div>
            </div>
            
            {/* Balance Card with glow */}
            <motion.div 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              variants={glowVariants}
              animate="glow"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wallet className="w-5 h-5 text-primary" />
              </motion.div>
              <span className="text-base font-bold text-primary">{balance.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">ر.س</span>
            </motion.div>
          </motion.div>

          {/* Tabs with animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
              <TabsList className="w-full grid grid-cols-2 h-12 mb-6 bg-muted/50 backdrop-blur-sm rounded-xl p-1">
                <TabsTrigger 
                  value="new-order" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground gap-2 text-sm font-semibold rounded-lg transition-all duration-300"
                >
                  <ShoppingCart className="w-4 h-4" />
                  طلب جديد
                </TabsTrigger>
                <TabsTrigger 
                  value="browse" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground gap-2 text-sm font-semibold rounded-lg transition-all duration-300"
                >
                  <Grid3X3 className="w-4 h-4" />
                  تصفح الخدمات
                  <Badge variant="secondary" className="mr-1 text-[10px]">
                    {socialMediaServices.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* New Order Tab */}
              <TabsContent value="new-order" className="mt-0">
                <motion.div 
                  className="grid lg:grid-cols-[1fr_380px] gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Order Form */}
                  <motion.div variants={cardVariants}>
                    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="pb-4 border-b border-border/50">
                        <CardTitle className="text-lg font-bold flex items-center gap-3">
                          <motion.div 
                            className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Package className="w-5 h-5 text-primary-foreground" />
                          </motion.div>
                          نموذج الطلب
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">
                        {/* Platform Selector */}
                        <PlatformSelector
                          networks={socialNetworks}
                          selected={selectedCategory}
                          onSelect={(id) => { setSelectedCategory(id); setSelectedService(null); }}
                          getServiceCount={(id) => getServicesByCategory(id).length}
                        />

                        {/* Service Selection */}
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            الخدمة
                          </Label>
                          <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                            <PopoverTrigger asChild>
                              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={serviceSearchOpen}
                                  className="w-full h-14 justify-between rounded-xl bg-muted/50 border-2 border-border hover:border-primary/50 text-right transition-all duration-300"
                                >
                                  {selectedService ? (
                                    <div className="flex items-center gap-3 text-right flex-1 min-w-0">
                                      {selectedPlatform && (
                                        <div className={`w-8 h-8 rounded-lg ${selectedPlatform.bgColor} flex items-center justify-center shrink-0`}>
                                          {(() => {
                                            const CustomIcon = (selectedPlatform as any).customIcon;
                                            const Icon = selectedPlatform.icon;
                                            if (CustomIcon) return <div className={selectedPlatform.textColor || "text-white"}><CustomIcon /></div>;
                                            if (Icon) return <Icon className={cn("w-4 h-4", selectedPlatform.textColor || "text-white")} />;
                                            return null;
                                          })()}
                                        </div>
                                      )}
                                      <span className="truncate font-medium">{selectedService.name}</span>
                                      <Badge className="bg-primary/15 text-primary border-0 text-xs shrink-0 ml-auto">
                                        {convertToSAR(selectedService.price).toFixed(2)} ر.س
                                      </Badge>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground flex items-center gap-2">
                                      <Search className="w-4 h-4" />
                                      ابحث واختر الخدمة...
                                    </span>
                                  )}
                                  <ChevronDown className="w-5 h-5 shrink-0 opacity-50" />
                                </Button>
                              </motion.div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover/95 backdrop-blur-xl border-border z-50 rounded-xl" align="start">
                              <Command className="bg-transparent">
                                <CommandInput 
                                  placeholder="ابحث عن خدمة..." 
                                  value={serviceSearchQuery}
                                  onValueChange={setServiceSearchQuery}
                                  className="h-12"
                                />
                                <CommandList className="max-h-72">
                                  <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    لا توجد خدمات مطابقة
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {categoryServices.slice(0, 50).map((service, index) => {
                                      const features = parseFeatures(service.features);
                                      const platform = getServicePlatform(service);
                                      return (
                                        <CommandItem
                                          key={service.id}
                                          value={service.name}
                                          onSelect={() => handleSelectService(service)}
                                          className="flex items-center gap-3 py-3 px-3 cursor-pointer rounded-lg m-1 hover:bg-primary/10"
                                        >
                                          <div className={`w-9 h-9 rounded-lg ${platform.bgColor} flex items-center justify-center shrink-0`}>
                                            {(() => {
                                              const CustomIcon = (platform as any).customIcon;
                                              const Icon = platform.icon;
                                              if (CustomIcon) return <div className={platform.textColor || "text-white"}><CustomIcon /></div>;
                                              if (Icon) return <Icon className={cn("w-4 h-4", platform.textColor || "text-white")} />;
                                              return null;
                                            })()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{service.name}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                              {service.external_service_id && `#${service.external_service_id} • `}
                                              {features.min.toLocaleString()}-{features.max.toLocaleString()}
                                            </p>
                                          </div>
                                          <Badge className="bg-primary/15 text-primary border-0 text-xs shrink-0">
                                            {convertToSAR(service.price).toFixed(2)}
                                          </Badge>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </motion.div>

                        {/* Link Input */}
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-primary" />
                            الرابط
                          </Label>
                          <div className="relative">
                            <Input
                              value={link}
                              onChange={(e) => setLink(e.target.value)}
                              placeholder={getLinkPlaceholder()}
                              className="h-14 rounded-xl bg-muted/50 border-2 border-border hover:border-primary/50 focus:border-primary pr-12 transition-all duration-300"
                              dir="ltr"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Globe className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>
                        </motion.div>

                        {/* Quantity Input */}
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            الكمية
                          </Label>
                          <div className="flex items-center gap-3">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={decrementQuantity}
                                disabled={!selectedService}
                                className="h-14 w-14 rounded-xl border-2 shrink-0 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
                              >
                                <Minus className="w-5 h-5" />
                              </Button>
                            </motion.div>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder="أدخل الكمية"
                              className="h-14 rounded-xl bg-muted/50 border-2 border-border hover:border-primary/50 text-center text-lg font-bold flex-1 transition-all duration-300"
                              dir="ltr"
                            />
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={incrementQuantity}
                                disabled={!selectedService}
                                className="h-14 w-14 rounded-xl border-2 shrink-0 hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500"
                              >
                                <Plus className="w-5 h-5" />
                              </Button>
                            </motion.div>
                          </div>
                          {currentFeatures && (
                            <motion.div 
                              className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                            >
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                الحد الأدنى: {currentFeatures.min.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                الحد الأقصى: {currentFeatures.max.toLocaleString()}
                              </span>
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Price Summary Card */}
                        <motion.div 
                          className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 space-y-4"
                          variants={pulseVariants}
                          animate={totalPrice > 0 ? "pulse" : ""}
                        >
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              السعر / 1000:
                            </span>
                            <span className="font-semibold">{selectedService ? convertToSAR(selectedService.price).toFixed(2) : '0.00'} ر.س</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              الكمية:
                            </span>
                            <span className="font-semibold">{parseInt(quantity) ? parseInt(quantity).toLocaleString() : 0}</span>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">الإجمالي:</span>
                            <motion.span 
                              className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                              key={totalPrice}
                              initial={{ scale: 1.2, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              {totalPrice.toFixed(2)} ر.س
                            </motion.span>
                          </div>
                          
                          {userBalance && (
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                              <span className="text-muted-foreground">رصيدك الحالي:</span>
                              <span className={cn(
                                "font-bold",
                                userBalance.balance >= totalPrice ? "text-green-500" : "text-destructive"
                              )}>
                                {userBalance.balance.toFixed(2)} ر.س
                              </span>
                            </div>
                          )}
                          
                          {userBalance && userBalance.balance < totalPrice && totalPrice > 0 && (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard/deposit')}
                                className="w-full gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 rounded-xl h-12"
                              >
                                <Wallet className="w-4 h-4" />
                                شحن الرصيد الآن
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedService || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
                            className="w-full h-14 text-lg font-bold rounded-xl gap-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg shadow-primary/25"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                جاري تنفيذ الطلب...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-6 h-6" />
                                تنفيذ الطلب
                                <motion.div
                                  animate={{ x: [0, 5, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <ArrowLeft className="w-5 h-5" />
                                </motion.div>
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Service Details Card */}
                  <motion.div variants={cardVariants}>
                    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-fit lg:sticky lg:top-4 overflow-hidden">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg font-bold flex items-center gap-3">
                          <motion.div 
                            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Info className="w-5 h-5 text-primary" />
                          </motion.div>
                          تفاصيل الخدمة
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5">
                        <AnimatePresence mode="wait">
                          {selectedService ? (
                            <motion.div 
                              key={selectedService.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="space-y-5"
                            >
                              {/* Service Name with Platform Icon */}
                              <motion.div 
                                className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border"
                                whileHover={{ scale: 1.01 }}
                              >
                                <div className="flex items-start gap-3">
                                  {selectedPlatform && (
                                    <div className={`w-12 h-12 rounded-xl ${selectedPlatform.bgColor} flex items-center justify-center shrink-0`}>
                                      {(() => {
                                        const CustomIcon = (selectedPlatform as any).customIcon;
                                        const Icon = selectedPlatform.icon;
                                        if (CustomIcon) return <div className={selectedPlatform.textColor || "text-white"}><CustomIcon /></div>;
                                        if (Icon) return <Icon className={cn("w-6 h-6", selectedPlatform.textColor || "text-white")} />;
                                        return null;
                                      })()}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-bold text-sm leading-relaxed">{selectedService.name}</h3>
                                    {selectedService.external_service_id && (
                                      <p className="text-xs text-muted-foreground mt-1 font-mono">#{selectedService.external_service_id}</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>

                              {/* Stats Grid with animations */}
                              <div className="grid grid-cols-2 gap-3">
                                <motion.div 
                                  className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center"
                                  whileHover={{ scale: 1.03, y: -2 }}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">السعر / 1000</p>
                                  <p className="text-2xl font-bold text-primary">{convertToSAR(selectedService.price).toFixed(2)}</p>
                                  <p className="text-[10px] text-muted-foreground">ر.س</p>
                                </motion.div>
                                <motion.div 
                                  className="p-4 rounded-xl bg-muted/50 border border-border text-center"
                                  whileHover={{ scale: 1.03, y: -2 }}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">الحد الأدنى</p>
                                  <p className="text-2xl font-bold">{currentFeatures?.min.toLocaleString()}</p>
                                </motion.div>
                                <motion.div 
                                  className="p-4 rounded-xl bg-muted/50 border border-border text-center"
                                  whileHover={{ scale: 1.03, y: -2 }}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">الحد الأقصى</p>
                                  <p className="text-2xl font-bold">{currentFeatures?.max.toLocaleString()}</p>
                                </motion.div>
                                <motion.div 
                                  className="p-4 rounded-xl bg-muted/50 border border-border text-center"
                                  whileHover={{ scale: 1.03, y: -2 }}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">وقت البدء</p>
                                  <div className="flex items-center justify-center gap-1">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-sm font-bold">0-1 ساعة</p>
                                  </div>
                                </motion.div>
                              </div>

                              {/* Speed indicator */}
                              <motion.div 
                                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                                whileHover={{ scale: 1.02 }}
                              >
                                <motion.div
                                  animate={{ rotate: [0, 360] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                >
                                  <Zap className="w-6 h-6 text-amber-500" />
                                </motion.div>
                                <div>
                                  <p className="text-sm font-bold">سرعة التنفيذ</p>
                                  <p className="text-xs text-muted-foreground">100 - 10K / يوم</p>
                                </div>
                              </motion.div>

                              {/* Badges with animation */}
                              <motion.div 
                                className="flex flex-wrap gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                {(selectedService.refill_enabled || currentFeatures?.refill) && (
                                  <motion.div whileHover={{ scale: 1.05 }}>
                                    <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1.5 px-3 py-1.5">
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      ضمان تعويض
                                    </Badge>
                                  </motion.div>
                                )}
                                {selectedService.refill_days && (
                                  <motion.div whileHover={{ scale: 1.05 }}>
                                    <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1.5 px-3 py-1.5">
                                      <Shield className="w-3.5 h-3.5" />
                                      {selectedService.refill_days} يوم
                                    </Badge>
                                  </motion.div>
                                )}
                                <motion.div whileHover={{ scale: 1.05 }}>
                                  <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-3 py-1.5">
                                    <Zap className="w-3.5 h-3.5" />
                                    تنفيذ فوري
                                  </Badge>
                                </motion.div>
                              </motion.div>

                              {/* Description */}
                              {selectedService.description && (
                                <motion.div 
                                  className="space-y-2"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                >
                                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    الوصف
                                  </Label>
                                  <ScrollArea className="h-28 rounded-xl border border-border p-4 bg-muted/30">
                                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                      {selectedService.description}
                                    </p>
                                  </ScrollArea>
                                </motion.div>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-center py-12"
                            >
                              <motion.div 
                                className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4"
                                animate={{ 
                                  rotate: [0, 5, -5, 0],
                                  y: [0, -5, 0],
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <Package className="w-10 h-10 text-muted-foreground" />
                              </motion.div>
                              <p className="text-sm text-muted-foreground font-medium">اختر خدمة لعرض التفاصيل</p>
                              <p className="text-xs text-muted-foreground mt-1">ستظهر هنا جميع معلومات الخدمة</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>

              {/* Browse Services Tab */}
              <TabsContent value="browse" className="mt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Search with animation */}
                  <motion.div 
                    className="mb-6"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <div className="relative">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="ابحث عن خدمة..."
                        value={browseSearchQuery}
                        onChange={(e) => setBrowseSearchQuery(e.target.value)}
                        className="pr-12 h-14 rounded-xl bg-muted/50 border-2 border-border hover:border-primary/50 focus:border-primary text-base transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{browseServices.length}</span> خدمة متاحة
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          الأكثر طلباً
                        </Badge>
                      </div>
                    </div>
                  </motion.div>

                  {/* Services List */}
                  <motion.div 
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {browseServices.length === 0 ? (
                      <motion.div 
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <motion.div 
                          className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Search className="w-10 h-10 text-muted-foreground" />
                        </motion.div>
                        <h3 className="text-lg font-bold mb-2">لا توجد خدمات</h3>
                        <p className="text-muted-foreground text-sm">
                          {browseSearchQuery ? "لم يتم العثور على خدمات مطابقة" : "سيتم إضافة الخدمات قريباً"}
                        </p>
                      </motion.div>
                    ) : (
                      browseServices.slice(0, 50).map((service, index) => (
                        <BrowseServiceCard
                          key={service.id}
                          service={service}
                          onOrder={(s) => {
                            handleSelectService(s);
                            setActiveTab("new-order");
                          }}
                          isFavorite={favorites.includes(service.id)}
                          onToggleFavorite={toggleFavorite}
                          parseFeatures={parseFeatures}
                          convertToSAR={convertToSAR}
                          index={index}
                        />
                      ))
                    )}
                    {browseServices.length > 50 && (
                      <motion.p 
                        className="text-center text-sm text-muted-foreground py-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        يتم عرض أول 50 خدمة، استخدم البحث لإيجاد المزيد
                      </motion.p>
                    )}
                  </motion.div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
