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
const translationDict: Record<string, string> = {
  // المنصات الكاملة
  'instagram': 'انستقرام', 'facebook': 'فيسبوك', 'twitter': 'تويتر', 'youtube': 'يوتيوب',
  'tiktok': 'تيك توك', 'tik tok': 'تيك توك', 'telegram': 'تيليجرام', 'snapchat': 'سناب شات',
  'linkedin': 'لينكد إن', 'pinterest': 'بنترست', 'reddit': 'ريديت', 'whatsapp': 'واتساب',
  'twitch': 'تويتش', 'spotify': 'سبوتيفاي', 'soundcloud': 'ساوند كلاود', 'discord': 'ديسكورد',
  'threads': 'ثريدز', 'x.com': 'إكس', 'vk': 'فكونتاكتي', 'vkontakte': 'فكونتاكتي',
  'weibo': 'ويبو', 'kwai': 'كواي', 'likee': 'لايكي', 'clubhouse': 'كلوب هاوس',
  'google': 'جوجل', 'apple': 'أبل', 'amazon': 'أمازون', 'yelp': 'يلب',
  'tripadvisor': 'تريب أدفايزر', 'trustpilot': 'تراست بايلوت', 'gmb': 'جوجل بزنس',
  'shazam': 'شازام', 'dailymotion': 'ديلي موشن', 'vimeo': 'فيميو', 'rumble': 'رمبل',
  'bilibili': 'بيلي بيلي', 'kick': 'كيك', 'igtv': 'آي جي تي في', 'trovo': 'تروفو',
  'periscope': 'بيريسكوب', 'mixer': 'ميكسر', 'dlive': 'دي لايف',
  
  // الاختصارات
  'ig': 'انستقرام', 'fb': 'فيسبوك', 'tw': 'تويتر', 'yt': 'يوتيوب', 'tt': 'تيك توك',
  'tg': 'تيليجرام', 'smm': 'تسويق', 'hq': 'جودة عالية', 'lq': 'جودة منخفضة',
  'mq': 'جودة متوسطة', 'sq': 'جودة قياسية', 'pva': 'حسابات موثقة', 'nft': 'رموز غير قابلة للاستبدال',
  
  // الأنواع والأفعال
  'followers': 'متابعين', 'follower': 'متابع', 'following': 'متابعة',
  'likes': 'لايكات', 'like': 'لايك', 'liking': 'إعجاب',
  'views': 'مشاهدات', 'view': 'مشاهدة', 'viewing': 'مشاهدة',
  'comments': 'تعليقات', 'comment': 'تعليق', 'commenting': 'تعليق',
  'subscribers': 'مشتركين', 'subscriber': 'مشترك', 'subscribing': 'اشتراك',
  'shares': 'مشاركات', 'share': 'مشاركة', 'sharing': 'مشاركة',
  'retweets': 'ريتويت', 'retweet': 'ريتويت', 'retweeting': 'ريتويت',
  'reposts': 'إعادة نشر', 'repost': 'إعادة نشر', 'reposting': 'إعادة نشر',
  'saves': 'حفظ', 'save': 'حفظ', 'saving': 'حفظ',
  'impressions': 'انطباعات', 'impression': 'انطباع',
  'reach': 'وصول', 'reaching': 'وصول',
  'engagement': 'تفاعل', 'engagements': 'تفاعلات', 'engaging': 'تفاعل',
  'live': 'بث مباشر', 'lives': 'بثوث مباشرة',
  'story': 'ستوري', 'stories': 'ستوريز',
  'reel': 'ريل', 'reels': 'ريلز',
  'post': 'منشور', 'posts': 'منشورات', 'posting': 'نشر',
  'video': 'فيديو', 'videos': 'فيديوهات',
  'photo': 'صورة', 'photos': 'صور',
  'watch': 'مشاهدة', 'watching': 'مشاهدة',
  'hour': 'ساعة', 'hours': 'ساعات', 'hr': 'ساعة', 'hrs': 'ساعات',
  'members': 'أعضاء', 'member': 'عضو',
  'reactions': 'تفاعلات', 'reaction': 'تفاعل',
  'plays': 'تشغيلات', 'play': 'تشغيل', 'playing': 'تشغيل',
  'streams': 'بثوث', 'stream': 'بث', 'streaming': 'بث مباشر',
  'listeners': 'مستمعين', 'listener': 'مستمع',
  'fans': 'معجبين', 'fan': 'معجب',
  'friends': 'أصدقاء', 'friend': 'صديق',
  'connections': 'اتصالات', 'connection': 'اتصال',
  'clicks': 'نقرات', 'click': 'نقرة', 'clicking': 'نقر',
  'visits': 'زيارات', 'visit': 'زيارة', 'visiting': 'زيارة',
  'visitors': 'زوار', 'visitor': 'زائر',
  'votes': 'تصويتات', 'vote': 'تصويت', 'voting': 'تصويت',
  'polls': 'استطلاعات', 'poll': 'استطلاع',
  'answers': 'إجابات', 'answer': 'إجابة',
  'questions': 'أسئلة', 'question': 'سؤال',
  'mentions': 'إشارات', 'mention': 'إشارة',
  'tags': 'وسوم', 'tag': 'وسم', 'tagging': 'وسم',
  'hashtags': 'هاشتاقات', 'hashtag': 'هاشتاق',
  'links': 'روابط', 'link': 'رابط',
  
  // الجودة والنوع
  'premium': 'مميز', 'real': 'حقيقي', 'bots': 'بوتات', 'bot': 'بوت',
  'high': 'عالي', 'quality': 'جودة', 'fast': 'سريع', 'slow': 'بطيء', 'slower': 'أبطأ', 'fastest': 'الأسرع',
  'instant': 'فوري', 'instantly': 'فورياً',
  'organic': 'طبيعي', 'organically': 'بشكل طبيعي',
  'targeted': 'مستهدف', 'target': 'مستهدف', 'targeting': 'استهداف',
  'worldwide': 'عالمي', 'global': 'عالمي', 'globally': 'عالمياً',
  'cheapest': 'الأرخص', 'cheap': 'رخيص', 'cheaper': 'أرخص',
  'best': 'الأفضل', 'better': 'أفضل',
  'top': 'الأعلى', 'super': 'سوبر', 'ultra': 'ألترا',
  'mega': 'ميجا', 'max': 'ماكس', 'pro': 'برو', 'vip': 'في آي بي',
  'exclusive': 'حصري', 'special': 'خاص', 'specially': 'خصيصاً',
  'new': 'جديد', 'newer': 'أجدد', 'newest': 'الأجدد',
  'hot': 'ساخن', 'popular': 'شائع', 'trending': 'رائج', 'viral': 'فيروسي',
  'verified': 'موثق', 'unverified': 'غير موثق',
  'old': 'قديم', 'older': 'أقدم', 'oldest': 'الأقدم',
  'aged': 'قديم', 'aging': 'تقادم',
  'low quality': 'جودة منخفضة', 'high quality': 'جودة عالية', 'medium quality': 'جودة متوسطة',
  'low': 'منخفض', 'lower': 'أقل', 'lowest': 'الأقل',
  'medium': 'متوسط', 'standard': 'قياسي', 'basic': 'أساسي', 'advanced': 'متقدم',
  'ultimate': 'نهائي', 'limited': 'محدود', 'unlimited': 'غير محدود',
  'gradual': 'تدريجي', 'gradually': 'تدريجياً',
  'natural': 'طبيعي', 'naturally': 'طبيعياً',
  'safe': 'آمن', 'safer': 'أكثر أماناً', 'safest': 'الأكثر أماناً',
  'legit': 'حقيقي', 'legitimate': 'شرعي', 'authentic': 'أصلي',
  'genuine': 'حقيقي', 'original': 'أصلي',
  'unique': 'فريد', 'lifetime': 'مدى الحياة', 'permanent': 'دائم', 'temporary': 'مؤقت',
  'stable': 'مستقر', 'unstable': 'غير مستقر',
  'power': 'قوي', 'powerful': 'قوي جداً',
  'boost': 'تعزيز', 'boosted': 'معزز', 'boosting': 'تعزيز',
  'express': 'سريع', 'priority': 'أولوية',
  'economy': 'اقتصادي', 'budget': 'ميزانية',
  
  // المناطق والجنسيات الموسعة
  'arabic': 'عربي', 'arab': 'عربي', 'arabs': 'عرب',
  'usa': 'أمريكي', 'us': 'أمريكي', 'american': 'أمريكي', 'americans': 'أمريكان',
  'uk': 'بريطاني', 'british': 'بريطاني', 'england': 'إنجلترا', 'english': 'إنجليزي',
  'european': 'أوروبي', 'europe': 'أوروبا', 'eu': 'أوروبي',
  'asian': 'آسيوي', 'asia': 'آسيا',
  'indian': 'هندي', 'india': 'الهند', 'indians': 'هنود',
  'brazilian': 'برازيلي', 'brazil': 'البرازيل', 'br': 'برازيلي',
  'russian': 'روسي', 'russia': 'روسيا', 'ru': 'روسي',
  'turkish': 'تركي', 'turkey': 'تركيا', 'tr': 'تركي', 'turk': 'تركي', 'turks': 'أتراك',
  'german': 'ألماني', 'germany': 'ألمانيا', 'de': 'ألماني',
  'french': 'فرنسي', 'france': 'فرنسا', 'fr': 'فرنسي',
  'spanish': 'إسباني', 'spain': 'إسبانيا', 'es': 'إسباني',
  'italian': 'إيطالي', 'italy': 'إيطاليا', 'it': 'إيطالي',
  'korean': 'كوري', 'korea': 'كوريا', 'kr': 'كوري', 'south korea': 'كوريا الجنوبية',
  'japanese': 'ياباني', 'japan': 'اليابان', 'jp': 'ياباني',
  'chinese': 'صيني', 'china': 'الصين', 'cn': 'صيني',
  'indonesian': 'إندونيسي', 'indonesia': 'إندونيسيا', 'indo': 'إندونيسي',
  'malaysian': 'ماليزي', 'malaysia': 'ماليزيا', 'my': 'ماليزي',
  'thai': 'تايلندي', 'thailand': 'تايلند', 'th': 'تايلندي',
  'vietnamese': 'فيتنامي', 'vietnam': 'فيتنام', 'vn': 'فيتنامي',
  'pakistani': 'باكستاني', 'pakistan': 'باكستان', 'pk': 'باكستاني',
  'bangladeshi': 'بنغلاديشي', 'bangladesh': 'بنغلاديش', 'bd': 'بنغلاديشي',
  'nigerian': 'نيجيري', 'nigeria': 'نيجيريا', 'ng': 'نيجيري',
  'egyptian': 'مصري', 'egypt': 'مصر', 'eg': 'مصري',
  'saudi': 'سعودي', 'ksa': 'السعودية', 'sa': 'سعودي', 'saudis': 'سعوديين',
  'uae': 'الإمارات', 'emirati': 'إماراتي', 'dubai': 'دبي', 'abudhabi': 'أبوظبي', 'abu dhabi': 'أبوظبي',
  'kuwaiti': 'كويتي', 'kuwait': 'الكويت', 'kw': 'كويتي',
  'qatari': 'قطري', 'qatar': 'قطر', 'qa': 'قطري',
  'bahraini': 'بحريني', 'bahrain': 'البحرين', 'bh': 'بحريني',
  'omani': 'عماني', 'oman': 'عمان', 'om': 'عماني',
  'jordanian': 'أردني', 'jordan': 'الأردن', 'jo': 'أردني',
  'lebanese': 'لبناني', 'lebanon': 'لبنان', 'lb': 'لبناني',
  'iraqi': 'عراقي', 'iraq': 'العراق', 'iq': 'عراقي',
  'syrian': 'سوري', 'syria': 'سوريا', 'sy': 'سوري',
  'moroccan': 'مغربي', 'morocco': 'المغرب', 'ma': 'مغربي',
  'algerian': 'جزائري', 'algeria': 'الجزائر', 'dz': 'جزائري',
  'tunisian': 'تونسي', 'tunisia': 'تونس', 'tn': 'تونسي',
  'libyan': 'ليبي', 'libya': 'ليبيا', 'ly': 'ليبي',
  'sudanese': 'سوداني', 'sudan': 'السودان', 'sd': 'سوداني',
  'yemeni': 'يمني', 'yemen': 'اليمن', 'ye': 'يمني',
  'palestinian': 'فلسطيني', 'palestine': 'فلسطين', 'ps': 'فلسطيني',
  'latin': 'لاتيني', 'latam': 'أمريكا اللاتينية', 'latino': 'لاتيني', 'latina': 'لاتينية',
  'african': 'أفريقي', 'africa': 'أفريقيا',
  'middle east': 'الشرق الأوسط', 'middleeast': 'الشرق الأوسط', 'mena': 'الشرق الأوسط',
  'gulf': 'الخليج', 'gcc': 'دول الخليج', 'khaleeji': 'خليجي',
  'mexican': 'مكسيكي', 'mexico': 'المكسيك', 'mx': 'مكسيكي',
  'canadian': 'كندي', 'canada': 'كندا', 'ca': 'كندي',
  'australian': 'أسترالي', 'australia': 'أستراليا', 'au': 'أسترالي',
  'dutch': 'هولندي', 'netherlands': 'هولندا', 'nl': 'هولندي',
  'polish': 'بولندي', 'poland': 'بولندا', 'pl': 'بولندي',
  'ukrainian': 'أوكراني', 'ukraine': 'أوكرانيا', 'ua': 'أوكراني',
  'greek': 'يوناني', 'greece': 'اليونان', 'gr': 'يوناني',
  'portuguese': 'برتغالي', 'portugal': 'البرتغال', 'pt': 'برتغالي',
  'swedish': 'سويدي', 'sweden': 'السويد', 'se': 'سويدي',
  'norwegian': 'نرويجي', 'norway': 'النرويج',
  'danish': 'دنماركي', 'denmark': 'الدنمارك', 'dk': 'دنماركي',
  'finnish': 'فنلندي', 'finland': 'فنلندا', 'fi': 'فنلندي',
  'filipino': 'فلبيني', 'philippines': 'الفلبين', 'ph': 'فلبيني',
  'singaporean': 'سنغافوري', 'singapore': 'سنغافورة', 'sg': 'سنغافوري',
  'hongkong': 'هونج كونج', 'hong kong': 'هونج كونج', 'hk': 'هونج كونج',
  'taiwanese': 'تايواني', 'taiwan': 'تايوان',
  
  // الجنس
  'females': 'إناث', 'female': 'إناث', 'woman': 'امرأة', 'women': 'نساء', 'girl': 'فتاة', 'girls': 'فتيات',
  'males': 'ذكور', 'male': 'ذكور', 'man': 'رجل', 'men': 'رجال', 'boy': 'شاب', 'boys': 'شباب',
  'mixed': 'مختلط', 'random': 'عشوائي', 'both': 'كلاهما',
  
  // الحالة
  'active': 'نشط', 'inactive': 'غير نشط', 'online': 'متصل', 'offline': 'غير متصل',
  
  // الضمانات
  'refills': 'تعبئات', 'refill': 'تعبئة', 'refilling': 'تعبئة',
  'guaranteed': 'مضمون', 'guarantee': 'ضمان', 'guarantees': 'ضمانات',
  'warranty': 'ضمان', 'warrantied': 'مضمون',
  'no drop': 'بدون نقص', 'non drop': 'بدون نقص', 'nondrop': 'بدون نقص', 'nodrop': 'بدون نقص',
  'no refill': 'بدون تعبئة', 'norefill': 'بدون تعبئة',
  'forever': 'للأبد', 'always': 'دائماً',
  '30 days': '30 يوم', '60 days': '60 يوم', '90 days': '90 يوم', '180 days': '180 يوم', '365 days': '365 يوم',
  '1 year': 'سنة واحدة', '2 years': 'سنتين',
  
  // الوقت
  'days': 'أيام', 'day': 'يوم',
  'minutes': 'دقائق', 'minute': 'دقيقة', 'mins': 'دقائق',
  'seconds': 'ثواني', 'second': 'ثانية', 'sec': 'ثانية', 'secs': 'ثواني',
  'weeks': 'أسابيع', 'week': 'أسبوع',
  'months': 'أشهر', 'month': 'شهر',
  'years': 'سنوات', 'year': 'سنة',
  'daily': 'يومي', 'weekly': 'أسبوعي', 'monthly': 'شهري', 'yearly': 'سنوي', 'annually': 'سنوياً',
  'per day': 'في اليوم', 'per hour': 'في الساعة', 'per minute': 'في الدقيقة',
  
  // أرقام ورموز
  'k': 'ألف', '1k': '1000', '5k': '5000', '10k': '10000', '50k': '50000', '100k': '100000',
  'm': 'مليون', '1m': 'مليون',
  
  // كلمات SMM إضافية موسعة
  'emojis': 'إيموجيات', 'emoji': 'إيموجي',
  'custom': 'مخصص', 'customize': 'تخصيص', 'customization': 'تخصيص',
  'auto': 'تلقائي', 'automatic': 'تلقائي', 'automatically': 'تلقائياً',
  'manual': 'يدوي', 'manually': 'يدوياً',
  'promotion': 'ترويج', 'promote': 'ترويج', 'promoting': 'ترويج', 'promoted': 'مروج',
  'advertising': 'إعلان', 'ads': 'إعلانات', 'ad': 'إعلان', 'advert': 'إعلان', 'adverts': 'إعلانات',
  'seo': 'سيو', 'sem': 'تسويق محركات البحث',
  'traffic': 'زيارات', 'traffics': 'زيارات',
  'website': 'موقع', 'websites': 'مواقع', 'web': 'ويب',
  'application': 'تطبيق', 'app': 'تطبيق', 'apps': 'تطبيقات', 'applications': 'تطبيقات',
  'downloads': 'تحميلات', 'download': 'تحميل', 'downloading': 'تحميل',
  'installs': 'تثبيتات', 'install': 'تثبيت', 'installing': 'تثبيت', 'installation': 'تثبيت',
  'reviews': 'مراجعات', 'review': 'مراجعة', 'reviewing': 'مراجعة',
  'ratings': 'تقييمات', 'rating': 'تقييم', 'rate': 'تقييم', 'rated': 'مقيم',
  'stars': 'نجوم', 'star': 'نجمة',
  'positive': 'إيجابي', 'negative': 'سلبي', 'neutral': 'محايد',
  'channels': 'قنوات', 'channel': 'قناة',
  'groups': 'مجموعات', 'group': 'مجموعة',
  'pages': 'صفحات', 'page': 'صفحة',
  'profiles': 'ملفات شخصية', 'profile': 'ملف شخصي',
  'accounts': 'حسابات', 'account': 'حساب', 'acc': 'حساب', 'accs': 'حسابات',
  'bio': 'البايو', 'bios': 'البايوهات',
  'caption': 'وصف', 'captions': 'أوصاف',
  'description': 'وصف', 'descriptions': 'أوصاف', 'desc': 'وصف',
  'title': 'عنوان', 'titles': 'عناوين',
  'username': 'اسم المستخدم', 'usernames': 'أسماء المستخدمين',
  'name': 'اسم', 'names': 'أسماء',
  'password': 'كلمة المرور', 'passwords': 'كلمات المرور', 'pass': 'كلمة المرور',
  'email': 'بريد إلكتروني', 'emails': 'بريد إلكتروني',
  'phone': 'هاتف', 'phones': 'هواتف', 'mobile': 'جوال', 'mobiles': 'جوالات',
  'services': 'خدمات', 'service': 'خدمة',
  'packages': 'باقات', 'package': 'باقة', 'pkg': 'باقة',
  'plans': 'خطط', 'plan': 'خطة',
  'orders': 'طلبات', 'order': 'طلب', 'ordering': 'طلب',
  'cancelled': 'ملغي', 'cancel': 'إلغاء', 'cancellation': 'إلغاء', 'canceling': 'إلغاء',
  'pending': 'معلق', 'processing': 'قيد المعالجة', 'inprogress': 'قيد التنفيذ', 'in progress': 'قيد التنفيذ',
  'completed': 'مكتمل', 'complete': 'مكتمل', 'completion': 'اكتمال',
  'failed': 'فاشل', 'fail': 'فشل', 'failure': 'فشل',
  'partial': 'جزئي', 'partially': 'جزئياً',
  'start': 'بداية', 'starting': 'بداية', 'started': 'بدأ',
  'end': 'نهاية', 'ending': 'نهاية', 'ended': 'انتهى',
  'count': 'عدد', 'counts': 'أعداد', 'counting': 'عد',
  'quantity': 'كمية', 'quantities': 'كميات', 'qty': 'كمية',
  'amount': 'مبلغ', 'amounts': 'مبالغ',
  'price': 'سعر', 'prices': 'أسعار', 'pricing': 'تسعير',
  'cost': 'تكلفة', 'costs': 'تكاليف', 'costing': 'تكلفة',
  'speed': 'سرعة', 'speeds': 'سرعات', 'speedy': 'سريع',
  'delivery': 'توصيل', 'deliver': 'توصيل', 'delivered': 'تم التوصيل', 'delivering': 'توصيل',
  'drip feed': 'تنقيط', 'dripfeed': 'تنقيط', 'drip': 'تنقيط',
  'split': 'تقسيم', 'splitting': 'تقسيم',
  'bulk': 'جملة', 'mass': 'جماعي', 'batch': 'دفعة',
  'servers': 'سيرفرات', 'server': 'سيرفر', 'srv': 'سيرفر',
  'api': 'واجهة برمجة', 'apis': 'واجهات برمجة',
  'panel': 'لوحة', 'panels': 'لوحات',
  'reseller': 'موزع', 'resellers': 'موزعين', 'reselling': 'إعادة بيع',
  'provider': 'مزود', 'providers': 'مزودين',
  'supplier': 'مورد', 'suppliers': 'موردين',
  'source': 'مصدر', 'sources': 'مصادر',
  'direct': 'مباشر', 'directly': 'مباشرة',
  'copy': 'نسخة', 'copies': 'نسخ',
  'duplicate': 'مكرر', 'duplicates': 'مكررات',
  'test': 'تجربة', 'testing': 'اختبار', 'tested': 'مجرب',
  'trial': 'تجريبي', 'trials': 'تجريبية',
  'free': 'مجاني', 'freebie': 'مجاني',
  'paid': 'مدفوع', 'payment': 'دفع', 'payments': 'مدفوعات',
  'bonus': 'مكافأة', 'bonuses': 'مكافآت',
  'discount': 'خصم', 'discounts': 'خصومات', 'discounted': 'مخفض',
  'offer': 'عرض', 'offers': 'عروض', 'offering': 'تقديم',
  'deal': 'صفقة', 'deals': 'صفقات',
  'sale': 'تخفيض', 'sales': 'مبيعات', 'selling': 'بيع',
  'with': 'مع', 'without': 'بدون', 'w/': 'مع', 'w/o': 'بدون',
  'and': 'و', 'or': 'أو', 'for': 'لـ', 'from': 'من', 'to': 'إلى', 'per': 'لكل', 'via': 'عبر',
  'by': 'بواسطة', 'at': 'في', 'on': 'على', 'in': 'في', 'of': 'من', 'the': '',
  'is': 'هو', 'are': 'هم', 'can': 'يمكن', 'will': 'سوف', 'may': 'قد',
  'minimum': 'الحد الأدنى', 'maximum': 'الحد الأقصى', 'min': 'الحد الأدنى', 'max': 'الحد الأقصى',
  'average': 'متوسط', 'avg': 'متوسط',
  'working': 'يعمل', 'fixed': 'تم الإصلاح',
  'updated': 'محدث', 'latest': 'الأحدث',
  'version': 'إصدار', 'versions': 'إصدارات', 'ver': 'إصدار', 'v': 'إصدار',
  'type': 'نوع', 'types': 'أنواع',
  'category': 'فئة', 'categories': 'فئات', 'cat': 'فئة',
  'section': 'قسم', 'sections': 'أقسام',
  'options': 'خيارات', 'option': 'خيار', 'opt': 'خيار',
  'features': 'مميزات', 'feature': 'ميزة', 'feat': 'ميزة',
  'notes': 'ملاحظات', 'note': 'ملاحظة',
  'warning': 'تحذير', 'warnings': 'تحذيرات', 'warn': 'تحذير',
  'important': 'مهم', 'importance': 'أهمية',
  'required': 'مطلوب', 'optional': 'اختياري', 'recommended': 'موصى به',
  'example': 'مثال', 'examples': 'أمثلة', 'ex': 'مثال',
  'sample': 'نموذج', 'samples': 'نماذج',
  'demo': 'تجريبي', 'preview': 'معاينة',
  'images': 'صور', 'image': 'صورة', 'img': 'صورة', 'imgs': 'صور',
  'pictures': 'صور', 'picture': 'صورة', 'pic': 'صورة', 'pics': 'صور',
  'thumbnail': 'صورة مصغرة', 'thumbnails': 'صور مصغرة', 'thumb': 'صورة مصغرة',
  'cover': 'غلاف', 'covers': 'أغلفة',
  'banner': 'بانر', 'banners': 'بانرات',
  'logo': 'شعار', 'logos': 'شعارات',
  'icon': 'أيقونة', 'icons': 'أيقونات',
  'avatar': 'صورة رمزية', 'avatars': 'صور رمزية',
  'filter': 'فلتر', 'filters': 'فلاتر',
  'effect': 'تأثير', 'effects': 'تأثيرات',
  'music': 'موسيقى', 'audio': 'صوت', 'sound': 'صوت', 'sounds': 'أصوات',
  'clip': 'مقطع', 'clips': 'مقاطع',
  'shorts': 'شورتس', 'short': 'قصير',
  'long': 'طويل', 'longer': 'أطول', 'longest': 'الأطول',
  'full': 'كامل',
  'empty': 'فارغ', 'none': 'لا شيء',
  'default': 'افتراضي', 'defaults': 'افتراضيات',
  'normal': 'عادي', 'regular': 'عادي',
  'common': 'شائع', 'rare': 'نادر',
  'additional': 'إضافي', 'extra': 'إضافي', 'extras': 'إضافات',
  'hidden': 'مخفي', 'visible': 'مرئي',
  'public': 'عام', 'private': 'خاص', 'secret': 'سري',
  'secure': 'آمن', 'security': 'أمان',
  'trusted': 'موثوق', 'trust': 'ثقة',
  'official': 'رسمي', 'officially': 'رسمياً',
  'legal': 'قانوني', 'legally': 'قانونياً',
  'banned': 'محظور', 'ban': 'حظر', 'banning': 'حظر',
  'blocked': 'محظور', 'block': 'حظر', 'blocking': 'حظر',
  'suspended': 'موقوف', 'suspend': 'تعليق', 'suspension': 'تعليق',
  'restricted': 'مقيد', 'restrict': 'تقييد', 'restriction': 'تقييد',
  'allowed': 'مسموح', 'allow': 'سماح', 'allowing': 'سماح',
  'enabled': 'مفعل', 'enable': 'تفعيل', 'enabling': 'تفعيل',
  'disabled': 'معطل', 'disable': 'تعطيل', 'disabling': 'تعطيل',
  
  // كلمات SMM المتخصصة
  'explore': 'استكشاف', 'exploring': 'استكشاف',
  'feed': 'الخلاصة', 'feeds': 'خلاصات',
  'timeline': 'الجدول الزمني', 'timelines': 'جداول زمنية',
  'home': 'الرئيسية', 'homepage': 'الصفحة الرئيسية',
  'discover': 'اكتشاف', 'discovering': 'اكتشاف', 'discovery': 'اكتشاف',
  'fyp': 'لك', 'for you': 'لك', 'foryou': 'لك', 'for you page': 'صفحة لك',
  'watchtime': 'وقت المشاهدة', 'watch time': 'وقت المشاهدة',
  'retention': 'الاحتفاظ', 'retaining': 'احتفاظ',
  'monetization': 'تحقيق الدخل', 'monetize': 'تحقيق الدخل', 'monetized': 'مربح',
  'adsense': 'أدسنس', 'admob': 'أدموب',
  'partnership': 'شراكة', 'partnerships': 'شراكات',
  'partner': 'شريك', 'partners': 'شركاء', 'partnered': 'متشارك',
  'verified badge': 'علامة التوثيق', 'verification': 'توثيق',
  'blue tick': 'العلامة الزرقاء', 'bluetick': 'العلامة الزرقاء',
  'checkmark': 'علامة صح', 'check mark': 'علامة صح',
  'badge': 'شارة', 'badges': 'شارات',
  'creator': 'منشئ محتوى', 'creators': 'منشئي محتوى',
  'influencer': 'مؤثر', 'influencers': 'مؤثرين',
  'blogger': 'مدون', 'bloggers': 'مدونين',
  'celebrity': 'مشهور', 'celebrities': 'مشاهير', 'celeb': 'مشهور',
  'follow': 'متابعة', 'unfollow': 'إلغاء متابعة', 'unfollowing': 'إلغاء متابعة',
  'subscribe': 'اشتراك', 'unsubscribe': 'إلغاء اشتراك',
  'join': 'انضمام', 'joining': 'انضمام', 'joined': 'انضم',
  'leave': 'مغادرة', 'leaving': 'مغادرة',
  'invite': 'دعوة', 'inviting': 'دعوة', 'invitation': 'دعوة', 'invitations': 'دعوات',
  'accept': 'قبول', 'accepting': 'قبول', 'accepted': 'مقبول',
  'decline': 'رفض', 'declining': 'رفض', 'declined': 'مرفوض',
  'approve': 'موافقة', 'approving': 'موافقة', 'approved': 'موافق عليه', 'approval': 'موافقة',
  'reject': 'رفض', 'rejecting': 'رفض', 'rejected': 'مرفوض', 'rejection': 'رفض',
  'mute': 'كتم', 'muting': 'كتم', 'muted': 'مكتوم',
  'unmute': 'إلغاء كتم', 'unmuting': 'إلغاء كتم', 'unmuted': 'غير مكتوم',
  'spam': 'سبام', 'spamming': 'سبام', 'spammer': 'مزعج',
  'scam': 'احتيال', 'scamming': 'احتيال', 'scammer': 'محتال',
  'fake': 'مزيف', 'fakes': 'مزيفات', 'faking': 'تزييف',
  'content': 'محتوى', 'contents': 'محتويات',
  'header': 'رأس الصفحة', 'headers': 'رؤوس الصفحات',
  'about': 'حول', 'location': 'الموقع', 'locations': 'المواقع',
  'link in bio': 'رابط في البايو', 'linkinbio': 'رابط في البايو',
  'linktree': 'لينك تري',
  'start time': 'وقت البدء', 'starttime': 'وقت البدء',
  'eta': 'الوقت المتوقع',
  'avg time': 'متوسط الوقت', 'average time': 'متوسط الوقت',
  'real users': 'مستخدمين حقيقيين', 'realusers': 'مستخدمين حقيقيين',
  'real people': 'أشخاص حقيقيين', 'realpeople': 'أشخاص حقيقيين',
  'real accounts': 'حسابات حقيقية', 'realaccounts': 'حسابات حقيقية',
  'active users': 'مستخدمين نشطين', 'activeusers': 'مستخدمين نشطين',
  'active accounts': 'حسابات نشطة', 'activeaccounts': 'حسابات نشطة',
  'with profile pic': 'مع صورة', 'withprofilepic': 'مع صورة',
  'with posts': 'مع منشورات', 'withposts': 'مع منشورات',
  'with bio': 'مع بايو', 'withbio': 'مع بايو',
  'aged accounts': 'حسابات قديمة', 'agedaccounts': 'حسابات قديمة',
  'new accounts': 'حسابات جديدة', 'newaccounts': 'حسابات جديدة',
  'empty accounts': 'حسابات فارغة', 'emptyaccounts': 'حسابات فارغة',
  'no avatar': 'بدون صورة', 'noavatar': 'بدون صورة',
  'with avatar': 'مع صورة', 'withavatar': 'مع صورة',
  'with profile picture': 'مع صورة شخصية', 'withprofilepicture': 'مع صورة شخصية',
  'combo': 'كومبو', 'combos': 'كومبوات',
  'bundle': 'حزمة', 'bundles': 'حزم',
  'mix': 'مزيج', 'mixes': 'مزائج', 'mixing': 'خلط',
  'customized': 'مخصص', 'tailored': 'مفصل',
  'wholesale': 'جملة', 'retail': 'تجزئة',
  'only': 'فقط', 'just': 'فقط', 'also': 'أيضاً', 'too': 'أيضاً',
  'more': 'أكثر', 'less': 'أقل', 'much': 'كثير', 'many': 'كثيرون', 'few': 'قليل',
  'all': 'الكل', 'any': 'أي', 'some': 'بعض', 'each': 'كل', 'every': 'كل',
  'first': 'أول', 'last': 'آخر', 'next': 'التالي', 'previous': 'السابق',
  'other': 'آخر', 'others': 'آخرون', 'another': 'آخر',
  'same': 'نفس', 'different': 'مختلف', 'similar': 'مشابه',
  'various': 'متنوع', 'variety': 'تنوع',
  'specific': 'محدد', 'general': 'عام',
  'exact': 'دقيق', 'exactly': 'بالضبط',
  'approximately': 'تقريباً', 'approx': 'تقريباً',
  'up to': 'حتى', 'upto': 'حتى',
  'over': 'أكثر من', 'under': 'أقل من',
  'between': 'بين', 'among': 'بين',
  'before': 'قبل', 'after': 'بعد',
  'during': 'خلال', 'within': 'ضمن',
  'now': 'الآن', 'soon': 'قريباً', 'later': 'لاحقاً',
  'today': 'اليوم', 'tomorrow': 'غداً', 'yesterday': 'أمس',
  'currently': 'حالياً',
  'please': 'من فضلك', 'thanks': 'شكراً', 'thank you': 'شكراً لك',
  'here': 'هنا', 'there': 'هناك',
  'this': 'هذا', 'that': 'ذلك', 'these': 'هؤلاء', 'those': 'أولئك',
  'then': 'ثم', 'than': 'من',
  'as': 'كـ',
  'if': 'إذا', 'when': 'عندما', 'where': 'أين', 'why': 'لماذا', 'how': 'كيف', 'what': 'ماذا', 'which': 'أي',
  'not': 'ليس', 'no': 'لا', 'yes': 'نعم',
  'very': 'جداً', 'really': 'حقاً', 'truly': 'حقاً',
  'most': 'معظم', 'least': 'أقل',
  'highly': 'للغاية', 'extremely': 'للغاية',
};

