import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Loader2,
  Package,
  FolderTree,
  Layers,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Filter,
  RefreshCw,
  Zap,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ArrowUpDown,
  Grid3X3,
  List,
  Eye,
  Settings,
  Sparkles,
  Hash,
  Activity,
  BarChart3,
  GitBranch,
  ArrowRight,
  ChevronUp,
  CircleDot,
  Target,
  Gauge,
  Heart,
  HeartOff,
  Save,
  BookmarkPlus,
} from 'lucide-react';

// Types
interface ApiProvider {
  id: string;
  name: string;
  name_ar: string;
  profit_margin: number;
  is_active: boolean;
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
  parsed?: {
    type: string;
    min: number;
    max: number;
    rate: number;
    refill: boolean;
    cancel: boolean;
    dripfeed: boolean;
  };
}

interface CategoryNode {
  name: string;
  count: number;
  services: ProviderService[];
  subcategories: Map<string, SubcategoryNode>;
  hasRefill: boolean;
  hasCancel: boolean;
  hasDripfeed: boolean;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  isExpanded: boolean;
  isSelected: boolean;
}

interface SubcategoryNode {
  name: string;
  count: number;
  services: ProviderService[];
  hasRefill: boolean;
  hasCancel: boolean;
  hasDripfeed: boolean;
  minPrice: number;
  maxPrice: number;
  isSelected: boolean;
}

interface FetcherStats {
  totalServices: number;
  totalCategories: number;
  totalSubcategories: number;
  priceRange: { min: number; max: number; avg: number };
  featureStats: {
    refillCount: number;
    cancelCount: number;
    dripfeedCount: number;
  };
}

