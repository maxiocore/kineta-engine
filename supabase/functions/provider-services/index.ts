import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform translations
const platformTranslations: Record<string, string> = {
  'instagram': 'انستقرام',
  'facebook': 'فيسبوك',
  'twitter': 'تويتر',
  'youtube': 'يوتيوب',
  'tiktok': 'تيك توك',
  'telegram': 'تيليجرام',
  'snapchat': 'سناب شات',
  'linkedin': 'لينكد إن',
  'spotify': 'سبوتيفاي',
  'soundcloud': 'ساوند كلاود',
  'threads': 'ثريدز',
  'whatsapp': 'واتساب',
  'pinterest': 'بنترست',
  'discord': 'ديسكورد',
  'twitch': 'تويتش',
  'reddit': 'ريديت',
};

// Service type translations
const serviceTypeTranslations: Record<string, string> = {
  'followers': 'متابعين',
  'likes': 'لايكات',
  'views': 'مشاهدات',
  'comments': 'تعليقات',
  'subscribers': 'مشتركين',
  'shares': 'مشاركات',
  'saves': 'حفظ',
  'reactions': 'تفاعلات',
  'impressions': 'انطباعات',
  'watch hours': 'ساعات مشاهدة',
  'live stream': 'بث مباشر',
  'story': 'ستوري',
  'reel': 'ريلز',
  'post': 'منشور',
  'video': 'فيديو',
  'photo': 'صورة',
  'real': 'حقيقي',
  'high quality': 'جودة عالية',
  'premium': 'مميز',
  'organic': 'عضوي',
  'fast': 'سريع',
  'instant': 'فوري',
  'slow': 'بطيء',
  'refill': 'إعادة تعبئة',
  'guaranteed': 'مضمون',
  'lifetime': 'مدى الحياة',
};

// Helper function to detect platform from category name
const detectPlatform = (category: string): { platform: string | null; platformAr: string | null } => {
  const lowerCategory = category.toLowerCase();
  for (const [en, ar] of Object.entries(platformTranslations)) {
    if (lowerCategory.includes(en)) {
      return { platform: en, platformAr: ar };
    }
  }
  return { platform: null, platformAr: null };
};

// Helper function to extract subcategory from category name
const extractSubcategory = (categoryName: string): { main: string; sub: string | null } => {
  const separators = [' - ', ' | ', ' > ', ' » ', ': ', ' / '];
  for (const sep of separators) {
    if (categoryName.includes(sep)) {
      const parts = categoryName.split(sep);
      return { 
        main: parts[0].trim(), 
        sub: parts.slice(1).join(sep).trim() || null 
      };
    }
  }
  return { main: categoryName, sub: null };
};

// Helper function to parse and format description with all available details
const formatServiceDescription = (service: any): string => {
  const parts: string[] = [];
  
  // Add original description if exists
  if (service.desc && service.desc.trim()) {
    parts.push(service.desc.trim());
  } else if (service.description && service.description.trim()) {
    parts.push(service.description.trim());
  }
  
  // Build structured details
  const details: string[] = [];
  
  if (service.type) {
    details.push(`النوع: ${service.type}`);
  }
  if (service.min) {
    details.push(`الحد الأدنى: ${parseInt(service.min).toLocaleString('ar-SA')}`);
  }
  if (service.max) {
    details.push(`الحد الأقصى: ${parseInt(service.max).toLocaleString('ar-SA')}`);
  }
  if (service.average_time) {
    details.push(`متوسط الوقت: ${service.average_time}`);
  }
  if (service.quality) {
    details.push(`الجودة: ${service.quality}`);
  }
  if (service.speed) {
    details.push(`السرعة: ${service.speed}`);
  }
  
  if (details.length > 0) {
    parts.push(details.join(' | '));
  }
  
  // Add feature flags
  const features: string[] = [];
  if (service.refill === true || service.refill === 'true') {
    features.push('✓ إعادة التعبئة متاحة');
  }
  if (service.cancel === true || service.cancel === 'true') {
    features.push('✓ قابل للإلغاء');
  }
  if (service.dripfeed === true || service.dripfeed === 'true') {
    features.push('✓ التنقيط متاح');
  }
  
  if (features.length > 0) {
    parts.push(features.join(' | '));
  }
  
  return parts.join('\n') || 'غير متوفر';
};