// أيقونات المنصات
const platformIcons: Record<string, string> = {
  'instagram': '📸', 'ig': '📸',
  'facebook': '👤', 'fb': '👤',
  'twitter': '🐦', 'tw': '🐦', 'x.com': '🐦',
  'youtube': '▶️', 'yt': '▶️',
  'tiktok': '🎵', 'tik tok': '🎵', 'tt': '🎵',
  'telegram': '✈️', 'tg': '✈️',
  'snapchat': '👻',
  'linkedin': '💼',
  'pinterest': '📌',
  'reddit': '🤖',
  'whatsapp': '💬',
  'twitch': '🎮',
  'spotify': '🎧',
  'soundcloud': '☁️',
  'discord': '🎯',
  'threads': '🧵',
  'google': '🔍', 'gmb': '🔍',
  'apple': '🍎',
  'amazon': '📦',
  'reviews': '⭐',
  'seo': '📊',
  'traffic': '🌐',
  'website': '🌐', 'web': '🌐',
};

// الكشف عن المنصة من النص
const detectPlatform = (text: string): string | null => {
  const lowerText = text.toLowerCase();
  for (const [platform, icon] of Object.entries(platformIcons)) {
    if (lowerText.includes(platform)) {
      return icon;
    }
  }
  return null;
};