interface AdvancedServicesFetcherProps {
  provider: ApiProvider | null;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

// Helper functions
const extractSubcategory = (categoryName: string): { main: string; sub: string | null } => {
  // Try to extract subcategory from patterns like "Instagram - Followers" or "YouTube | Views"
  const separators = [' - ', ' | ', ' > ', ' » ', ': '];
  for (const sep of separators) {
    if (categoryName.includes(sep)) {
      const [main, sub] = categoryName.split(sep, 2);
      return { main: main.trim(), sub: sub?.trim() || null };
    }
  }
  return { main: categoryName, sub: null };
};

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
    'threads': 'ثريدز',
    'whatsapp': 'واتساب',
  };

  const serviceTypeMap: Record<string, string> = {
    'followers': 'متابعين',
    'likes': 'لايكات',
    'views': 'مشاهدات',
    'comments': 'تعليقات',
    'subscribers': 'مشتركين',
    'shares': 'مشاركات',
    'saves': 'حفظ',
    'reactions': 'تفاعلات',
    'impressions': 'انطباعات',
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

export const AdvancedServicesFetcher = ({
  provider,
  isOpen,
  onClose,
  onImportComplete,
}: AdvancedServicesFetcherProps) => {
  const queryClient = useQueryClient();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [categoryTree, setCategoryTree] = useState<Map<string, CategoryNode>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tree' | 'list' | 'selected'>('tree');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'price'>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [applyProfitMargin, setApplyProfitMargin] = useState(true);
  
  // Selection state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<string | number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Favorites state
  const [favoriteCategories, setFavoriteCategories] = useState<Set<string>>(new Set());

  // Fetch system categories
  const { data: systemCategories = [] } = useQuery({
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

  // Fetch favorite categories for this provider
  const { data: savedFavorites = [], refetch: refetchFavorites } = useQuery({
    queryKey: ['favorite-import-categories', provider?.id],
    queryFn: async () => {
      if (!provider) return [];
      const { data, error } = await supabase
        .from('favorite_import_categories')
        .select('*')
        .eq('provider_id', provider.id);
      if (error) throw error;
      return data;
    },
    enabled: !!provider,
  });

  // Load favorites into state when data changes
  useEffect(() => {
    if (savedFavorites.length > 0) {
      const favSet = new Set(savedFavorites.map((f: any) => f.category_name));
      setFavoriteCategories(favSet);
    }
  }, [savedFavorites]);

  // Build category tree from services
  const buildCategoryTree = useCallback((services: ProviderService[]) => {
    const tree = new Map<string, CategoryNode>();

    services.forEach(service => {
      const { main, sub } = extractSubcategory(service.category);
      const rate = parseFloat(service.rate) || 0;
      const hasRefill = service.refill === true || service.refill === 'true';
      const hasCancel = service.cancel === true || service.cancel === 'true';
      const hasDripfeed = service.dripfeed === true || service.dripfeed === 'true';

      if (!tree.has(main)) {
        tree.set(main, {
          name: main,
          count: 0,
          services: [],
          subcategories: new Map(),
          hasRefill: false,
          hasCancel: false,
          hasDripfeed: false,
          minPrice: Infinity,
          maxPrice: 0,
          avgPrice: 0,
          isExpanded: false,
          isSelected: false,
        });
      }

      const categoryNode = tree.get(main)!;
      categoryNode.count++;
      categoryNode.services.push(service);
      categoryNode.hasRefill = categoryNode.hasRefill || hasRefill;
      categoryNode.hasCancel = categoryNode.hasCancel || hasCancel;
      categoryNode.hasDripfeed = categoryNode.hasDripfeed || hasDripfeed;
      categoryNode.minPrice = Math.min(categoryNode.minPrice, rate);
      categoryNode.maxPrice = Math.max(categoryNode.maxPrice, rate);

      if (sub) {
        if (!categoryNode.subcategories.has(sub)) {
          categoryNode.subcategories.set(sub, {
            name: sub,
            count: 0,
            services: [],
            hasRefill: false,
            hasCancel: false,
            hasDripfeed: false,
            minPrice: Infinity,
            maxPrice: 0,
            isSelected: false,
          });
        }

        const subNode = categoryNode.subcategories.get(sub)!;
        subNode.count++;
        subNode.services.push(service);
        subNode.hasRefill = subNode.hasRefill || hasRefill;
        subNode.hasCancel = subNode.hasCancel || hasCancel;
        subNode.hasDripfeed = subNode.hasDripfeed || hasDripfeed;
        subNode.minPrice = Math.min(subNode.minPrice, rate);
        subNode.maxPrice = Math.max(subNode.maxPrice, rate);
      }
    });

    // Calculate averages
    tree.forEach(node => {
      const total = node.services.reduce((sum, s) => sum + (parseFloat(s.rate) || 0), 0);
      node.avgPrice = node.count > 0 ? total / node.count : 0;
      if (node.minPrice === Infinity) node.minPrice = 0;
    });

    return tree;
  }, []);

  // Stats
  const stats: FetcherStats = useMemo(() => {
    let totalSubcategories = 0;
    let refillCount = 0;
    let cancelCount = 0;
    let dripfeedCount = 0;

    categoryTree.forEach(cat => {
      totalSubcategories += cat.subcategories.size;
    });

    services.forEach(s => {
      if (s.refill === true || s.refill === 'true') refillCount++;
      if (s.cancel === true || s.cancel === 'true') cancelCount++;
      if (s.dripfeed === true || s.dripfeed === 'true') dripfeedCount++;
    });

    const prices = services.map(s => parseFloat(s.rate) || 0).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    return {
      totalServices: services.length,
      totalCategories: categoryTree.size,
      totalSubcategories,
      priceRange: { min: minPrice, max: maxPrice, avg: avgPrice },
      featureStats: { refillCount, cancelCount, dripfeedCount },
    };
  }, [services, categoryTree]);

  // Fetch services
  const fetchServices = async () => {
    if (!provider) return;

    setIsLoading(true);
    setServices([]);
    setCategoryTree(new Map());
    setSelectedCategories(new Set());
    setSelectedServices(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('provider-services', {
        body: { provider_id: provider.id }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const servicesArray = data.services || [];
      setServices(servicesArray);
      setCategoryTree(buildCategoryTree(servicesArray));

      toast.success(`تم جلب ${servicesArray.length} خدمة من ${provider.name_ar}`);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('فشل في جلب الخدمات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      setIsLoading(false);
    }
  };

  // Category selection handlers
  const toggleCategoryExpand = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleCategorySelect = (categoryName: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
        // Remove all services from this category
        const cat = categoryTree.get(categoryName);
        if (cat) {
          cat.services.forEach(s => {
            setSelectedServices(prev => {
              const newServices = new Set(prev);
              newServices.delete(s.service);
              return newServices;
            });
          });
        }
      } else {
        newSet.add(categoryName);
        // Add all services from this category
        const cat = categoryTree.get(categoryName);
        if (cat) {
          setSelectedServices(prev => {
            const newServices = new Set(prev);
            cat.services.forEach(s => newServices.add(s.service));
            return newServices;
          });
        }
      }
      return newSet;
    });
  };

  const toggleServiceSelect = (serviceId: string | number) => {
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

  const selectAll = () => {
    const allServices = new Set<string | number>();
    const allCategories = new Set<string>();
    services.forEach(s => allServices.add(s.service));
    categoryTree.forEach((_, key) => allCategories.add(key));
    setSelectedServices(allServices);
    setSelectedCategories(allCategories);
  };

  const clearSelection = () => {
    setSelectedServices(new Set());
    setSelectedCategories(new Set());
  };

  // Select favorites
  const selectFavorites = () => {
    if (favoriteCategories.size === 0) {
      toast.error('لا توجد أقسام مفضلة محفوظة');
      return;
    }
    
    const favServices = new Set<string | number>();
    services.forEach(s => {
      const { main } = extractSubcategory(s.category);
      if (favoriteCategories.has(main)) {
        favServices.add(s.service);
      }
    });
    
    setSelectedServices(favServices);
    setSelectedCategories(favoriteCategories);
    toast.success(`تم تحديد ${favServices.size} خدمة من الأقسام المفضلة`);
  };

  // Toggle favorite category
  const toggleFavoriteCategory = async (categoryName: string) => {
    if (!provider) return;
    
    const isFavorite = favoriteCategories.has(categoryName);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorite_import_categories')
          .delete()
          .eq('provider_id', provider.id)
          .eq('category_name', categoryName);
        
        setFavoriteCategories(prev => {
          const newSet = new Set(prev);
          newSet.delete(categoryName);
          return newSet;
        });
        toast.success('تم إزالة القسم من المفضلة');
      } else {
        // Add to favorites
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('يجب تسجيل الدخول');
          return;
        }
        
        await supabase
          .from('favorite_import_categories')
          .insert({
            user_id: user.id,
            provider_id: provider.id,
            category_name: categoryName,
            target_category_id: targetCategoryId || null,
            auto_translate: autoTranslate,
            apply_profit_margin: applyProfitMargin,
          });
        
        setFavoriteCategories(prev => {
          const newSet = new Set(prev);
          newSet.add(categoryName);
          return newSet;
        });
        toast.success('تم حفظ القسم في المفضلة');
      }
      
      refetchFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('حدث خطأ');
    }
  };

  // Save selected as favorites
  const saveSelectedAsFavorites = async () => {
    if (!provider || selectedCategories.size === 0) {
      toast.error('يرجى تحديد أقسام أولاً');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول');
        return;
      }
      
      const categoriesToSave = Array.from(selectedCategories).filter(
        cat => !favoriteCategories.has(cat)
      );
      
      if (categoriesToSave.length === 0) {
        toast.info('جميع الأقسام المحددة موجودة بالفعل في المفضلة');
        return;
      }
      
      const inserts = categoriesToSave.map(categoryName => ({
        user_id: user.id,
        provider_id: provider.id,
        category_name: categoryName,
        target_category_id: targetCategoryId || null,
        auto_translate: autoTranslate,
        apply_profit_margin: applyProfitMargin,
      }));
      
      await supabase
        .from('favorite_import_categories')
        .upsert(inserts, { onConflict: 'user_id,provider_id,category_name' });
      
      setFavoriteCategories(prev => {
        const newSet = new Set(prev);
        categoriesToSave.forEach(cat => newSet.add(cat));
        return newSet;
      });
      
      refetchFavorites();
      toast.success(`تم حفظ ${categoriesToSave.length} قسم في المفضلة`);
    } catch (error) {
      console.error('Error saving favorites:', error);
      toast.error('حدث خطأ في الحفظ');
    }
  };

  // Filter and sort
  const filteredCategories = useMemo(() => {
    let cats = Array.from(categoryTree.entries());

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      cats = cats.filter(([name, node]) =>
        name.toLowerCase().includes(query) ||
        node.services.some(s => 
          s.name.toLowerCase().includes(query) ||
          String(s.service).includes(query)
        )
      );
    }

    cats.sort((a, b) => {
      const [nameA, nodeA] = a;
      const [nameB, nodeB] = b;
      
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = nameA.localeCompare(nameB);
          break;
        case 'count':
          comparison = nodeA.count - nodeB.count;
          break;
        case 'price':
          comparison = nodeA.avgPrice - nodeB.avgPrice;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return cats;
  }, [categoryTree, searchQuery, sortBy, sortOrder]);

  // Import services
  const handleImport = async () => {
    if (!provider || selectedServices.size === 0) {
      toast.error('يرجى تحديد الخدمات للاستيراد');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedServices.size, status: 'جاري التحضير...' });

    try {
      const servicesToImport = services.filter(s => selectedServices.has(s.service));
      let imported = 0;
      let updated = 0;
      let errors = 0;

      for (let i = 0; i < servicesToImport.length; i++) {
        const service = servicesToImport[i];
        setImportProgress({
          current: i + 1,
          total: servicesToImport.length,
          status: `${service.name.slice(0, 40)}...`,
        });

        try {
          const { data: existingService } = await supabase
            .from('services')
            .select('id')
            .eq('external_service_id', String(service.service))
            .eq('provider_id', provider.id)
            .single();

          const basePrice = parseFloat(service.rate) || 0;
          const finalPrice = applyProfitMargin
            ? basePrice * (1 + (provider.profit_margin / 100))
            : basePrice;

          const features = {
            min: parseInt(service.min) || 0,
            max: parseInt(service.max) || 0,
            type: service.type || 'default',
            refill: service.refill === true || service.refill === 'true',
            cancel: service.cancel === true || service.cancel === 'true',
            dripfeed: service.dripfeed === true || service.dripfeed === 'true',
            average_time: service.average_time || null,
          };

          // Find the appropriate category based on the original service category
          const { main: mainCategory, sub: subCategory } = extractSubcategory(service.category);
          
          // If targetCategoryId is set, use it as the parent category
          // Otherwise, try to find or use the original category
          let finalCategoryId = targetCategoryId || null;
          let finalCategoryName = service.category;
          
          // If we have a target category, append the subcategory info to the name
          if (targetCategoryId && subCategory) {
            finalCategoryName = subCategory;
          } else if (targetCategoryId) {
            finalCategoryName = mainCategory;
          }

          const serviceData = {
            name: autoTranslate ? translateServiceName(service.name) : service.name,
            description: service.desc || null,
            price: finalPrice,
            external_service_id: String(service.service),
            provider_id: provider.id,
            category: finalCategoryName,
            category_id: finalCategoryId,
            features,
            status: 'active' as const,
          };

          if (existingService && updateExisting) {
            await supabase
              .from('services')
              .update(serviceData)
              .eq('id', existingService.id);
            updated++;
          } else if (!existingService) {
            await supabase.from('services').insert(serviceData);
            imported++;
          }
        } catch (err) {
          console.error('Error importing service:', service.service, err);
          errors++;
        }
      }

      await supabase
        .from('api_providers')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', provider.id);

      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });

      toast.success(
        `تم الاستيراد! ${imported} جديدة | ${updated} تحديث | ${errors} أخطاء`,
        { duration: 5000 }
      );

      onImportComplete?.();
      clearSelection();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('فشل في الاستيراد');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Auto-fetch on open
  useEffect(() => {
    if (isOpen && provider && services.length === 0) {
      fetchServices();
    }
  }, [isOpen, provider]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setServices([]);
      setCategoryTree(new Map());
      setSelectedCategories(new Set());
      setSelectedServices(new Set());
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:max-w-3xl p-0 overflow-hidden">
        <div className="flex flex-col h-full" dir="rtl">
          {/* Header */}
          <SheetHeader className="p-4 border-b bg-gradient-to-l from-primary/10 via-accent/5 to-background">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold">جلب الخدمات المتقدم</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    {provider?.name_ar || 'غير محدد'}
                  </p>
                </div>
              </SheetTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchServices}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </SheetHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="h-16 w-16 text-primary mx-auto" />
                </motion.div>
                <div>
                  <p className="font-semibold text-lg">جاري جلب الخدمات...</p>
                  <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
                </div>
              </div>
            </div>
          ) : services.length > 0 ? (
            <>
              {/* Stats Bar */}
              <div className="p-4 border-b bg-muted/30">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                  >
                    <Package className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-primary">{stats.totalServices.toLocaleString('ar-SA')}</p>
                    <p className="text-[10px] text-muted-foreground">خدمة</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20"
                  >
                    <FolderTree className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-500">{stats.totalCategories}</p>
                    <p className="text-[10px] text-muted-foreground">قسم رئيسي</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20"
                  >
                    <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-500">${stats.priceRange.min.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">أقل سعر</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20"
                  >
                    <Check className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-500">{selectedServices.size}</p>
                    <p className="text-[10px] text-muted-foreground">محدد</p>
                  </motion.div>
                </div>

                {/* Feature badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                    <RefreshCw className="h-3 w-3" />
                    إعادة التعبئة: {stats.featureStats.refillCount}
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
                    <X className="h-3 w-3" />
                    قابل للإلغاء: {stats.featureStats.cancelCount}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                    <Activity className="h-3 w-3" />
                    التنقيط: {stats.featureStats.dripfeedCount}
                  </Badge>
                </div>
              </div>

              {/* Tabs & Search */}
              <div className="p-4 border-b space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في الأقسام والخدمات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="w-32">
                        <ArrowUpDown className="h-4 w-4 ml-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">عدد الخدمات</SelectItem>
                        <SelectItem value="name">الاسم</SelectItem>
                        <SelectItem value="price">السعر</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Selection actions */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={selectAll} className="text-xs h-8">
                      تحديد الكل
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection} className="text-xs h-8">
                      إلغاء التحديد
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectFavorites}
                      className="text-xs h-8 gap-1"
                      disabled={favoriteCategories.size === 0}
                    >
                      <Heart className="h-3 w-3 text-pink-500" />
                      المفضلة ({favoriteCategories.size})
                    </Button>
                    {selectedCategories.size > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={saveSelectedAsFavorites}
                        className="text-xs h-8 gap-1 border-pink-500/30 text-pink-600 hover:bg-pink-500/10"
                      >
                        <BookmarkPlus className="h-3 w-3" />
                        حفظ كمفضلة
                      </Button>
                    )}
                  </div>
                  <Badge variant="secondary" className="h-8 px-3">
                    {selectedServices.size} / {services.length} خدمة
                  </Badge>
                </div>
              </div>

              {/* Category Tree */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  <AnimatePresence>
                    {filteredCategories.map(([categoryName, categoryNode], index) => (
                      <motion.div
                        key={categoryName}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Collapsible
                          open={expandedCategories.has(categoryName)}
                          onOpenChange={() => toggleCategoryExpand(categoryName)}
                        >
                          <div className="group rounded-xl border bg-card hover:bg-accent/5 transition-colors overflow-hidden">
                            <div className="flex items-center gap-3 p-3">
                              {/* Checkbox */}
                              <Checkbox
                                checked={selectedCategories.has(categoryName)}
                                onCheckedChange={() => toggleCategorySelect(categoryName)}
                                className="data-[state=checked]:bg-primary"
                              />

                              {/* Expand button */}
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  {expandedCategories.has(categoryName) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>

                              {/* Category info */}
                              <div className="flex-1 min-w-0" onClick={() => toggleCategoryExpand(categoryName)}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{categoryName}</span>
                                  <Badge variant="secondary" className="text-[10px] h-5">
                                    {categoryNode.count}
                                  </Badge>
                                  {categoryNode.subcategories.size > 0 && (
                                    <Badge variant="outline" className="text-[10px] h-5 gap-0.5">
                                      <GitBranch className="h-2.5 w-2.5" />
                                      {categoryNode.subcategories.size}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-muted-foreground">
                                    ${categoryNode.minPrice.toFixed(3)} - ${categoryNode.maxPrice.toFixed(3)}
                                  </span>
                                  <div className="flex gap-1">
                                    {categoryNode.hasRefill && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <RefreshCw className="h-3 w-3 text-green-500" />
                                          </TooltipTrigger>
                                          <TooltipContent>إعادة التعبئة متاحة</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {categoryNode.hasCancel && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <X className="h-3 w-3 text-red-500" />
                                          </TooltipTrigger>
                                          <TooltipContent>قابل للإلغاء</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {categoryNode.hasDripfeed && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Activity className="h-3 w-3 text-blue-500" />
                                          </TooltipTrigger>
                                          <TooltipContent>التنقيط متاح</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Favorite button */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavoriteCategory(categoryName);
                                      }}
                                    >
                                      {favoriteCategories.has(categoryName) ? (
                                        <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                                      ) : (
                                        <Heart className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {favoriteCategories.has(categoryName) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Quick select all in category */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategorySelect(categoryName);
                                }}
                              >
                                {selectedCategories.has(categoryName) ? 'إلغاء' : 'تحديد الكل'}
                              </Button>
                            </div>

                            {/* Expanded content - subcategories and services */}
                            <CollapsibleContent>
                              <div className="border-t bg-muted/20 p-2 space-y-2 max-h-80 overflow-y-auto">
                                {/* Subcategories section */}
                                {categoryNode.subcategories.size > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-medium px-2 py-1">
                                      الفئات الفرعية ({categoryNode.subcategories.size})
                                    </p>
                                    {Array.from(categoryNode.subcategories.entries()).map(([subName, subNode]) => {
                                      const subKey = `${categoryName}::${subName}`;
                                      const isSubSelected = subNode.services.every(s => selectedServices.has(s.service));
                                      const isSubPartial = !isSubSelected && subNode.services.some(s => selectedServices.has(s.service));
                                      
                                      return (
                                        <div
                                          key={subKey}
                                          className={`flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors cursor-pointer mr-4 border-r-2 border-primary/20 ${
                                            isSubSelected ? 'bg-primary/10 border-l border-t border-b border-primary/20' : ''
                                          }`}
                                          onClick={() => {
                                            // Toggle all services in this subcategory
                                            setSelectedServices(prev => {
                                              const newSet = new Set(prev);
                                              if (isSubSelected) {
                                                subNode.services.forEach(s => newSet.delete(s.service));
                                              } else {
                                                subNode.services.forEach(s => newSet.add(s.service));
                                              }
                                              return newSet;
                                            });
                                          }}
                                        >
                                          <Checkbox
                                            checked={isSubSelected}
                                            className={`data-[state=checked]:bg-primary ${isSubPartial ? 'opacity-50' : ''}`}
                                          />
                                          <GitBranch className="h-3.5 w-3.5 text-primary/60" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium truncate">{subName}</span>
                                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                                                {subNode.count}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                              <span>${subNode.minPrice.toFixed(3)} - ${subNode.maxPrice.toFixed(3)}</span>
                                              <div className="flex gap-0.5">
                                                {subNode.hasRefill && <RefreshCw className="h-2.5 w-2.5 text-green-500" />}
                                                {subNode.hasCancel && <X className="h-2.5 w-2.5 text-red-500" />}
                                                {subNode.hasDripfeed && <Activity className="h-2.5 w-2.5 text-blue-500" />}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {/* Services section */}
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground font-medium px-2 py-1">
                                    الخدمات ({categoryNode.services.filter(s => !searchQuery || 
                                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      String(s.service).includes(searchQuery)
                                    ).length})
                                  </p>
                                  {categoryNode.services
                                    .filter(s => !searchQuery || 
                                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      String(s.service).includes(searchQuery)
                                    )
                                    .map(service => (
                                      <div
                                        key={service.service}
                                        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors cursor-pointer ${
                                          selectedServices.has(service.service) ? 'bg-primary/10 border border-primary/20' : ''
                                        }`}
                                        onClick={() => toggleServiceSelect(service.service)}
                                      >
                                        <Checkbox
                                          checked={selectedServices.has(service.service)}
                                          onCheckedChange={() => toggleServiceSelect(service.service)}
                                          className="data-[state=checked]:bg-primary"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm truncate">{service.name}</p>
                                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <span className="font-mono">#{service.service}</span>
                                            <span>•</span>
                                            <span>${parseFloat(service.rate).toFixed(4)}</span>
                                            <span>•</span>
                                            <span>{service.min}-{service.max}</span>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          {(service.refill === true || service.refill === 'true') && (
                                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                              <RefreshCw className="h-2.5 w-2.5 text-green-500" />
                                            </div>
                                          )}
                                          {(service.cancel === true || service.cancel === 'true') && (
                                            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                              <X className="h-2.5 w-2.5 text-red-500" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Import Footer */}
              <div className="p-4 border-t bg-muted/30 space-y-4">
                {/* Import Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="autoTranslate"
                      checked={autoTranslate}
                      onCheckedChange={setAutoTranslate}
                    />
                    <Label htmlFor="autoTranslate" className="text-xs cursor-pointer">
                      ترجمة تلقائية
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="updateExisting"
                      checked={updateExisting}
                      onCheckedChange={setUpdateExisting}
                    />
                    <Label htmlFor="updateExisting" className="text-xs cursor-pointer">
                      تحديث الموجود
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="applyProfitMargin"
                      checked={applyProfitMargin}
                      onCheckedChange={setApplyProfitMargin}
                    />
                    <Label htmlFor="applyProfitMargin" className="text-xs cursor-pointer">
                      نسبة الربح ({provider?.profit_margin}%)
                    </Label>
                  </div>
                  <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                    <SelectTrigger className="h-8 text-xs">
                      <FolderTree className="h-3 w-3 ml-1" />
                      <SelectValue placeholder="قسم مخصص" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الاحتفاظ بالأصلي</SelectItem>
                      {systemCategories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Progress or Button */}
                {importProgress ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[200px]">
                        {importProgress.status}
                      </span>
                      <span className="font-medium">
                        {importProgress.current}/{importProgress.total}
                      </span>
                    </div>
                    <Progress value={(importProgress.current / importProgress.total) * 100} />
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2 h-12 text-base font-semibold"
                    onClick={handleImport}
                    disabled={isImporting || selectedServices.size === 0}
                  >
                    {isImporting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                    استيراد {selectedServices.size} خدمة
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-lg">لا توجد بيانات</p>
                  <p className="text-sm text-muted-foreground">
                    اضغط على "تحديث" لجلب الخدمات
                  </p>
                </div>
                <Button onClick={fetchServices} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  جلب الخدمات
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedServicesFetcher;
