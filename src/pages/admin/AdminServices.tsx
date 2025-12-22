import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, AlertTriangle, Trash2, Package, Plus, RefreshCw, 
  ArrowUpRight, Globe, Palette, Code, Layers,
  Instagram, Facebook, Youtube, Twitter, Send, MessageCircle,
  Sparkles, Star, Smartphone, TrendingUp, ChevronLeft, ChevronDown,
  Grid3X3, LayoutList, Search, DollarSign, ShoppingCart, BarChart3,
  Activity, Zap, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import EnhancedServiceCard from "@/components/admin/services/EnhancedServiceCard";
import EmptyServicesState from "@/components/admin/services/EmptyServicesState";
import ServiceFormDialog from "@/components/admin/services/ServiceFormDialog";
import ServiceDetailsDialog from "@/components/admin/services/ServiceDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  status: string;
  features: string[];
  image_url: string | null;
  created_at?: string;
  orderCount?: number;
  revenue?: number;
}

interface CategoryGroup {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
  gradient: string;
  iconGradient: string;
  bgGlow: string;
  services: Service[];
  platforms?: { icon: React.ElementType; color: string; bg: string }[];
}

const serviceSchema = z.object({
  name: z.string().min(3, "اسم الخدمة مطلوب (3 أحرف على الأقل)"),
  category: z.string().min(1, "التصنيف مطلوب"),
  price: z.number().min(0, "السعر يجب أن يكون رقماً موجباً"),
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  }
};

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // View states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);

  // Bulk delete
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkDeleteCategory, setBulkDeleteCategory] = useState("all");
  const [deleting, setDeleting] = useState(false);

  // Stats from orders
  const [orderStats, setOrderStats] = useState<{ serviceId: string; count: number; revenue: number }[]>([]);

  useEffect(() => {
    fetchServices();
    fetchOrderStats();

    const channel = supabase
      .channel('services-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب الخدمات");
    } else {
      setServices(data as Service[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const fetchOrderStats = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("service_id, total_price");

    if (!error && data) {
      const stats = data.reduce((acc, order) => {
        const existing = acc.find(s => s.serviceId === order.service_id);
        if (existing) {
          existing.count++;
          existing.revenue += order.total_price;
        } else {
          acc.push({ serviceId: order.service_id, count: 1, revenue: order.total_price });
        }
        return acc;
      }, [] as { serviceId: string; count: number; revenue: number }[]);
      setOrderStats(stats);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServices();
    fetchOrderStats();
  };

  // Enrich services with order stats
  const enrichedServices = useMemo(() => {
    return services.map(service => {
      const stats = orderStats.find(s => s.serviceId === service.id);
      return {
        ...service,
        orderCount: stats?.count || 0,
        revenue: stats?.revenue || 0,
      };
    });
  }, [services, orderStats]);

  // Category groups
  const categoryGroups: CategoryGroup[] = useMemo(() => {
    const groups: CategoryGroup[] = [
      {
        id: 'social',
        name: 'Social Media',
        nameAr: 'خدمات التواصل الاجتماعي',
        icon: Globe,
        gradient: 'from-blue-600/80 to-cyan-600/80',
        iconGradient: 'from-blue-500 to-cyan-500',
        bgGlow: 'bg-blue-500/10',
        services: [],
        platforms: [
          { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/10' },
          { icon: Facebook, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Youtube, color: 'text-red-400', bg: 'bg-red-500/10' },
          { icon: Twitter, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: Send, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        ]
      },
      {
        id: 'design',
        name: 'Design',
        nameAr: 'خدمات التصميم',
        icon: Palette,
        gradient: 'from-violet-600/80 to-purple-600/80',
        iconGradient: 'from-violet-500 to-purple-500',
        bgGlow: 'bg-violet-500/10',
        services: [],
        platforms: [
          { icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ]
      },
      {
        id: 'dev',
        name: 'Development',
        nameAr: 'خدمات البرمجة والتطوير',
        icon: Code,
        gradient: 'from-emerald-600/80 to-teal-600/80',
        iconGradient: 'from-emerald-500 to-teal-500',
        bgGlow: 'bg-emerald-500/10',
        services: [],
        platforms: [
          { icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Code, color: 'text-teal-400', bg: 'bg-teal-500/10' },
          { icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/10' },
        ]
      },
      {
        id: 'other',
        name: 'Other',
        nameAr: 'خدمات أخرى',
        icon: Package,
        gradient: 'from-gray-600/80 to-slate-600/80',
        iconGradient: 'from-gray-500 to-slate-500',
        bgGlow: 'bg-gray-500/10',
        services: [],
      }
    ];

    // Categorize services - include Arabic keywords
    enrichedServices.forEach(service => {
      const cat = service.category.toLowerCase();
      const catOriginal = service.category;
      
      // Social Media - English and Arabic keywords
      if (cat.includes('instagram') || cat.includes('facebook') || cat.includes('twitter') || 
          cat.includes('youtube') || cat.includes('tiktok') || cat.includes('telegram') || 
          cat.includes('linkedin') || cat.includes('spotify') || cat.includes('social') ||
          catOriginal.includes('انستقرام') || catOriginal.includes('انستا') || 
          catOriginal.includes('فيسبوك') || catOriginal.includes('تويتر') || 
          catOriginal.includes('يوتيوب') || catOriginal.includes('تيك توك') || 
          catOriginal.includes('تيليجرام') || catOriginal.includes('سناب') ||
          catOriginal.includes('واتساب') || catOriginal.includes('لايكات') ||
          catOriginal.includes('متابعين') || catOriginal.includes('مشاهدات') ||
          catOriginal.includes('اشتراكات') || catOriginal.includes('ريتويت') ||
          catOriginal.includes('تغريد') || catOriginal.includes('سبوتيفاي')) {
        groups[0].services.push(service);
      } else if (cat.includes('design') || catOriginal.includes('تصميم')) {
        groups[1].services.push(service);
      } else if (cat.includes('dev') || catOriginal.includes('برمجة') || catOriginal.includes('تطوير') || catOriginal.includes('موقع') || catOriginal.includes('تطبيق')) {
        groups[2].services.push(service);
      } else {
        groups[3].services.push(service);
      }
    });

    return groups.filter(g => g.services.length > 0);
  }, [enrichedServices]);

  // Get selected category
  const selectedCategory = useMemo(() => {
    return categoryGroups.find(g => g.id === selectedCategoryId) || null;
  }, [categoryGroups, selectedCategoryId]);

  // Filter services in selected category
  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    return selectedCategory.services.filter(service =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedCategory, searchQuery]);

  // Group services by subcategory (actual category field from database)
  const subcategories = useMemo(() => {
    if (!selectedCategory) return {};
    const groups: Record<string, Service[]> = {};
    selectedCategory.services.forEach(service => {
      const cat = service.category;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(service);
    });
    return groups;
  }, [selectedCategory]);

  // Toggle subcategory expansion
  const toggleSubcategory = (subcat: string) => {
    setExpandedSubcategories(prev => {
      const next = new Set(prev);
      if (next.has(subcat)) {
        next.delete(subcat);
      } else {
        next.add(subcat);
      }
      return next;
    });
  };

  // Stats
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === "active").length;
  const totalRevenue = orderStats.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrders = orderStats.reduce((sum, s) => sum + s.count, 0);

  const uniqueCategories = useMemo(() => {
    return [...new Set(services.map(s => s.category))];
  }, [services]);

  const openNewDialog = () => {
    setEditingService(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setIsFormDialogOpen(true);
  };

  const openDetailsDialog = (service: Service) => {
    setViewingService(service);
    setIsDetailsDialogOpen(true);
  };

  const handleSubmit = async (formData: {
    name: string;
    description: string;
    category: string;
    price: string;
    status: string;
    features: string[];
    image_url: string;
  }) => {
    const validation = serviceSchema.safeParse({
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const serviceData = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      price: parseFloat(formData.price),
      status: formData.status as "active" | "inactive" | "archived",
      features: formData.features,
      image_url: formData.image_url || null,
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingService.id);

      if (error) {
        toast.error("خطأ في تحديث الخدمة");
      } else {
        toast.success("تم تحديث الخدمة بنجاح");
        setIsFormDialogOpen(false);
        fetchServices();
      }
    } else {
      const { error } = await supabase.from("services").insert(serviceData);

      if (error) {
        toast.error("خطأ في إضافة الخدمة");
      } else {
        toast.success("تم إضافة الخدمة بنجاح");
        setIsFormDialogOpen(false);
        fetchServices();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast.error("خطأ في حذف الخدمة. قد تكون مرتبطة بطلبات.");
    } else {
      toast.success("تم حذف الخدمة بنجاح");
      fetchServices();
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    
    let query = supabase.from("services").delete();
    
    if (bulkDeleteCategory !== "all") {
      query = query.eq("category", bulkDeleteCategory);
    } else {
      query = query.neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { error } = await query.select();

    if (error) {
      toast.error("خطأ في حذف الخدمات. قد تكون بعضها مرتبطة بطلبات.");
    } else {
      const deletedCount = bulkDeleteCategory === "all" 
        ? services.length 
        : services.filter(s => s.category === bulkDeleteCategory).length;
      toast.success(`تم حذف ${deletedCount} خدمة بنجاح`);
      fetchServices();
    }
    
    setDeleting(false);
    setIsBulkDeleteOpen(false);
    setBulkDeleteCategory("all");
  };

  const getDeleteCount = () => {
    if (bulkDeleteCategory === "all") return services.length;
    return services.filter(s => s.category === bulkDeleteCategory).length;
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">جاري تحميل الخدمات...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="w-full min-h-screen overflow-x-hidden pb-10" dir="rtl">
        <AnimatePresence mode="wait">
          {/* Categories View */}
          {!selectedCategoryId ? (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/30 p-4 sm:p-6"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-xl blur-xl opacity-50" />
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/30">
                        <Package className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-foreground">إدارة الخدمات</h1>
                      <p className="text-sm text-muted-foreground">{totalServices} خدمة متاحة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      تحديث
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsBulkDeleteOpen(true)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </Button>
                    <Button onClick={openNewDialog} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      إضافة خدمة
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="relative z-10 flex flex-wrap gap-3 mt-4">
                  {[
                    { label: 'نشطة', value: activeServices, gradient: 'from-emerald-500 to-green-500' },
                    { label: 'طلبات', value: totalOrders, gradient: 'from-blue-500 to-cyan-500' },
                    { label: 'إيرادات', value: `$${totalRevenue.toFixed(0)}`, gradient: 'from-amber-500 to-orange-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 border border-border/50">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                        {typeof stat.value === 'number' ? stat.value : stat.value.replace('$', '')}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Category Cards Grid with Charts */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              >
                {categoryGroups.map((category) => {
                  const categoryRevenue = category.services.reduce((sum, s) => sum + (s.revenue || 0), 0);
                  const categoryOrders = category.services.reduce((sum, s) => sum + (s.orderCount || 0), 0);
                  const activeCount = category.services.filter(s => s.status === 'active').length;
                  const avgPrice = category.services.length > 0 
                    ? category.services.reduce((sum, s) => sum + s.price, 0) / category.services.length 
                    : 0;
                  
                  // Mini chart data - simulate trend
                  const chartData = Array.from({ length: 7 }, (_, i) => ({
                    day: i,
                    value: Math.floor(Math.random() * categoryOrders * 0.3) + categoryOrders * 0.7 / 7
                  }));

                  // Status distribution for pie chart
                  const statusData = [
                    { name: 'نشط', value: activeCount, color: '#22c55e' },
                    { name: 'متوقف', value: category.services.filter(s => s.status === 'inactive').length, color: '#f59e0b' },
                    { name: 'مؤرشف', value: category.services.filter(s => s.status === 'archived').length, color: '#64748b' },
                  ].filter(d => d.value > 0);

                  // Top services by revenue
                  const topServices = [...category.services]
                    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                    .slice(0, 3);

                  return (
                    <motion.div
                      key={category.id}
                      variants={itemVariants}
                      onMouseEnter={() => setHoveredCategory(category.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className="group cursor-pointer"
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <Card className="h-full relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-500 hover:shadow-xl hover:border-border hover:scale-[1.01]">
                        {/* Background Gradient */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08]`}
                        />
                        
                        {/* Glow Orb */}
                        <div
                          className={`absolute -top-20 -right-20 w-40 h-40 ${category.bgGlow} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}
                        />

                        <CardContent className="relative z-10 p-4 sm:p-5 flex flex-col h-full">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <motion.div
                              animate={{ 
                                x: hoveredCategory === category.id ? 8 : 0,
                                scale: hoveredCategory === category.id ? 1.1 : 1
                              }}
                              className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-all duration-300"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                              <span className="text-[10px] font-semibold">استعراض</span>
                            </motion.div>
                            
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors text-right">
                                  {category.nameAr}
                                </h3>
                                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider text-right">
                                  {category.name.toUpperCase()}
                                </p>
                              </div>
                              <motion.div 
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="relative"
                              >
                                <div className={`absolute inset-0 bg-gradient-to-br ${category.iconGradient} rounded-xl blur-lg opacity-40`} />
                                <div className={`relative p-3 rounded-xl bg-gradient-to-br ${category.iconGradient} shadow-lg`}>
                                  <category.icon className="w-5 h-5 text-white" />
                                </div>
                              </motion.div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {[
                              { icon: Package, label: 'خدمات', value: category.services.length, color: 'text-primary' },
                              { icon: Zap, label: 'نشطة', value: activeCount, color: 'text-emerald-500' },
                              { icon: ShoppingCart, label: 'طلبات', value: categoryOrders, color: 'text-blue-500' },
                              { icon: DollarSign, label: 'إيرادات', value: `$${categoryRevenue.toFixed(0)}`, color: 'text-amber-500' },
                            ].map((stat, i) => (
                              <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="text-center p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                              >
                                <stat.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${stat.color}`} />
                                <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                              </motion.div>
                            ))}
                          </div>

                          {/* Charts Row */}
                          <div className="flex gap-3 mb-3">
                            {/* Mini Area Chart - Orders Trend */}
                            <div className="flex-1 p-2 rounded-lg bg-secondary/20">
                              <div className="flex items-center justify-between mb-1">
                                <Activity className="w-3 h-3 text-blue-500" />
                                <span className="text-[9px] text-muted-foreground">اتجاه الطلبات</span>
                              </div>
                              <div className="h-12">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData}>
                                    <defs>
                                      <linearGradient id={`gradient-${category.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <Tooltip 
                                      content={({ payload }) => payload?.[0] ? (
                                        <div className="bg-popover/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] border border-border">
                                          {Number(payload[0].value || 0).toFixed(0)} طلب
                                        </div>
                                      ) : null}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke="#3b82f6" 
                                      strokeWidth={1.5}
                                      fill={`url(#gradient-${category.id})`} 
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Mini Pie Chart - Status Distribution */}
                            <div className="w-20 p-2 rounded-lg bg-secondary/20">
                              <div className="flex items-center justify-center mb-1">
                                <span className="text-[9px] text-muted-foreground">الحالة</span>
                              </div>
                              <div className="h-12">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={statusData}
                                      dataKey="value"
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={12}
                                      outerRadius={20}
                                      strokeWidth={0}
                                    >
                                      {statusData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          {/* Top Services Bar */}
                          {topServices.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <BarChart3 className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[9px] text-muted-foreground">أعلى الخدمات إيراداً</span>
                              </div>
                              <div className="space-y-1.5">
                                {topServices.map((service, i) => {
                                  const maxRevenue = topServices[0].revenue || 1;
                                  const percentage = ((service.revenue || 0) / maxRevenue) * 100;
                                  return (
                                    <div key={service.id} className="space-y-0.5">
                                      <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-muted-foreground truncate max-w-[60%]">{service.name}</span>
                                        <span className="font-medium text-primary">${(service.revenue || 0).toFixed(0)}</span>
                                      </div>
                                      <Progress value={percentage} className="h-1" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Platform Icons */}
                          {category.platforms && (
                            <div className="flex flex-wrap gap-1.5 justify-end mb-2">
                              {category.platforms.slice(0, 4).map((platform, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 + i * 0.03 }}
                                  whileHover={{ scale: 1.15, y: -1 }}
                                  className={`w-7 h-7 rounded-lg ${platform.bg} flex items-center justify-center transition-all duration-300`}
                                >
                                  <platform.icon className={`w-3.5 h-3.5 ${platform.color}`} />
                                </motion.div>
                              ))}
                              {category.services.length > 4 && (
                                <div className="px-2 h-7 rounded-lg bg-secondary/50 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                  +{category.services.length - 4}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                            <motion.span
                              animate={{ x: hoveredCategory === category.id ? 5 : 0 }}
                              className="text-[10px] font-medium text-primary flex items-center gap-1"
                            >
                              <span>عرض التفاصيل</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </motion.span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                متوسط: ${avgPrice.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Empty State */}
              {categoryGroups.length === 0 && (
                <EmptyServicesState hasFilters={false} onAddNew={openNewDialog} onClearFilters={() => {}} />
              )}
            </motion.div>
          ) : (
            /* Category Detail View with Subcategories */
            <motion.div
              key="category-detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              {/* Back Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/30 p-4 sm:p-6"
              >
                <div className={`absolute top-0 right-0 w-64 h-64 ${selectedCategory?.bgGlow} rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/4`} />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedCategoryId(null)}
                      className="shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${selectedCategory?.iconGradient} rounded-xl blur-xl opacity-50`} />
                      <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${selectedCategory?.iconGradient} flex items-center justify-center shadow-xl`}>
                        {selectedCategory && <selectedCategory.icon className="w-6 h-6 text-white" />}
                      </div>
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-foreground">{selectedCategory?.nameAr}</h1>
                      <p className="text-sm text-muted-foreground">{selectedCategory?.services.length} خدمة • {Object.keys(subcategories).length} قسم</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-9 h-9"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode('list')}
                      >
                        <LayoutList className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button onClick={openNewDialog} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      إضافة
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Subcategories with Services */}
              {Object.keys(subcategories).length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {Object.entries(subcategories).map(([subcat, subServices], index) => {
                    const isExpanded = expandedSubcategories.has(subcat);
                    const subcatRevenue = subServices.reduce((sum, s) => sum + (s.revenue || 0), 0);
                    const subcatOrders = subServices.reduce((sum, s) => sum + (s.orderCount || 0), 0);
                    const activeCount = subServices.filter(s => s.status === 'active').length;
                    
                    // Filter by search
                    const filteredSubServices = subServices.filter(service =>
                      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (searchQuery && filteredSubServices.length === 0) return null;

                    return (
                      <motion.div
                        key={subcat}
                        variants={itemVariants}
                        className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm"
                      >
                        <button
                          onClick={() => toggleSubcategory(subcat)}
                          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedCategory?.iconGradient} flex items-center justify-center`}>
                              <Package className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-right">
                              <h3 className="font-bold text-lg">{subcat}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-muted-foreground">{subServices.length} خدمة</span>
                                <span className="text-xs text-emerald-500">{activeCount} نشطة</span>
                                <span className="text-xs text-blue-500">{subcatOrders} طلب</span>
                                <span className="text-xs text-amber-500">${subcatRevenue.toFixed(0)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="h-7 px-3 text-xs font-medium">
                              {subServices.length}
                            </Badge>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                              className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"
                            >
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </motion.div>
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border/40 p-4 sm:p-5">
                                <div className={
                                  viewMode === 'grid'
                                    ? 'grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                    : 'flex flex-col gap-2'
                                }>
                                  {(searchQuery ? filteredSubServices : subServices).map((service, idx) => (
                                    <motion.div
                                      key={service.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.03 }}
                                    >
                                      <EnhancedServiceCard
                                        service={service}
                                        index={idx}
                                        viewMode={viewMode}
                                        onView={(s) => openDetailsDialog(s)}
                                        onEdit={(s) => openEditDialog(s)}
                                        onDelete={(id) => handleDelete(id)}
                                      />
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">لا توجد خدمات</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'أضف خدمة جديدة للبدء'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={openNewDialog} className="mt-4 gap-2">
                      <Plus className="w-4 h-4" />
                      إضافة خدمة
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialogs */}
        <ServiceFormDialog
          isOpen={isFormDialogOpen}
          onClose={() => setIsFormDialogOpen(false)}
          editingService={editingService}
          onSubmit={handleSubmit}
          categories={uniqueCategories}
          statusOptions={[
            { value: "active", label: "نشط" },
            { value: "inactive", label: "غير نشط" },
            { value: "archived", label: "مؤرشف" },
          ]}
        />

        <ServiceDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          service={viewingService}
        />

        {/* Bulk Delete Dialog */}
        <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                حذف الخدمات
              </AlertDialogTitle>
              <AlertDialogDescription>
                اختر التصنيف الذي تريد حذف خدماته. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <Select value={bulkDeleteCategory} onValueChange={setBulkDeleteCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الخدمات ({services.length})</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat} ({services.filter(s => s.category === cat).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {getDeleteCount() > 0 && (
                <p className="mt-3 text-sm text-destructive">
                  سيتم حذف {getDeleteCount()} خدمة
                </p>
              )}
            </div>

            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={deleting || getDeleteCount() === 0}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Trash2 className="w-4 h-4 ml-2" />
                )}
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminServices;