// الكشف عن نوع الخدمة
const detectServiceType = (text: string): { type: string; icon: string } => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('follower')) return { type: 'متابعين', icon: '👥' };
  if (lowerText.includes('like')) return { type: 'لايكات', icon: '❤️' };
  if (lowerText.includes('view')) return { type: 'مشاهدات', icon: '👁️' };
  if (lowerText.includes('comment')) return { type: 'تعليقات', icon: '💬' };
  if (lowerText.includes('subscriber')) return { type: 'مشتركين', icon: '🔔' };
  if (lowerText.includes('share')) return { type: 'مشاركات', icon: '🔄' };
  if (lowerText.includes('retweet')) return { type: 'ريتويت', icon: '🔁' };
  if (lowerText.includes('member')) return { type: 'أعضاء', icon: '👤' };
  if (lowerText.includes('reaction')) return { type: 'تفاعلات', icon: '😊' };
  if (lowerText.includes('play') || lowerText.includes('stream')) return { type: 'تشغيلات', icon: '▶️' };
  if (lowerText.includes('save')) return { type: 'حفظ', icon: '📥' };
  if (lowerText.includes('impression')) return { type: 'انطباعات', icon: '📈' };
  if (lowerText.includes('reach')) return { type: 'وصول', icon: '📡' };
  if (lowerText.includes('engagement')) return { type: 'تفاعل', icon: '🔥' };
  if (lowerText.includes('watch') && lowerText.includes('hour')) return { type: 'ساعات مشاهدة', icon: '⏰' };
  if (lowerText.includes('review') || lowerText.includes('rating')) return { type: 'تقييمات', icon: '⭐' };
  if (lowerText.includes('vote')) return { type: 'تصويتات', icon: '🗳️' };
  if (lowerText.includes('download') || lowerText.includes('install')) return { type: 'تحميلات', icon: '📲' };
  
  return { type: 'خدمة', icon: '✨' };
};

