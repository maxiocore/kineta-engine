import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  Download,
  Loader2,
  Package,
  FolderTree,
  Check,
  X,
  RefreshCw,
  DollarSign,
  Star,
  Filter,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// =============== الأنواع ===============
interface Provider {
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
}

interface CategoryNode {
  name: string;
  count: number;
  services: ProviderService[];
  minPrice: number;
  maxPrice: number;
  refillCount: number;
}

interface Props {
  المزود: Provider | null;
  مفتوح: boolean;
  عند_الاغلاق: () => void;
  عند_اكتمال_الاستيراد?: () => void;
}

// =============== الدوال المساعدة ===============
const translateName = (name: string): string => {
  const platforms: Record<string, string> = {
    'instagram': 'انستقرام',
    'facebook': 'فيسبوك',
    'twitter': 'تويتر',
    'youtube': 'يوتيوب',
    'tiktok': 'تيك توك',
    'telegram': 'تيليجرام',
    'snapchat': 'سناب شات',
  };

  const types: Record<string, string> = {
    'followers': 'متابعين',
    'likes': 'لايكات',
    'views': 'مشاهدات',
    'comments': 'تعليقات',
    'subscribers': 'مشتركين',
  };

  let translated = name.toLowerCase();
  
  for (const [en, ar] of Object.entries(platforms)) {
    translated = translated.replace(new RegExp(en, 'gi'), ar);
  }
  
  for (const [en, ar] of Object.entries(types)) {
    translated = translated.replace(new RegExp(en, 'gi'), ar);
  }

  return translated.charAt(0).toUpperCase() + translated.slice(1);
};

const hasRefill = (s: ProviderService): boolean => 
  s.refill === true || s.refill === 'true' || s.refill === '1';

const hasCancel = (s: ProviderService): boolean => 
  s.cancel === true || s.cancel === 'true' || s.cancel === '1';

