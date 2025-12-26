import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, AlertTriangle, Trash2, Package, Plus, RefreshCw, 
  ArrowUpRight, TrendingUp, Target, BarChart3, Search,
  DollarSign, ShoppingCart, Activity, Zap, Grid3X3, LayoutList,
  Megaphone, LineChart, PieChart, MousePointer, Globe, Mail,
  Share2, Eye, Users, ChevronDown
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
import { AreaChart, Area, ResponsiveContainer, Tooltip, Cell } from "recharts";
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

interface SubcategoryGroup {
  name: string;
  icon: React.ElementType;
  color: string;
  services: Service[];
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

// Digital marketing subcategories
const digitalMarketingSubcategories = [
  { keyword: 'seo', name: 'تحسين محركات البحث (SEO)', icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
  { keyword: 'ads', name: 'الإعلانات المدفوعة', icon: Megaphone, color: 'from-orange-500 to-red-500' },
  { keyword: 'google', name: 'إعلانات جوجل', icon: Globe, color: 'from-blue-600 to-indigo-600' },
  { keyword: 'analytics', name: 'التحليلات والتقارير', icon: BarChart3, color: 'from-violet-500 to-purple-500' },
  { keyword: 'content', name: 'تسويق المحتوى', icon: Share2, color: 'from-pink-500 to-rose-500' },
  { keyword: 'email', name: 'التسويق عبر البريد', icon: Mail, color: 'from-emerald-500 to-teal-500' },
  { keyword: 'conversion', name: 'تحسين التحويل', icon: Target, color: 'from-amber-500 to-orange-500' },
  { keyword: 'campaign', name: 'إدارة الحملات', icon: LineChart, color: 'from-indigo-500 to-blue-500' },
];

const AdminDigitalMarketing = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // View states
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);

