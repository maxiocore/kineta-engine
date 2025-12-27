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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
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
  ChevronDown,
  ChevronLeft,
  Check,
  X,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  Star,
  Heart,
  Save,
  Filter,
  Zap,
  TrendingUp,
  Clock,
  BarChart3,
  Layers,
  ArrowUpDown,
  Eye,
  Settings,
  Sparkles,
  Target,
  Gauge,
  Activity,
  AlertCircle,
  Info,
  Copy,
  Trash2,
  RotateCcw,
} from 'lucide-react';

// =============== الأنواع ===============
interface مزود {
  id: string;
  name: string;
  name_ar: string;
  profit_margin: number;
  is_active: boolean;
}

interface خدمة_مزود {
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

interface قسم {
  الاسم: string;
  العدد: number;
  الخدمات: خدمة_مزود[];
  الاقسام_الفرعية: Map<string, قسم_فرعي>;
  اقل_سعر: number;
  اعلى_سعر: number;
  متوسط_السعر: number;
  عدد_التعبئة: number;
  عدد_الالغاء: number;
}

interface قسم_فرعي {
  الاسم: string;
  العدد: number;
  الخدمات: خدمة_مزود[];
}

interface فلتر_متقدم {
  اقل_سعر: number;
  اعلى_سعر: number;
  التعبئة_فقط: boolean;
  الالغاء_فقط: boolean;
  التنقيط_فقط: boolean;
  الحد_الادنى: number;
  الحد_الاقصى: number;
}

interface خصائص_المكون {
  المزود: مزود | null;
  مفتوح: boolean;
  عند_الاغلاق: () => void;
  عند_اكتمال_الاستيراد?: () => void;
}

// =============== الدوال المساعدة ===============
const استخراج_القسم_الفرعي = (اسم_القسم: string): { رئيسي: string; فرعي: string | null } => {
  const فواصل = [' - ', ' | ', ' > ', ' » ', ': '];
  for (const فاصل of فواصل) {
    if (اسم_القسم.includes(فاصل)) {
      const [رئيسي, فرعي] = اسم_القسم.split(فاصل, 2);
      return { رئيسي: رئيسي.trim(), فرعي: فرعي?.trim() || null };
    }
  }
  return { رئيسي: اسم_القسم, فرعي: null };
};

const ترجمة_الاسم = (name: string): string => {
  const المنصات: Record<string, string> = {
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
    'pinterest': 'بينتريست',
    'twitch': 'تويتش',
    'discord': 'ديسكورد',
  };

  const الانواع: Record<string, string> = {
    'followers': 'متابعين',
    'likes': 'لايكات',
    'views': 'مشاهدات',
    'comments': 'تعليقات',
    'subscribers': 'مشتركين',
    'shares': 'مشاركات',
    'saves': 'حفظ',
    'reactions': 'تفاعلات',
    'impressions': 'انطباعات',
    'reach': 'وصول',
    'engagement': 'تفاعل',
    'story': 'ستوري',
    'reels': 'ريلز',
    'live': 'بث مباشر',
    'members': 'أعضاء',
    'post': 'منشور',
    'video': 'فيديو',
    'photo': 'صورة',
  };

  const الجودة: Record<string, string> = {
    'high quality': 'جودة عالية',
    'premium': 'مميز',
    'real': 'حقيقي',
    'fast': 'سريع',
    'instant': 'فوري',
    'slow': 'بطيء',
    'cheap': 'رخيص',
    'mix': 'مختلط',
    'active': 'نشط',
    'lifetime': 'مدى الحياة',
    'guaranteed': 'مضمون',
    'non drop': 'بدون نقص',
    'no drop': 'بدون نقص',
    'refill': 'تعويض',
  };

  let مترجم = name.toLowerCase();
  
  for (const [en, ar] of Object.entries(المنصات)) {
    مترجم = مترجم.replace(new RegExp(en, 'gi'), ar);
  }
  
  for (const [en, ar] of Object.entries(الانواع)) {
    مترجم = مترجم.replace(new RegExp(en, 'gi'), ar);
  }
  
  for (const [en, ar] of Object.entries(الجودة)) {
    مترجم = مترجم.replace(new RegExp(en, 'gi'), ar);
  }

  return مترجم.charAt(0).toUpperCase() + مترجم.slice(1);
};

const تنسيق_الرقم = (رقم: number): string => {
  if (رقم >= 1000000) return `${(رقم / 1000000).toFixed(1)}M`;
  if (رقم >= 1000) return `${(رقم / 1000).toFixed(1)}K`;
  return رقم.toLocaleString('ar-SA');
};

const هل_تعبئة = (خدمة: خدمة_مزود): boolean => 
  خدمة.refill === true || خدمة.refill === 'true' || خدمة.refill === '1';

const هل_الغاء = (خدمة: خدمة_مزود): boolean => 
  خدمة.cancel === true || خدمة.cancel === 'true' || خدمة.cancel === '1';

const هل_تنقيط = (خدمة: خدمة_مزود): boolean => 
  خدمة.dripfeed === true || خدمة.dripfeed === 'true' || خدمة.dripfeed === '1';

// =============== المكون الرئيسي ===============
export const ServiceImportDialog = ({
  المزود,
  مفتوح,
  عند_الاغلاق,
  عند_اكتمال_الاستيراد,
}: خصائص_المكون) => {
  const queryClient = useQueryClient();
  
  // =============== الحالات ===============
  const [جاري_التحميل, set_جاري_التحميل] = useState(false);
  const [الخدمات, set_الخدمات] = useState<خدمة_مزود[]>([]);
  const [شجرة_الاقسام, set_شجرة_الاقسام] = useState<Map<string, قسم>>(new Map());
  const [نص_البحث, set_نص_البحث] = useState('');
  const [التبويب_النشط, set_التبويب_النشط] = useState<'الاقسام' | 'الخدمات' | 'المحددة' | 'الاحصائيات'>('الاقسام');
  const [الترتيب, set_الترتيب] = useState<'العدد' | 'الاسم' | 'السعر'>('العدد');
  const [اتجاه_الترتيب, set_اتجاه_الترتيب] = useState<'تصاعدي' | 'تنازلي'>('تنازلي');
  
  // حالات الفلترة المتقدمة
  const [عرض_الفلاتر, set_عرض_الفلاتر] = useState(false);
  const [الفلتر, set_الفلتر] = useState<فلتر_متقدم>({
    اقل_سعر: 0,
    اعلى_سعر: 1000,
    التعبئة_فقط: false,
    الالغاء_فقط: false,
    التنقيط_فقط: false,
    الحد_الادنى: 0,
    الحد_الاقصى: 1000000,
  });
  
  // حالات الاستيراد
  const [جاري_الاستيراد, set_جاري_الاستيراد] = useState(false);
  const [تقدم_الاستيراد, set_تقدم_الاستيراد] = useState<{ حالي: number; اجمالي: number; نجاح: number; فشل: number; الحالة: string } | null>(null);
  const [الفئة_المستهدفة, set_الفئة_المستهدفة] = useState<string>('');
  const [ترجمة_تلقائية, set_ترجمة_تلقائية] = useState(true);
  const [تحديث_الموجود, set_تحديث_الموجود] = useState(true);
  const [تطبيق_الهامش, set_تطبيق_الهامش] = useState(true);
  const [هامش_مخصص, set_هامش_مخصص] = useState<number | null>(null);
  
  // حالات التحديد
  const [الاقسام_المحددة, set_الاقسام_المحددة] = useState<Set<string>>(new Set());
  const [الخدمات_المحددة, set_الخدمات_المحددة] = useState<Set<string | number>>(new Set());
  const [الاقسام_المفتوحة, set_الاقسام_المفتوحة] = useState<Set<string>>(new Set());
  const [الاقسام_المفضلة, set_الاقسام_المفضلة] = useState<Set<string>>(new Set());
  const [عرض_معاينة, set_عرض_معاينة] = useState<خدمة_مزود | null>(null);

  // =============== جلب البيانات ===============
  const { data: الفئات = [] } = useQuery({
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

  const { data: المفضلات_المحفوظة = [], refetch: اعادة_جلب_المفضلات } = useQuery({
    queryKey: ['favorite-import-categories', المزود?.id],
    queryFn: async () => {
      if (!المزود) return [];
      const { data, error } = await supabase
        .from('favorite_import_categories')
        .select('*')
        .eq('provider_id', المزود.id);
      if (error) throw error;
      return data;
    },
    enabled: !!المزود,
  });

  const { data: الخدمات_الموجودة = [] } = useQuery({
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

  // =============== تحميل المفضلات ===============
  useEffect(() => {
    if (المفضلات_المحفوظة.length > 0) {
      const مجموعة_المفضلات = new Set(المفضلات_المحفوظة.map((f: any) => f.category_name));
      set_الاقسام_المفضلة(مجموعة_المفضلات);
    }
  }, [المفضلات_المحفوظة]);

  // =============== بناء شجرة الأقسام ===============
  const بناء_الشجرة = useCallback((الخدمات: خدمة_مزود[]) => {
    const شجرة = new Map<string, قسم>();

    الخدمات.forEach(خدمة => {
      const { رئيسي, فرعي } = استخراج_القسم_الفرعي(خدمة.category);
      const السعر = parseFloat(خدمة.rate) || 0;

      if (!شجرة.has(رئيسي)) {
        شجرة.set(رئيسي, {
          الاسم: رئيسي,
          العدد: 0,
          الخدمات: [],
          الاقسام_الفرعية: new Map(),
          اقل_سعر: Infinity,
          اعلى_سعر: 0,
          متوسط_السعر: 0,
          عدد_التعبئة: 0,
          عدد_الالغاء: 0,
        });
      }

      const عقدة_القسم = شجرة.get(رئيسي)!;
      عقدة_القسم.العدد++;
      عقدة_القسم.الخدمات.push(خدمة);
      عقدة_القسم.اقل_سعر = Math.min(عقدة_القسم.اقل_سعر, السعر);
      عقدة_القسم.اعلى_سعر = Math.max(عقدة_القسم.اعلى_سعر, السعر);
      if (هل_تعبئة(خدمة)) عقدة_القسم.عدد_التعبئة++;
      if (هل_الغاء(خدمة)) عقدة_القسم.عدد_الالغاء++;

      if (فرعي) {
        if (!عقدة_القسم.الاقسام_الفرعية.has(فرعي)) {
          عقدة_القسم.الاقسام_الفرعية.set(فرعي, {
            الاسم: فرعي,
            العدد: 0,
            الخدمات: [],
          });
        }

        const عقدة_فرعية = عقدة_القسم.الاقسام_الفرعية.get(فرعي)!;
        عقدة_فرعية.العدد++;
        عقدة_فرعية.الخدمات.push(خدمة);
      }
    });

    // حساب المتوسطات
    شجرة.forEach(عقدة => {
      const مجموع = عقدة.الخدمات.reduce((sum, s) => sum + (parseFloat(s.rate) || 0), 0);
      عقدة.متوسط_السعر = عقدة.العدد > 0 ? مجموع / عقدة.العدد : 0;
      if (عقدة.اقل_سعر === Infinity) عقدة.اقل_سعر = 0;
    });

    return شجرة;
  }, []);

  // =============== الإحصائيات ===============
  const الاحصائيات = useMemo(() => {
    const اسعار = الخدمات.map(s => parseFloat(s.rate) || 0).filter(p => p > 0);
    const عدد_التعبئة = الخدمات.filter(هل_تعبئة).length;
    const عدد_الالغاء = الخدمات.filter(هل_الغاء).length;
    const عدد_التنقيط = الخدمات.filter(هل_تنقيط).length;
    const موجود_مسبقا = الخدمات.filter(s => الخدمات_الموجودة.includes(String(s.service))).length;
    
    let مجموع_الفرعية = 0;
    شجرة_الاقسام.forEach(قسم => {
      مجموع_الفرعية += قسم.الاقسام_الفرعية.size;
    });

    return {
      اجمالي_الخدمات: الخدمات.length,
      اجمالي_الاقسام: شجرة_الاقسام.size,
      اجمالي_الفرعية: مجموع_الفرعية,
      اقل_سعر: اسعار.length > 0 ? Math.min(...اسعار) : 0,
      اعلى_سعر: اسعار.length > 0 ? Math.max(...اسعار) : 0,
      متوسط_السعر: اسعار.length > 0 ? اسعار.reduce((a, b) => a + b, 0) / اسعار.length : 0,
      عدد_المحددة: الخدمات_المحددة.size,
      عدد_التعبئة,
      عدد_الالغاء,
      عدد_التنقيط,
      موجود_مسبقا,
      جديدة: الخدمات.length - موجود_مسبقا,
    };
  }, [الخدمات, شجرة_الاقسام, الخدمات_المحددة, الخدمات_الموجودة]);

  // =============== جلب الخدمات ===============
  const جلب_الخدمات = async () => {
    if (!المزود) return;

    set_جاري_التحميل(true);
    set_الخدمات([]);
    set_شجرة_الاقسام(new Map());
    set_الاقسام_المحددة(new Set());
    set_الخدمات_المحددة(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('provider-services', {
        body: { provider_id: المزود.id }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const قائمة_الخدمات = data.services || [];
      set_الخدمات(قائمة_الخدمات);
      set_شجرة_الاقسام(بناء_الشجرة(قائمة_الخدمات));
      
      // تحديث نطاق الأسعار للفلتر
      if (قائمة_الخدمات.length > 0) {
        const اسعار = قائمة_الخدمات.map((s: any) => parseFloat(s.rate) || 0);
        set_الفلتر(prev => ({
          ...prev,
          اقل_سعر: 0,
          اعلى_سعر: Math.ceil(Math.max(...اسعار)),
        }));
      }

      toast.success(`تم جلب ${قائمة_الخدمات.length} خدمة من ${المزود.name_ar}`);
    } catch (error) {
      console.error('خطأ في جلب الخدمات:', error);
      toast.error('فشل في جلب الخدمات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      set_جاري_التحميل(false);
    }
  };

  // =============== التحكم بالأقسام ===============
  const تبديل_فتح_القسم = (اسم_القسم: string) => {
    set_الاقسام_المفتوحة(prev => {
      const مجموعة_جديدة = new Set(prev);
      if (مجموعة_جديدة.has(اسم_القسم)) {
        مجموعة_جديدة.delete(اسم_القسم);
      } else {
        مجموعة_جديدة.add(اسم_القسم);
      }
      return مجموعة_جديدة;
    });
  };

  const تبديل_تحديد_القسم = (اسم_القسم: string) => {
    set_الاقسام_المحددة(prev => {
      const مجموعة_جديدة = new Set(prev);
      const القسم = شجرة_الاقسام.get(اسم_القسم);
      
      if (مجموعة_جديدة.has(اسم_القسم)) {
        مجموعة_جديدة.delete(اسم_القسم);
        if (القسم) {
          set_الخدمات_المحددة(prev => {
            const خدمات_جديدة = new Set(prev);
            القسم.الخدمات.forEach(s => خدمات_جديدة.delete(s.service));
            return خدمات_جديدة;
          });
        }
      } else {
        مجموعة_جديدة.add(اسم_القسم);
        if (القسم) {
          set_الخدمات_المحددة(prev => {
            const خدمات_جديدة = new Set(prev);
            القسم.الخدمات.forEach(s => خدمات_جديدة.add(s.service));
            return خدمات_جديدة;
          });
        }
      }
      return مجموعة_جديدة;
    });
  };

  const تبديل_تحديد_خدمة = (معرف_الخدمة: string | number) => {
    set_الخدمات_المحددة(prev => {
      const مجموعة_جديدة = new Set(prev);
      if (مجموعة_جديدة.has(معرف_الخدمة)) {
        مجموعة_جديدة.delete(معرف_الخدمة);
      } else {
        مجموعة_جديدة.add(معرف_الخدمة);
      }
      return مجموعة_جديدة;
    });
  };

  const تحديد_الكل = () => {
    const كل_الخدمات = new Set<string | number>();
    const كل_الاقسام = new Set<string>();
    الخدمات_المفلترة.forEach(s => كل_الخدمات.add(s.service));
    شجرة_الاقسام.forEach((_, key) => كل_الاقسام.add(key));
    set_الخدمات_المحددة(كل_الخدمات);
    set_الاقسام_المحددة(كل_الاقسام);
    toast.success(`تم تحديد ${كل_الخدمات.size} خدمة`);
  };

  const مسح_التحديد = () => {
    set_الخدمات_المحددة(new Set());
    set_الاقسام_المحددة(new Set());
    toast.info('تم مسح التحديد');
  };

  const تحديد_الجديدة = () => {
    const جديدة = new Set<string | number>();
    الخدمات.forEach(s => {
      if (!الخدمات_الموجودة.includes(String(s.service))) {
        جديدة.add(s.service);
      }
    });
    set_الخدمات_المحددة(جديدة);
    toast.success(`تم تحديد ${جديدة.size} خدمة جديدة`);
  };

  const تحديد_المفضلات = () => {
    if (الاقسام_المفضلة.size === 0) {
      toast.error('لا توجد أقسام مفضلة محفوظة');
      return;
    }
    
    const خدمات_مفضلة = new Set<string | number>();
    الخدمات.forEach(s => {
      const { رئيسي } = استخراج_القسم_الفرعي(s.category);
      if (الاقسام_المفضلة.has(رئيسي)) {
        خدمات_مفضلة.add(s.service);
      }
    });
    
    set_الخدمات_المحددة(خدمات_مفضلة);
    set_الاقسام_المحددة(الاقسام_المفضلة);
    toast.success(`تم تحديد ${خدمات_مفضلة.size} خدمة من الأقسام المفضلة`);
  };

  const حفظ_المفضلات = async () => {
    if (!المزود || الاقسام_المحددة.size === 0) {
      toast.error('يرجى تحديد أقسام أولاً');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول');
        return;
      }
      
      const للحفظ = Array.from(الاقسام_المحددة).filter(
        قسم => !الاقسام_المفضلة.has(قسم)
      );
      
      if (للحفظ.length === 0) {
        toast.info('جميع الأقسام المحددة موجودة بالفعل في المفضلة');
        return;
      }
      
      const بيانات_الحفظ = للحفظ.map(اسم_القسم => ({
        user_id: user.id,
        provider_id: المزود.id,
        category_name: اسم_القسم,
        target_category_id: الفئة_المستهدفة || null,
        auto_translate: ترجمة_تلقائية,
        apply_profit_margin: تطبيق_الهامش,
      }));
      
      await supabase.from('favorite_import_categories').upsert(بيانات_الحفظ, {
        onConflict: 'user_id,provider_id,category_name'
      });
      
      set_الاقسام_المفضلة(prev => {
        const مجموعة_جديدة = new Set(prev);
        للحفظ.forEach(قسم => مجموعة_جديدة.add(قسم));
        return مجموعة_جديدة;
      });
      
      اعادة_جلب_المفضلات();
      toast.success(`تم حفظ ${للحفظ.length} قسم في المفضلة`);
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      toast.error('حدث خطأ في الحفظ');
    }
  };

  // =============== الفلترة والترتيب ===============
  const الخدمات_المفلترة = useMemo(() => {
    let نتائج = [...الخدمات];

    // البحث النصي
    if (نص_البحث) {
      const استعلام = نص_البحث.toLowerCase();
      نتائج = نتائج.filter(s =>
        s.name.toLowerCase().includes(استعلام) ||
        s.category.toLowerCase().includes(استعلام) ||
        String(s.service).includes(استعلام)
      );
    }

    // فلترة السعر
    نتائج = نتائج.filter(s => {
      const السعر = parseFloat(s.rate) || 0;
      return السعر >= الفلتر.اقل_سعر && السعر <= الفلتر.اعلى_سعر;
    });

    // فلترة الخصائص
    if (الفلتر.التعبئة_فقط) {
      نتائج = نتائج.filter(هل_تعبئة);
    }
    if (الفلتر.الالغاء_فقط) {
      نتائج = نتائج.filter(هل_الغاء);
    }
    if (الفلتر.التنقيط_فقط) {
      نتائج = نتائج.filter(هل_تنقيط);
    }

    // فلترة الحدود
    نتائج = نتائج.filter(s => {
      const الادنى = parseInt(s.min) || 0;
      const الاقصى = parseInt(s.max) || 0;
      return الادنى >= الفلتر.الحد_الادنى && الاقصى <= الفلتر.الحد_الاقصى;
    });

    return نتائج;
  }, [الخدمات, نص_البحث, الفلتر]);

  const الاقسام_المفلترة = useMemo(() => {
    let قائمة = Array.from(شجرة_الاقسام.entries());

    if (نص_البحث) {
      const استعلام = نص_البحث.toLowerCase();
      قائمة = قائمة.filter(([اسم, عقدة]) =>
        اسم.toLowerCase().includes(استعلام) ||
        عقدة.الخدمات.some(s => 
          s.name.toLowerCase().includes(استعلام) ||
          String(s.service).includes(استعلام)
        )
      );
    }

    // الترتيب
    قائمة.sort((a, b) => {
      let مقارنة = 0;
      switch (الترتيب) {
        case 'الاسم':
          مقارنة = a[0].localeCompare(b[0]);
          break;
        case 'العدد':
          مقارنة = a[1].العدد - b[1].العدد;
          break;
        case 'السعر':
          مقارنة = a[1].متوسط_السعر - b[1].متوسط_السعر;
          break;
      }
      return اتجاه_الترتيب === 'تنازلي' ? -مقارنة : مقارنة;
    });

    return قائمة;
  }, [شجرة_الاقسام, نص_البحث, الترتيب, اتجاه_الترتيب]);

  // =============== الاستيراد ===============
  const استيراد = async () => {
    if (!المزود || الخدمات_المحددة.size === 0) {
      toast.error('يرجى تحديد الخدمات للاستيراد');
      return;
    }

    set_جاري_الاستيراد(true);
    set_تقدم_الاستيراد({ حالي: 0, اجمالي: الخدمات_المحددة.size, نجاح: 0, فشل: 0, الحالة: 'جاري التحضير...' });

    try {
      const للاستيراد = الخدمات.filter(s => الخدمات_المحددة.has(s.service));
      let نجاح = 0;
      let فشل = 0;

      // الاستيراد بالدفعات
      const حجم_الدفعة = 10;
      for (let i = 0; i < للاستيراد.length; i += حجم_الدفعة) {
        const دفعة = للاستيراد.slice(i, i + حجم_الدفعة);
        
        await Promise.all(دفعة.map(async (خدمة, index) => {
          set_تقدم_الاستيراد(prev => ({
            ...prev!,
            حالي: i + index + 1,
            الحالة: `${خدمة.name.slice(0, 50)}...`,
          }));

          try {
            const { data: موجود } = await supabase
              .from('services')
              .select('id')
              .eq('external_service_id', String(خدمة.service))
              .eq('provider_id', المزود.id)
              .single();

            const السعر_الاساسي = parseFloat(خدمة.rate) || 0;
            const نسبة_الهامش = هامش_مخصص !== null ? هامش_مخصص : المزود.profit_margin;
            const السعر_النهائي = تطبيق_الهامش
              ? السعر_الاساسي * (1 + (نسبة_الهامش / 100))
              : السعر_الاساسي;

            const الميزات = {
              min: parseInt(خدمة.min) || 0,
              max: parseInt(خدمة.max) || 0,
              type: خدمة.type || 'default',
              refill: هل_تعبئة(خدمة),
              cancel: هل_الغاء(خدمة),
              dripfeed: هل_تنقيط(خدمة),
              average_time: خدمة.average_time || null,
            };

            const { رئيسي, فرعي } = استخراج_القسم_الفرعي(خدمة.category);
            let اسم_الفئة = خدمة.category;
            
            if (الفئة_المستهدفة && فرعي) {
              اسم_الفئة = فرعي;
            } else if (الفئة_المستهدفة) {
              اسم_الفئة = رئيسي;
            }

            const بيانات_الخدمة = {
              name: ترجمة_تلقائية ? ترجمة_الاسم(خدمة.name) : خدمة.name,
              description: خدمة.desc || null,
              price: السعر_النهائي,
              external_service_id: String(خدمة.service),
              provider_id: المزود.id,
              category: اسم_الفئة,
              category_id: الفئة_المستهدفة || null,
              features: الميزات,
              status: 'active' as const,
            };

            if (موجود && تحديث_الموجود) {
              await supabase.from('services').update(بيانات_الخدمة).eq('id', موجود.id);
              نجاح++;
            } else if (!موجود) {
              await supabase.from('services').insert(بيانات_الخدمة);
              نجاح++;
            }
          } catch (err) {
            console.error('خطأ في استيراد الخدمة:', خدمة.service, err);
            فشل++;
          }
        }));

        set_تقدم_الاستيراد(prev => ({
          ...prev!,
          نجاح,
          فشل,
        }));
      }

      await supabase
        .from('api_providers')
        .update({ 
          last_sync_at: new Date().toISOString(),
          services_count: نجاح,
        })
        .eq('id', المزود.id);

      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['existing-services', المزود.id] });

      toast.success(`تم الاستيراد بنجاح! ✅ ${نجاح} | ❌ ${فشل}`, { duration: 5000 });

      عند_اكتمال_الاستيراد?.();
      مسح_التحديد();
    } catch (error) {
      console.error('خطأ في الاستيراد:', error);
      toast.error('فشل في الاستيراد');
    } finally {
      set_جاري_الاستيراد(false);
      set_تقدم_الاستيراد(null);
    }
  };

  // =============== التأثيرات ===============
  useEffect(() => {
    if (مفتوح && المزود && الخدمات.length === 0) {
      جلب_الخدمات();
    }
  }, [مفتوح, المزود]);

  useEffect(() => {
    if (!مفتوح) {
      set_الخدمات([]);
      set_شجرة_الاقسام(new Map());
      set_الاقسام_المحددة(new Set());
      set_الخدمات_المحددة(new Set());
      set_نص_البحث('');
      set_عرض_الفلاتر(false);
    }
  }, [مفتوح]);

  if (!المزود) return null;

  // =============== العرض ===============
  return (
    <Dialog open={مفتوح} onOpenChange={عند_الاغلاق}>
      <DialogContent className="max-w-5xl h-[95vh] p-0 gap-0 flex flex-col overflow-hidden" dir="rtl">
        {/* =============== الرأس =============== */}
        <DialogHeader className="p-4 border-b bg-gradient-to-l from-primary/10 via-accent/5 to-background shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold">أداة الاستيراد المتقدمة</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  {المزود?.name_ar} • هامش الربح: {هامش_مخصص ?? المزود?.profit_margin}%
                </p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => set_عرض_الفلاتر(!عرض_الفلاتر)}
                className={`gap-2 ${عرض_الفلاتر ? 'bg-primary/10' : ''}`}
              >
                <Filter className="h-4 w-4" />
                الفلاتر
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={جلب_الخدمات}
                disabled={جاري_التحميل}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${جاري_التحميل ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* =============== المحتوى =============== */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {جاري_التحميل ? (
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
                  <p className="text-sm text-muted-foreground">من {المزود.name_ar}</p>
                </div>
              </div>
            </div>
          ) : الخدمات.length > 0 ? (
            <>
              {/* =============== شريط الإحصائيات =============== */}
              <div className="p-3 border-b bg-muted/30 shrink-0">
                <div className="grid grid-cols-6 gap-2">
                  <StatCard icon={Package} label="خدمة" value={الاحصائيات.اجمالي_الخدمات} color="primary" />
                  <StatCard icon={FolderTree} label="قسم" value={الاحصائيات.اجمالي_الاقسام} color="blue" />
                  <StatCard icon={DollarSign} label="أقل سعر" value={`$${الاحصائيات.اقل_سعر.toFixed(2)}`} color="green" />
                  <StatCard icon={Check} label="محدد" value={الاحصائيات.عدد_المحددة} color="purple" />
                  <StatCard icon={Zap} label="جديدة" value={الاحصائيات.جديدة} color="orange" />
                  <StatCard icon={RotateCcw} label="تعبئة" value={الاحصائيات.عدد_التعبئة} color="teal" />
                </div>
              </div>

              {/* =============== الفلاتر المتقدمة =============== */}
              <AnimatePresence>
                {عرض_الفلاتر && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b bg-muted/20 overflow-hidden shrink-0"
                  >
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">نطاق السعر ($)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={الفلتر.اقل_سعر}
                              onChange={(e) => set_الفلتر(prev => ({ ...prev, اقل_سعر: Number(e.target.value) }))}
                              className="h-8"
                              placeholder="من"
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              value={الفلتر.اعلى_سعر}
                              onChange={(e) => set_الفلتر(prev => ({ ...prev, اعلى_سعر: Number(e.target.value) }))}
                              className="h-8"
                              placeholder="إلى"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">الحد الأدنى/الأقصى</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={الفلتر.الحد_الادنى}
                              onChange={(e) => set_الفلتر(prev => ({ ...prev, الحد_الادنى: Number(e.target.value) }))}
                              className="h-8"
                              placeholder="أدنى"
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              value={الفلتر.الحد_الاقصى}
                              onChange={(e) => set_الفلتر(prev => ({ ...prev, الحد_الاقصى: Number(e.target.value) }))}
                              className="h-8"
                              placeholder="أقصى"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">الخصائص</Label>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={الفلتر.التعبئة_فقط ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => set_الفلتر(prev => ({ ...prev, التعبئة_فقط: !prev.التعبئة_فقط }))}
                            >
                              ♻️ تعبئة
                            </Badge>
                            <Badge
                              variant={الفلتر.الالغاء_فقط ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => set_الفلتر(prev => ({ ...prev, الالغاء_فقط: !prev.الالغاء_فقط }))}
                            >
                              ❌ إلغاء
                            </Badge>
                            <Badge
                              variant={الفلتر.التنقيط_فقط ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => set_الفلتر(prev => ({ ...prev, التنقيط_فقط: !prev.التنقيط_فقط }))}
                            >
                              💧 تنقيط
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* =============== شريط الأدوات =============== */}
              <div className="p-3 border-b space-y-3 shrink-0">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث في الخدمات والأقسام..."
                      value={نص_البحث}
                      onChange={(e) => set_نص_البحث(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={الترتيب} onValueChange={(v) => set_الترتيب(v as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="العدد">الأكثر خدمات</SelectItem>
                      <SelectItem value="الاسم">الاسم</SelectItem>
                      <SelectItem value="السعر">السعر</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => set_اتجاه_الترتيب(prev => prev === 'تصاعدي' ? 'تنازلي' : 'تصاعدي')}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={تحديد_الكل} className="gap-1.5 h-8">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    تحديد الكل ({الخدمات_المفلترة.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={تحديد_الجديدة} className="gap-1.5 h-8">
                    <Zap className="h-3.5 w-3.5" />
                    الجديدة ({الاحصائيات.جديدة})
                  </Button>
                  <Button variant="outline" size="sm" onClick={مسح_التحديد} className="gap-1.5 h-8">
                    <X className="h-3.5 w-3.5" />
                    مسح التحديد
                  </Button>
                  <div className="flex-1" />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={تحديد_المفضلات}
                    className="gap-1.5 h-8"
                    disabled={الاقسام_المفضلة.size === 0}
                  >
                    <Heart className="h-3.5 w-3.5" />
                    المفضلات ({الاقسام_المفضلة.size})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={حفظ_المفضلات}
                    className="gap-1.5 h-8"
                    disabled={الاقسام_المحددة.size === 0}
                  >
                    <Save className="h-3.5 w-3.5" />
                    حفظ
                  </Button>
                </div>
              </div>

              {/* =============== التبويبات =============== */}
              <Tabs value={التبويب_النشط} onValueChange={(v) => set_التبويب_النشط(v as any)} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-2 shrink-0">
                  <TabsTrigger value="الاقسام" className="gap-1.5">
                    <FolderTree className="h-4 w-4" />
                    الأقسام ({الاقسام_المفلترة.length})
                  </TabsTrigger>
                  <TabsTrigger value="الخدمات" className="gap-1.5">
                    <Package className="h-4 w-4" />
                    الخدمات ({الخدمات_المفلترة.length})
                  </TabsTrigger>
                  <TabsTrigger value="المحددة" className="gap-1.5">
                    <Check className="h-4 w-4" />
                    المحددة ({الخدمات_المحددة.size})
                  </TabsTrigger>
                  <TabsTrigger value="الاحصائيات" className="gap-1.5">
                    <BarChart3 className="h-4 w-4" />
                    الإحصائيات
                  </TabsTrigger>
                </TabsList>

                {/* =============== محتوى الأقسام =============== */}
                <TabsContent value="الاقسام" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full px-4">
                    <div className="space-y-2 py-4">
                      {الاقسام_المفلترة.map(([اسم_القسم, القسم]) => (
                        <CategoryCard
                          key={اسم_القسم}
                          اسم_القسم={اسم_القسم}
                          القسم={القسم}
                          محدد={الاقسام_المحددة.has(اسم_القسم)}
                          مفتوح={الاقسام_المفتوحة.has(اسم_القسم)}
                          مفضل={الاقسام_المفضلة.has(اسم_القسم)}
                          الخدمات_المحددة={الخدمات_المحددة}
                          الخدمات_الموجودة={الخدمات_الموجودة}
                          عند_التحديد={() => تبديل_تحديد_القسم(اسم_القسم)}
                          عند_الفتح={() => تبديل_فتح_القسم(اسم_القسم)}
                          عند_تحديد_خدمة={تبديل_تحديد_خدمة}
                          عند_المعاينة={set_عرض_معاينة}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* =============== محتوى الخدمات =============== */}
                <TabsContent value="الخدمات" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full px-4">
                    <div className="grid grid-cols-1 gap-2 py-4">
                      {الخدمات_المفلترة.slice(0, 200).map((خدمة) => (
                        <ServiceCard
                          key={خدمة.service}
                          خدمة={خدمة}
                          محدد={الخدمات_المحددة.has(خدمة.service)}
                          موجود={الخدمات_الموجودة.includes(String(خدمة.service))}
                          عند_التحديد={() => تبديل_تحديد_خدمة(خدمة.service)}
                          عند_المعاينة={() => set_عرض_معاينة(خدمة)}
                        />
                      ))}
                      {الخدمات_المفلترة.length > 200 && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          يتم عرض أول 200 خدمة من {الخدمات_المفلترة.length}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* =============== محتوى المحددة =============== */}
                <TabsContent value="المحددة" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full px-4">
                    <div className="grid grid-cols-1 gap-2 py-4">
                      {الخدمات.filter(s => الخدمات_المحددة.has(s.service)).map((خدمة) => (
                        <ServiceCard
                          key={خدمة.service}
                          خدمة={خدمة}
                          محدد={true}
                          موجود={الخدمات_الموجودة.includes(String(خدمة.service))}
                          عند_التحديد={() => تبديل_تحديد_خدمة(خدمة.service)}
                          عند_المعاينة={() => set_عرض_معاينة(خدمة)}
                        />
                      ))}
                      {الخدمات_المحددة.size === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          لم يتم تحديد أي خدمات
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* =============== محتوى الإحصائيات =============== */}
                <TabsContent value="الاحصائيات" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full px-4">
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            إحصائيات الخدمات
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">إجمالي الخدمات:</span>
                              <span className="font-medium">{الاحصائيات.اجمالي_الخدمات}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">خدمات جديدة:</span>
                              <span className="font-medium text-green-600">{الاحصائيات.جديدة}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">موجودة مسبقاً:</span>
                              <span className="font-medium text-amber-600">{الاحصائيات.موجود_مسبقا}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">محددة للاستيراد:</span>
                              <span className="font-medium text-primary">{الاحصائيات.عدد_المحددة}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            الأسعار
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">أقل سعر:</span>
                              <span className="font-medium">${الاحصائيات.اقل_سعر.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">أعلى سعر:</span>
                              <span className="font-medium">${الاحصائيات.اعلى_سعر.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">متوسط السعر:</span>
                              <span className="font-medium">${الاحصائيات.متوسط_السعر.toFixed(4)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <FolderTree className="h-4 w-4" />
                            الأقسام
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">أقسام رئيسية:</span>
                              <span className="font-medium">{الاحصائيات.اجمالي_الاقسام}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">أقسام فرعية:</span>
                              <span className="font-medium">{الاحصائيات.اجمالي_الفرعية}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">أقسام مفضلة:</span>
                              <span className="font-medium">{الاقسام_المفضلة.size}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            الميزات
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">♻️ إعادة التعبئة:</span>
                              <span className="font-medium">{الاحصائيات.عدد_التعبئة}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">❌ قابل للإلغاء:</span>
                              <span className="font-medium">{الاحصائيات.عدد_الالغاء}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">💧 التنقيط:</span>
                              <span className="font-medium">{الاحصائيات.عدد_التنقيط}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* =============== شريط الاستيراد =============== */}
              <div className="p-4 border-t bg-background shrink-0 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">الفئة المستهدفة</Label>
                    <Select value={الفئة_المستهدفة} onValueChange={set_الفئة_المستهدفة}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="بدون فئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">بدون فئة</SelectItem>
                        {الفئات.map((فئة: any) => (
                          <SelectItem key={فئة.id} value={فئة.id}>
                            {فئة.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">هامش الربح المخصص (%)</Label>
                    <Input
                      type="number"
                      value={هامش_مخصص ?? ''}
                      onChange={(e) => set_هامش_مخصص(e.target.value ? Number(e.target.value) : null)}
                      placeholder={`${المزود.profit_margin}% (افتراضي)`}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">ترجمة تلقائية</Label>
                      <Switch checked={ترجمة_تلقائية} onCheckedChange={set_ترجمة_تلقائية} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">تحديث الموجود</Label>
                      <Switch checked={تحديث_الموجود} onCheckedChange={set_تحديث_الموجود} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">تطبيق الهامش</Label>
                      <Switch checked={تطبيق_الهامش} onCheckedChange={set_تطبيق_الهامش} />
                    </div>
                  </div>
                </div>

                {/* شريط التقدم */}
                {تقدم_الاستيراد && (
                  <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate flex-1">
                        {تقدم_الاستيراد.الحالة}
                      </span>
                      <div className="flex gap-3">
                        <span className="text-green-600">✅ {تقدم_الاستيراد.نجاح}</span>
                        <span className="text-red-600">❌ {تقدم_الاستيراد.فشل}</span>
                        <span className="font-medium">
                          {تقدم_الاستيراد.حالي} / {تقدم_الاستيراد.اجمالي}
                        </span>
                      </div>
                    </div>
                    <Progress value={(تقدم_الاستيراد.حالي / تقدم_الاستيراد.اجمالي) * 100} />
                  </div>
                )}

                {/* زر الاستيراد */}
                <Button
                  onClick={استيراد}
                  disabled={جاري_الاستيراد || الخدمات_المحددة.size === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  {جاري_الاستيراد ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الاستيراد...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      استيراد {الخدمات_المحددة.size} خدمة
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Package className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                <div>
                  <p className="font-semibold text-lg">لا توجد خدمات</p>
                  <p className="text-sm text-muted-foreground">اضغط على "تحديث" لجلب الخدمات</p>
                </div>
                <Button onClick={جلب_الخدمات} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  جلب الخدمات
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* =============== نافذة المعاينة =============== */}
        <Dialog open={!!عرض_معاينة} onOpenChange={() => set_عرض_معاينة(null)}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>معاينة الخدمة</DialogTitle>
            </DialogHeader>
            {عرض_معاينة && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">الاسم الأصلي</Label>
                  <p className="font-medium">{عرض_معاينة.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">الاسم المترجم</Label>
                  <p className="font-medium">{ترجمة_الاسم(عرض_معاينة.name)}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">السعر</Label>
                    <p className="font-medium">${عرض_معاينة.rate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">الحد الأدنى</Label>
                    <p className="font-medium">{تنسيق_الرقم(parseInt(عرض_معاينة.min) || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">الحد الأقصى</Label>
                    <p className="font-medium">{تنسيق_الرقم(parseInt(عرض_معاينة.max) || 0)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {هل_تعبئة(عرض_معاينة) && <Badge variant="outline">♻️ تعبئة</Badge>}
                  {هل_الغاء(عرض_معاينة) && <Badge variant="outline">❌ إلغاء</Badge>}
                  {هل_تنقيط(عرض_معاينة) && <Badge variant="outline">💧 تنقيط</Badge>}
                </div>
                {عرض_معاينة.desc && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">الوصف</Label>
                    <p className="text-sm">{عرض_معاينة.desc}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

// =============== المكونات المساعدة ===============
const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => {
  const colors: Record<string, string> = {
    primary: 'from-primary/10 to-primary/5 border-primary/20 text-primary',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-500',
    green: 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-500',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-500',
    orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-500',
    teal: 'from-teal-500/10 to-teal-500/5 border-teal-500/20 text-teal-500',
  };

  return (
    <div className={`text-center p-2 rounded-lg bg-gradient-to-br border ${colors[color]}`}>
      <Icon className="h-4 w-4 mx-auto mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
};

const CategoryCard = ({
  اسم_القسم,
  القسم,
  محدد,
  مفتوح,
  مفضل,
  الخدمات_المحددة,
  الخدمات_الموجودة,
  عند_التحديد,
  عند_الفتح,
  عند_تحديد_خدمة,
  عند_المعاينة,
}: {
  اسم_القسم: string;
  القسم: قسم;
  محدد: boolean;
  مفتوح: boolean;
  مفضل: boolean;
  الخدمات_المحددة: Set<string | number>;
  الخدمات_الموجودة: string[];
  عند_التحديد: () => void;
  عند_الفتح: () => void;
  عند_تحديد_خدمة: (id: string | number) => void;
  عند_المعاينة: (خدمة: خدمة_مزود) => void;
}) => {
  const المحددة_في_القسم = القسم.الخدمات.filter(s => الخدمات_المحددة.has(s.service)).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-lg overflow-hidden ${محدد ? 'ring-2 ring-primary' : ''}`}
    >
      <Collapsible open={مفتوح} onOpenChange={عند_الفتح}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={محدد}
              onCheckedChange={عند_التحديد}
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{اسم_القسم}</span>
              <Badge variant="secondary" className="text-xs shrink-0">
                {القسم.العدد}
              </Badge>
              {المحددة_في_القسم > 0 && المحددة_في_القسم < القسم.العدد && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {المحددة_في_القسم} محدد
                </Badge>
              )}
              {مفضل && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span>${القسم.اقل_سعر.toFixed(2)} - ${القسم.اعلى_سعر.toFixed(2)}</span>
              {القسم.عدد_التعبئة > 0 && (
                <Badge variant="outline" className="text-[10px] px-1">
                  ♻️ {القسم.عدد_التعبئة}
                </Badge>
              )}
            </div>

            {مفتوح ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t bg-muted/20 p-2 space-y-1 max-h-60 overflow-y-auto">
            {القسم.الخدمات.map((خدمة) => {
              const موجود = الخدمات_الموجودة.includes(String(خدمة.service));
              return (
                <div
                  key={خدمة.service}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-background/50 transition-colors cursor-pointer ${
                    الخدمات_المحددة.has(خدمة.service) ? 'bg-primary/5 border border-primary/20' : ''
                  } ${موجود ? 'opacity-60' : ''}`}
                  onClick={() => عند_تحديد_خدمة(خدمة.service)}
                >
                  <Checkbox
                    checked={الخدمات_المحددة.has(خدمة.service)}
                    onCheckedChange={() => عند_تحديد_خدمة(خدمة.service)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{خدمة.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {خدمة.service} | ${خدمة.rate} | {خدمة.min}-{خدمة.max}
                    </p>
                  </div>
                  <div className="flex gap-1 items-center">
                    {موجود && (
                      <Badge variant="outline" className="text-[10px] px-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                        موجود
                      </Badge>
                    )}
                    {هل_تعبئة(خدمة) && <span className="text-xs">♻️</span>}
                    {هل_الغاء(خدمة) && <span className="text-xs">❌</span>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        عند_المعاينة(خدمة);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

const ServiceCard = ({
  خدمة,
  محدد,
  موجود,
  عند_التحديد,
  عند_المعاينة,
}: {
  خدمة: خدمة_مزود;
  محدد: boolean;
  موجود: boolean;
  عند_التحديد: () => void;
  عند_المعاينة: () => void;
}) => {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer ${
        محدد ? 'ring-2 ring-primary' : ''
      } ${موجود ? 'opacity-60' : ''}`}
      onClick={عند_التحديد}
    >
      <Checkbox checked={محدد} onCheckedChange={عند_التحديد} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{خدمة.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {خدمة.category} | ID: {خدمة.service}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-left">
          <p className="font-medium">${خدمة.rate}</p>
          <p className="text-[10px] text-muted-foreground">{خدمة.min}-{خدمة.max}</p>
        </div>
        <div className="flex gap-1">
          {موجود && (
            <Badge variant="outline" className="text-[10px] px-1 bg-amber-500/10 text-amber-600">
              موجود
            </Badge>
          )}
          {هل_تعبئة(خدمة) && <span className="text-sm">♻️</span>}
          {هل_الغاء(خدمة) && <span className="text-sm">❌</span>}
          {هل_تنقيط(خدمة) && <span className="text-sm">💧</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            عند_المعاينة();
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ServiceImportDialog;