// Enhance service object with parsed data and hierarchy info
const enhanceService = (service: any) => {
  const { main, sub } = extractSubcategory(service.category || 'Uncategorized');
  const { platform, platformAr } = detectPlatform(service.category || '');
  
  const rate = parseFloat(service.rate) || 0;
  const min = parseInt(service.min) || 1;
  const max = parseInt(service.max) || 1000;
  
  return {
    ...service,
    formatted_description: formatServiceDescription(service),
    hierarchy: {
      mainCategory: main,
      subCategory: sub,
      platform: platform,
      platformAr: platformAr,
    },
    parsed: {
      type: service.type || 'Default',
      min: min,
      max: max,
      rate: rate,
      refill: service.refill === true || service.refill === 'true',
      cancel: service.cancel === true || service.cancel === 'true',
      dripfeed: service.dripfeed === true || service.dripfeed === 'true',
      average_time: service.average_time || null,
      quality: service.quality || null,
      speed: service.speed || null,
      desc: service.desc || service.description || '',
    },
    stats: {
      pricePerK: rate > 0 ? (rate / 1000).toFixed(4) : '0.0000',
      estimatedDelivery: service.average_time || 'غير محدد',
    }
  };
};

// Build hierarchical category structure
const buildCategoryHierarchy = (services: any[]) => {
  const hierarchy: Record<string, {
    name: string;
    count: number;
    subcategories: Record<string, {
      name: string;
      count: number;
      hasRefill: boolean;
      hasCancel: boolean;
      hasDripfeed: boolean;
      minPrice: number;
      maxPrice: number;
    }>;
    hasRefill: boolean;
    hasCancel: boolean;
    hasDripfeed: boolean;
    minPrice: number;
    maxPrice: number;
    platform: string | null;
    platformAr: string | null;
  }> = {};

  services.forEach(service => {
    const { main, sub } = extractSubcategory(service.category || 'Uncategorized');
    const { platform, platformAr } = detectPlatform(service.category || '');
    const rate = parseFloat(service.rate) || 0;
    const hasRefill = service.refill === true || service.refill === 'true';
    const hasCancel = service.cancel === true || service.cancel === 'true';
    const hasDripfeed = service.dripfeed === true || service.dripfeed === 'true';

    // Initialize main category if not exists
    if (!hierarchy[main]) {
      hierarchy[main] = {
        name: main,
        count: 0,
        subcategories: {},
        hasRefill: false,
        hasCancel: false,
        hasDripfeed: false,
        minPrice: Infinity,
        maxPrice: 0,
        platform: platform,
        platformAr: platformAr,
      };
    }

    const mainCat = hierarchy[main];
    mainCat.count++;
    mainCat.hasRefill = mainCat.hasRefill || hasRefill;
    mainCat.hasCancel = mainCat.hasCancel || hasCancel;
    mainCat.hasDripfeed = mainCat.hasDripfeed || hasDripfeed;
    if (rate > 0) {
      mainCat.minPrice = Math.min(mainCat.minPrice, rate);
      mainCat.maxPrice = Math.max(mainCat.maxPrice, rate);
    }

    // Handle subcategory
    if (sub) {
      if (!mainCat.subcategories[sub]) {
        mainCat.subcategories[sub] = {
          name: sub,
          count: 0,
          hasRefill: false,
          hasCancel: false,
          hasDripfeed: false,
          minPrice: Infinity,
          maxPrice: 0,
        };
      }

      const subCat = mainCat.subcategories[sub];
      subCat.count++;
      subCat.hasRefill = subCat.hasRefill || hasRefill;
      subCat.hasCancel = subCat.hasCancel || hasCancel;
      subCat.hasDripfeed = subCat.hasDripfeed || hasDripfeed;
      if (rate > 0) {
        subCat.minPrice = Math.min(subCat.minPrice, rate);
        subCat.maxPrice = Math.max(subCat.maxPrice, rate);
      }
    }
  });

  // Clean up infinity values and convert to array
  const result = Object.values(hierarchy).map(cat => ({
    ...cat,
    minPrice: cat.minPrice === Infinity ? 0 : cat.minPrice,
    subcategories: Object.values(cat.subcategories).map(sub => ({
      ...sub,
      minPrice: sub.minPrice === Infinity ? 0 : sub.minPrice,
    })),
    subcategoriesCount: Object.keys(cat.subcategories).length,
  }));

  return result.sort((a, b) => b.count - a.count);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      provider_id, 
      categories_only, 
      selected_categories,
      include_hierarchy,
      search_query,
      features_filter,
    } = await req.json();

    if (!provider_id) {
      return new Response(
        JSON.stringify({ error: 'Provider ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch provider details
    console.log('Fetching provider:', provider_id);
    const { data: provider, error: providerError } = await supabase
      .from('api_providers')
      .select('*')
      .eq('id', provider_id)
      .single();

    if (providerError || !provider) {
      console.error('Provider not found:', providerError);
      return new Response(
        JSON.stringify({ error: 'Provider not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!provider.is_active) {
      return new Response(
        JSON.stringify({ error: 'Provider is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching services from provider: ${provider.name} (${provider.api_url})`);

    // Make request to provider API
    const formData = new FormData();
    formData.append('key', provider.api_key);
    formData.append('action', 'services');

    const response = await fetch(provider.api_url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Provider API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch services from provider', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let allServices = await response.json();
    
    // Handle error response from provider
    if (allServices && allServices.error) {
      return new Response(
        JSON.stringify({ error: allServices.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const servicesCount = Array.isArray(allServices) ? allServices.length : 0;
    console.log(`Fetched ${servicesCount} services from ${provider.name}`);

    // Update provider's last_sync_at and services_count
    await supabase
      .from('api_providers')
      .update({ 
        last_sync_at: new Date().toISOString(),
        services_count: servicesCount 
      })
      .eq('id', provider_id);

    // Build category hierarchy first
    const categoryHierarchy = buildCategoryHierarchy(Array.isArray(allServices) ? allServices : []);

    // If categories_only is true, return only hierarchy (smaller response)
    if (categories_only) {
      console.log(`Returning ${categoryHierarchy.length} categories with hierarchy`);

      return new Response(
        JSON.stringify({ 
          categories: categoryHierarchy,
          services_count: servicesCount,
          provider: {
            id: provider.id,
            name: provider.name,
            name_ar: provider.name_ar,
            profit_margin: provider.profit_margin,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter services if selected_categories is provided
    let filteredServices = allServices;
    if (selected_categories && Array.isArray(selected_categories) && selected_categories.length > 0) {
      const selectedSet = new Set(selected_categories);
      filteredServices = Array.isArray(allServices) 
        ? allServices.filter((s: any) => {
            const { main } = extractSubcategory(s.category || 'Uncategorized');
            return selectedSet.has(s.category) || selectedSet.has(main);
          })
        : [];
      console.log(`Filtered to ${filteredServices.length} services for ${selected_categories.length} categories`);
    }

    // Apply search query filter
    if (search_query && typeof search_query === 'string') {
      const query = search_query.toLowerCase();
      filteredServices = Array.isArray(filteredServices)
        ? filteredServices.filter((s: any) => 
            (s.name && s.name.toLowerCase().includes(query)) ||
            (s.category && s.category.toLowerCase().includes(query)) ||
            String(s.service).includes(query)
          )
        : [];
      console.log(`Search filtered to ${filteredServices.length} services`);
    }

    // Apply features filter
    if (features_filter) {
      filteredServices = Array.isArray(filteredServices)
        ? filteredServices.filter((s: any) => {
            if (features_filter.refill && !(s.refill === true || s.refill === 'true')) return false;
            if (features_filter.cancel && !(s.cancel === true || s.cancel === 'true')) return false;
            if (features_filter.dripfeed && !(s.dripfeed === true || s.dripfeed === 'true')) return false;
            return true;
          })
        : [];
      console.log(`Features filtered to ${filteredServices.length} services`);
    }

    // Enhance all services with formatted descriptions and hierarchy
    const enhancedServices = Array.isArray(filteredServices) 
      ? filteredServices.map(enhanceService)
      : [];

    // Calculate aggregate stats
    const prices = enhancedServices.map((s: any) => s.parsed.rate).filter((p: number) => p > 0);
    const stats = {
      totalServices: enhancedServices.length,
      totalCategories: categoryHierarchy.length,
      totalSubcategories: categoryHierarchy.reduce((sum, cat) => sum + (cat.subcategoriesCount || 0), 0),
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
        avg: prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0,
      },
      features: {
        refillCount: enhancedServices.filter((s: any) => s.parsed.refill).length,
        cancelCount: enhancedServices.filter((s: any) => s.parsed.cancel).length,
        dripfeedCount: enhancedServices.filter((s: any) => s.parsed.dripfeed).length,
      }
    };

    return new Response(
      JSON.stringify({ 
        services: enhancedServices,
        categories: include_hierarchy ? categoryHierarchy : undefined,
        stats,
        services_count: servicesCount,
        provider: {
          id: provider.id,
          name: provider.name,
          name_ar: provider.name_ar,
          profit_margin: provider.profit_margin,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in provider-services:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
