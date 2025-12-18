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
  AlertCircle,
  Layers,
  FolderPlus
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

interface ProviderCategory {
  name: string;
  count: number;
}

const AdminServiceImport = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedProvider = searchParams.get('provider');
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'provider' | 'categories' | 'services'>('provider');
  
  const [services, setServices] = useState<ProviderService[]>([]);
  const [providerCategories, setProviderCategories] = useState<ProviderCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingCategories, setImportingCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedProviderCategories, setSelectedProviderCategories] = useState<Set<string>>(new Set());
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
  const [translateCategories, setTranslateCategories] = useState<boolean>(true);

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

  // Fetch categories from provider (fetches all services but only extracts categories)
  const fetchCategories = async () => {
    if (!selectedProvider) {
      toast.error('اختر مزود أولاً');
      return;
    }

    setLoadingCategories(true);
    setServices([]);
    setProviderCategories([]);
    setSelectedServices(new Set());
    setSelectedProviderCategories(new Set());
    
    try {
      const { data, error } = await supabase.functions.invoke('provider-services', {
        body: { provider_id: selectedProvider }
      });
      
      if (error) throw error;
      
      if (data?.services && Array.isArray(data.services)) {
        const fetchedServices = data.services as ProviderService[];
        const providerName = data.provider?.name_ar || 'المزود';
        
        // Extract categories first (lightweight operation)
        const categoryMap = new Map<string, number>();
        fetchedServices.forEach((service: ProviderService) => {
          const count = categoryMap.get(service.category) || 0;
          categoryMap.set(service.category, count + 1);
        });
        
        const categories: ProviderCategory[] = Array.from(categoryMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        // Update categories first
        setProviderCategories(categories);
        
        // Use requestAnimationFrame to prevent UI freeze when storing large dataset
        requestAnimationFrame(() => {
          setServices(fetchedServices);
          setCurrentStep('categories');
          setLoadingCategories(false);
          toast.success(`تم جلب ${categories.length} فئة (${fetchedServices.length} خدمة) من ${providerName}`);
          
          // Refresh providers list to update services_count
          queryClient.invalidateQueries({ queryKey: ['api-providers-active'] });
        });
        
        return; // Exit early since setLoadingCategories is handled in RAF
      } else {
        toast.error('فشل في جلب الخدمات');
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('حدث خطأ أثناء جلب الخدمات: ' + (error.message || ''));
    }
    
    setLoadingCategories(false);
  };

  // Get services for selected categories
  const filteredServices = useMemo(() => {
    if (selectedProviderCategories.size === 0) return [];
    return services.filter(s => selectedProviderCategories.has(s.category));
  }, [services, selectedProviderCategories]);

  const categories = useMemo(() => {
    const cats = new Set(filteredServices.map(s => s.category));
    return Array.from(cats).sort();
  }, [filteredServices]);

  // Toggle provider category for import
  const toggleProviderCategory = (category: string) => {
    setSelectedProviderCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Select all provider categories
  const selectAllProviderCategories = () => {
    if (selectedProviderCategories.size === providerCategories.length) {
      setSelectedProviderCategories(new Set());
    } else {
      setSelectedProviderCategories(new Set(providerCategories.map(c => c.name)));
    }
  };

  // Import selected categories to local database
  const importSelectedCategoriesToDB = async () => {
    if (selectedProviderCategories.size === 0) {
      toast.error('اختر فئة واحدة على الأقل');
      return;
    }

    setImportingCategories(true);
    let successCount = 0;
    const categoriesToImport = Array.from(selectedProviderCategories);
    const total = categoriesToImport.length;

    try {
      // Get existing local categories to check for duplicates
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('name, slug');
      
      const existingSlugs = new Set(existingCategories?.map(c => c.slug) || []);

      // Get the max display_order
      const { data: maxOrderData } = await supabase
        .from('categories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();
      
      let displayOrder = (maxOrderData?.display_order || 0) + 1;

      for (let i = 0; i < categoriesToImport.length; i++) {
        const categoryName = categoriesToImport[i];
        
        // Generate slug
        const slug = categoryName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Skip if slug already exists
        if (existingSlugs.has(slug)) {
          console.log(`Category ${categoryName} already exists, skipping...`);
          continue;
        }

        let translatedName = categoryName;

        // Translate category name if enabled
        if (translateCategories) {
          try {
            toast.loading(`جاري ترجمة الفئة ${i + 1}/${total}...`, { id: 'translate-cat' });
            
            const { data: translated, error: translateError } = await supabase.functions.invoke('translate-service', {
              body: {
                name: categoryName,
                description: '',
                category: categoryName,
              }
            });

            if (!translateError && translated && !translated.error) {
              translatedName = translated.category || categoryName;
            }
          } catch (translateErr) {
            console.warn('Translation failed for category:', categoryName, translateErr);
          }
        }

        const { error } = await supabase.from('categories').insert({
          name: categoryName,
          name_ar: translatedName,
          slug: slug,
          icon: 'Layers',
          color: 'from-primary to-accent',
          is_active: true,
          display_order: displayOrder++,
        });

        if (error) {
          console.error('Error importing category:', categoryName, error);
        } else {
          successCount++;
          existingSlugs.add(slug);
        }
      }

      toast.dismiss('translate-cat');
      
      if (successCount > 0) {
        toast.success(`تم استيراد ${successCount} فئة بنجاح`);
        queryClient.invalidateQueries({ queryKey: ['categories-for-import'] });
      } else {
        toast.info('جميع الفئات موجودة مسبقاً');
      }
    } catch (error: any) {
      console.error('Error importing categories:', error);
      toast.dismiss('translate-cat');
      toast.error('حدث خطأ أثناء استيراد الفئات');
    } finally {
      setImportingCategories(false);
    }
  };

  // Proceed to services step
  const proceedToServices = () => {
    if (selectedProviderCategories.size === 0) {
      toast.error('اختر فئة واحدة على الأقل للمتابعة');
      return;
    }
    setCurrentStep('services');
    // Expand all selected categories
    setExpandedCategories(new Set(selectedProviderCategories));
  };

  const calculateFinalPrice = (originalRate: string): number => {
    const original = parseFloat(originalRate) || 0;
    if (marginType === 'percentage') {
      return original * (1 + profitMargin / 100);
    }
    return original + fixedMargin;
  };

  const groupedServices = useMemo(() => {
    const filtered = filteredServices.filter(s => {
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
  }, [filteredServices, searchQuery, selectedCategory]);

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

  const selectAllServices = () => {
    const allServiceIds = filteredServices.map(s => s.service);
    if (selectedServices.size === allServiceIds.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(allServiceIds));
    }
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
    const servicesToImport = filteredServices.filter(s => selectedServices.has(s.service));
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
    const selected = filteredServices.filter(s => selectedServices.has(s.service));
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
  }, [selectedServices, filteredServices, profitMargin, marginType, fixedMargin]);

  const currentProvider = providers.find(p => p.id === selectedProvider);

  // Reset to provider selection
  const resetToProvider = () => {
    setCurrentStep('provider');
    setServices([]);
    setProviderCategories([]);
    setSelectedServices(new Set());
    setSelectedProviderCategories(new Set());
    setCategoryMapping({});
  };

  // Back to categories
  const backToCategories = () => {
    setCurrentStep('categories');
    setSelectedServices(new Set());
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
              <p className="text-muted-foreground">اختر مزود واستورد الخدمات لموقعك</p>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            <Badge variant={currentStep === 'provider' ? 'default' : 'outline'} className="gap-1">
              1. المزود
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant={currentStep === 'categories' ? 'default' : 'outline'} className="gap-1">
              2. الفئات
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant={currentStep === 'services' ? 'default' : 'outline'} className="gap-1">
              3. الخدمات
            </Badge>
          </div>
        </div>

        {/* Step 1: Provider Selection */}
        {currentStep === 'provider' && (
          <>
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
                        onClick={() => setSelectedProvider(provider.id)}
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

            {/* Fetch Categories Button */}
            {selectedProvider && (
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={fetchCategories} 
                  disabled={loadingCategories}
                  className="min-w-[200px]"
                >
                  {loadingCategories ? (
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5 ml-2" />
                  )}
                  {loadingCategories ? 'جاري جلب الفئات...' : 'جلب الفئات'}
                </Button>
              </div>
            )}

            {!selectedProvider && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Globe className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">اختر مزود</h3>
                  <p className="text-muted-foreground">اختر مزود من القائمة أعلاه ثم اضغط "جلب الفئات"</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Step 2: Categories Selection */}
        {currentStep === 'categories' && (
          <>
            {/* Provider Info */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{currentProvider?.name_ar}</p>
                      <p className="text-xs text-muted-foreground">{services.length} خدمة متاحة</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetToProvider}>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    تغيير المزود
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import Settings */}
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
                <div className="grid sm:grid-cols-3 gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Categories Selection */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-green-500" />
                    اختر الفئات للاستيراد
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="translate-cats" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                      <Languages className="h-4 w-4 text-green-500" />
                      ترجمة الفئات
                    </Label>
                    <Switch
                      id="translate-cats"
                      checked={translateCategories}
                      onCheckedChange={setTranslateCategories}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm text-muted-foreground">
                      اختر الفئات التي تريد استيراد خدماتها ({selectedProviderCategories.size} من {providerCategories.length} محدد)
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={selectAllProviderCategories}
                      >
                        {selectedProviderCategories.size === providerCategories.length ? 'إلغاء الكل' : 'تحديد الكل'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={importSelectedCategoriesToDB}
                        disabled={importingCategories || selectedProviderCategories.size === 0}
                      >
                        {importingCategories ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <FolderPlus className="h-4 w-4 ml-2" />
                        )}
                        حفظ الفئات للموقع
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-96 overflow-y-auto p-1">
                    {providerCategories.map((category) => {
                      const isSelected = selectedProviderCategories.has(category.name);
                      
                      return (
                        <div
                          key={category.name}
                          onClick={() => toggleProviderCategory(category.name)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-border hover:border-green-500/50 bg-background'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleProviderCategory(category.name)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" title={category.name}>
                                {category.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {category.count} خدمة
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Proceed Button */}
                  <div className="flex justify-center pt-4 border-t">
                    <Button 
                      size="lg" 
                      onClick={proceedToServices}
                      disabled={selectedProviderCategories.size === 0}
                      className="min-w-[200px]"
                    >
                      <Package className="h-5 w-5 ml-2" />
                      متابعة لاختيار الخدمات ({filteredServices.length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 3: Services Selection & Import */}
        {currentStep === 'services' && (
          <>
            {/* Back & Provider Info */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={backToCategories}>
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  العودة للفئات
                </Button>
                <div className="text-sm text-muted-foreground">
                  {currentProvider?.name_ar} • {selectedProviderCategories.size} فئة • {filteredServices.length} خدمة
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={selectAllServices}
                >
                  {selectedServices.size === filteredServices.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </Button>
                <Button 
                  onClick={importSelectedServices} 
                  disabled={importing || selectedServices.size === 0}
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

            {/* Category Mapping */}
            {localCategories.length > 0 && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="h-5 w-5 text-orange-500" />
                    ربط الأقسام المحلية (اختياري)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">اختر القسم المحلي لكل قسم من المزود</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
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
                  <p className="text-2xl font-bold">{filteredServices.length}</p>
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

            {/* Estimated Profit */}
            {selectedServices.size > 0 && (
              <Card className="border-success/20 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">السعر الأصلي:</span>
                    <span>${estimatedProfit.original.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">السعر النهائي:</span>
                    <span>${estimatedProfit.final.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-success border-t border-success/20 pt-2 mt-2">
                    <span>الربح المتوقع:</span>
                    <span>+${estimatedProfit.profit.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services List */}
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
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminServiceImport;
