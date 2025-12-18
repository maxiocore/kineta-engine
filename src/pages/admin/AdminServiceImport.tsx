import React, { useState, useEffect, useMemo } from 'react';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Search, 
  Download, 
  CheckCircle2, 
  Package,
  Filter,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface BulkFollowsService {
  service: string;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
}

const AdminServiceImport = () => {
  const [services, setServices] = useState<BulkFollowsService[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulkfollows-services');
      
      if (error) throw error;
      
      if (data?.services && Array.isArray(data.services)) {
        setServices(data.services);
        toast.success(`تم جلب ${data.services.length} خدمة`);
      } else {
        toast.error('فشل في جلب الخدمات');
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('حدث خطأ أثناء جلب الخدمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category));
    return Array.from(cats).sort();
  }, [services]);

  const groupedServices = useMemo(() => {
    const filtered = services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const grouped: Record<string, BulkFollowsService[]> = {};
    filtered.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });
    return grouped;
  }, [services, searchQuery, selectedCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const selectAllInCategory = (category: string) => {
    const categoryServices = groupedServices[category] || [];
    const allSelected = categoryServices.every(s => selectedServices.has(s.service));
    
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      categoryServices.forEach(s => {
        if (allSelected) {
          newSet.delete(s.service);
        } else {
          newSet.add(s.service);
        }
      });
      return newSet;
    });
  };

  const importSelectedServices = async () => {
    if (selectedServices.size === 0) {
      toast.error('اختر خدمة واحدة على الأقل');
      return;
    }

    setImporting(true);
    try {
      const servicesToImport = services.filter(s => selectedServices.has(s.service));
      
      for (const service of servicesToImport) {
        const { error } = await supabase.from('services').insert({
          name: service.name,
          description: `النوع: ${service.type} | الحد الأدنى: ${service.min} | الحد الأقصى: ${service.max}`,
          price: parseFloat(service.rate) || 0,
          category: service.category,
          status: 'active',
          external_service_id: service.service,
          features: [
            service.dripfeed ? 'دعم التنقيط' : null,
            service.refill ? 'إعادة التعبئة' : null,
            service.cancel ? 'قابل للإلغاء' : null,
          ].filter(Boolean),
        });

        if (error) {
          console.error('Error importing service:', service.name, error);
        }
      }

      toast.success(`تم استيراد ${selectedServices.size} خدمة بنجاح`);
      setSelectedServices(new Set());
    } catch (error: any) {
      console.error('Error importing services:', error);
      toast.error('حدث خطأ أثناء الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/services">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">استيراد الخدمات</h1>
              <p className="text-muted-foreground">اختر الخدمات من BulkFollows لإضافتها لموقعك</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchServices} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button 
              onClick={importSelectedServices} 
              disabled={importing || selectedServices.size === 0}
              className="bg-primary"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 ml-2" />
              )}
              استيراد ({selectedServices.size})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الخدمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{services.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الخدمات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Filter className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground">الأقسام</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{selectedServices.size}</p>
              <p className="text-sm text-muted-foreground">محدد</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Download className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{Object.keys(groupedServices).length}</p>
              <p className="text-sm text-muted-foreground">أقسام معروضة</p>
            </CardContent>
          </Card>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-3">جاري جلب الخدمات...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={categoryServices.every(s => selectedServices.has(s.service))}
                            onCheckedChange={() => selectAllInCategory(category)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <CardTitle className="text-lg">{category}</CardTitle>
                          <Badge variant="secondary">{categoryServices.length}</Badge>
                        </div>
                        {expandedCategories.has(category) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {expandedCategories.has(category) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CardContent className="pt-0">
                            <div className="divide-y">
                              {categoryServices.map((service) => (
                                <div 
                                  key={service.service}
                                  className={`py-3 px-2 flex items-start gap-3 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer ${
                                    selectedServices.has(service.service) ? 'bg-primary/5' : ''
                                  }`}
                                  onClick={() => toggleService(service.service)}
                                >
                                  <Checkbox
                                    checked={selectedServices.has(service.service)}
                                    onCheckedChange={() => toggleService(service.service)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{service.name}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        ${service.rate}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {service.min} - {service.max}
                                      </Badge>
                                      {service.refill && (
                                        <Badge className="text-xs bg-green-500/10 text-green-500">
                                          تعبئة
                                        </Badge>
                                      )}
                                      {service.dripfeed && (
                                        <Badge className="text-xs bg-blue-500/10 text-blue-500">
                                          تنقيط
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminServiceImport;