  // Bulk delete
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleteSelectedOpen, setIsDeleteSelectedOpen] = useState(false);

  // Stats from orders
  const [orderStats, setOrderStats] = useState<{ serviceId: string; count: number; revenue: number }[]>([]);

  useEffect(() => {
    fetchServices();
    fetchOrderStats();

    const channel = supabase
      .channel('digital-services-changes')
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
      .or('category.ilike.%marketing%,category.ilike.%تسويق%,category.ilike.%digital%,category.ilike.%رقمي%,name.ilike.%seo%,name.ilike.%إعلان%,name.ilike.%حملة%,name.ilike.%تسويق%,name.ilike.%ads%,name.ilike.%google%,name.ilike.%analytics%')
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب خدمات التسويق الرقمي");
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

  // Filter services
  const filteredServices = useMemo(() => {
    return enrichedServices.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || service.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrichedServices, searchQuery, statusFilter]);

  // Group services by subcategory
  const subcategoryGroups = useMemo(() => {
    const groups: Record<string, SubcategoryGroup> = {};
    
    filteredServices.forEach(service => {
      const nameLower = service.name.toLowerCase();
      const catLower = service.category.toLowerCase();
      const combined = nameLower + ' ' + catLower;
      
      let matched = false;
      for (const subcat of digitalMarketingSubcategories) {
        if (combined.includes(subcat.keyword) || 
            service.category.includes(subcat.name) ||
            service.name.includes(subcat.name)) {
          if (!groups[subcat.name]) {
            groups[subcat.name] = {
              name: subcat.name,
              icon: subcat.icon,
              color: subcat.color,
              services: []
            };
          }
          groups[subcat.name].services.push(service);
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        const otherKey = 'خدمات تسويقية أخرى';
        if (!groups[otherKey]) {
          groups[otherKey] = {
            name: otherKey,
            icon: BarChart3,
            color: 'from-gray-500 to-slate-500',
            services: []
          };
        }
        groups[otherKey].services.push(service);
      }
    });
    
    return groups;
  }, [filteredServices]);

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

  // Chart data
  const chartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push({
        day: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
        value: Math.floor(Math.random() * 100) + 20
      });
    }
    return last7Days;
  }, []);

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
    
    const serviceIds = services.map(s => s.id);
    const { error } = await supabase
      .from("services")
      .delete()
      .in("id", serviceIds);

    if (error) {
      toast.error("خطأ في حذف الخدمات. قد تكون بعضها مرتبطة بطلبات.");
    } else {
      toast.success(`تم حذف ${services.length} خدمة بنجاح`);
      fetchServices();
    }
    
    setDeleting(false);
    setIsBulkDeleteOpen(false);
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
    setIsDeleteSelectedOpen(false);
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

  const selectAllInSubcategory = (services: Service[]) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      services.forEach(s => next.add(s.id));
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
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                خدمات التسويق الرقمي
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                إدارة خدمات SEO والإعلانات والتحليلات
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
                onClick={() => setIsDeleteSelectedOpen(true)}
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
              {isSelectionMode ? "إلغاء التحديد" : "تحديد متعدد"}
            </Button>
            
            <Button 
              onClick={openNewDialog}
              className="gap-2 bg-gradient-to-l from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4" />
              إضافة خدمة
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'إجمالي الخدمات', 
              value: totalServices, 
              icon: Package, 
              color: 'from-blue-500 to-cyan-500',
              bgColor: 'bg-blue-500/10'
            },
            { 
              label: 'الخدمات النشطة', 
              value: activeServices, 
              icon: Activity, 
              color: 'from-emerald-500 to-green-500',
              bgColor: 'bg-emerald-500/10'
            },
            { 
              label: 'إجمالي الطلبات', 
              value: totalOrders, 
              icon: ShoppingCart, 
              color: 'from-violet-500 to-purple-500',
              bgColor: 'bg-violet-500/10'
            },
            { 
              label: 'إجمالي الإيرادات', 
              value: `$${totalRevenue.toFixed(2)}`, 
              icon: DollarSign, 
              color: 'from-amber-500 to-orange-500',
              bgColor: 'bg-amber-500/10'
            },
          ].map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{ color: stat.color.includes('blue') ? '#3B82F6' : stat.color.includes('emerald') ? '#10B981' : stat.color.includes('violet') ? '#8B5CF6' : '#F59E0B' }} />
                  </div>
                </div>
                <div className="mt-3 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stat.color.includes('blue') ? '#3B82F6' : stat.color.includes('emerald') ? '#10B981' : stat.color.includes('violet') ? '#8B5CF6' : '#F59E0B'} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={stat.color.includes('blue') ? '#3B82F6' : stat.color.includes('emerald') ? '#10B981' : stat.color.includes('violet') ? '#8B5CF6' : '#F59E0B'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={stat.color.includes('blue') ? '#3B82F6' : stat.color.includes('emerald') ? '#10B981' : stat.color.includes('violet') ? '#8B5CF6' : '#F59E0B'}
                        fill={`url(#gradient-${index})`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث في خدمات التسويق..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-secondary/50"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] bg-secondary/50">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                      <SelectItem value="archived">مؤرشف</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex border border-border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="rounded-none"
                    >
                      <LayoutList className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Services by Subcategory */}
        {Object.keys(subcategoryGroups).length === 0 ? (
          <EmptyServicesState 
            hasFilters={!!searchQuery || statusFilter !== 'all'} 
            onAddNew={openNewDialog}
            onClearFilters={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          />
        ) : (
          <motion.div variants={itemVariants} className="space-y-4">
            {Object.entries(subcategoryGroups).map(([subcatName, group]) => {
              const isExpanded = expandedSubcategories.has(subcatName);
              const Icon = group.icon;
              
              return (
                <Card key={subcatName} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                  {/* Subcategory Header */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => toggleSubcategory(subcatName)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{subcatName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.services.length} خدمة
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isSelectionMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllInSubcategory(group.services);
                          }}
                          className="text-xs"
                        >
                          تحديد الكل
                        </Button>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {group.services.filter(s => s.status === 'active').length} نشط
                      </Badge>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Services Grid */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className={`p-4 pt-0 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}`}>
                          {group.services.map((service, index) => (
                            <EnhancedServiceCard
                              key={service.id}
                              service={service}
                              index={index}
                              onEdit={() => openEditDialog(service)}
                              onDelete={() => handleDelete(service.id)}
                              onView={() => openDetailsDialog(service)}
                              isSelected={selectedServiceIds.has(service.id)}
                              isSelectionMode={isSelectionMode}
                              onToggleSelect={toggleServiceSelection}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Dialogs */}
      <ServiceFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSubmit={handleSubmit}
        editingService={editingService}
        statusOptions={[
          { value: 'active', label: 'نشط' },
          { value: 'inactive', label: 'غير نشط' },
          { value: 'archived', label: 'مؤرشف' },
        ]}
      />

      <ServiceDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        service={viewingService}
      />

      {/* Delete Selected Dialog */}
      <AlertDialog open={isDeleteSelectedOpen} onOpenChange={setIsDeleteSelectedOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              حذف الخدمات المحددة
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedServiceIds.size} خدمة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              حذف جميع خدمات التسويق الرقمي
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف جميع خدمات التسويق الرقمي ({services.length} خدمة)؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف الكل"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminDashboardLayout>
  );
};

export default AdminDigitalMarketing;
