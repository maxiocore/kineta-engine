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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
} from 'lucide-react';

// أنواع البيانات
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
}

interface قسم {
  الاسم: string;
  العدد: number;
  الخدمات: خدمة_مزود[];
  الاقسام_الفرعية: Map<string, قسم_فرعي>;
  مفتوح: boolean;
  محدد: boolean;
  مفضل: boolean;
}

interface قسم_فرعي {
  الاسم: string;
  العدد: number;
  الخدمات: خدمة_مزود[];
  محدد: boolean;
}

interface خصائص_المكون {
  المزود: مزود | null;
  مفتوح: boolean;
  عند_الاغلاق: () => void;
  عند_اكتمال_الاستيراد?: () => void;
}

// دالة استخراج القسم الفرعي
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

// دالة ترجمة اسم الخدمة
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
  };

  let مترجم = name.toLowerCase();
  
  for (const [en, ar] of Object.entries(المنصات)) {
    مترجم = مترجم.replace(new RegExp(en, 'gi'), ar);
  }
  
  for (const [en, ar] of Object.entries(الانواع)) {
    مترجم = مترجم.replace(new RegExp(en, 'gi'), ar);
  }

  return مترجم.charAt(0).toUpperCase() + مترجم.slice(1);
};

export const ServiceImportDialog = ({
  المزود,
  مفتوح,
  عند_الاغلاق,
  عند_اكتمال_الاستيراد,
}: خصائص_المكون) => {
  const queryClient = useQueryClient();
  
  // الحالات
  const [جاري_التحميل, set_جاري_التحميل] = useState(false);
  const [الخدمات, set_الخدمات] = useState<خدمة_مزود[]>([]);
  const [شجرة_الاقسام, set_شجرة_الاقسام] = useState<Map<string, قسم>>(new Map());
  const [نص_البحث, set_نص_البحث] = useState('');
  
  // حالات الاستيراد
  const [جاري_الاستيراد, set_جاري_الاستيراد] = useState(false);
  const [تقدم_الاستيراد, set_تقدم_الاستيراد] = useState<{ حالي: number; اجمالي: number; الحالة: string } | null>(null);
  const [الفئة_المستهدفة, set_الفئة_المستهدفة] = useState<string>('');
  const [ترجمة_تلقائية, set_ترجمة_تلقائية] = useState(true);
  const [تحديث_الموجود, set_تحديث_الموجود] = useState(true);
  const [تطبيق_الهامش, set_تطبيق_الهامش] = useState(true);
  
  // حالات التحديد
  const [الاقسام_المحددة, set_الاقسام_المحددة] = useState<Set<string>>(new Set());
  const [الخدمات_المحددة, set_الخدمات_المحددة] = useState<Set<string | number>>(new Set());
  const [الاقسام_المفتوحة, set_الاقسام_المفتوحة] = useState<Set<string>>(new Set());
  const [الاقسام_المفضلة, set_الاقسام_المفضلة] = useState<Set<string>>(new Set());

  // جلب الفئات
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

  // جلب المفضلات
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

  // تحميل المفضلات
  useEffect(() => {
    if (المفضلات_المحفوظة.length > 0) {
      const مجموعة_المفضلات = new Set(المفضلات_المحفوظة.map((f: any) => f.category_name));
      set_الاقسام_المفضلة(مجموعة_المفضلات);
    }
  }, [المفضلات_المحفوظة]);

  // بناء شجرة الأقسام
  const بناء_الشجرة = useCallback((الخدمات: خدمة_مزود[]) => {
    const شجرة = new Map<string, قسم>();

    الخدمات.forEach(خدمة => {
      const { رئيسي, فرعي } = استخراج_القسم_الفرعي(خدمة.category);

      if (!شجرة.has(رئيسي)) {
        شجرة.set(رئيسي, {
          الاسم: رئيسي,
          العدد: 0,
          الخدمات: [],
          الاقسام_الفرعية: new Map(),
          مفتوح: false,
          محدد: false,
          مفضل: false,
        });
      }

      const عقدة_القسم = شجرة.get(رئيسي)!;
      عقدة_القسم.العدد++;
      عقدة_القسم.الخدمات.push(خدمة);

      if (فرعي) {
        if (!عقدة_القسم.الاقسام_الفرعية.has(فرعي)) {
          عقدة_القسم.الاقسام_الفرعية.set(فرعي, {
            الاسم: فرعي,
            العدد: 0,
            الخدمات: [],
            محدد: false,
          });
        }

        const عقدة_فرعية = عقدة_القسم.الاقسام_الفرعية.get(فرعي)!;
        عقدة_فرعية.العدد++;
        عقدة_فرعية.الخدمات.push(خدمة);
      }
    });

    return شجرة;
  }, []);

  // الإحصائيات
  const الاحصائيات = useMemo(() => {
    const اسعار = الخدمات.map(s => parseFloat(s.rate) || 0).filter(p => p > 0);
    return {
      اجمالي_الخدمات: الخدمات.length,
      اجمالي_الاقسام: شجرة_الاقسام.size,
      اقل_سعر: اسعار.length > 0 ? Math.min(...اسعار) : 0,
      عدد_المحددة: الخدمات_المحددة.size,
    };
  }, [الخدمات, شجرة_الاقسام, الخدمات_المحددة]);

  // جلب الخدمات من المزود
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

      toast.success(`تم جلب ${قائمة_الخدمات.length} خدمة من ${المزود.name_ar}`);
    } catch (error) {
      console.error('خطأ في جلب الخدمات:', error);
      toast.error('فشل في جلب الخدمات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      set_جاري_التحميل(false);
    }
  };

  // تبديل حالة القسم (مفتوح/مغلق)
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

  // تحديد/إلغاء تحديد قسم
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

  // تحديد/إلغاء تحديد خدمة
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

  // تحديد الكل
  const تحديد_الكل = () => {
    const كل_الخدمات = new Set<string | number>();
    const كل_الاقسام = new Set<string>();
    الخدمات.forEach(s => كل_الخدمات.add(s.service));
    شجرة_الاقسام.forEach((_, key) => كل_الاقسام.add(key));
    set_الخدمات_المحددة(كل_الخدمات);
    set_الاقسام_المحددة(كل_الاقسام);
  };

  // مسح التحديد
  const مسح_التحديد = () => {
    set_الخدمات_المحددة(new Set());
    set_الاقسام_المحددة(new Set());
  };

  // تحديد المفضلات
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

  // حفظ في المفضلة
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

  // الأقسام المفلترة
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

    return قائمة.sort((a, b) => b[1].العدد - a[1].العدد);
  }, [شجرة_الاقسام, نص_البحث]);

  // استيراد الخدمات
  const استيراد = async () => {
    if (!المزود || الخدمات_المحددة.size === 0) {
      toast.error('يرجى تحديد الخدمات للاستيراد');
      return;
    }

    set_جاري_الاستيراد(true);
    set_تقدم_الاستيراد({ حالي: 0, اجمالي: الخدمات_المحددة.size, الحالة: 'جاري التحضير...' });

    try {
      const للاستيراد = الخدمات.filter(s => الخدمات_المحددة.has(s.service));
      let مستورد = 0;
      let محدث = 0;
      let اخطاء = 0;

      for (let i = 0; i < للاستيراد.length; i++) {
        const خدمة = للاستيراد[i];
        set_تقدم_الاستيراد({
          حالي: i + 1,
          اجمالي: للاستيراد.length,
          الحالة: `${خدمة.name.slice(0, 40)}...`,
        });

        try {
          const { data: موجود } = await supabase
            .from('services')
            .select('id')
            .eq('external_service_id', String(خدمة.service))
            .eq('provider_id', المزود.id)
            .single();

          const السعر_الاساسي = parseFloat(خدمة.rate) || 0;
          const السعر_النهائي = تطبيق_الهامش
            ? السعر_الاساسي * (1 + (المزود.profit_margin / 100))
            : السعر_الاساسي;

          const الميزات = {
            min: parseInt(خدمة.min) || 0,
            max: parseInt(خدمة.max) || 0,
            type: خدمة.type || 'default',
            refill: خدمة.refill === true || خدمة.refill === 'true',
            cancel: خدمة.cancel === true || خدمة.cancel === 'true',
            dripfeed: خدمة.dripfeed === true || خدمة.dripfeed === 'true',
          };

          const { رئيسي, فرعي } = استخراج_القسم_الفرعي(خدمة.category);
          
          let الفئة_النهائية_id = الفئة_المستهدفة || null;
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
            category_id: الفئة_النهائية_id,
            features: الميزات,
            status: 'active' as const,
          };

          if (موجود && تحديث_الموجود) {
            await supabase.from('services').update(بيانات_الخدمة).eq('id', موجود.id);
            محدث++;
          } else if (!موجود) {
            await supabase.from('services').insert(بيانات_الخدمة);
            مستورد++;
          }
        } catch (err) {
          console.error('خطأ في الاستيراد:', خدمة.service, err);
          اخطاء++;
        }
      }

      await supabase
        .from('api_providers')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', المزود.id);

      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });

      toast.success(
        `تم الاستيراد! ${مستورد} جديدة | ${محدث} تحديث | ${اخطاء} أخطاء`,
        { duration: 5000 }
      );

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

  // جلب تلقائي عند الفتح
  useEffect(() => {
    if (مفتوح && المزود && الخدمات.length === 0) {
      جلب_الخدمات();
    }
  }, [مفتوح, المزود]);

  // إعادة التعيين عند الإغلاق
  useEffect(() => {
    if (!مفتوح) {
      set_الخدمات([]);
      set_شجرة_الاقسام(new Map());
      set_الاقسام_المحددة(new Set());
      set_الخدمات_المحددة(new Set());
      set_نص_البحث('');
    }
  }, [مفتوح]);

  if (!المزود) return null;

  return (
    <Dialog open={مفتوح} onOpenChange={عند_الاغلاق}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 flex flex-col" dir="rtl">
        {/* الرأس */}
        <DialogHeader className="p-4 border-b bg-gradient-to-l from-primary/10 via-accent/5 to-background shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold">جلب الخدمات</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  {المزود?.name_ar || 'غير محدد'}
                </p>
              </div>
            </DialogTitle>
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
        </DialogHeader>

        {/* المحتوى */}
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
                  <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
                </div>
              </div>
            </div>
          ) : الخدمات.length > 0 ? (
            <>
              {/* شريط الإحصائيات */}
              <div className="p-4 border-b bg-muted/30 shrink-0">
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <Package className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold text-primary">{الاحصائيات.اجمالي_الخدمات.toLocaleString('ar-SA')}</p>
                    <p className="text-[10px] text-muted-foreground">خدمة</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                    <FolderTree className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-500">{الاحصائيات.اجمالي_الاقسام}</p>
                    <p className="text-[10px] text-muted-foreground">قسم</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                    <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-500">${الاحصائيات.اقل_سعر.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">أقل سعر</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                    <Check className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-purple-500">{الاحصائيات.عدد_المحددة}</p>
                    <p className="text-[10px] text-muted-foreground">محدد</p>
                  </div>
                </div>
              </div>

              {/* شريط البحث والأدوات */}
              <div className="p-4 border-b space-y-3 shrink-0">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في الخدمات والأقسام..."
                    value={نص_البحث}
                    onChange={(e) => set_نص_البحث(e.target.value)}
                    className="pr-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={تحديد_الكل} className="gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    تحديد الكل
                  </Button>
                  <Button variant="outline" size="sm" onClick={مسح_التحديد} className="gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    إلغاء التحديد
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={تحديد_المفضلات}
                    className="gap-1.5"
                    disabled={الاقسام_المفضلة.size === 0}
                  >
                    <Heart className="h-3.5 w-3.5" />
                    تحديد المفضلات ({الاقسام_المفضلة.size})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={حفظ_المفضلات}
                    className="gap-1.5"
                    disabled={الاقسام_المحددة.size === 0}
                  >
                    <Save className="h-3.5 w-3.5" />
                    حفظ كمفضلة
                  </Button>
                </div>
              </div>

              {/* قائمة الأقسام */}
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-2 py-4">
                  <AnimatePresence mode="popLayout">
                    {الاقسام_المفلترة.map(([اسم_القسم, القسم]) => (
                      <motion.div
                        key={اسم_القسم}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-card border rounded-lg overflow-hidden"
                      >
                        <Collapsible
                          open={الاقسام_المفتوحة.has(اسم_القسم)}
                          onOpenChange={() => تبديل_فتح_القسم(اسم_القسم)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                              <Checkbox
                                checked={الاقسام_المحددة.has(اسم_القسم)}
                                onCheckedChange={() => تبديل_تحديد_القسم(اسم_القسم)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              
                              <div className="flex-1 flex items-center gap-2">
                                <FolderTree className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium truncate">{اسم_القسم}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {القسم.العدد} خدمة
                                </Badge>
                                {الاقسام_المفضلة.has(اسم_القسم) && (
                                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                )}
                              </div>

                              {الاقسام_المفتوحة.has(اسم_القسم) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="border-t bg-muted/20 p-2 space-y-1 max-h-60 overflow-y-auto">
                              {القسم.الخدمات.map((خدمة) => (
                                <div
                                  key={خدمة.service}
                                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-background/50 transition-colors cursor-pointer ${
                                    الخدمات_المحددة.has(خدمة.service) ? 'bg-primary/5 border border-primary/20' : ''
                                  }`}
                                  onClick={() => تبديل_تحديد_خدمة(خدمة.service)}
                                >
                                  <Checkbox
                                    checked={الخدمات_المحددة.has(خدمة.service)}
                                    onCheckedChange={() => تبديل_تحديد_خدمة(خدمة.service)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{خدمة.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      ID: {خدمة.service} | ${خدمة.rate} | {خدمة.min}-{خدمة.max}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    {(خدمة.refill === true || خدمة.refill === 'true') && (
                                      <Badge variant="outline" className="text-[10px] px-1 bg-green-500/10 text-green-600 border-green-500/20">
                                        ♻️
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* شريط الاستيراد */}
              <div className="p-4 border-t bg-background shrink-0 space-y-4">
                {/* خيارات الاستيراد */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">الفئة المستهدفة</Label>
                    <Select value={الفئة_المستهدفة} onValueChange={set_الفئة_المستهدفة}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">بدون فئة محددة</SelectItem>
                        {الفئات.map((فئة: any) => (
                          <SelectItem key={فئة.id} value={فئة.id}>
                            {فئة.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">تطبيق هامش الربح</Label>
                      <Switch checked={تطبيق_الهامش} onCheckedChange={set_تطبيق_الهامش} />
                    </div>
                  </div>
                </div>

                {/* شريط التقدم */}
                {تقدم_الاستيراد && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate flex-1">
                        {تقدم_الاستيراد.الحالة}
                      </span>
                      <span className="font-medium">
                        {تقدم_الاستيراد.حالي} / {تقدم_الاستيراد.اجمالي}
                      </span>
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
                  <p className="text-sm text-muted-foreground">اضغط على "تحديث" لجلب الخدمات من المزود</p>
                </div>
                <Button onClick={جلب_الخدمات} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  جلب الخدمات
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceImportDialog;
