import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Globe, 
  Key, 
  RefreshCw,
  Server,
  Link2,
  CheckCircle,
  XCircle,
  Star,
  Percent,
  Package,
  Clock,
  Eye,
  EyeOff,
  Download,
  BarChart3,
  Scale,
  Tag,
  FileText,
  Filter,
  Wallet,
  DollarSign,
  Layers,
  Search,
  ArrowUpDown,
  Activity,
  Zap,
  TrendingUp,
  Languages,
  Settings,
  Database,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Provider categories
const PROVIDER_CATEGORIES = [
  { value: 'smm', label: 'SMM Panel', labelAr: 'لوحة SMM' },
  { value: 'reseller', label: 'Reseller', labelAr: 'موزع' },
  { value: 'direct', label: 'Direct API', labelAr: 'API مباشر' },
  { value: 'wholesale', label: 'Wholesale', labelAr: 'جملة' },
  { value: 'premium', label: 'Premium', labelAr: 'مميز' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
];

interface ApiProvider {
  id: string;
  name: string;
  name_ar: string;
  api_url: string;
  api_key: string;
  is_active: boolean;
  is_default: boolean;
  profit_margin: number;
  last_sync_at: string | null;
  services_count: number;
  category: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ProviderService {
  service: string | number;
  name: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  type?: string;
  desc?: string;
  refill?: boolean | string;
  cancel?: boolean | string;
  dripfeed?: boolean | string;
  average_time?: string;
}

interface FetchedServicesData {
  services: ProviderService[];
  categories: { name: string; count: number }[];
  totalServices: number;
  minPrice: number;
  maxPrice: number;
}

const AdminApiProviders = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [providerBalances, setProviderBalances] = useState<Record<string, { balance: number | null; currency: string; loading: boolean; error?: string }>>({});
  
  // Services preview state
  const [isServicesSheetOpen, setIsServicesSheetOpen] = useState(false);
  const [fetchingProvider, setFetchingProvider] = useState<ApiProvider | null>(null);
  const [fetchedServices, setFetchedServices] = useState<FetchedServicesData | null>(null);
  const [isFetchingServices, setIsFetchingServices] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('all');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    api_url: '',
    api_key: '',
    is_active: true,
    is_default: false,
    profit_margin: 30,
    category: 'smm',
    description: '',
  });

  // Fetch providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['api-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_providers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ApiProvider[];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  // Create provider mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('api_providers')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('تم إضافة المزود بنجاح');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error('فشل في إضافة المزود: ' + error.message);
    },
  });

  // Update provider mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('api_providers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('تم تحديث المزود بنجاح');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث المزود: ' + error.message);
    },
  });

  // Delete provider mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_providers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('تم حذف المزود بنجاح');
      setIsDeleteDialogOpen(false);
      setSelectedProvider(null);
    },
    onError: (error: Error) => {
      toast.error('فشل في حذف المزود: ' + error.message);
    },
  });

  // Set as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('api_providers')
        .update({ is_default: false })
        .neq('id', id);
      
      const { error } = await supabase
        .from('api_providers')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('تم تعيين المزود الافتراضي');
    },
    onError: (error: Error) => {
      toast.error('فشل في تعيين المزود الافتراضي: ' + error.message);
    },
  });

  const handleOpenDialog = (provider?: ApiProvider) => {
    if (provider) {
      setSelectedProvider(provider);
      setFormData({
        name: provider.name,
        name_ar: provider.name_ar,
        api_url: provider.api_url,
        api_key: provider.api_key,
        is_active: provider.is_active,
        is_default: provider.is_default,
        profit_margin: provider.profit_margin,
        category: provider.category || 'smm',
        description: provider.description || '',
      });
    } else {
      setSelectedProvider(null);
      setFormData({
        name: '',
        name_ar: '',
        api_url: '',
        api_key: '',
        is_active: true,
        is_default: false,
        profit_margin: 30,
        category: 'smm',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProvider(null);
    setFormData({
      name: '',
      name_ar: '',
      api_url: '',
      api_key: '',
      is_active: true,
      is_default: false,
      profit_margin: 30,
      category: 'smm',
      description: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name_ar || !formData.api_url || !formData.api_key) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (selectedProvider) {
      updateMutation.mutate({ id: selectedProvider.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Fetch services from provider API using edge function (avoids CORS issues)
  const handleFetchServices = async (provider: ApiProvider) => {
    setFetchingProvider(provider);
    setIsServicesSheetOpen(true);
    setIsFetchingServices(true);
    setFetchedServices(null);
    setSelectedServiceCategory('all');
    setServiceSearchQuery('');

    try {
      // Use edge function to fetch services (avoids CORS)
      const { data, error } = await supabase.functions.invoke('provider-services', {
        body: { provider_id: provider.id }
      });

      if (error) {
        throw new Error(error.message || 'فشل في الاتصال بالخادم');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const servicesArray = data.services || [];
      
      if (!Array.isArray(servicesArray)) {
        throw new Error('استجابة غير صالحة من المزود');
      }

      // Process services
      const services: ProviderService[] = servicesArray.map((s: any) => ({
        service: s.service,
        name: s.name || '',
        category: s.category || 'Uncategorized',
        rate: s.rate || '0',
        min: s.min || '0',
        max: s.max || '0',
        type: s.type,
        desc: s.desc || s.description || s.formatted_description,
        refill: s.refill,
        cancel: s.cancel,
        dripfeed: s.dripfeed,
        average_time: s.average_time,
      }));

      // Calculate categories
      const categoryMap = new Map<string, number>();
      services.forEach(s => {
        const cat = s.category || 'Other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      const categoriesList = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate stats
      const prices = services.map(s => parseFloat(s.rate) || 0).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      setFetchedServices({
        services,
        categories: categoriesList,
        totalServices: services.length,
        minPrice,
        maxPrice,
      });

      toast.success(`تم جلب ${services.length} خدمة و ${categoriesList.length} قسم`);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('فشل في جلب الخدمات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      setIsFetchingServices(false);
    }
  };

  // Import services to database
  const handleImportServices = async () => {
    if (!fetchedServices || !fetchingProvider) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: filteredServices.length, status: 'جاري التحضير...' });

    try {
      // Call the sync-services-advanced function with full details
      const { data, error } = await supabase.functions.invoke('sync-services-advanced', {
        body: {
          provider_id: fetchingProvider.id,
          update_prices: true,
          update_descriptions: true,
          translate_names: true,
          delete_removed: false,
        }
      });

      if (error) throw error;

      toast.success(data.message || 'تم استيراد الخدمات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      // Update provider services count
      await supabase
        .from('api_providers')
        .update({ 
          last_sync_at: new Date().toISOString(),
          services_count: fetchedServices.totalServices 
        })
        .eq('id', fetchingProvider.id);

    } catch (error) {
      console.error('Error importing services:', error);
      toast.error('فشل في استيراد الخدمات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Fetch provider balance
  const fetchProviderBalance = async (providerId: string) => {
    setProviderBalances(prev => ({
      ...prev,
      [providerId]: { balance: null, currency: 'USD', loading: true }
    }));

    try {
      const { data, error } = await supabase.functions.invoke('provider-balance', {
        body: { provider_id: providerId }
      });

      if (error) throw error;

      setProviderBalances(prev => ({
        ...prev,
        [providerId]: {
          balance: data.balance,
          currency: data.currency || 'USD',
          loading: false
        }
      }));

      toast.success(`رصيد ${data.provider?.name_ar || 'المزود'}: ${data.balance?.toFixed(2) || '0.00'} ر.س`);
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      setProviderBalances(prev => ({
        ...prev,
        [providerId]: {
          balance: null,
          currency: 'USD',
          loading: false,
          error: error.message
        }
      }));
      toast.error('فشل في جلب الرصيد');
    }
  };

  const fetchAllBalances = async () => {
    const activeProviders = providers.filter(p => p.is_active);
    for (const provider of activeProviders) {
      await fetchProviderBalance(provider.id);
    }
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter services
  const filteredServices = fetchedServices?.services.filter(s => {
    const matchesCategory = selectedServiceCategory === 'all' || s.category === selectedServiceCategory;
    const matchesSearch = !serviceSearchQuery || 
      s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
      String(s.service).includes(serviceSearchQuery);
    return matchesCategory && matchesSearch;
  }) || [];

  // Stats
  const stats = {
    total: providers.length,
    active: providers.filter(p => p.is_active).length,
    totalServices: providers.reduce((sum, p) => sum + p.services_count, 0),
    defaultProvider: providers.find(p => p.is_default),
  };

  // Filter providers
  const filteredProviders = providers.filter(p => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_ar.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (category: string | null) => {
    const cat = PROVIDER_CATEGORIES.find(c => c.value === category);
    return cat?.labelAr || 'أخرى';
  };

  // Translate service name helper
  const translateServiceName = (name: string): string => {
    const platformMap: Record<string, string> = {
      'instagram': 'انستقرام',
      'facebook': 'فيسبوك',
      'twitter': 'تويتر',
      'youtube': 'يوتيوب',
      'tiktok': 'تيك توك',
      'telegram': 'تيليجرام',
      'snapchat': 'سناب شات',
      'linkedin': 'لينكد إن',
      'spotify': 'سبوتيفاي',
    };

    const serviceTypeMap: Record<string, string> = {
      'followers': 'متابعين',
      'likes': 'لايكات',
      'views': 'مشاهدات',
      'comments': 'تعليقات',
      'subscribers': 'مشتركين',
    };

    let translated = name.toLowerCase();
    
    for (const [en, ar] of Object.entries(platformMap)) {
      translated = translated.replace(new RegExp(en, 'gi'), ar);
    }
    
    for (const [en, ar] of Object.entries(serviceTypeMap)) {
      translated = translated.replace(new RegExp(en, 'gi'), ar);
    }

    return translated.charAt(0).toUpperCase() + translated.slice(1);
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-4 sm:space-y-6" dir="rtl">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-border/50 p-4 sm:p-6">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
                  <Server className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">إدارة المزودين</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">جلب وإدارة خدمات مواقع SMM الخارجية</p>
                </div>
              </div>
              
              <Button onClick={() => handleOpenDialog()} className="gap-2 w-full sm:w-auto shadow-lg" size="default">
                <Plus className="h-4 w-4" />
                إضافة مزود
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                className="gap-1.5 text-xs sm:text-sm h-9 bg-background/50 backdrop-blur-sm hover:bg-background/80" 
                size="sm" 
                onClick={fetchAllBalances}
              >
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                جلب الأرصدة
              </Button>
              <Link to="/admin/providers/reports">
                <Button variant="outline" className="gap-1.5 text-xs sm:text-sm h-9 bg-background/50 backdrop-blur-sm hover:bg-background/80" size="sm">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  التقارير
                </Button>
              </Link>
              <Link to="/admin/providers/compare">
                <Button variant="outline" className="gap-1.5 text-xs sm:text-sm h-9 bg-background/50 backdrop-blur-sm hover:bg-background/80" size="sm">
                  <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  المقارنة
                </Button>
              </Link>
              <Link to="/admin/social-categories">
                <Button variant="outline" className="gap-1.5 text-xs sm:text-sm h-9 bg-background/50 backdrop-blur-sm hover:bg-background/80" size="sm">
                  <FolderTree className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  الأقسام
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 bg-primary/20 rounded-xl flex-shrink-0">
                    <Server className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">إجمالي المزودين</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 bg-green-500/20 rounded-xl flex-shrink-0">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">المزودين النشطين</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 bg-blue-500/20 rounded-xl flex-shrink-0">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">إجمالي الخدمات</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalServices.toLocaleString('ar-SA')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 bg-yellow-500/20 rounded-xl flex-shrink-0">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">المزود الافتراضي</p>
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {stats.defaultProvider?.name_ar || 'غير محدد'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث عن مزود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="جميع التصنيفات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التصنيفات</SelectItem>
                    {PROVIDER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.labelAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(categoryFilter !== 'all' || searchQuery) && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Providers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProviders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Server className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {providers.length === 0 ? 'لا يوجد مزودين' : 'لا يوجد نتائج'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {providers.length === 0 ? 'ابدأ بإضافة مزود SMM لاستيراد الخدمات' : 'جرب تغيير معايير البحث'}
              </p>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة مزود جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredProviders.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`relative overflow-hidden transition-all hover:shadow-xl group ${
                      provider.is_default ? 'ring-2 ring-primary shadow-primary/10' : ''
                    } ${!provider.is_active ? 'opacity-60' : ''}`}
                  >
                    {provider.is_default && (
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {provider.name_ar}
                            {provider.is_default && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
                                <Star className="h-3 w-3 fill-primary" />
                                افتراضي
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground font-mono">{provider.name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge 
                            variant={provider.is_active ? 'default' : 'secondary'}
                            className={provider.is_active ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
                          >
                            {provider.is_active ? (
                              <><CheckCircle2 className="h-3 w-3 ml-1" /> نشط</>
                            ) : (
                              <><XCircle className="h-3 w-3 ml-1" /> غير نشط</>
                            )}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Tag className="h-2.5 w-2.5" />
                            {getCategoryLabel(provider.category)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* API URL */}
                      <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate text-muted-foreground font-mono text-xs" title={provider.api_url}>
                          {provider.api_url}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => navigator.clipboard.writeText(provider.api_url)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* API Key */}
                      <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                        <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-mono text-muted-foreground text-xs flex-1 truncate">
                          {showApiKey[provider.id] ? provider.api_key : '••••••••••••••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => toggleApiKeyVisibility(provider.id)}
                        >
                          {showApiKey[provider.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                          <Percent className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">نسبة الربح</p>
                            <p className="text-sm font-bold text-foreground">{provider.profit_margin}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/10">
                          <Package className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">الخدمات</p>
                            <p className="text-sm font-bold text-foreground">{provider.services_count.toLocaleString('ar-SA')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-green-500/20">
                            <Wallet className="h-4 w-4 text-green-500" />
                          </div>
                          <span className="text-sm font-medium text-foreground">الرصيد</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {providerBalances[provider.id]?.loading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : providerBalances[provider.id]?.balance !== undefined && providerBalances[provider.id]?.balance !== null ? (
                            <span className="font-bold text-green-600 dark:text-green-400">
                              ${providerBalances[provider.id].balance?.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">--</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => fetchProviderBalance(provider.id)}
                            disabled={providerBalances[provider.id]?.loading}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${providerBalances[provider.id]?.loading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Last Sync */}
                      {provider.last_sync_at && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          آخر مزامنة: {format(new Date(provider.last_sync_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-9 text-xs"
                          onClick={() => handleFetchServices(provider)}
                        >
                          <Zap className="h-3.5 w-3.5" />
                          جلب
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-9 text-xs"
                          onClick={() => handleOpenDialog(provider)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          تعديل
                        </Button>
                        
                        {!provider.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-9 text-xs"
                            onClick={() => setDefaultMutation.mutate(provider.id)}
                          >
                            <Star className="h-3.5 w-3.5" />
                            افتراضي
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-9 text-xs text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Services Preview Sheet */}
        <Sheet open={isServicesSheetOpen} onOpenChange={setIsServicesSheetOpen}>
          <SheetContent side="left" className="w-full sm:max-w-2xl overflow-hidden p-0">
            <div className="flex flex-col h-full">
              <SheetHeader className="p-4 sm:p-6 border-b bg-gradient-to-r from-primary/5 to-accent/5">
                <SheetTitle className="flex items-center gap-3 text-right">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">خدمات {fetchingProvider?.name_ar}</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      {isFetchingServices ? 'جاري جلب الخدمات...' : 
                        fetchedServices ? `${fetchedServices.totalServices.toLocaleString('ar-SA')} خدمة في ${fetchedServices.categories.length} قسم` : ''}
                    </p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {isFetchingServices ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <div>
                      <p className="font-medium">جاري جلب الخدمات...</p>
                      <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
                    </div>
                  </div>
                </div>
              ) : fetchedServices ? (
                <>
                  {/* Stats Bar */}
                  <div className="p-4 border-b bg-muted/30">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 rounded-lg bg-background">
                        <p className="text-2xl font-bold text-primary">{fetchedServices.totalServices.toLocaleString('ar-SA')}</p>
                        <p className="text-[10px] text-muted-foreground">خدمة</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background">
                        <p className="text-2xl font-bold text-blue-500">{fetchedServices.categories.length}</p>
                        <p className="text-[10px] text-muted-foreground">قسم</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background">
                        <p className="text-2xl font-bold text-green-500">${fetchedServices.minPrice.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">أقل سعر</p>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="p-4 border-b space-y-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث في الخدمات..."
                        value={serviceSearchQuery}
                        onChange={(e) => setServiceSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <Select value={selectedServiceCategory} onValueChange={setSelectedServiceCategory}>
                      <SelectTrigger>
                        <Layers className="h-4 w-4 ml-2" />
                        <SelectValue placeholder="جميع الأقسام" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأقسام ({fetchedServices.totalServices})</SelectItem>
                        {fetchedServices.categories.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>
                            {cat.name} ({cat.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Services List */}
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                      {filteredServices.slice(0, 100).map((service, index) => (
                        <motion.div
                          key={service.service}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  #{service.service}
                                </Badge>
                                {(service.refill === true || service.refill === 'true') && (
                                  <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                                    ♻️ Refill
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium text-foreground line-clamp-2">{service.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{service.category}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                <span>Min: {parseInt(service.min).toLocaleString('ar-SA')}</span>
                                <span>Max: {parseInt(service.max).toLocaleString('ar-SA')}</span>
                              </div>
                            </div>
                            <div className="text-left shrink-0">
                              <p className="text-sm font-bold text-primary">${parseFloat(service.rate).toFixed(4)}</p>
                              <p className="text-[10px] text-muted-foreground">لكل 1000</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {filteredServices.length > 100 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          عرض أول 100 خدمة من أصل {filteredServices.length}
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Import Button */}
                  <div className="p-4 border-t bg-background">
                    {importProgress ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{importProgress.status}</span>
                          <span>{importProgress.current} / {importProgress.total}</span>
                        </div>
                        <Progress value={(importProgress.current / importProgress.total) * 100} />
                      </div>
                    ) : (
                      <Button 
                        className="w-full gap-2" 
                        onClick={handleImportServices}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        تحديث/استيراد الخدمات مع الترجمة
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">لا توجد بيانات</p>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                {selectedProvider ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {selectedProvider ? 'تعديل المزود' : 'إضافة مزود جديد'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Provider Names */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    الاسم (English)
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Provider Name"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar" className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    الاسم (عربي)
                  </Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="اسم المزود"
                  />
                </div>
              </div>
              
              {/* API Configuration Section */}
              <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  إعدادات API
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="api_url">رابط API</Label>
                  <Input
                    id="api_url"
                    value={formData.api_url}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    placeholder="https://provider.com/api/v2"
                    dir="ltr"
                    className="text-left font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_key">مفتاح API</Label>
                  <Input
                    id="api_key"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="أدخل مفتاح API"
                    dir="ltr"
                    type="password"
                    className="text-left font-mono text-sm"
                  />
                </div>
              </div>
              
              {/* Profit & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profit_margin">نسبة الربح (%)</Label>
                  <Input
                    id="profit_margin"
                    type="number"
                    min="0"
                    max="500"
                    value={formData.profit_margin}
                    onChange={(e) => setFormData({ ...formData, profit_margin: Number(e.target.value) })}
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">تصنيف المزود</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.labelAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">ملاحظات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                  className="h-20 resize-none"
                />
              </div>
              
              {/* Toggle Settings */}
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="cursor-pointer flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    تفعيل المزود
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_default" className="cursor-pointer flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    تعيين كمزود افتراضي
                  </Label>
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedProvider ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                حذف المزود
              </AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف المزود "{selectedProvider?.name_ar}"؟ 
                سيتم فصل جميع الخدمات المرتبطة به.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => selectedProvider && deleteMutation.mutate(selectedProvider.id)}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminApiProviders;
