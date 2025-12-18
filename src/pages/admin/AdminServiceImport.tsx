import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  RefreshCw, 
  Search, 
  Download, 
  CheckCircle2, 
  Package,
  Filter,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Percent,
  DollarSign,
  TrendingUp,
  Languages,
  Globe,
  Server,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  average_time?: string;
  speed?: string;
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

interface LocalCategory {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
}

const AdminServiceImport = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedProvider = searchParams.get('provider');
  
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<string>(preselectedProvider || '');
  const [providerProfitMargin, setProviderProfitMargin] = useState<number>(30);
  
  // Category mapping: maps provider category name to local category id
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});
  
  // Profit margin settings
  const [profitMargin, setProfitMargin] = useState<number>(50);
  const [marginType, setMarginType] = useState<'percentage' | 'fixed'>('percentage');
  const [fixedMargin, setFixedMargin] = useState<number>(0.5);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);
  const [useProviderMargin, setUseProviderMargin] = useState<boolean>(true);

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

  // Fetch local categories
  const { data: localCategories = [] } = useQuery({
    queryKey: ['categories-for-import'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_ar, slug')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as LocalCategory[];
    },
  });

  useEffect(() => {
    if (preselectedProvider && providers.length > 0) {
      const provider = providers.find(p => p.id === preselectedProvider);
      if (provider) {
        setSelectedProvider(provider.id);
        setProviderProfitMargin(provider.profit_margin);
        if (useProviderMargin) {
          setProfitMargin(provider.profit_margin);
        }
      }
    }
  }, [preselectedProvider, providers]);

  // Update margin when provider changes
  useEffect(() => {
    if (selectedProvider && useProviderMargin) {
      const provider = providers.find(p => p.id === selectedProvider);
      if (provider) {
        setProviderProfitMargin(provider.profit_margin);
        setProfitMargin(provider.profit_margin);
      }
    }
  }, [selectedProvider, providers, useProviderMargin]);

  const fetchServices = async () => {
    if (!selectedProvider) {
      toast.error('اختر مزود أولاً');
      return;
    }

    setLoading(true);
    setServices([]);
    setSelectedServices(new Set());
    
    try {
      const { data, error } = await supabase.functions.invoke('provider-services', {
        body: { provider_id: selectedProvider }
      });
      
      if (error) throw error;
      
      if (data?.services && Array.isArray(data.services)) {
        setServices(data.services);
        toast.success(`تم جلب ${data.services.length} خدمة من ${data.provider?.name_ar || 'المزود'}`);
        
        // Refresh providers list to update services_count
        queryClient.invalidateQueries({ queryKey: ['api-providers-active'] });
      } else {
        toast.error('فشل في جلب الخدمات');
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('حدث خطأ أثناء جلب الخدمات: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category));
    return Array.from(cats).sort();
  }, [services]);

  const calculateFinalPrice = (originalRate: string): number => {
    const original = parseFloat(originalRate) || 0;
    if (marginType === 'percentage') {
      return original * (1 + profitMargin / 100);
    }
    return original + fixedMargin;
  };

  const groupedServices = useMemo(() => {
    const filtered = services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const grouped: Record<string, ProviderService[]> = {};
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

    if (!selectedProvider) {
      toast.error('اختر مزود أولاً');
      return;
    }

    setImporting(true);
    let successCount = 0;
    const servicesToImport = services.filter(s => selectedServices.has(s.service));
    const total = servicesToImport.length;

    try {
      for (let i = 0; i < servicesToImport.length; i++) {
        const service = servicesToImport[i];
        let translatedName = service.name;
        
        // Build comprehensive description from all available fields
        const originalDescription = service.desc || service.description || '';
        const descriptionParts = [];
        
        if (originalDescription) {
          descriptionParts.push(originalDescription);
        }
        
        // Add service details
        const detailsLine = [
          `النوع: ${service.type}`,
          `الحد الأدنى: ${service.min}`,
          `الحد الأقصى: ${service.max}`,
        ].join(' | ');
        descriptionParts.push(detailsLine);
        
        // Add additional info if available
        const additionalInfo = [];
        if (service.average_time) additionalInfo.push(`وقت التنفيذ: ${service.average_time}`);
        if (service.speed) additionalInfo.push(`السرعة: ${service.speed}`);
        if (additionalInfo.length > 0) {
          descriptionParts.push(additionalInfo.join(' | '));
        }
        
        let translatedDescription = descriptionParts.join('\n\n');
        let translatedCategory = service.category;

        // Translate if enabled
        if (autoTranslate) {
          try {
            toast.loading(`جاري ترجمة ${i + 1}/${total}...`, { id: 'translate' });
            
            const textToTranslate = originalDescription 
              ? `${originalDescription}\n\nType: ${service.type} | Min: ${service.min} | Max: ${service.max}${service.average_time ? ` | Average Time: ${service.average_time}` : ''}${service.speed ? ` | Speed: ${service.speed}` : ''}`
              : `Type: ${service.type} | Min: ${service.min} | Max: ${service.max}${service.average_time ? ` | Average Time: ${service.average_time}` : ''}${service.speed ? ` | Speed: ${service.speed}` : ''}`;
            
            const { data: translated, error: translateError } = await supabase.functions.invoke('translate-service', {
              body: {
                name: service.name,
                description: textToTranslate,
                category: service.category,
              }
            });

            if (!translateError && translated && !translated.error) {
              translatedName = translated.name || service.name;
              translatedDescription = translated.description || translatedDescription;
              translatedCategory = translated.category || service.category;
            }
          } catch (translateErr) {
            console.warn('Translation failed for:', service.name, translateErr);
          }
        }

        const finalPrice = calculateFinalPrice(service.rate);
        // Get the mapped local category ID
        const mappedCategoryId = categoryMapping[service.category] || null;
        
        const { error } = await supabase.from('services').insert({
          name: translatedName,
          description: translatedDescription,
          price: parseFloat(finalPrice.toFixed(4)),
          category: translatedCategory,
          category_id: mappedCategoryId,
          status: 'active',
          external_service_id: service.service,
          provider_id: selectedProvider,
          refill_enabled: service.refill || false,
          refill_days: service.refill ? 30 : null,
          features: [
            service.dripfeed ? 'دعم التنقيط' : null,
            service.refill ? 'إعادة التعبئة' : null,
            service.cancel ? 'قابل للإلغاء' : null,
            service.average_time ? `وقت التنفيذ: ${service.average_time}` : null,
            `الحد الأدنى: ${service.min}`,
            `الحد الأقصى: ${service.max}`,
          ].filter(Boolean),
        });

        if (error) {
          console.error('Error importing service:', service.name, error);
        } else {
          successCount++;
        }
      }

      // Update provider's services count
      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', selectedProvider);

      await supabase
        .from('api_providers')
        .update({ services_count: count || 0 })
        .eq('id', selectedProvider);

      toast.dismiss('translate');
      toast.success(`تم استيراد ${successCount} خدمة بنجاح`);
      setSelectedServices(new Set());
    } catch (error: any) {
      console.error('Error importing services:', error);
      toast.dismiss('translate');
      toast.error('حدث خطأ أثناء الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  // Calculate estimated profit
  const estimatedProfit = useMemo(() => {
    const selected = services.filter(s => selectedServices.has(s.service));
    let totalOriginal = 0;
    let totalFinal = 0;
    selected.forEach(s => {
      const original = parseFloat(s.rate) || 0;
      totalOriginal += original;
      totalFinal += calculateFinalPrice(s.rate);
    });
    return {
      original: totalOriginal,
      final: totalFinal,
      profit: totalFinal - totalOriginal,
    };
  }, [selectedServices, services, profitMargin, marginType, fixedMargin]);

  const currentProvider = providers.find(p => p.id === selectedProvider);

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
              <p className="text-muted-foreground">اختر مزود واستورد الخدمات لموقعك</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchServices} disabled={loading || !selectedProvider} variant="outline">
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              جلب الخدمات
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

        {/* Provider Selection */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-blue-500" />
              اختر المزود
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProviders ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري تحميل المزودين...
              </div>
            ) : providers.length === 0 ? (
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-4 w-4" />
                <span>لا يوجد مزودين نشطين.</span>
                <Link to="/admin/providers" className="text-primary hover:underline">
                  إضافة مزود جديد
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setServices([]);
                      setSelectedServices(new Set());
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProvider === provider.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedProvider === provider.id ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <Server className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{provider.name_ar}</p>
                        <p className="text-xs text-muted-foreground truncate">{provider.name}</p>
                      </div>
                      {selectedProvider === provider.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {provider.services_count} خدمة
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {provider.profit_margin}% ربح
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Margin Settings */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                إعدادات الاستيراد
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="auto-translate" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                  <Languages className="h-4 w-4 text-primary" />
                  ترجمة تلقائية للعربية
                </Label>
                <Switch
                  id="auto-translate"
                  checked={autoTranslate}
                  onCheckedChange={setAutoTranslate}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-4">
              {/* Use Provider Margin Toggle */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  استخدام هامش المزود
                </Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={useProviderMargin}
                    onCheckedChange={(checked) => {
                      setUseProviderMargin(checked);
                      if (checked && currentProvider) {
                        setProfitMargin(currentProvider.profit_margin);
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {useProviderMargin ? `${providerProfitMargin}%` : 'مخصص'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>نوع الهامش</Label>
                <Select 
                  value={marginType} 
                  onValueChange={(v: 'percentage' | 'fixed') => setMarginType(v)}
                  disabled={useProviderMargin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {marginType === 'percentage' ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    نسبة الربح
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={500}
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(Math.max(0, Math.min(500, parseInt(e.target.value) || 0)))}
                      className="w-24"
                      disabled={useProviderMargin}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    المبلغ الثابت
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={fixedMargin}
                      onChange={(e) => setFixedMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-24"
                      disabled={useProviderMargin}
                    />
                    <span className="text-muted-foreground">$</span>
                  </div>
                </div>
              )}

              {selectedServices.size > 0 && (
                <div className="space-y-2">
                  <Label>الأرباح المتوقعة</Label>
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">السعر الأصلي:</span>
                      <span>${estimatedProfit.original.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">السعر النهائي:</span>
                      <span>${estimatedProfit.final.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-success border-t border-success/20 pt-2 mt-2">
                      <span>الربح:</span>
                      <span>+${estimatedProfit.profit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Mapping */}
        {services.length > 0 && categories.length > 0 && localCategories.length > 0 && (
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-orange-500" />
                ربط الأقسام المحلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">اختر القسم المحلي لكل قسم من المزود</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {categories.map((providerCat) => (
                  <div key={providerCat} className="flex items-center gap-2 p-2 rounded-lg bg-background border">
                    <span className="text-sm font-medium flex-1 truncate" title={providerCat}>
                      {providerCat}
                    </span>
                    <Select
                      value={categoryMapping[providerCat] || ''}
                      onValueChange={(value) => setCategoryMapping(prev => ({ ...prev, [providerCat]: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="اختر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">بدون تحديد</SelectItem>
                        {localCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {services.length > 0 && (
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
        )}

        {/* Stats */}
        {services.length > 0 && (
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
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-warning" />
                <p className="text-2xl font-bold">{profitMargin}%</p>
                <p className="text-sm text-muted-foreground">هامش الربح</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services List */}
        {!selectedProvider ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">اختر مزود</h3>
              <p className="text-muted-foreground">اختر مزود من القائمة أعلاه لجلب الخدمات</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-3">جاري جلب الخدمات من {currentProvider?.name_ar}...</span>
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد خدمات</h3>
              <p className="text-muted-foreground mb-4">اضغط على "جلب الخدمات" لتحميل الخدمات من المزود</p>
              <Button onClick={fetchServices} disabled={loading}>
                <RefreshCw className="h-4 w-4 ml-2" />
                جلب الخدمات
              </Button>
            </CardContent>
          </Card>
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
                              {categoryServices.map((service) => {
                                const originalPrice = parseFloat(service.rate) || 0;
                                const finalPrice = calculateFinalPrice(service.rate);
                                
                                return (
                                  <div 
                                    key={service.service}
                                    className={`py-4 px-3 flex items-start gap-3 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer ${
                                      selectedServices.has(service.service) ? 'bg-primary/5 border border-primary/20' : ''
                                    }`}
                                    onClick={() => toggleService(service.service)}
                                  >
                                    <Checkbox
                                      checked={selectedServices.has(service.service)}
                                      onCheckedChange={() => toggleService(service.service)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0 space-y-2">
                                      {/* Service Name & ID */}
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium text-sm">{service.name}</p>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                          ID: {service.service}
                                        </Badge>
                                      </div>
                                      
                                      {/* Description if available */}
                                      {(service.desc || service.description) && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {service.desc || service.description}
                                        </p>
                                      )}
                                      
                                      {/* Price & Quantity Info */}
                                      <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="text-xs line-through text-muted-foreground">
                                          ${originalPrice.toFixed(4)}
                                        </Badge>
                                        <Badge className="text-xs bg-success/10 text-success border-success/20">
                                          ${finalPrice.toFixed(4)}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          النوع: {service.type}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          الكمية: {service.min} - {service.max}
                                        </Badge>
                                      </div>
                                      
                                      {/* Additional Info */}
                                      {(service.average_time || service.speed) && (
                                        <div className="flex flex-wrap gap-2">
                                          {service.average_time && (
                                            <Badge variant="outline" className="text-xs bg-muted">
                                              ⏱️ وقت التنفيذ: {service.average_time}
                                            </Badge>
                                          )}
                                          {service.speed && (
                                            <Badge variant="outline" className="text-xs bg-muted">
                                              ⚡ السرعة: {service.speed}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Features */}
                                      <div className="flex flex-wrap gap-1.5">
                                        {service.refill && (
                                          <Badge className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                                            ✓ إعادة التعبئة
                                          </Badge>
                                        )}
                                        {service.dripfeed && (
                                          <Badge className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                                            ✓ التنقيط
                                          </Badge>
                                        )}
                                        {service.cancel && (
                                          <Badge className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                                            ✓ قابل للإلغاء
                                          </Badge>
                                        )}
                                        {!service.refill && (
                                          <Badge className="text-xs bg-muted text-muted-foreground">
                                            ✗ بدون تعبئة
                                          </Badge>
                                        )}
                                        {!service.cancel && (
                                          <Badge className="text-xs bg-muted text-muted-foreground">
                                            ✗ غير قابل للإلغاء
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
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
