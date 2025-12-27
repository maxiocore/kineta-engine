import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform name translations
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
  'twitch': 'تويتش',
  'discord': 'ديسكورد',
  'pinterest': 'بنترست',
  'threads': 'ثريدز',
  'whatsapp': 'واتساب',
};

// Service type translations
const serviceTypeTranslations: Record<string, string> = {
  'followers': 'متابعين',
  'likes': 'لايكات',
  'views': 'مشاهدات',
  'comments': 'تعليقات',
  'shares': 'مشاركات',
  'subscribers': 'مشتركين',
  'retweets': 'ريتويت',
  'story views': 'مشاهدات الستوري',
  'reel views': 'مشاهدات الريلز',
  'watch hours': 'ساعات المشاهدة',
  'live views': 'مشاهدات البث',
  'saves': 'حفظ',
  'members': 'أعضاء',
  'plays': 'تشغيلات',
  'streams': 'استماعات',
  'reactions': 'تفاعلات',
};

// Quality translations
const qualityTranslations: Record<string, string> = {
  'real': 'حقيقي',
  'active': 'نشط',
  'high quality': 'جودة عالية',
  'hq': 'جودة عالية',
  'premium': 'مميز',
  'fast': 'سريع',
  'instant': 'فوري',
  'slow': 'بطيء',
  'organic': 'طبيعي',
  'targeted': 'مستهدف',
  'worldwide': 'عالمي',
  'arab': 'عربي',
  'usa': 'أمريكي',
  'guaranteed': 'مضمون',
  'lifetime': 'مدى الحياة',
  'non-drop': 'بدون نقصان',
  'no drop': 'بدون نقصان',
  'refill': 'إعادة تعبئة',
};