// الكشف عن الجودة
const detectQuality = (text: string): { quality: string; badge: string } | null => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('premium') || lowerText.includes('vip')) return { quality: 'مميز', badge: '👑' };
  if (lowerText.includes('real') || lowerText.includes('genuine')) return { quality: 'حقيقي', badge: '✅' };
  if (lowerText.includes('high quality') || lowerText.includes('hq')) return { quality: 'جودة عالية', badge: '💎' };
  if (lowerText.includes('organic') || lowerText.includes('natural')) return { quality: 'طبيعي', badge: '🌿' };
  if (lowerText.includes('instant') || lowerText.includes('fast')) return { quality: 'سريع', badge: '⚡' };
  if (lowerText.includes('cheap') || lowerText.includes('low')) return { quality: 'اقتصادي', badge: '💰' };
  if (lowerText.includes('targeted')) return { quality: 'مستهدف', badge: '🎯' };
  if (lowerText.includes('no drop') || lowerText.includes('non drop')) return { quality: 'بدون نقص', badge: '🛡️' };
  if (lowerText.includes('refill') || lowerText.includes('guarantee')) return { quality: 'مضمون', badge: '🔄' };
  
  return null;
};

// الكشف عن المنطقة/الجنسية
const detectRegion = (text: string): { region: string; flag: string } | null => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('arab') || lowerText.includes('arabic')) return { region: 'عربي', flag: '🇸🇦' };
  if (lowerText.includes('saudi') || lowerText.includes('ksa')) return { region: 'سعودي', flag: '🇸🇦' };
  if (lowerText.includes('egypt')) return { region: 'مصري', flag: '🇪🇬' };
  if (lowerText.includes('uae') || lowerText.includes('emirati')) return { region: 'إماراتي', flag: '🇦🇪' };
  if (lowerText.includes('usa') || lowerText.includes('american')) return { region: 'أمريكي', flag: '🇺🇸' };
  if (lowerText.includes('uk') || lowerText.includes('british')) return { region: 'بريطاني', flag: '🇬🇧' };
  if (lowerText.includes('indian') || lowerText.includes('india')) return { region: 'هندي', flag: '🇮🇳' };
  if (lowerText.includes('turkish') || lowerText.includes('turkey')) return { region: 'تركي', flag: '🇹🇷' };
  if (lowerText.includes('brazil')) return { region: 'برازيلي', flag: '🇧🇷' };
  if (lowerText.includes('russia')) return { region: 'روسي', flag: '🇷🇺' };
  if (lowerText.includes('worldwide') || lowerText.includes('global')) return { region: 'عالمي', flag: '🌍' };
  if (lowerText.includes('mixed')) return { region: 'مختلط', flag: '🌐' };
  
  return null;
};

