import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  RefreshCw, Search, Download, CheckCircle2, Package, Loader2,
  ArrowLeft, ChevronDown, ChevronUp, Percent, TrendingUp,
  Languages, Globe, Server, AlertCircle, Layers, Eye, 
  DollarSign, Clock, Zap, Shield, RotateCcw, Filter,
  Star, Info, Hash, ArrowUpDown, X, Check, Database,
  Sparkles, Target, Gauge
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProviderService {
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
  desc?: string;
  description?: string;
  formatted_description?: string;
  parsed?: {
    type: string;
    min: number;
    max: number;
    rate: number;
    refill: boolean;
    cancel: boolean;
    dripfeed: boolean;
    average_time?: string;
    quality?: string;
    speed?: string;
    desc: string;
  };
}

interface ApiProvider {
  id: string;
  name: string;
  name_ar: string;
  api_url: string;
  is_active: boolean;
  profit_margin: number;
  services_count: number;
}

interface ProviderCategory {
  name: string;
  count: number;
}

const AdminServiceImport = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedProvider = searchParams.get('provider');
  
  // Step: 1 = provider, 2 = categories, 3 = services
  const [step, setStep] = useState(1);
  
  const [selectedProvider, setSelectedProvider] = useState<string>(preselectedProvider || '');
  const [providerCategories, setProviderCategories] = useState<ProviderCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [services, setServices] = useState<ProviderService[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // New filters
  const [filterRefill, setFilterRefill] = useState<'all' | 'yes' | 'no'>('all');
  const [filterDripfeed, setFilterDripfeed] = useState<'all' | 'yes' | 'no'>('all');
  const [filterCancel, setFilterCancel] = useState<'all' | 'yes' | 'no'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minQuantity, setMinQuantity] = useState<number>(0);
  const [maxQuantity, setMaxQuantity] = useState<number>(10000000);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'min' | 'max'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Service details sheet
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<ProviderService | null>(null);
  
  // Category search
  const [categorySearch, setCategorySearch] = useState('');

  // Fetch providers
  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['api-providers-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_providers')
        .select('id, name, name_ar, api_url, is_active, profit_margin, services_count')
        .eq('is_active', true)
        .order('name_ar');
      if (error) throw error;
      return data as ApiProvider[];
    },
  });

  const currentProvider = providers.find(p => p.id === selectedProvider);

  // Step 1: Fetch categories only (lightweight)
  const fetchCategories = async () => {
    if (!selectedProvider) {
      toast.error('اختر مزود أولاً');
      return;
    }

    setLoadingCategories(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-services', {
        body: { provider_id: selectedProvider, categories_only: true }
      });
      
      if (error) throw error;
      
      if (data?.categories) {
        setProviderCategories(data.categories);
        setProfitMargin(currentProvider?.profit_margin || 30);
        setStep(2);
        toast.success(`تم جلب ${data.categories.length} فئة`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('خطأ في جلب الفئات');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Step 2: Fetch services for selected categories
  const fetchServices = async () => {
    if (selectedCategories.size === 0) {
      toast.error('اختر فئة واحدة على الأقل');
      return;
    }

    setLoadingServices(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-services', {
        body: { 
          provider_id: selectedProvider, 
          selected_categories: Array.from(selectedCategories)
        }
      });
      
      if (error) throw error;
      
      if (data?.services) {
        setServices(data.services);
        setExpandedCategories(new Set(selectedCategories));
        // Set price range based on actual data
        const prices = data.services.map((s: ProviderService) => parseFloat(s.rate) || 0);
        if (prices.length > 0) {
          setPriceRange([0, Math.max(...prices) * 1.5]);
        }
        setStep(3);
        toast.success(`تم تحميل ${data.services.length} خدمة`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('خطأ في جلب الخدمات');
    } finally {
      setLoadingServices(false);
    }
  };

  // Filtered and sorted services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      // Text search
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !s.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !s.service.includes(searchQuery)) {
        return false;
      }
      
      // Refill filter
      if (filterRefill === 'yes' && !s.refill) return false;
      if (filterRefill === 'no' && s.refill) return false;
      
      // Dripfeed filter
      if (filterDripfeed === 'yes' && !s.dripfeed) return false;
      if (filterDripfeed === 'no' && s.dripfeed) return false;
      
      // Cancel filter
      if (filterCancel === 'yes' && !s.cancel) return false;
      if (filterCancel === 'no' && s.cancel) return false;
      
      // Price range
      const price = parseFloat(s.rate) || 0;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      
      // Quantity filters
      const min = parseInt(s.min) || 0;
      const max = parseInt(s.max) || 0;
      if (min < minQuantity) return false;
      if (maxQuantity > 0 && max > maxQuantity) return false;
      
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = (parseFloat(a.rate) || 0) - (parseFloat(b.rate) || 0);
          break;
        case 'min':
          comparison = (parseInt(a.min) || 0) - (parseInt(b.min) || 0);
          break;
        case 'max':
          comparison = (parseInt(a.max) || 0) - (parseInt(b.max) || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [services, searchQuery, filterRefill, filterDripfeed, filterCancel, priceRange, minQuantity, maxQuantity, sortBy, sortOrder]);

  // Group services by category
  const groupedServices = useMemo(() => {
    const grouped: Record<string, ProviderService[]> = {};
    filteredServices.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });
    return grouped;
  }, [filteredServices]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return providerCategories;
    return providerCategories.filter(c => 
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [providerCategories, categorySearch]);

  const calculatePrice = (rate: string) => {
    const original = parseFloat(rate) || 0;
    return original * (1 + profitMargin / 100);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) newSet.delete(serviceId);
      else newSet.add(serviceId);
      return newSet;
    });
  };

  const toggleAllInCategory = (category: string) => {
    const categoryServices = groupedServices[category] || [];
    const allSelected = categoryServices.every(s => selectedServices.has(s.service));
    
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      categoryServices.forEach(s => {
        if (allSelected) newSet.delete(s.service);
        else newSet.add(s.service);
      });
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    if (selectedServices.size === filteredServices.length && filteredServices.length > 0) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.service)));
    }
  };

  // Import selected services
  const importServices = async () => {
    if (selectedServices.size === 0) {
      toast.error('اختر خدمة واحدة على الأقل');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let skippedCount = 0;
    const toImport = services.filter(s => selectedServices.has(s.service));

    try {
      // Check for existing services
      const { data: existingServices } = await supabase
        .from('services')
        .select('external_service_id')
        .eq('provider_id', selectedProvider)
        .in('external_service_id', toImport.map(s => s.service));
      
      const existingIds = new Set(existingServices?.map(s => s.external_service_id) || []);
      
      for (let i = 0; i < toImport.length; i++) {
        const service = toImport[i];
        
        // Skip if already exists
        if (existingIds.has(service.service)) {
          skippedCount++;
          continue;
        }
        
        let name = service.name;
        let description = service.desc || service.description || '';
        let category = service.category;

        // Translate if enabled
        if (autoTranslate) {
          toast.loading(`ترجمة ${i + 1}/${toImport.length}...`, { id: 'translate' });
          try {
            const { data: translated } = await supabase.functions.invoke('translate-service', {
              body: { name, description, category }
            });
            if (translated && !translated.error) {
              name = translated.name || name;
              description = translated.description || description;
              category = translated.category || category;
            }
          } catch (e) {
            console.warn('Translation failed:', e);
          }
        }

        // Build description
        const fullDescription = service.formatted_description || 
          `${description}\n\n📊 النوع: ${service.type || 'Default'}\n📉 الحد الأدنى: ${parseInt(service.min).toLocaleString()}\n📈 الحد الأقصى: ${parseInt(service.max).toLocaleString()}${service.refill ? '\n🔄 يدعم إعادة التعبئة' : ''}${service.dripfeed ? '\n💧 يدعم التنقيط' : ''}${service.cancel ? '\n❌ قابل للإلغاء' : ''}`;
        
        const { error } = await supabase.from('services').insert({
          name,
          description: fullDescription,
          price: parseFloat(calculatePrice(service.rate).toFixed(4)),
          category,
          status: 'active',
          external_service_id: service.service,
          provider_id: selectedProvider,
          refill_enabled: service.refill || false,
          refill_days: service.refill ? 30 : null,
          features: [
            service.dripfeed ? 'دعم التنقيط' : null,
            service.refill ? 'إعادة التعبئة' : null,
            service.cancel ? 'قابل للإلغاء' : null,
          ].filter(Boolean),
        });

        if (!error) successCount++;
      }

      toast.dismiss('translate');
      
      // Update provider services count
      await supabase
        .from('api_providers')
        .update({ 
          services_count: (currentProvider?.services_count || 0) + successCount,
          last_sync_at: new Date().toISOString()
        })
        .eq('id', selectedProvider);
      
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      let message = `تم استيراد ${successCount} خدمة`;
      if (skippedCount > 0) {
        message += ` (تم تخطي ${skippedCount} خدمة موجودة مسبقاً)`;
      }
      toast.success(message);
      setSelectedServices(new Set());
    } catch (error) {
      console.error('Error:', error);
      toast.dismiss('translate');
      toast.error('خطأ في الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setProviderCategories([]);
    setSelectedCategories(new Set());
    setServices([]);
    setSelectedServices(new Set());
    setSearchQuery('');
    setCategorySearch('');
    setFilterRefill('all');
    setFilterDripfeed('all');
    setFilterCancel('all');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRefill('all');
    setFilterDripfeed('all');
    setFilterCancel('all');
    setPriceRange([0, Math.max(...services.map(s => parseFloat(s.rate) || 0)) * 1.5 || 1000]);
    setMinQuantity(0);
    setMaxQuantity(10000000);
    setSortBy('name');
    setSortOrder('asc');
  };

  // Stats
  const stats = useMemo(() => ({
    total: services.length,
    filtered: filteredServices.length,
    selected: selectedServices.size,
    withRefill: services.filter(s => s.refill).length,
    withDripfeed: services.filter(s => s.dripfeed).length,
    avgPrice: services.length > 0 
      ? (services.reduce((sum, s) => sum + (parseFloat(s.rate) || 0), 0) / services.length).toFixed(4)
      : '0',
  }), [services, filteredServices, selectedServices]);

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/services">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">استيراد الخدمات</h1>
              <p className="text-muted-foreground text-sm">اختر خدمات محددة من المزود مع فلترة متقدمة</p>
            </div>
          </div>
          
          {/* Steps */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
            <motion.div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                step === 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
              animate={{ scale: step === 1 ? 1.05 : 1 }}
            >
              <Server className="h-4 w-4" />
              <span className="text-sm font-medium">المزود</span>
            </motion.div>
            <ChevronDown className="h-4 w-4 rotate-[-90deg] text-muted-foreground" />
            <motion.div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                step === 2 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
              animate={{ scale: step === 2 ? 1.05 : 1 }}
            >
              <Layers className="h-4 w-4" />
              <span className="text-sm font-medium">الفئات</span>
            </motion.div>
            <ChevronDown className="h-4 w-4 rotate-[-90deg] text-muted-foreground" />
            <motion.div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                step === 3 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
              animate={{ scale: step === 3 ? 1.05 : 1 }}
            >
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">الخدمات</span>
            </motion.div>
          </div>
        </div>

        {/* Step 1: Select Provider */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    اختر المزود
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingProviders ? (
                    <div className="flex items-center gap-2 justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>جاري التحميل...</span>
                    </div>
                  ) : providers.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <AlertCircle className="h-12 w-12 text-yellow-500" />
                      <p className="text-muted-foreground">لا يوجد مزودين نشطين</p>
                      <Link to="/admin/providers">
                        <Button variant="outline">
                          <Server className="h-4 w-4 ml-2" />
                          إضافة مزود جديد
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {providers.map(p => (
                        <motion.div
                          key={p.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedProvider(p.id)}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedProvider === p.id
                              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          {selectedProvider === p.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1"
                            >
                              <Check className="h-4 w-4" />
                            </motion.div>
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`p-3 rounded-lg ${
                              selectedProvider === p.id ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                              <Server className={`h-6 w-6 ${
                                selectedProvider === p.id ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{p.name_ar}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.name}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Package className="h-3 w-3 ml-1" />
                                  {p.services_count} خدمة
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Percent className="h-3 w-3 ml-1" />
                                  {p.profit_margin}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {selectedProvider && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button onClick={fetchCategories} disabled={loadingCategories} className="w-full" size="lg">
                        {loadingCategories ? (
                          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5 ml-2" />
                        )}
                        {loadingCategories ? 'جاري جلب الفئات...' : 'متابعة - جلب الفئات'}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Select Categories */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>اختر الفئات</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedCategories.size} من {providerCategories.length} فئة محددة
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={reset}>
                      <RefreshCw className="h-4 w-4 ml-2" />
                      تغيير المزود
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and select all */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث في الفئات..."
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedCategories.size === providerCategories.length && providerCategories.length > 0}
                        onCheckedChange={() => {
                          if (selectedCategories.size === providerCategories.length) {
                            setSelectedCategories(new Set());
                          } else {
                            setSelectedCategories(new Set(providerCategories.map(c => c.name)));
                          }
                        }}
                      />
                      <Label className="text-sm">تحديد الكل</Label>
                    </div>
                  </div>
                  
                  {/* Categories grid */}
                  <ScrollArea className="h-[400px] rounded-lg border p-2">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {filteredCategories.map(cat => (
                        <motion.div
                          key={cat.name}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCategories(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(cat.name)) newSet.delete(cat.name);
                              else newSet.add(cat.name);
                              return newSet;
                            });
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedCategories.has(cat.name)
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              checked={selectedCategories.has(cat.name)}
                              className="shrink-0"
                            />
                            <span className="text-sm truncate flex-1">{cat.name}</span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {cat.count}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Summary */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm">
                      <span className="text-muted-foreground">إجمالي الخدمات المتوقعة: </span>
                      <span className="font-semibold text-primary">
                        {providerCategories
                          .filter(c => selectedCategories.has(c.name))
                          .reduce((s, c) => s + c.count, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <Button 
                      onClick={fetchServices} 
                      disabled={selectedCategories.size === 0 || loadingServices}
                    >
                      {loadingServices ? (
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      ) : (
                        <Package className="h-4 w-4 ml-2" />
                      )}
                      {loadingServices ? 'جاري التحميل...' : 'تحميل الخدمات'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Select & Import Services */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Database className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">إجمالي</p>
                      <p className="font-semibold">{stats.total.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Filter className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">مفلترة</p>
                      <p className="font-semibold">{stats.filtered.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">محددة</p>
                      <p className="font-semibold text-primary">{stats.selected.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <RotateCcw className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ريفيل</p>
                      <p className="font-semibold">{stats.withRefill}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Zap className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">تنقيط</p>
                      <p className="font-semibold">{stats.withDripfeed}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">متوسط السعر</p>
                      <p className="font-semibold">${stats.avgPrice}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Settings & Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Profit Margin */}
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">هامش الربح:</Label>
                      <Input 
                        type="number" 
                        value={profitMargin} 
                        onChange={e => setProfitMargin(Number(e.target.value))}
                        className="w-20 h-8"
                      />
                      <span className="text-sm">%</span>
                    </div>
                    
                    {/* Auto translate */}
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">ترجمة تلقائية</Label>
                      <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
                    </div>
                    
                    <div className="flex-1" />
                    
                    {/* Toggle filters */}
                    <Button 
                      variant={showFilters ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 ml-2" />
                      فلاتر متقدمة
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                      <ArrowLeft className="h-4 w-4 ml-2" />
                      العودة
                    </Button>
                  </div>
                  
                  {/* Advanced Filters */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                          {/* Refill filter */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-2">
                              <RotateCcw className="h-4 w-4" />
                              إعادة التعبئة
                            </Label>
                            <Select value={filterRefill} onValueChange={(v: any) => setFilterRefill(v)}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="yes">يدعم</SelectItem>
                                <SelectItem value="no">لا يدعم</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Dripfeed filter */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              التنقيط
                            </Label>
                            <Select value={filterDripfeed} onValueChange={(v: any) => setFilterDripfeed(v)}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="yes">يدعم</SelectItem>
                                <SelectItem value="no">لا يدعم</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Cancel filter */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-2">
                              <X className="h-4 w-4" />
                              قابل للإلغاء
                            </Label>
                            <Select value={filterCancel} onValueChange={(v: any) => setFilterCancel(v)}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="yes">نعم</SelectItem>
                                <SelectItem value="no">لا</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Sort */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-2">
                              <ArrowUpDown className="h-4 w-4" />
                              الترتيب
                            </Label>
                            <div className="flex gap-2">
                              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                <SelectTrigger className="h-9 flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="name">الاسم</SelectItem>
                                  <SelectItem value="price">السعر</SelectItem>
                                  <SelectItem value="min">الحد الأدنى</SelectItem>
                                  <SelectItem value="max">الحد الأقصى</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-9 w-9 shrink-0"
                                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                              >
                                <ArrowUpDown className={`h-4 w-4 transition-transform ${
                                  sortOrder === 'desc' ? 'rotate-180' : ''
                                }`} />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Clear filters button */}
                          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                              <X className="h-4 w-4 ml-2" />
                              مسح الفلاتر
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>الخدمات</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedServices.size} من {filteredServices.length} محددة
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم أو ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pr-10 w-full sm:w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                      {selectedServices.size === filteredServices.length && filteredServices.length > 0 
                        ? 'إلغاء الكل' 
                        : 'تحديد الكل'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {Object.entries(groupedServices).map(([category, categoryServices]) => (
                        <div key={category} className="border rounded-lg overflow-hidden">
                          <div 
                            className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted"
                            onClick={() => {
                              setExpandedCategories(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(category)) newSet.delete(category);
                                else newSet.add(category);
                                return newSet;
                              });
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={categoryServices.every(s => selectedServices.has(s.service))}
                                onClick={e => e.stopPropagation()}
                                onCheckedChange={() => toggleAllInCategory(category)}
                              />
                              <Layers className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm truncate">{category}</span>
                              <Badge variant="secondary" className="text-xs">
                                {categoryServices.length}
                              </Badge>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedCategories.has(category) ? 180 : 0 }}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </motion.div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedCategories.has(category) && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="divide-y">
                                  {categoryServices.map(service => (
                                    <div 
                                      key={service.service} 
                                      className={`flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors ${
                                        selectedServices.has(service.service) ? 'bg-primary/5' : ''
                                      }`}
                                    >
                                      <Checkbox
                                        checked={selectedServices.has(service.service)}
                                        onCheckedChange={() => toggleService(service.service)}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{service.name}</p>
                                        <div className="flex flex-wrap items-center gap-1 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            <Hash className="h-3 w-3 ml-1" />
                                            {service.service}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            Min: {parseInt(service.min).toLocaleString()}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            Max: {parseInt(service.max).toLocaleString()}
                                          </Badge>
                                          {service.refill && (
                                            <Badge className="text-xs bg-purple-500/20 text-purple-600 border-0">
                                              <RotateCcw className="h-3 w-3 ml-1" />
                                              ريفيل
                                            </Badge>
                                          )}
                                          {service.dripfeed && (
                                            <Badge className="text-xs bg-orange-500/20 text-orange-600 border-0">
                                              <Zap className="h-3 w-3 ml-1" />
                                              تنقيط
                                            </Badge>
                                          )}
                                          {service.cancel && (
                                            <Badge className="text-xs bg-red-500/20 text-red-600 border-0">
                                              <X className="h-3 w-3 ml-1" />
                                              إلغاء
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-left shrink-0">
                                        <p className="text-xs text-muted-foreground line-through">
                                          ${parseFloat(service.rate).toFixed(4)}
                                        </p>
                                        <p className="text-sm font-semibold text-primary">
                                          ${calculatePrice(service.rate).toFixed(4)}
                                        </p>
                                      </div>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 shrink-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedServiceDetails(service);
                                              }}
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>عرض التفاصيل</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                      
                      {Object.keys(groupedServices).length === 0 && (
                        <div className="text-center py-12">
                          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">لا توجد خدمات تطابق الفلاتر</p>
                          <Button variant="link" onClick={clearFilters}>
                            مسح الفلاتر
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Import Button */}
                  <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                      <span>سيتم استيراد </span>
                      <span className="font-semibold text-primary">{selectedServices.size}</span>
                      <span> خدمة بهامش ربح </span>
                      <span className="font-semibold">{profitMargin}%</span>
                      {autoTranslate && <span className="text-purple-500"> (مع الترجمة)</span>}
                    </div>
                    <Button 
                      onClick={importServices} 
                      disabled={selectedServices.size === 0 || importing}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {importing ? (
                        <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5 ml-2" />
                      )}
                      {importing ? 'جاري الاستيراد...' : `استيراد ${selectedServices.size} خدمة`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Service Details Sheet */}
      <Sheet open={!!selectedServiceDetails} onOpenChange={() => setSelectedServiceDetails(null)}>
        <SheetContent side="left" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              تفاصيل الخدمة
            </SheetTitle>
          </SheetHeader>
          
          {selectedServiceDetails && (
            <ScrollArea className="h-[calc(100vh-120px)] mt-6">
              <div className="space-y-6">
                {/* Service name */}
                <div>
                  <Label className="text-muted-foreground text-xs">اسم الخدمة</Label>
                  <p className="font-medium mt-1">{selectedServiceDetails.name}</p>
                </div>
                
                {/* IDs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">معرف الخدمة</Label>
                    <Badge variant="outline" className="mt-1">
                      <Hash className="h-3 w-3 ml-1" />
                      {selectedServiceDetails.service}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">النوع</Label>
                    <p className="font-medium mt-1">{selectedServiceDetails.type || 'Default'}</p>
                  </div>
                </div>
                
                {/* Category */}
                <div>
                  <Label className="text-muted-foreground text-xs">الفئة</Label>
                  <Badge variant="secondary" className="mt-1">
                    <Layers className="h-3 w-3 ml-1" />
                    {selectedServiceDetails.category}
                  </Badge>
                </div>
                
                {/* Pricing */}
                <Card className="p-4 bg-muted/50">
                  <Label className="text-muted-foreground text-xs">التسعير</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">سعر المزود</p>
                      <p className="text-lg font-semibold">${parseFloat(selectedServiceDetails.rate).toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">سعر البيع (+{profitMargin}%)</p>
                      <p className="text-lg font-semibold text-primary">
                        ${calculatePrice(selectedServiceDetails.rate).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </Card>
                
                {/* Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Target className="h-4 w-4" />
                      <span className="text-xs">الحد الأدنى</span>
                    </div>
                    <p className="font-semibold">{parseInt(selectedServiceDetails.min).toLocaleString()}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Gauge className="h-4 w-4" />
                      <span className="text-xs">الحد الأقصى</span>
                    </div>
                    <p className="font-semibold">{parseInt(selectedServiceDetails.max).toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Features */}
                <div>
                  <Label className="text-muted-foreground text-xs">المميزات</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={`${
                      selectedServiceDetails.refill 
                        ? 'bg-green-500/20 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                    } border-0`}>
                      <RotateCcw className="h-3 w-3 ml-1" />
                      إعادة التعبئة: {selectedServiceDetails.refill ? 'نعم' : 'لا'}
                    </Badge>
                    <Badge className={`${
                      selectedServiceDetails.dripfeed 
                        ? 'bg-blue-500/20 text-blue-600' 
                        : 'bg-muted text-muted-foreground'
                    } border-0`}>
                      <Zap className="h-3 w-3 ml-1" />
                      التنقيط: {selectedServiceDetails.dripfeed ? 'نعم' : 'لا'}
                    </Badge>
                    <Badge className={`${
                      selectedServiceDetails.cancel 
                        ? 'bg-orange-500/20 text-orange-600' 
                        : 'bg-muted text-muted-foreground'
                    } border-0`}>
                      <X className="h-3 w-3 ml-1" />
                      قابل للإلغاء: {selectedServiceDetails.cancel ? 'نعم' : 'لا'}
                    </Badge>
                  </div>
                </div>
                
                {/* Description */}
                {(selectedServiceDetails.desc || selectedServiceDetails.description) && (
                  <div>
                    <Label className="text-muted-foreground text-xs">الوصف</Label>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedServiceDetails.desc || selectedServiceDetails.description}
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      toggleService(selectedServiceDetails.service);
                      setSelectedServiceDetails(null);
                    }}
                  >
                    {selectedServices.has(selectedServiceDetails.service) ? (
                      <>
                        <X className="h-4 w-4 ml-2" />
                        إلغاء التحديد
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 ml-2" />
                        تحديد للاستيراد
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </AdminDashboardLayout>
  );
};

export default AdminServiceImport;
