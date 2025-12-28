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
  Copy,
  TrendingUp,
  Target,
  Clock,
  Activity,
  Rocket,
  Shield,
  Users,
  Award,
  Grid3X3,
  LayoutList,
  SlidersHorizontal,
  Eye,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/adminNotifyService";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import FeaturedOffersSection from "@/components/offers/FeaturedOffersSection";
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

// أيقونات SVG مخصصة للمنصات
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.857-.711 2.04-1.134 3.522-1.262 1.048-.09 2.015-.049 2.91.088-.058-.963-.27-1.685-.636-2.166-.453-.595-1.178-.897-2.156-.897h-.04c-.825.011-1.502.252-2.01.716-.322.294-.555.657-.708 1.078l-1.9-.723c.248-.64.623-1.2 1.116-1.67.882-.838 2.073-1.28 3.45-1.28h.06c1.636.013 2.915.563 3.802 1.636.78.943 1.182 2.254 1.2 3.903.013.13.013.26.013.39 1.157.457 2.074 1.19 2.677 2.154.815 1.305 1.05 2.943.66 4.61-.48 2.04-1.68 3.683-3.473 4.758-1.594.955-3.554 1.442-5.834 1.449z"/>
  </svg>
);

const socialNetworks = [
  { id: 'all', name: 'الكل', keywords: [], icon: Sparkles, color: 'from-orange-500 to-amber-500', bgColor: 'bg-gradient-to-r from-orange-500 to-amber-500' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, color: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]', bgColor: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], customIcon: TikTokIcon, color: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, color: 'from-[#FF0000] to-[#CC0000]', bgColor: 'bg-[#FF0000]' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, color: 'from-[#1877F2] to-[#0D65D9]', bgColor: 'bg-[#1877F2]' },
  { id: 'twitter', name: 'تويتر', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: X, color: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], customIcon: SpotifyIcon, color: 'from-[#1DB954] to-[#19A349]', bgColor: 'bg-[#1DB954]' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, color: 'from-[#FFFC00] to-[#FFE100]', bgColor: 'bg-[#FFFC00]', iconColor: 'text-black' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: 'from-[#0088CC] to-[#0077B5]', bgColor: 'bg-[#0088CC]' },
  { id: 'discord', name: 'ديسكورد', keywords: ['discord', 'ديسكورد', 'دسكورد'], customIcon: DiscordIcon, color: 'from-[#5865F2] to-[#4752C4]', bgColor: 'bg-[#5865F2]' },
  { id: 'twitch', name: 'تويتش', keywords: ['twitch', 'تويتش', 'توتش'], customIcon: TwitchIcon, color: 'from-[#9146FF] to-[#7C2FE6]', bgColor: 'bg-[#9146FF]' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, color: 'from-[#0A66C2] to-[#0855A5]', bgColor: 'bg-[#0A66C2]' },
  { id: 'google', name: 'جوجل', keywords: ['google', 'جوجل', 'قوقل'], customIcon: GoogleIcon, color: 'from-white to-gray-100', bgColor: 'bg-white border border-border' },
  { id: 'threads', name: 'ثريدز', keywords: ['threads', 'ثريدز', 'ثردز'], customIcon: ThreadsIcon, color: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع', 'ويب'], icon: Globe, color: 'from-[#10B981] to-[#059669]', bgColor: 'bg-[#10B981]' },
  { id: 'reviews', name: 'تقييمات', keywords: ['review', 'تقييم', 'rating'], icon: Star, color: 'from-[#F59E0B] to-[#D97706]', bgColor: 'bg-[#F59E0B]' },
];

// Live Indicator Component
const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 rounded-full border border-emerald-500/30"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <motion.div
      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-[10px] sm:text-xs font-semibold text-emerald-500">متاح الآن</span>
  </motion.div>
);

// Stat Badge Component
const StatBadge = ({ icon: Icon, value, label, delay = 0 }: { icon: any; value: string; label: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10"
  >
    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="text-right">
      <p className="text-white font-bold text-sm">{value}</p>
      <p className="text-white/60 text-[10px]">{label}</p>
    </div>
  </motion.div>
);

// Modern Social Service Card (Grid View)
const SocialServiceCard = ({ 
  service, 
  index, 
  onOrder, 
  isFavorite,
  onToggleFavorite,
  parseFeatures,
  convertToSAR,
}: { 
  service: Service; 
  index: number; 
  onOrder: (service: Service) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  parseFeatures: (features: any) => { min: number; max: number; rate: number; refill: boolean; cancel: boolean };
  convertToSAR: (price: number) => number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const features = parseFeatures(service.features);
  const pricePerK = convertToSAR(service.price);

  // Find matching platform
  const getPlatformIcon = () => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[0]; // default
  };
  
  const platform = getPlatformIcon();
  const Icon = platform.icon;
  const CustomIcon = (platform as any).customIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group h-full"
    >
      <Card className="h-full relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 rounded-2xl hover:shadow-xl hover:shadow-primary/5">
        {/* Gradient Overlay on Hover */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-0 group-hover:opacity-5`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.05 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${platform.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        <CardContent className="relative z-10 p-4 sm:p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Icon */}
            <motion.div 
              animate={{ rotate: isHovered ? 5 : 0, scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} blur-lg opacity-30 group-hover:opacity-50 transition-opacity`} />
              <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${platform.bgColor} flex items-center justify-center shadow-lg`}>
                {CustomIcon ? (
                  <CustomIcon />
                ) : Icon ? (
                  <Icon className={cn("w-6 h-6 sm:w-7 sm:h-7", platform.iconColor || "text-white")} />
                ) : null}
              </div>
            </motion.div>

            {/* Price & Badges */}
            <div className="text-left flex flex-col items-end gap-2">
              <motion.div 
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="flex items-baseline gap-1"
              >
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {pricePerK.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">ر.س</span>
              </motion.div>
              
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {(service.refill_enabled || features.refill) && (
                  <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px] px-1.5 py-0.5 gap-0.5">
                    <RefreshCw className="w-2.5 h-2.5" />
                    ضمان
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Service Name */}
          <h3 className="font-bold text-sm sm:text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {service.name}
          </h3>

          {/* Description */}
          {service.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed flex-grow">
              {service.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4 mt-auto">
            {service.external_service_id && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
                <span dir="ltr">#{service.external_service_id}</span>
              </span>
            )}
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
              <Target className="w-3 h-3" />
              <span dir="ltr">{features.min.toLocaleString()} - {features.max.toLocaleString()}</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(service.id);
              }}
              className={cn(
                "h-9 w-9 rounded-xl shrink-0",
                isFavorite 
                  ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25" 
                  : "hover:bg-rose-500/10 hover:text-rose-500"
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
            <Button
              size="sm"
              onClick={() => onOrder(service)}
              className={`flex-1 bg-gradient-to-r ${platform.color} hover:opacity-90 text-white rounded-xl h-9 sm:h-10 text-xs shadow-md hover:shadow-lg transition-shadow`}
            >
              <ShoppingCart className="w-3.5 h-3.5 ml-1.5" />
              اطلب الآن
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// List View Card
const SocialServiceListCard = ({ 
  service, 
  index, 
  onOrder, 
  isFavorite,
  onToggleFavorite,
  parseFeatures,
  convertToSAR,
}: { 
  service: Service; 
  index: number; 
  onOrder: (service: Service) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  parseFeatures: (features: any) => { min: number; max: number; rate: number; refill: boolean; cancel: boolean };
  convertToSAR: (price: number) => number;
}) => {
  const features = parseFeatures(service.features);
  const pricePerK = convertToSAR(service.price);

  // Find matching platform
  const getPlatformIcon = () => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[0];
  };
  
  const platform = getPlatformIcon();
  const Icon = platform.icon;
  const CustomIcon = (platform as any).customIcon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group"
    >
      <Card className="relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 rounded-xl hover:shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl ${platform.bgColor} flex items-center justify-center shadow-md shrink-0`}>
              {CustomIcon ? (
                <CustomIcon />
              ) : Icon ? (
                <Icon className={cn("w-5 h-5 sm:w-7 sm:h-7", platform.iconColor || "text-white")} />
              ) : null}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <span className="text-lg sm:text-xl font-bold text-primary shrink-0">
                  {pricePerK.toFixed(2)} ر.س
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {service.external_service_id && (
                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      #{service.external_service_id}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Target className="w-3 h-3" />
                    {features.min.toLocaleString()} - {features.max.toLocaleString()}
                  </span>
                  {(service.refill_enabled || features.refill) && (
                    <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px] px-1.5 py-0.5">
                      <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
                      ضمان
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(service.id);
                    }}
                    className={cn(
                      "h-8 px-2 rounded-lg",
                      isFavorite 
                        ? "text-rose-500 hover:bg-rose-500/10" 
                        : "hover:text-rose-500 hover:bg-rose-500/10"
                    )}
                  >
                    <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onOrder(service)}
                    className={`h-8 px-3 bg-gradient-to-r ${platform.color} hover:opacity-90 text-white rounded-lg text-xs`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 ml-1" />
                    اطلب
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SocialMediaServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { convertToSAR } = useExchangeRate();
  
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("price-asc");
  const [balance, setBalance] = useState(0);

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
    if (userBalance) {
      setBalance(userBalance.balance);
    }
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

  // Get services by network
  const getServicesByNetwork = useCallback((networkId: string) => {
    if (networkId === 'all') return socialMediaServices;
    const network = socialNetworks.find(n => n.id === networkId);
    if (!network || network.keywords.length === 0) return socialMediaServices;
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = getServicesByNetwork(selectedNetwork);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [selectedNetwork, searchQuery, sortBy, getServicesByNetwork]);

  // Parse features
  const parseFeatures = (features: any) => {
    const defaults = { min: 10, max: 100000, rate: 0, refill: false, cancel: false };
    if (!features) return defaults;
    try {
      const f = typeof features === 'string' ? JSON.parse(features) : features;
      return {
        min: parseInt(f.min || f.minQuantity) || defaults.min,
        max: parseInt(f.max || f.maxQuantity) || defaults.max,
        rate: parseFloat(f.rate) || 0,
        refill: f.refill === true || f.refill === 'true',
        cancel: f.cancel === true || f.cancel === 'true' || f.canCancel === true,
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

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    const features = parseFeatures(service.features);
    setQuantity(features.min.toString());
    setShowOrderDialog(true);
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
      setShowOrderDialog(false);
      refetchBalance();
      
    } catch { 
      toast.error("حدث خطأ أثناء إرسال الطلب"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات السوشيال ميديا" color="blue" />
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full overflow-x-hidden">
        <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 lg:space-y-8 pb-8 px-4 md:px-6" dir="rtl">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 sm:p-6 lg:p-8"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-40 sm:w-72 h-40 sm:h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 sm:w-96 h-60 sm:h-96 bg-black/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/3" />
            
            {/* Floating Icons */}
            <motion.div 
              className="absolute top-4 left-4 opacity-15 hidden md:block"
              animate={{ y: [0, -8, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Instagram className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div 
              className="absolute bottom-8 left-1/4 opacity-15 hidden md:block"
              animate={{ y: [0, 8, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            >
              <Youtube className="w-10 h-10 text-white" />
            </motion.div>
            
            <div className="relative z-10">
              {/* Top Row */}
              <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                    <LiveIndicator />
                    <Badge className="bg-white/15 text-white border-0 text-[10px] sm:text-xs">
                      <TrendingUp className="w-3 h-3 ml-1" />
                      الأكثر طلباً
                    </Badge>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                    خدمات السوشيال ميديا
                  </h1>
                  <p className="text-white/70 text-xs sm:text-sm max-w-lg hidden sm:block">
                    زد متابعيك وتفاعلك على جميع منصات التواصل الاجتماعي بأفضل الأسعار
                  </p>
                </div>
                
                <Link to="/dashboard/our-services">
                  <motion.div 
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors border border-white/10"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                </Link>
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <StatBadge icon={Activity} value={`${socialMediaServices.length}`} label="خدمة متاحة" delay={0.1} />
                <StatBadge icon={Zap} value="فوري - 24 ساعة" label="وقت التنفيذ" delay={0.2} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border border-white/20"
                >
                  <span className="text-white/80 text-xs">رصيدك:</span>
                  <span className="font-bold text-white text-sm sm:text-base">{balance.toFixed(2)} ر.س</span>
                </motion.div>
              </div>

              {/* Quick Features - Desktop Only */}
              <div className="hidden lg:grid grid-cols-4 gap-3 mt-6">
                {[
                  { icon: Zap, label: "تنفيذ سريع", value: "فوري" },
                  { icon: Shield, label: "ضمان التعويض", value: "100%" },
                  { icon: Users, label: "عملاء سعداء", value: "+5000" },
                  { icon: Award, label: "منصات متعددة", value: "+15" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center border border-white/10"
                  >
                    <stat.icon className="w-5 h-5 text-white/80 mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">{stat.value}</p>
                    <p className="text-white/50 text-[10px]">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Platform Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full overflow-hidden"
          >
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-2">
              <div className="flex gap-2 min-w-max">
                {socialNetworks.map((network) => {
                  const Icon = network.icon;
                  const CustomIcon = (network as any).customIcon;
                  const isSelected = selectedNetwork === network.id;
                  
                  return (
                    <button
                      key={network.id}
                      onClick={() => setSelectedNetwork(network.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all shrink-0 border",
                        isSelected
                          ? `bg-gradient-to-r ${network.color} text-white border-transparent shadow-md`
                          : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full",
                        !isSelected && network.bgColor
                      )}>
                        {CustomIcon ? (
                          <div className={isSelected ? "text-white" : ""}>
                            <CustomIcon />
                          </div>
                        ) : Icon ? (
                          <Icon className={cn("w-4 h-4", isSelected ? "text-white" : network.iconColor || "text-white")} />
                        ) : null}
                      </div>
                      <span className={cn(
                        "text-sm font-medium whitespace-nowrap",
                        isSelected ? "text-white" : "text-foreground"
                      )}>
                        {network.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Search & Filters Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-3 sm:p-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  placeholder="ابحث عن خدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10 sm:h-11 text-sm rounded-xl bg-background/50 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
                />
              </div>
              
              {/* Sort & View Controls */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[130px] sm:w-[150px] h-10 sm:h-11 rounded-xl text-xs sm:text-sm bg-background/50 border-border/50">
                    <SlidersHorizontal className="w-3.5 h-3.5 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="price-asc">السعر: الأقل</SelectItem>
                    <SelectItem value="price-desc">السعر: الأعلى</SelectItem>
                    <SelectItem value="name">الاسم</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-colors ${
                      viewMode === "grid" 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-colors ${
                      viewMode === "list" 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <span className="text-xs text-muted-foreground">
                عرض {filteredServices.length} من {socialMediaServices.length} خدمة
              </span>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  مسح البحث
                </Button>
              )}
            </div>
          </motion.div>

          {/* Featured Offers Section */}
          <FeaturedOffersSection category="smm" />

          {/* Services Grid/List */}
          {filteredServices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 sm:py-20"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">لا توجد خدمات</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto px-4">
                {searchQuery ? "لم يتم العثور على خدمات تطابق البحث" : "سيتم إضافة الخدمات قريباً"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedNetwork("all");
                }}
                className="mt-4"
              >
                إعادة ضبط الفلاتر
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`grid gap-3 sm:gap-4 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}
              >
                {filteredServices.map((service, index) => (
                  viewMode === "grid" ? (
                    <SocialServiceCard
                      key={service.id}
                      service={service}
                      index={index}
                      onOrder={handleSelectService}
                      isFavorite={favorites.includes(service.id)}
                      onToggleFavorite={toggleFavorite}
                      parseFeatures={parseFeatures}
                      convertToSAR={convertToSAR}
                    />
                  ) : (
                    <SocialServiceListCard
                      key={service.id}
                      service={service}
                      index={index}
                      onOrder={handleSelectService}
                      isFavorite={favorites.includes(service.id)}
                      onToggleFavorite={toggleFavorite}
                      parseFeatures={parseFeatures}
                      convertToSAR={convertToSAR}
                    />
                  )
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-md mx-4 rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-primary/5 p-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  طلب جديد
                </DialogTitle>
              </DialogHeader>
              
              {selectedService && (
                <div className="mt-3 p-3 bg-card rounded-xl border border-border">
                  <h4 className="font-medium text-sm text-foreground line-clamp-2">
                    {selectedService.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {selectedService.external_service_id && (
                      <span>#{selectedService.external_service_id}</span>
                    )}
                    {(selectedService.refill_enabled || parseFeatures(selectedService.features).refill) && (
                      <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border-0">
                        <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
                        ضمان تعويض
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 space-y-4">
              {/* Link Input */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  رابط الحساب أو المنشور
                </Label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="rounded-lg"
                  dir="ltr"
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" />
                  الكمية
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="أدخل الكمية"
                  className="rounded-lg"
                  dir="ltr"
                />
                {selectedService && (
                  <p className="text-xs text-muted-foreground">
                    الحد: {parseFeatures(selectedService.features).min.toLocaleString()} - {parseFeatures(selectedService.features).max.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Price Summary */}
              <div className="p-3 bg-muted/50 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">السعر / 1000:</span>
                  <span>{selectedService ? convertToSAR(selectedService.price).toFixed(2) : 0} ر.س</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">الكمية:</span>
                  <span>{parseInt(quantity) || 0}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">الإجمالي:</span>
                  <span className="text-lg font-bold text-primary">{totalPrice.toFixed(2)} ر.س</span>
                </div>
                
                {userBalance && (
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-muted-foreground">رصيدك:</span>
                    <span className={cn(
                      "font-medium",
                      userBalance.balance >= totalPrice ? "text-green-600" : "text-red-500"
                    )}>
                      {userBalance.balance.toFixed(2)} ر.س
                    </span>
                  </div>
                )}
                
                {userBalance && userBalance.balance < totalPrice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/deposit')}
                    className="w-full mt-2 rounded-lg gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                  >
                    <Wallet className="w-4 h-4" />
                    شحن الرصيد
                  </Button>
                )}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
                className="w-full h-11 rounded-xl gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    تأكيد الطلب
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
