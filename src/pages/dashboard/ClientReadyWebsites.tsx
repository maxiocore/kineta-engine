import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Globe, Search, Sparkles, Star, Clock, ShoppingCart, Eye,
  CheckCircle2, ArrowLeft, Filter, Zap, Tag, ChevronLeft,
  Monitor, Smartphone, ExternalLink,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { cn } from "@/lib/utils";

interface ReadyWebsite {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  category: string;
  preview_url: string | null;
  demo_url: string | null;
  image_url: string | null;
  price: number;
  original_price: number | null;
  features: string[];
  technologies: string[];
  is_featured: boolean;
  delivery_days: number;
  sales_count: number;
  rating: number;
  display_order: number;
}

const categoryFilters = [
  { id: "all", name: "الكل", icon: Globe },
  { id: "landing", name: "صفحات هبوط", icon: Monitor },
  { id: "corporate", name: "مواقع شركات", icon: Globe },
  { id: "ecommerce", name: "متاجر إلكترونية", icon: ShoppingCart },
  { id: "restaurant", name: "مطاعم", icon: Star },
  { id: "portfolio", name: "بورتفوليو", icon: Eye },
  { id: "medical", name: "طبي", icon: Zap },
  { id: "realestate", name: "عقارات", icon: Globe },
  { id: "education", name: "تعليمي", icon: Globe },
];

const ClientReadyWebsites = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWebsite, setSelectedWebsite] = useState<ReadyWebsite | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: websites = [], isLoading, refetch } = useQuery({
    queryKey: ["ready-websites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ready_websites")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((w: any) => ({
        ...w,
        features: Array.isArray(w.features) ? w.features : [],
        technologies: Array.isArray(w.technologies) ? w.technologies : [],
      })) as ReadyWebsite[];
    },
  });

  const filteredWebsites = websites.filter((w) => {
    const matchesSearch =
      !searchQuery ||
      w.title_ar.includes(searchQuery) ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.description_ar && w.description_ar.includes(searchQuery));
    const matchesCategory = selectedCategory === "all" || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOrder = (website: ReadyWebsite) => {
    navigate("/dashboard/support", {
      state: {
        subject: `طلب موقع جاهز: ${website.title_ar}`,
        message: `أرغب في طلب "${website.title_ar}" بسعر ${website.price} ر.س`,
      },
    });
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم التحديث");
  };

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="min-h-screen pb-8" dir="rtl">
          {/* Header */}
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/50 p-5 sm:p-8">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-bl from-sky-500/15 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-2xl" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/dashboard/our-services")}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Globe className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">المواقع الجاهزة</h1>
                    <p className="text-sm text-muted-foreground">مواقع احترافية جاهزة للتسليم الفوري</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن موقع..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 rounded-xl bg-secondary/30 border-border/30"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Category Filters */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categoryFilters.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-xl whitespace-nowrap gap-1.5 shrink-0",
                    selectedCategory === cat.id && "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-0"
                  )}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.name}
                </Button>
              ))}
            </div>
          </motion.section>

          {/* Stats Bar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center justify-between mb-4 px-1">
            <span className="text-sm text-muted-foreground">
              {filteredWebsites.length} موقع متاح
            </span>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              {websites.filter((w) => w.is_featured).length} مميز
            </Badge>
          </motion.div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-secondary/30 animate-pulse" />
              ))}
            </div>
          ) : filteredWebsites.length === 0 ? (
            <div className="text-center py-20">
              <Globe className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold mb-2">لا توجد مواقع</h3>
              <p className="text-muted-foreground text-sm">جرب البحث بكلمات مختلفة</p>
            </div>
          ) : (
            /* Websites Grid */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredWebsites.map((website, index) => (
                <WebsiteCard
                  key={website.id}
                  website={website}
                  index={index}
                  onViewDetails={() => {
                    setSelectedWebsite(website);
                    setDetailsOpen(true);
                  }}
                  onOrder={() => handleOrder(website)}
                />
              ))}
            </div>
          )}

          {/* Details Dialog */}
          <WebsiteDetailsDialog
            website={selectedWebsite}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            onOrder={() => selectedWebsite && handleOrder(selectedWebsite)}
          />
        </div>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

