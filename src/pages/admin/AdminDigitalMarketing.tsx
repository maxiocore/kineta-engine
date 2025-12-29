import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Trash2, Plus, RefreshCw, 
  BarChart3, Search, Grid3X3, LayoutList,
  ChevronDown, ChevronUp, Settings2, Filter,
  Sparkles, Package, Eye, Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import ServiceFormDialog from "@/components/admin/services/ServiceFormDialog";
import ServiceDetailsDialog from "@/components/admin/services/ServiceDetailsDialog";
import { 
  digitalMarketingCategories, 
  DigitalCategoriesTabs,
  categorizeService,
  getCategoryById
} from "@/components/digital-marketing/DigitalMarketingCategories";
import { DigitalMarketingStats } from "@/components/digital-marketing/DigitalMarketingStats";
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
  digitalCategory?: string;
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
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  }
};

const AdminDigitalMarketing = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // View states
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);

  // Selection & Delete
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Stats from orders
  const [orderStats, setOrderStats] = useState<{ serviceId: string; count: number; revenue: number }[]>([]);

  useEffect(() => {
    fetchServices();
    fetchOrderStats();

    const channel = supabase
      .channel('digital-services-admin')
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
      .or('category.ilike.%marketing%,category.ilike.%تسويق%,category.ilike.%digital%,category.ilike.%رقمي%,name.ilike.%seo%,name.ilike.%إعلان%,name.ilike.%حملة%,name.ilike.%تسويق%,name.ilike.%ads%,name.ilike.%google%,name.ilike.%analytics%,name.ilike.%بريد%,name.ilike.%email%,name.ilike.%محتوى%,name.ilike.%content%')
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب خدمات التسويق الرقمي");
    } else {
      const enrichedData = (data as Service[]).map(service => ({
        ...service,
        digitalCategory: categorizeService(service.name, service.category, service.description)
      }));
      setServices(enrichedData);
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

  // Filter services
  const filteredServices = useMemo(() => {
    return enrichedServices.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || service.status === statusFilter;
      const matchesCategory = selectedCategory === "all" || service.digitalCategory === selectedCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [enrichedServices, searchQuery, statusFilter, selectedCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    enrichedServices.forEach(service => {
      const cat = service.digitalCategory || "other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [enrichedServices]);

  // Group by category for expanded view
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      const cat = service.digitalCategory || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(service);
    });
    return groups;
  }, [filteredServices]);

  // Toggle category expansion
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // Stats
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
      category: formData.category || 'تسويق رقمي',
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
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast.error("خطأ في حذف الخدمة. قد تكون مرتبطة بطلبات.");
    } else {
      toast.success("تم حذف الخدمة بنجاح");
      fetchServices();
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedServiceIds.size === 0) return;
    
    setDeleting(true);
    const idsArray = Array.from(selectedServiceIds);
    
    const { error } = await supabase
      .from("services")
      .delete()
      .in("id", idsArray);

    if (error) {
      toast.error("خطأ في حذف الخدمات المحددة");
    } else {
      toast.success(`تم حذف ${idsArray.length} خدمة بنجاح`);
      setSelectedServiceIds(new Set());
      setIsSelectionMode(false);
      fetchServices();
    }
    
    setDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  const toggleServiceSelection = (id: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 p-4 md:p-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                خدمات التسويق الرقمي
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                إدارة خدمات SEO والإعلانات والتحليلات والمزيد
              </p>
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
            
            {isSelectionMode && selectedServiceIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                حذف ({selectedServiceIds.size})
              </Button>
            )}
            
            <Button
              variant={isSelectionMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedServiceIds(new Set());
              }}
              className="gap-2"
            >
              <Settings2 className="w-4 h-4" />
              {isSelectionMode ? "إلغاء التحديد" : "تحديد متعدد"}
            </Button>
            
            <Button onClick={openNewDialog} className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
              <Plus className="w-4 h-4" />
              إضافة خدمة
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants}>
          <DigitalMarketingStats 
            stats={{
              totalServices,
              activeServices,
              totalRevenue,
              totalOrders
            }}
            variant="admin"
          />
        </motion.div>

        {/* Categories */}
        <motion.div variants={itemVariants}>
          <DigitalCategoriesTabs
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </motion.div>

        {/* Filters & Search */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الخدمات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-card border-border/50"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border/50">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
              <SelectItem value="archived">مؤرشف</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-card rounded-lg border border-border/50 p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Services by Category */}
        <motion.div variants={itemVariants} className="space-y-4">
          {Object.entries(groupedServices).length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                <Package className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">لا توجد خدمات</h3>
              <p className="text-muted-foreground mb-4">لم يتم العثور على خدمات تطابق معايير البحث</p>
              <Button onClick={openNewDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة خدمة جديدة
              </Button>
            </Card>
          ) : (
            Object.entries(groupedServices).map(([catId, catServices]) => {
              const category = getCategoryById(catId) || digitalMarketingCategories.find(c => c.id === "all");
              const isExpanded = expandedCategories.has(catId);
              const displayServices = isExpanded ? catServices : catServices.slice(0, viewMode === "grid" ? 4 : 3);
              
              return (
                <Card key={catId} className="overflow-hidden border-border/50">
                  <CardHeader 
                    className="cursor-pointer hover:bg-accent/50 transition-colors pb-3"
                    onClick={() => toggleCategory(catId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {category && (
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                            <category.icon className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{category?.name || catId}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {catServices.length} خدمة
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {catServices.filter(s => s.status === "active").length} نشطة
                        </Badge>
                        {catServices.length > (viewMode === "grid" ? 4 : 3) && (
                          isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isExpanded ? "expanded" : "collapsed"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={viewMode === "grid" 
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                          : "space-y-3"
                        }
                      >
                        {displayServices.map((service, index) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            index={index}
                            viewMode={viewMode}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedServiceIds.has(service.id)}
                            onToggleSelection={() => toggleServiceSelection(service.id)}
                            onView={() => openDetailsDialog(service)}
                            onEdit={() => openEditDialog(service)}
                            onDelete={() => handleDelete(service.id)}
                          />
                        ))}
                      </motion.div>
                    </AnimatePresence>
                    
                    {catServices.length > displayServices.length && !isExpanded && (
                      <Button
                        variant="ghost"
                        className="w-full mt-3 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleCategory(catId)}
                      >
                        عرض المزيد ({catServices.length - displayServices.length})
                        <ChevronDown className="w-4 h-4 mr-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </motion.div>

        {/* Dialogs */}
        <ServiceFormDialog
          isOpen={isFormDialogOpen}
          onClose={() => setIsFormDialogOpen(false)}
          onSubmit={handleSubmit}
          editingService={editingService}
          statusOptions={[
            { value: "active", label: "نشط" },
            { value: "inactive", label: "غير نشط" },
            { value: "archived", label: "مؤرشف" }
          ]}
        />

        <ServiceDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          service={viewingService}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف {selectedServiceIds.size} خدمة؟ هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AdminDashboardLayout>
  );
};

// Service Card Component
interface ServiceCardProps {
  service: Service;
  index: number;
  viewMode: "grid" | "list";
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ServiceCard = ({
  service,
  index,
  viewMode,
  isSelectionMode,
  isSelected,
  onToggleSelection,
  onView,
  onEdit,
  onDelete
}: ServiceCardProps) => {
  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    inactive: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  const statusLabels: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    archived: "مؤرشف",
  };

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`group flex items-center gap-4 p-3 rounded-xl border transition-all ${
          isSelected 
            ? "border-primary bg-primary/5" 
            : "border-border/50 hover:border-primary/30 hover:bg-accent/50"
        }`}
      >
        {isSelectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm truncate">{service.name}</h4>
            <Badge className={`${statusColors[service.status]} text-[10px]`}>
              {statusLabels[service.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{service.price.toFixed(0)} ر.س</span>
            <span>•</span>
            <span>{service.orderCount || 0} طلب</span>
            <span>•</span>
            <span>{(service.revenue || 0).toFixed(0)} ر.س إيرادات</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onView} className="h-8 w-8 p-0">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative rounded-xl border overflow-hidden transition-all ${
        isSelected 
          ? "border-primary ring-2 ring-primary/20" 
          : "border-border/50 hover:border-primary/30 hover:shadow-lg"
      }`}
    >
      {isSelectionMode && (
        <div className="absolute top-3 right-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Badge className={`${statusColors[service.status]} text-[10px]`}>
            {statusLabels[service.status]}
          </Badge>
          <span className="text-lg font-bold text-primary">{service.price.toFixed(0)} ر.س</span>
        </div>

        <h4 className="font-semibold text-sm mb-2 line-clamp-2">{service.name}</h4>
        
        {service.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{service.orderCount || 0} طلب</span>
          <span className="text-emerald-500 font-medium">{(service.revenue || 0).toFixed(0)} ر.س</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1 h-8 text-xs">
            <Eye className="w-3.5 h-3.5 ml-1" />
            عرض
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:border-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDigitalMarketing;