// Translate service name to Arabic
function translateServiceName(name: string): string {
  let translated = name.toLowerCase();
  
  // Translate platform names
  for (const [en, ar] of Object.entries(platformTranslations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, ar);
  }
  
  // Translate service types
  for (const [en, ar] of Object.entries(serviceTypeTranslations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, ar);
  }
  
  // Translate quality terms
  for (const [en, ar] of Object.entries(qualityTranslations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, ar);
  }
  
  // Capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

// Format service description with all details
function formatServiceDescription(service: any): string {
  const parts: string[] = [];
  
  // Original description
  if (service.desc && service.desc.trim()) {
    parts.push(service.desc.trim());
  } else if (service.description && service.description.trim()) {
    parts.push(service.description.trim());
  }
  
  // Details section
  const details: string[] = [];
  if (service.type) details.push(`النوع: ${service.type}`);
  if (service.min) details.push(`الحد الأدنى: ${service.min}`);
  if (service.max) details.push(`الحد الأقصى: ${service.max}`);
  if (service.average_time) details.push(`متوسط الوقت: ${service.average_time}`);
  if (service.quality) details.push(`الجودة: ${service.quality}`);
  if (service.speed) details.push(`السرعة: ${service.speed}`);
  
  if (details.length > 0) {
    parts.push('');
    parts.push('━━━ تفاصيل الخدمة ━━━');
    parts.push(details.join(' | '));
  }
  
  // Features section
  const features: string[] = [];
  if (service.refill === true || service.refill === 'true') features.push('✓ إعادة التعبئة متاحة');
  if (service.cancel === true || service.cancel === 'true') features.push('✓ قابل للإلغاء');
  if (service.dripfeed === true || service.dripfeed === 'true') features.push('✓ التنقيط متاح');
  
  if (features.length > 0) {
    parts.push('');
    parts.push('━━━ المميزات ━━━');
    parts.push(features.join(' | '));
  }
  
  return parts.join('\n');
}

// Detect platform from category string
function detectPlatform(category: string): string {
  const lowerCat = category.toLowerCase();
  
  for (const [platform, arabic] of Object.entries(platformTranslations)) {
    if (lowerCat.includes(platform)) {
      return arabic;
    }
  }
  
  return 'أخرى';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      provider_id, 
      update_prices = true, 
      update_descriptions = true,
      translate_names = true,
      delete_removed = false,
      auto_sync = false 
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get providers to sync
    let providersQuery = supabase.from('api_providers').select('*').eq('is_active', true);
    if (provider_id && !auto_sync) {
      providersQuery = providersQuery.eq('id', provider_id);
    }
    
    const { data: providers, error: providersError } = await providersQuery;
    
    if (providersError || !providers || providers.length === 0) {
      console.error('No providers found:', providersError);
      return new Response(
        JSON.stringify({ error: 'لا يوجد مزودين نشطين' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any[] = [];
    
    for (const provider of providers) {
      console.log(`مزامنة الخدمات من المزود: ${provider.name}`);
      
      try {
        // Fetch services from provider API
        const formData = new FormData();
        formData.append('key', provider.api_key);
        formData.append('action', 'services');

        const response = await fetch(provider.api_url, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.error(`Provider ${provider.name} API error:`, response.status);
          results.push({
            provider_id: provider.id,
            provider_name: provider.name,
            success: false,
            error: `خطأ في الاتصال: ${response.status}`,
          });
          continue;
        }

        const providerServices = await response.json();
        
        if (!Array.isArray(providerServices)) {
          results.push({
            provider_id: provider.id,
            provider_name: provider.name,
            success: false,
            error: 'استجابة غير صالحة من المزود',
          });
          continue;
        }

        // Get existing services for this provider
        const { data: existingServices, error: existingError } = await supabase
          .from('services')
          .select('id, external_service_id, price, description, name, status')
          .eq('provider_id', provider.id)
          .not('external_service_id', 'is', null);

        if (existingError) {
          console.error(`Error fetching existing services:`, existingError);
          continue;
        }

        // Create maps for comparison
        const providerServicesMap = new Map<string, any>();
        providerServices.forEach((s: any) => {
          providerServicesMap.set(String(s.service), s);
        });

        const existingServicesMap = new Map<string, any>();
        (existingServices || []).forEach((s: any) => {
          existingServicesMap.set(String(s.external_service_id), s);
        });

        let updatedCount = 0;
        let deletedCount = 0;
        let priceUpdates = 0;
        let descriptionUpdates = 0;

        // Update existing services
        for (const existingService of existingServices || []) {
          const providerService = providerServicesMap.get(String(existingService.external_service_id));
          
          if (!providerService) {
            // Service no longer exists in provider
            if (delete_removed) {
              // Delete the service
              const { error: deleteError } = await supabase
                .from('services')
                .delete()
                .eq('id', existingService.id);
              
              if (!deleteError) {
                deletedCount++;
                console.log(`تم حذف الخدمة: ${existingService.name}`);
              }
            } else {
              // Mark as inactive
              await supabase
                .from('services')
                .update({ status: 'inactive' })
                .eq('id', existingService.id);
            }
            continue;
          }

          const updates: any = {};
          
          // Update price
          if (update_prices) {
            const newPrice = parseFloat(providerService.rate) * (1 + provider.profit_margin / 100);
            if (Math.abs(newPrice - existingService.price) > 0.0001) {
              updates.price = parseFloat(newPrice.toFixed(4));
              priceUpdates++;
            }
          }
          
          // Update description
          if (update_descriptions) {
            const newDescription = formatServiceDescription(providerService);
            if (newDescription !== existingService.description) {
              updates.description = newDescription;
              descriptionUpdates++;
            }
          }

          // Translate name if enabled
          if (translate_names && providerService.name) {
            const translatedName = translateServiceName(providerService.name);
            if (translatedName !== existingService.name) {
              updates.name = translatedName;
            }
          }
          
          // Update features and refill status
          const refillEnabled = providerService.refill === true || providerService.refill === 'true';
          updates.refill_enabled = refillEnabled;
          
          const features = [
            providerService.dripfeed === true || providerService.dripfeed === 'true' ? 'دعم التنقيط' : null,
            refillEnabled ? 'إعادة التعبئة' : null,
            providerService.cancel === true || providerService.cancel === 'true' ? 'قابل للإلغاء' : null,
          ].filter(Boolean);
          updates.features = features;
          updates.status = 'active';
          updates.updated_at = new Date().toISOString();

          if (Object.keys(updates).length > 2) {
            const { error: updateError } = await supabase
              .from('services')
              .update(updates)
              .eq('id', existingService.id);

            if (!updateError) {
              updatedCount++;
            }
          }
        }

        // Update provider's last sync time
        await supabase
          .from('api_providers')
          .update({ 
            last_sync_at: new Date().toISOString(),
            services_count: providerServices.length 
          })
          .eq('id', provider.id);

        results.push({
          provider_id: provider.id,
          provider_name: provider.name,
          provider_name_ar: provider.name_ar,
          success: true,
          total_provider_services: providerServices.length,
          existing_services: existingServices?.length || 0,
          updated: updatedCount,
          deleted: deletedCount,
          price_updates: priceUpdates,
          description_updates: descriptionUpdates,
        });

        console.log(`تم المزامنة: ${provider.name} - ${updatedCount} تحديث، ${deletedCount} حذف`);
        
      } catch (providerError) {
        console.error(`Error syncing provider ${provider.name}:`, providerError);
        results.push({
          provider_id: provider.id,
          provider_name: provider.name,
          success: false,
          error: providerError instanceof Error ? providerError.message : 'خطأ غير معروف',
        });
      }
    }

    // Log sync in audit_logs
    if (auto_sync) {
      await supabase.from('audit_logs').insert({
        table_name: 'services',
        action: 'AUTO_SYNC_ADVANCED',
        new_value: { results, sync_time: new Date().toISOString() },
      });
    }

    const totalUpdated = results.reduce((sum, r) => sum + (r.updated || 0), 0);
    const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `تم تحديث ${totalUpdated} خدمة${totalDeleted > 0 ? ` وحذف ${totalDeleted} خدمة` : ''}`,
        results,
        sync_time: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in sync-services-advanced:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