// Website Card Component
const WebsiteCard = ({
  website,
  index,
  onViewDetails,
  onOrder,
}: {
  website: ReadyWebsite;
  index: number;
  onViewDetails: () => void;
  onOrder: () => void;
}) => {
  const hasDiscount = website.original_price && website.original_price > website.price;
  const discountPercent = hasDiscount
    ? Math.round(((website.original_price! - website.price) / website.original_price!) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
    >
      <Card className="group relative overflow-hidden border-border/40 bg-card/80 backdrop-blur-sm rounded-2xl hover:border-sky-500/30 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 h-full flex flex-col">
        {/* Featured Badge */}
        {website.is_featured && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1 text-xs">
              <Star className="w-3 h-3" />
              مميز
            </Badge>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 text-xs">
              خصم {discountPercent}%
            </Badge>
          </div>
        )}

        {/* Image Placeholder */}
        <div className="relative h-40 sm:h-44 bg-gradient-to-br from-sky-500/10 via-blue-500/10 to-indigo-500/10 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent z-[1]" />
          <div className="relative z-0 flex items-center gap-3">
            <div className="w-16 h-12 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-sky-400" />
            </div>
            <div className="w-8 h-14 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-bold text-base sm:text-lg mb-1 group-hover:text-sky-500 transition-colors line-clamp-1">
            {website.title_ar}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {website.description_ar}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {website.features.slice(0, 3).map((feature, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/60 text-[10px] sm:text-xs"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                {feature as string}
              </span>
            ))}
            {website.features.length > 3 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground px-2 py-0.5">
                +{website.features.length - 3} أخرى
              </span>
            )}
          </div>

          {/* Delivery & Tech */}
          <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {website.delivery_days} أيام
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {(website.technologies as string[]).slice(0, 2).join(", ")}
            </span>
          </div>

          {/* Price & Actions */}
          <div className="mt-auto flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold text-sky-500">
                  {website.price.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">ر.س</span>
              </div>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {website.original_price!.toLocaleString()} ر.س
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
              >
                <Eye className="w-3.5 h-3.5" />
                تفاصيل
              </Button>
              <Button
                size="sm"
                className="rounded-xl gap-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white border-0 hover:opacity-90"
                onClick={(e) => {
                  e.stopPropagation();
                  onOrder();
                }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                اطلب
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Website Details Dialog
const WebsiteDetailsDialog = ({
  website,
  open,
  onOpenChange,
  onOrder,
}: {
  website: ReadyWebsite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrder: () => void;
}) => {
  if (!website) return null;

  const hasDiscount = website.original_price && website.original_price > website.price;
  const discountPercent = hasDiscount
    ? Math.round(((website.original_price! - website.price) / website.original_price!) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{website.title_ar}</h2>
              <p className="text-xs text-muted-foreground font-normal">{website.title}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Description */}
          <div>
            <h4 className="font-semibold mb-2 text-sm">الوصف</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{website.description_ar}</p>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">المميزات</h4>
            <div className="grid grid-cols-2 gap-2">
              {website.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm">{feature as string}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technologies */}
          <div>
            <h4 className="font-semibold mb-2 text-sm">التقنيات المستخدمة</h4>
            <div className="flex flex-wrap gap-2">
              {website.technologies.map((tech, i) => (
                <Badge key={i} variant="outline" className="rounded-lg">
                  {tech as string}
                </Badge>
              ))}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <Clock className="w-5 h-5 mx-auto mb-1 text-sky-500" />
              <p className="text-sm font-bold">{website.delivery_days} أيام</p>
              <p className="text-[10px] text-muted-foreground">مدة التسليم</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <Star className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-sm font-bold">{website.rating}</p>
              <p className="text-[10px] text-muted-foreground">التقييم</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-sm font-bold">{website.sales_count}</p>
              <p className="text-[10px] text-muted-foreground">مبيعات</p>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-sky-500">{website.price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">ر.س</span>
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground line-through">
                    {website.original_price!.toLocaleString()} ر.س
                  </span>
                  <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-xs">
                    وفّر {discountPercent}%
                  </Badge>
                </div>
              )}
            </div>
            <Button
              size="lg"
              className="gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl hover:opacity-90 transition-all"
              onClick={() => {
                onOrder();
                onOpenChange(false);
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              اطلب الآن
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientReadyWebsites;
