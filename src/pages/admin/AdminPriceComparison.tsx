import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Scale, 
  Search, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Package,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  name_ar: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  external_service_id: string | null;
  provider_id: string | null;
  provider?: Provider;
  category: string;
}

interface GroupedService {
  externalId: string;
  name: string;
  category: string;
  services: Service[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  priceDiff: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminPriceComparison = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [groupedServices, setGroupedServices] = useState<GroupedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch providers
    const { data: providersData } = await supabase
      .from('api_providers')
      .select('id, name, name_ar')
      .eq('is_active', true);

    if (providersData) {
      setProviders(providersData);
    }

    // Fetch services with provider info
    const { data: servicesData } = await supabase
      .from('services')
      .select(`
        id,
        name,
        price,
        external_service_id,
        provider_id,
        category,
        api_providers (
          id,
          name,
          name_ar
        )
      `)
      .eq('status', 'active')
      .not('external_service_id', 'is', null);

    if (servicesData) {
      const formattedServices = servicesData.map(s => ({
        ...s,
        provider: s.api_providers as Provider | undefined
      }));
      setServices(formattedServices);

      // Get unique categories
      const uniqueCategories = [...new Set(formattedServices.map(s => s.category))];
      setCategories(uniqueCategories);

      // Group services by external_service_id
      groupServices(formattedServices);
    }

    setLoading(false);
  };

  const groupServices = (servicesData: Service[]) => {
    const grouped = new Map<string, GroupedService>();

    servicesData.forEach(service => {
      if (!service.external_service_id) return;

      const key = service.external_service_id;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          externalId: key,
          name: service.name,
          category: service.category,
          services: [],
          minPrice: service.price,
          maxPrice: service.price,
          avgPrice: 0,
          priceDiff: 0
        });
      }

      const group = grouped.get(key)!;
      group.services.push(service);
      group.minPrice = Math.min(group.minPrice, service.price);
      group.maxPrice = Math.max(group.maxPrice, service.price);
    });

    // Calculate averages and differences
    grouped.forEach(group => {
      const totalPrice = group.services.reduce((sum, s) => sum + s.price, 0);
      group.avgPrice = totalPrice / group.services.length;
      group.priceDiff = ((group.maxPrice - group.minPrice) / group.minPrice) * 100;
    });

    // Filter to only show services with multiple providers
    const multiProviderGroups = Array.from(grouped.values())
      .filter(g => g.services.length > 1)
      .sort((a, b) => b.priceDiff - a.priceDiff);

    setGroupedServices(multiProviderGroups);
  };

  const filteredGroups = groupedServices.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.externalId.includes(searchQuery);
    const matchesCategory = categoryFilter === "all" || group.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalComparisons: groupedServices.length,
    avgPriceDiff: groupedServices.length > 0 
      ? groupedServices.reduce((sum, g) => sum + g.priceDiff, 0) / groupedServices.length 
      : 0,
    maxPriceDiff: groupedServices.length > 0 
      ? Math.max(...groupedServices.map(g => g.priceDiff)) 
      : 0,
    providersCompared: providers.length
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
              <Scale className="w-8 h-8 text-primary" />
              مقارنة أسعار المزودين
            </h1>
            <p className="text-muted-foreground">مقارنة أسعار نفس الخدمة بين المزودين المختلفين</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            <Link to="/admin/providers">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                العودة للمزودين
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-cyan-400 p-2.5 shadow-lg">
                  <Scale className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalComparisons}</p>
                  <p className="text-xs text-muted-foreground">خدمة للمقارنة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning to-orange-400 p-2.5 shadow-lg">
                  <TrendingUp className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgPriceDiff.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">متوسط فرق السعر</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-destructive to-red-400 p-2.5 shadow-lg">
                  <TrendingDown className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.maxPriceDiff.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">أقصى فرق سعر</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-success to-emerald-400 p-2.5 shadow-lg">
                  <Package className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.providersCompared}</p>
                  <p className="text-xs text-muted-foreground">مزود للمقارنة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث بالاسم أو معرف الخدمة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="جميع التصنيفات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التصنيفات</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparison Cards */}
        {filteredGroups.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="card-elevated">
              <CardContent className="p-12 text-center">
                <Scale className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">لا توجد خدمات للمقارنة</h3>
                <p className="text-muted-foreground">
                  {searchQuery || categoryFilter !== "all" 
                    ? "جرب تغيير معايير البحث" 
                    : "يجب أن تكون نفس الخدمة متوفرة من أكثر من مزود للمقارنة"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group, index) => (
              <motion.div key={group.externalId} variants={itemVariants}>
                <Card className="card-elevated overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ID: {group.externalId} • {group.category}
                        </p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "text-sm",
                          group.priceDiff > 20 ? "bg-destructive/10 text-destructive" :
                          group.priceDiff > 10 ? "bg-warning/10 text-warning" :
                          "bg-success/10 text-success"
                        )}
                      >
                        فرق {group.priceDiff.toFixed(1)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.services
                        .sort((a, b) => a.price - b.price)
                        .map((service, sIndex) => {
                          const isLowest = service.price === group.minPrice;
                          const isHighest = service.price === group.maxPrice;
                          
                          return (
                            <div
                              key={service.id}
                              className={cn(
                                "p-4 rounded-lg border transition-all",
                                isLowest && "border-success bg-success/5",
                                isHighest && group.services.length > 1 && "border-destructive/50 bg-destructive/5",
                                !isLowest && !isHighest && "border-border bg-secondary/30"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {service.provider?.name_ar || service.provider?.name || 'بدون مزود'}
                                </span>
                                {isLowest && (
                                  <Badge variant="outline" className="bg-success/10 text-success text-xs">
                                    الأقل
                                  </Badge>
                                )}
                                {isHighest && group.services.length > 1 && (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
                                    الأعلى
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold">
                                  {service.price.toFixed(4)} ر.س
                                </span>
                              </div>
                              {!isLowest && group.services.length > 1 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  +{((service.price - group.minPrice) / group.minPrice * 100).toFixed(1)}% من الأقل
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>الأقل: <span className="text-success font-medium">{group.minPrice.toFixed(4)} ر.س</span></span>
                      <span>الأعلى: <span className="text-destructive font-medium">{group.maxPrice.toFixed(4)} ر.س</span></span>
                      <span>المتوسط: <span className="font-medium">{group.avgPrice.toFixed(4)} ر.س</span></span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminPriceComparison;
