import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Loader2, Sparkles, RefreshCw, Download, DollarSign, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
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
import ServiceStats from "@/components/admin/services/ServiceStats";
import ServiceFilters from "@/components/admin/services/ServiceFilters";
import ServiceCard from "@/components/admin/services/ServiceCard";
import ServiceFormDialog from "@/components/admin/services/ServiceFormDialog";
import ServiceDetailsDialog from "@/components/admin/services/ServiceDetailsDialog";
import SocialNetworkGrid from "@/components/services/SocialNetworkGrid";
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

const categories = ["التصميم", "التسويق", "الإعلانات", "التطوير", "الاستشارات"];
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

    // Real-time subscription
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

  // Filter services
  const filteredServices = useMemo(() => {
    return enrichedServices.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const categorySlug = getCategorySlug(service.category);
      const matchesCategory = selectedCategory === "all" || categorySlug === selectedCategory || service.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || service.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [enrichedServices, searchQuery, selectedCategory, selectedStatus]);

  // Category counts for SocialNetworkGrid
  const socialNetworkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      const slug = getCategorySlug(service.category);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Category counts for ServiceFilters
  const serviceCounts = useMemo(() => {
    return categories.map(cat => ({
      category: cat,
      count: services.filter(s => s.category === cat).length,
    }));
  }, [services]);

  // Stats calculations
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === "active").length;
  const totalRevenue = orderStats.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrders = orderStats.reduce((sum, s) => sum + s.count, 0);

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
      // Delete all - need to use a condition that's always true
      query = query.neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { error, count } = await query.select();

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

  // Get unique categories from services
  const uniqueCategories = useMemo(() => {
    return [...new Set(services.map(s => s.category))];
  }, [services]);

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 p-2.5">
                <Package className="w-full h-full text-primary-foreground" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">إدارة الخدمات</h1>
            </motion.div>
            <p className="text-muted-foreground">إضافة وتعديل وإدارة الخدمات المقدمة</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/admin/services/import">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                استيراد
              </Button>
            </Link>
            <Link to="/admin/services/prices">
              <Button variant="outline" className="gap-2">
                <DollarSign className="w-4 h-4" />
                الأسعار
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={services.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              حذف جماعي
            </Button>
            <Button 
              onClick={openNewDialog} 
              className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة خدمة
            </Button>
          </div>
        </div>

        {/* Stats */}
        <ServiceStats
          totalServices={totalServices}
          activeServices={activeServices}
          totalRevenue={totalRevenue}
          totalOrders={totalOrders}
        />

        {/* Social Network Grid */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <SocialNetworkGrid
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              serviceCounts={socialNetworkCounts}
            />
          </CardContent>
        </Card>

        {/* Filters */}
        <ServiceFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          viewMode={viewMode}
          setViewMode={setViewMode}
          categories={categories}
          statusOptions={statusOptions}
          serviceCounts={serviceCounts}
        />

        {/* Services List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="py-16 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                </motion.div>
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                    ? "لا توجد نتائج مطابقة للبحث"
                    : "لا توجد خدمات. ابدأ بإضافة خدمة جديدة."}
                </p>
                {!searchQuery && selectedCategory === "all" && selectedStatus === "all" && (
                  <Button onClick={openNewDialog} className="mt-4" variant="outline">
                    <Plus className="w-4 h-4 ms-2" />
                    إضافة أول خدمة
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className={viewMode === "grid" 
              ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-3"
            }>
              {filteredServices.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={index}
                  viewMode={viewMode}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
                  onView={openDetailsDialog}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Dialogs */}
        <ServiceFormDialog
          isOpen={isFormDialogOpen}
          onClose={() => setIsFormDialogOpen(false)}
          editingService={editingService}
          onSubmit={handleSubmit}
          categories={categories}
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
              
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">سيتم حذف</p>
                <p className="text-2xl font-bold text-destructive">{getDeleteCount()}</p>
                <p className="text-sm text-muted-foreground">خدمة</p>
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