const translateText = (text: string): string => {
  let translated = text;
  
  // ترتيب حسب الطول (الأطول أولاً) لتجنب الاستبدال الجزئي
  const sortedEntries = Object.entries(translationDict).sort((a, b) => b[0].length - a[0].length);
  
  for (const [en, ar] of sortedEntries) {
    translated = translated.replace(new RegExp(`\\b${en}\\b`, 'gi'), ar);
  }

  return translated;
};

// إعادة صياغة اسم الخدمة بشكل محسن
const formatServiceName = (name: string): { formattedName: string; platformIcon: string; badges: string[] } => {
  const platformIcon = detectPlatform(name) || '📦';
  const serviceType = detectServiceType(name);
  const quality = detectQuality(name);
  const region = detectRegion(name);
  
  const badges: string[] = [];
  
  // بناء الاسم المحسن
  let parts: string[] = [];
  
  // إضافة نوع الخدمة
  parts.push(serviceType.type);
  
  // إضافة الجودة
  if (quality) {
    parts.push(`(${quality.quality})`);
    badges.push(quality.badge);
  }
  
  // إضافة المنطقة
  if (region) {
    parts.push(`- ${region.region}`);
    badges.push(region.flag);
  }
  
  // إضافة ميزات إضافية
  const lowerName = name.toLowerCase();
  if (lowerName.includes('drip') || lowerName.includes('gradual')) {
    badges.push('📊');
  }
  if (lowerName.includes('lifetime') || lowerName.includes('permanent')) {
    badges.push('♾️');
  }
  
  return {
    formattedName: parts.join(' '),
    platformIcon,
    badges
  };
};

const translateName = (name: string): string => {
  return translateText(name);
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
          <div className="flex-1 overflow-y-auto">
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

                  const categoryIcon = detectPlatform(catName) || '📁';

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
                        <span className="text-xl shrink-0">{categoryIcon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{autoTranslate ? translateText(catName) : catName}</p>
                          <p className="text-xs text-muted-foreground dir-ltr text-right">
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
                            const formatted = formatServiceName(service.name);
                            
                            return (
                              <div
                                key={service.service}
                                className={`flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-background/50 cursor-pointer ${
                                  isSelected ? 'bg-primary/5' : ''
                                } ${isExisting ? 'opacity-60' : ''}`}
                                onClick={() => toggleService(service.service)}
                              >
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleService(service.service)} />
                                <span className="text-xl shrink-0">{formatted.platformIcon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">
                                      {autoTranslate ? translateText(service.name) : service.name}
                                    </p>
                                    {formatted.badges.length > 0 && (
                                      <span className="text-xs shrink-0">{formatted.badges.slice(0, 3).join(' ')}</span>
                                    )}
                                  </div>
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
          </div>
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