// =============== المكون الرئيسي ===============
export const ServiceImportDialog = ({
  المزود,
  مفتوح,
  عند_الاغلاق,
  عند_اكتمال_الاستيراد,
}: Props) => {
  const queryClient = useQueryClient();
  
  // الحالات
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [categories, setCategories] = useState<Map<string, CategoryNode>>(new Map());
  const [searchText, setSearchText] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string | number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // خيارات الاستيراد
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [applyMargin, setApplyMargin] = useState(true);

  // جلب الفئات
  const { data: dbCategories = [] } = useQuery({
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

  // جلب الخدمات الموجودة
  const { data: existingServices = [] } = useQuery({
    queryKey: ['existing-services', المزود?.id],
    queryFn: async () => {
      if (!المزود) return [];
      const { data, error } = await supabase
        .from('services')
        .select('external_service_id')
        .eq('provider_id', المزود.id);
      if (error) throw error;
      return data.map(s => s.external_service_id);
    },
    enabled: !!المزود,
  });

  // بناء شجرة الأقسام
  const buildTree = useCallback((servicesList: ProviderService[]) => {
    const tree = new Map<string, CategoryNode>();

    servicesList.forEach(service => {
      const catName = service.category;
      const price = parseFloat(service.rate) || 0;

      if (!tree.has(catName)) {
        tree.set(catName, {
          name: catName,
          count: 0,
          services: [],
          minPrice: Infinity,
          maxPrice: 0,
          refillCount: 0,
        });
      }

      const node = tree.get(catName)!;
      node.count++;
      node.services.push(service);
      node.minPrice = Math.min(node.minPrice, price);
      node.maxPrice = Math.max(node.maxPrice, price);
      if (hasRefill(service)) node.refillCount++;
    });

    tree.forEach(node => {
      if (node.minPrice === Infinity) node.minPrice = 0;
    });

    return tree;
  }, []);

  // الإحصائيات
  const stats = useMemo(() => {
    const prices = services.map(s => parseFloat(s.rate) || 0).filter(p => p > 0);
    const existingCount = services.filter(s => existingServices.includes(String(s.service))).length;
    
    return {
      total: services.length,
      categories: categories.size,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      selected: selectedServices.size,
      existing: existingCount,
      newServices: services.length - existingCount,
    };
  }, [services, categories, selectedServices, existingServices]);

  // تصفية الخدمات
  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return categories;

    const filtered = new Map<string, CategoryNode>();
    categories.forEach((node, key) => {
      const matchingServices = node.services.filter(s => 
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.category.toLowerCase().includes(searchText.toLowerCase()) ||
        String(s.service).includes(searchText)
      );
      
      if (matchingServices.length > 0 || key.toLowerCase().includes(searchText.toLowerCase())) {
        filtered.set(key, {
          ...node,
          services: matchingServices.length > 0 ? matchingServices : node.services,
          count: matchingServices.length > 0 ? matchingServices.length : node.count,
        });
      }
    });
    return filtered;
  }, [categories, searchText]);

  // جلب الخدمات من المزود
  const fetchServices = async () => {
    if (!المزود) return;

    setIsLoading(true);
    setServices([]);
    setCategories(new Map());
    setSelectedServices(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('provider-services', {
        body: { provider_id: المزود.id }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const servicesList = data.services || [];
      setServices(servicesList);
      setCategories(buildTree(servicesList));
      
      toast.success(`تم جلب ${servicesList.length} خدمة بنجاح`);
    } catch (error) {
      console.error('خطأ في جلب الخدمات:', error);
      toast.error('فشل في جلب الخدمات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      setIsLoading(false);
    }
  };

  // تبديل تحديد قسم
  const toggleCategory = (catName: string) => {
    const category = categories.get(catName);
    if (!category) return;

    const allSelected = category.services.every(s => selectedServices.has(s.service));
    
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        category.services.forEach(s => newSet.delete(s.service));
      } else {
        category.services.forEach(s => newSet.add(s.service));
      }
      return newSet;
    });
  };

  // تبديل تحديد خدمة
  const toggleService = (serviceId: string | number) => {
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

  // تحديد الكل
  const selectAll = () => {
    const allIds = services.map(s => s.service);
    setSelectedServices(new Set(allIds));
  };

  // إلغاء تحديد الكل
  const clearSelection = () => {
    setSelectedServices(new Set());
  };

  // تحديد الجديدة فقط
  const selectNewOnly = () => {
    const newIds = services
      .filter(s => !existingServices.includes(String(s.service)))
      .map(s => s.service);
    setSelectedServices(new Set(newIds));
  };

  // استيراد الخدمات
  const importServices = async () => {
    if (!المزود || selectedServices.size === 0) return;

    setIsImporting(true);
    const selected = services.filter(s => selectedServices.has(s.service));
    let success = 0;
    let failed = 0;

    setImportProgress({ current: 0, total: selected.length, status: 'جاري الاستيراد...' });

    try {
      for (let i = 0; i < selected.length; i++) {
        const service = selected[i];
        setImportProgress({ current: i + 1, total: selected.length, status: service.name.slice(0, 40) + '...' });

        try {
          const { data: existing } = await supabase
            .from('services')
            .select('id')
            .eq('external_service_id', String(service.service))
            .eq('provider_id', المزود.id)
            .single();

          const basePrice = parseFloat(service.rate) || 0;
          const finalPrice = applyMargin
            ? basePrice * (1 + (المزود.profit_margin / 100))
            : basePrice;

          const features = {
            min: parseInt(service.min) || 0,
            max: parseInt(service.max) || 0,
            type: service.type || 'default',
            refill: hasRefill(service),
            cancel: hasCancel(service),
          };

          const serviceData = {
            name: autoTranslate ? translateName(service.name) : service.name,
            description: service.desc || null,
            price: finalPrice,
            external_service_id: String(service.service),
            provider_id: المزود.id,
            category: service.category,
            category_id: targetCategory || null,
            features: features,
            status: 'active' as const,
          };

          if (existing && updateExisting) {
            await supabase.from('services').update(serviceData).eq('id', existing.id);
            success++;
          } else if (!existing) {
            await supabase.from('services').insert(serviceData);
            success++;
          }
        } catch (err) {
          console.error('خطأ في استيراد الخدمة:', service.service, err);
          failed++;
        }
      }

      await supabase
        .from('api_providers')
        .update({ 
          last_sync_at: new Date().toISOString(),
          services_count: success,
        })
        .eq('id', المزود.id);

      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['existing-services', المزود.id] });

      toast.success(`تم الاستيراد! ✅ ${success} نجاح | ❌ ${failed} فشل`);
      عند_اكتمال_الاستيراد?.();
      clearSelection();
    } catch (error) {
      console.error('خطأ في الاستيراد:', error);
      toast.error('فشل في الاستيراد');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // تبديل فتح القسم
  const toggleExpand = (catName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(catName)) {
        newSet.delete(catName);
      } else {
        newSet.add(catName);
      }
      return newSet;
    });
  };

  // إعادة تعيين عند الإغلاق
  useEffect(() => {
    if (!مفتوح) {
      setServices([]);
      setCategories(new Map());
      setSelectedServices(new Set());
      setSearchText('');
      setExpandedCategories(new Set());
    }
  }, [مفتوح]);

  // لا نعرض شيء إذا لم يكن هناك مزود
  if (!المزود) {
    return null;
  }

  return (
    <Dialog open={مفتوح} onOpenChange={عند_الاغلاق}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0" dir="rtl">
        {/* الرأس */}
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">جلب خدمات المزود</h3>
              <p className="text-sm text-muted-foreground font-normal">
                {المزود.name_ar} • هامش الربح: {المزود.profit_margin}%
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* شريط الأدوات */}
          <div className="p-4 border-b space-y-3 shrink-0">
            {/* الإحصائيات */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="p-2 text-center">
                <div className="text-lg font-bold text-primary">{stats.total}</div>
                <div className="text-xs text-muted-foreground">إجمالي</div>
              </Card>
              <Card className="p-2 text-center">
                <div className="text-lg font-bold text-blue-500">{stats.categories}</div>
                <div className="text-xs text-muted-foreground">أقسام</div>
              </Card>
              <Card className="p-2 text-center">
                <div className="text-lg font-bold text-green-500">{stats.newServices}</div>
                <div className="text-xs text-muted-foreground">جديدة</div>
              </Card>
              <Card className="p-2 text-center">
                <div className="text-lg font-bold text-amber-500">{stats.selected}</div>
                <div className="text-xs text-muted-foreground">محددة</div>
              </Card>
            </div>

            {/* البحث والأزرار */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الخدمات..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchServices}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="mr-1">جلب</span>
              </Button>
              <Button variant="outline" size="sm" onClick={selectAll}>
                <Check className="h-4 w-4 ml-1" />
                الكل
              </Button>
              <Button variant="outline" size="sm" onClick={selectNewOnly}>
                <Star className="h-4 w-4 ml-1" />
                الجديدة
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4 ml-1" />
                مسح
              </Button>
            </div>
          </div>

          {/* قائمة الأقسام والخدمات */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">جاري جلب الخدمات...</p>
                  </div>
                </div>
              ) : services.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-3">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">اضغط على زر "جلب" لجلب الخدمات</p>
                  </div>
                </div>
              ) : (
                Array.from(filteredCategories.entries()).map(([catName, category]) => {
                  const isExpanded = expandedCategories.has(catName);
                  const allSelected = category.services.every(s => selectedServices.has(s.service));
                  const someSelected = category.services.some(s => selectedServices.has(s.service));

                  return (
                    <Card key={catName} className="overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpand(catName)}
                      >
                        <Checkbox
                          checked={allSelected}
                          className={someSelected && !allSelected ? 'opacity-50' : ''}
                          onCheckedChange={() => toggleCategory(catName)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FolderTree className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{catName}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.count} خدمة • ${category.minPrice.toFixed(4)} - ${category.maxPrice.toFixed(4)}
                          </p>
                        </div>
                        <Badge variant="secondary">{category.count}</Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t bg-muted/30">
                          {category.services.map(service => {
                            const isSelected = selectedServices.has(service.service);
                            const isExisting = existingServices.includes(String(service.service));
                            
                            return (
                              <div
                                key={service.service}
                                className={`flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-background/50 cursor-pointer ${
                                  isSelected ? 'bg-primary/5' : ''
                                } ${isExisting ? 'opacity-60' : ''}`}
                                onClick={() => toggleService(service.service)}
                              >
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleService(service.service)} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{service.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {service.service} • ${service.rate} • {service.min}-{service.max}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isExisting && (
                                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                                      موجود
                                    </Badge>
                                  )}
                                  {hasRefill(service) && <span title="تعبئة">♻️</span>}
                                  {hasCancel(service) && <span title="إلغاء">❌</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* الفوتر */}
        <div className="p-4 border-t space-y-3 shrink-0">
          {/* خيارات الاستيراد */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} id="translate" />
              <Label htmlFor="translate" className="text-sm">ترجمة تلقائية</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={updateExisting} onCheckedChange={setUpdateExisting} id="update" />
              <Label htmlFor="update" className="text-sm">تحديث الموجود</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={applyMargin} onCheckedChange={setApplyMargin} id="margin" />
              <Label htmlFor="margin" className="text-sm">تطبيق الهامش</Label>
            </div>
            <Select value={targetCategory || "__none__"} onValueChange={(v) => setTargetCategory(v === "__none__" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="الفئة المستهدفة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">بدون فئة</SelectItem>
                {dbCategories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* شريط التقدم */}
          {importProgress && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{importProgress.status}</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <Progress value={(importProgress.current / importProgress.total) * 100} />
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={عند_الاغلاق}>
              إلغاء
            </Button>
            <Button
              onClick={importServices}
              disabled={selectedServices.size === 0 || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              استيراد {selectedServices.size} خدمة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceImportDialog;
