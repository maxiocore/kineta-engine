import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import ServicesHeader from "@/components/admin/services/ServicesHeader";
import ServicesStatsGrid from "@/components/admin/services/ServicesStatsGrid";
import ServicesCategoryTabs from "@/components/admin/services/ServicesCategoryTabs";
import EnhancedServiceFilters from "@/components/admin/services/EnhancedServiceFilters";
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

const serviceSchema = z.object({
  name: z.string().min(3, "اسم الخدمة مطلوب (3 أحرف على الأقل)"),
  category: z.string().min(1, "التصنيف مطلوب"),
  price: z.number().min(0, "السعر يجب أن يكون رقماً موجباً"),
});

const statusOptions = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "archived", label: "مؤرشف" },
];

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("newest");
  
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
      // Update max price
      if (data && data.length > 0) {
        const maxPrice = Math.max(...data.map(s => s.price));
        setPriceRange([0, maxPrice > 0 ? maxPrice : 1000]);
      }
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

  // Max price for filter
  const maxPrice = useMemo(() => {
    if (services.length === 0) return 1000;
    return Math.max(...services.map(s => s.price));
  }, [services]);

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

  // Get category slug from category name
  const getCategorySlug = (categoryName: string) => {
    const slugMap: Record<string, string> = {
      "Instagram": "instagram",
      "Facebook": "facebook",
      "Youtube": "youtube",
      "Twitter": "twitter",
      "TikTok": "tiktok",
      "Telegram": "telegram",
      "LinkedIn": "linkedin",
      "Spotify": "spotify",
      "SoundCloud": "soundcloud",
      "Website Traffic": "website-traffic",
      "Other": "other",
    };
    return slugMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, "-");
  };

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = enrichedServices.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const categorySlug = getCategorySlug(service.category);
      const matchesCategory = selectedCategory === "all" || categorySlug === selectedCategory || service.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || service.status === selectedStatus;
      const matchesPrice = service.price >= priceRange[0] && service.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
    });

    // Sort
    switch (sortBy) {
      case "newest":
        filtered = filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case "oldest":
        filtered = filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
      case "price-high":
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case "price-low":
        filtered = filtered.sort((a, b) => a.price - b.price);
        break;
      case "orders":
        filtered = filtered.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
        break;
      case "revenue":
        filtered = filtered.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
        break;
    }

    return filtered;
  }, [enrichedServices, searchQuery, selectedCategory, selectedStatus, priceRange, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      const slug = getCategorySlug(service.category);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Stats calculations
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === "active").length;
  const inactiveServices = services.filter(s => s.status === "inactive").length;
  const totalRevenue = orderStats.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrders = orderStats.reduce((sum, s) => sum + s.count, 0);
  const avgPrice = totalServices > 0 ? services.reduce((sum, s) => sum + s.price, 0) / totalServices : 0;

  const hasActiveFilters = Boolean(searchQuery) || selectedCategory !== "all" || selectedStatus !== "all" || 
    priceRange[0] > 0 || priceRange[1] < maxPrice;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setPriceRange([0, maxPrice]);
    setSortBy("newest");
  };

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

  const uniqueCategories = useMemo(() => {
    return [...new Set(services.map(s => s.category))];
  }, [services]);

  const sidebarCategories = [
    { id: "all", label: "جميع الخدمات", icon: "📦", count: totalServices, color: "bg-primary" },
    { id: "instagram", label: "Instagram", icon: "📸", count: categoryCounts["instagram"] || 0, color: "bg-gradient-to-br from-pink-500 to-orange-400" },
    { id: "facebook", label: "Facebook", icon: "👤", count: categoryCounts["facebook"] || 0, color: "bg-gradient-to-br from-blue-600 to-blue-400" },
    { id: "youtube", label: "Youtube", icon: "▶️", count: categoryCounts["youtube"] || 0, color: "bg-gradient-to-br from-red-600 to-red-400" },
    { id: "twitter", label: "Twitter", icon: "🐦", count: categoryCounts["twitter"] || 0, color: "bg-gradient-to-br from-sky-500 to-sky-400" },
    { id: "tiktok", label: "TikTok", icon: "🎵", count: categoryCounts["tiktok"] || 0, color: "bg-gradient-to-br from-pink-500 to-cyan-400" },
    { id: "telegram", label: "Telegram", icon: "✈️", count: categoryCounts["telegram"] || 0, color: "bg-gradient-to-br from-sky-500 to-blue-500" },
    { id: "linkedin", label: "LinkedIn", icon: "💼", count: categoryCounts["linkedin"] || 0, color: "bg-gradient-to-br from-blue-700 to-blue-500" },
    { id: "spotify", label: "Spotify", icon: "🎧", count: categoryCounts["spotify"] || 0, color: "bg-gradient-to-br from-green-500 to-green-400" },
  ];

  return (
    <AdminDashboardLayout>
      <div className="w-full min-h-screen overflow-x-hidden" dir="rtl">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 pb-10">
          
          {/* Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-52 xl:w-56 shrink-0"
          >
            {/* Mobile: Horizontal Categories */}
            <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-2 px-2 pb-2">
              <div className="flex items-center gap-2 min-w-max">
                {sidebarCategories.slice(0, 7).map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card border border-border/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      selectedCategory === cat.id ? "bg-white/20" : "bg-secondary"
                    }`}>{cat.count}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Desktop: Vertical Sidebar */}
            <div className="hidden lg:block sticky top-4 space-y-3">
              {/* Categories */}
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 p-3 shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground px-2 pb-2 mb-2 border-b border-border/30">التصنيفات</h3>
                <div className="space-y-1">
                  {sidebarCategories.map((cat, index) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-sm transition-all ${
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg ${cat.color} flex items-center justify-center text-sm shadow-sm`}>
                        {cat.icon}
                      </span>
                      <span className="flex-1 text-start font-medium text-xs">{cat.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        selectedCategory === cat.id ? "bg-white/20" : "bg-secondary"
                      }`}>
                        {cat.count}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 p-3 shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground px-2 pb-2 mb-2 border-b border-border/30">إحصائيات</h3>
                <div className="grid grid-cols-2 gap-2">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-success/10 rounded-xl p-2.5 text-center border border-success/20"
                  >
                    <p className="text-lg font-bold text-success">{activeServices}</p>
                    <p className="text-[10px] text-muted-foreground">نشط</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-warning/10 rounded-xl p-2.5 text-center border border-warning/20"
                  >
                    <p className="text-lg font-bold text-warning">{inactiveServices}</p>
                    <p className="text-[10px] text-muted-foreground">متوقف</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-primary/10 rounded-xl p-2.5 text-center border border-primary/20"
                  >
                    <p className="text-lg font-bold text-primary">{totalOrders}</p>
                    <p className="text-[10px] text-muted-foreground">طلب</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-accent/10 rounded-xl p-2.5 text-center border border-accent/20"
                  >
                    <p className="text-lg font-bold text-accent">${totalRevenue.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">إيراد</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <ServicesHeader
              onAddNew={openNewDialog}
              onBulkDelete={() => setIsBulkDeleteOpen(true)}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              servicesCount={totalServices}
            />

            {/* Mobile Stats */}
            <div className="lg:hidden">
              <ServicesStatsGrid
                totalServices={totalServices}
                activeServices={activeServices}
                inactiveServices={inactiveServices}
                totalRevenue={totalRevenue}
                totalOrders={totalOrders}
                avgPrice={avgPrice}
              />
            </div>

            {/* Filters */}
            <EnhancedServiceFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              viewMode={viewMode}
              setViewMode={setViewMode}
              statusOptions={statusOptions}
              totalCount={totalServices}
              filteredCount={filteredServices.length}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              maxPrice={maxPrice}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            {/* Services Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">جاري تحميل الخدمات...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <EmptyServicesState
                hasFilters={hasActiveFilters}
                onAddNew={openNewDialog}
                onClearFilters={clearAllFilters}
              />
            ) : viewMode === "list" ? (
              <motion.div 
                className="flex flex-col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredServices.map((service, index) => (
                    <EnhancedServiceCard
                      key={service.id}
                      service={service}
                      index={index}
                      viewMode={viewMode}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onView={openDetailsDialog}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredServices.map((service, index) => (
                    <EnhancedServiceCard
                      key={service.id}
                      service={service}
                      index={index}
                      viewMode={viewMode}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onView={openDetailsDialog}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </main>
        </div>

        {/* Dialogs */}
        <ServiceFormDialog
          isOpen={isFormDialogOpen}
          onClose={() => setIsFormDialogOpen(false)}
          editingService={editingService}
          onSubmit={handleSubmit}
          statusOptions={statusOptions}
        />

        <ServiceDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          service={viewingService}
        />

        {/* Bulk Delete Dialog */}
        <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
          <AlertDialogContent className="max-w-md" dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                حذف الخدمات بشكل جماعي
              </AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الخدمات المحددة نهائياً.
                <br />
                <span className="text-destructive font-medium">
                  ملاحظة: الخدمات المرتبطة بطلبات لن يتم حذفها.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اختر نطاق الحذف</label>
                <Select value={bulkDeleteCategory} onValueChange={setBulkDeleteCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الخدمات ({services.length})</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat} ({services.filter(s => s.category === cat).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">سيتم حذف</p>
                <p className="text-3xl font-bold text-destructive">{getDeleteCount()}</p>
                <p className="text-sm text-muted-foreground mt-1">خدمة</p>
              </div>
            </div>

            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={deleting || getDeleteCount() === 0}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف {getDeleteCount()} خدمة
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminServices;
