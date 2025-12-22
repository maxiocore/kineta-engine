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

  return (
    <AdminDashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-20" dir="rtl">
        {/* Header */}
        <ServicesHeader
          onAddNew={openNewDialog}
          onBulkDelete={() => setIsBulkDeleteOpen(true)}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          servicesCount={totalServices}
        />

        {/* Stats Grid */}
        <ServicesStatsGrid
          totalServices={totalServices}
          activeServices={activeServices}
          inactiveServices={inactiveServices}
          totalRevenue={totalRevenue}
          totalOrders={totalOrders}
          avgPrice={avgPrice}
        />

        {/* Category Tabs */}
        <ServicesCategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCounts={categoryCounts}
          totalCount={totalServices}
        />

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

        {/* Services List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جاري تحميل الخدمات...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <EmptyServicesState
            hasFilters={hasActiveFilters}
            onAddNew={openNewDialog}
            onClearFilters={clearAllFilters}
          />
        ) : (
          <motion.div 
            className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
              : "space-y-3"
            }
            layout
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
