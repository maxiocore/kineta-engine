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
  Languages, Globe, Server, AlertCircle, Layers
} from 'lucide-react';
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

  // Group services by category
  const groupedServices = useMemo(() => {
    const filtered = services.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const grouped: Record<string, ProviderService[]> = {};
    filtered.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });
    return grouped;
  }, [services, searchQuery]);

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

  const selectAllServices = () => {
    if (selectedServices.size === services.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(services.map(s => s.service)));
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
    const toImport = services.filter(s => selectedServices.has(s.service));

    try {
      for (let i = 0; i < toImport.length; i++) {
        const service = toImport[i];
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

        const { error } = await supabase.from('services').insert({
          name,
          description: `${description}\n\nالنوع: ${service.type} | الحد الأدنى: ${service.min} | الحد الأقصى: ${service.max}`,
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
      toast.success(`تم استيراد ${successCount} خدمة`);
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
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/services">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">استيراد الخدمات</h1>
              <p className="text-muted-foreground text-sm">اختر مزود واستورد الخدمات</p>
            </div>
          </div>
          
          {/* Steps */}
          <div className="flex items-center gap-2">
            <Badge variant={step === 1 ? 'default' : 'outline'}>1. المزود</Badge>
            <span>→</span>
            <Badge variant={step === 2 ? 'default' : 'outline'}>2. الفئات</Badge>
            <span>→</span>
            <Badge variant={step === 3 ? 'default' : 'outline'}>3. الخدمات</Badge>
          </div>
        </div>

        {/* Step 1: Select Provider */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                اختر المزود
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingProviders ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحميل...
                </div>
              ) : providers.length === 0 ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>لا يوجد مزودين.</span>
                  <Link to="/admin/providers" className="text-primary hover:underline">إضافة مزود</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {providers.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProvider === p.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Server className={`h-5 w-5 ${selectedProvider === p.id ? 'text-primary' : ''}`} />
                        <div className="flex-1">
                          <p className="font-medium">{p.name_ar}</p>
                          <p className="text-xs text-muted-foreground">{p.services_count} خدمة</p>
                        </div>
                        {selectedProvider === p.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedProvider && (
                <Button onClick={fetchCategories} disabled={loadingCategories} className="w-full">
                  {loadingCategories ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Download className="h-4 w-4 ml-2" />}
                  {loadingCategories ? 'جاري الجلب...' : 'جلب الفئات'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Categories */}
        {step === 2 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                اختر الفئات ({selectedCategories.size}/{providerCategories.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RefreshCw className="h-4 w-4 ml-2" />
                تغيير المزود
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedCategories.size === providerCategories.length}
                  onCheckedChange={() => {
                    if (selectedCategories.size === providerCategories.length) {
                      setSelectedCategories(new Set());
                    } else {
                      setSelectedCategories(new Set(providerCategories.map(c => c.name)));
                    }
                  }}
                />
                <Label>تحديد الكل</Label>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                {providerCategories.map(cat => (
                  <div
                    key={cat.name}
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
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate">{cat.name}</span>
                      <Badge variant="secondary" className="text-xs">{cat.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={fetchServices} 
                disabled={selectedCategories.size === 0 || loadingServices}
                className="w-full"
              >
                {loadingServices ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Package className="h-4 w-4 ml-2" />}
                {loadingServices ? 'جاري التحميل...' : `تحميل الخدمات (${providerCategories.filter(c => selectedCategories.has(c.name)).reduce((s, c) => s + c.count, 0)})`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select & Import Services */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Settings */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    <Label>هامش الربح:</Label>
                    <Input 
                      type="number" 
                      value={profitMargin} 
                      onChange={e => setProfitMargin(Number(e.target.value))}
                      className="w-20"
                    />
                    <span>%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    <Label>ترجمة تلقائية</Label>
                    <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                    العودة للفئات
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  الخدمات ({selectedServices.size}/{services.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-48"
                  />
                  <Button variant="outline" size="sm" onClick={selectAllServices}>
                    {selectedServices.size === services.length ? 'إلغاء الكل' : 'تحديد الكل'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {Object.entries(groupedServices).map(([category, categoryServices]) => (
                    <div key={category} className="border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setExpandedCategories(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(category)) newSet.delete(category);
                            else newSet.add(category);
                            return newSet;
                          });
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={categoryServices.every(s => selectedServices.has(s.service))}
                            onClick={e => e.stopPropagation()}
                            onCheckedChange={() => toggleAllInCategory(category)}
                          />
                          <span className="font-medium">{category}</span>
                          <Badge variant="secondary">{categoryServices.length}</Badge>
                        </div>
                        {expandedCategories.has(category) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                      
                      {expandedCategories.has(category) && (
                        <div className="border-t divide-y">
                          {categoryServices.map(service => (
                            <div key={service.service} className="flex items-center gap-3 p-3 hover:bg-muted/30">
                              <Checkbox
                                checked={selectedServices.has(service.service)}
                                onCheckedChange={() => toggleService(service.service)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{service.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {service.service} | Min: {service.min} | Max: {service.max}
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="text-xs text-muted-foreground line-through">${parseFloat(service.rate).toFixed(4)}</p>
                                <p className="text-sm font-medium text-primary">${calculatePrice(service.rate).toFixed(4)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Import Button */}
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={importServices} 
                    disabled={selectedServices.size === 0 || importing}
                    className="w-full"
                    size="lg"
                  >
                    {importing ? <Loader2 className="h-5 w-5 ml-2 animate-spin" /> : <Download className="h-5 w-5 ml-2" />}
                    {importing ? 'جاري الاستيراد...' : `استيراد ${selectedServices.size} خدمة`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminServiceImport;
