import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to format description with all available details
const formatServiceDescription = (service: any): string => {
  const parts: string[] = [];
  
  if (service.desc && service.desc.trim()) {
    parts.push(service.desc.trim());
  } else if (service.description && service.description.trim()) {
    parts.push(service.description.trim());
  } else {
    parts.push('غير متوفر');
  }
  
  const details: string[] = [];
  if (service.type) details.push(`النوع: ${service.type}`);
  if (service.min) details.push(`الحد الأدنى: ${service.min}`);
  if (service.max) details.push(`الحد الأقصى: ${service.max}`);
  if (service.average_time) details.push(`متوسط الوقت: ${service.average_time}`);
  if (service.quality) details.push(`الجودة: ${service.quality}`);
  if (service.speed) details.push(`السرعة: ${service.speed}`);
  
  if (details.length > 0) {
    parts.push('');
    parts.push(details.join(' | '));
  }
  
  const features: string[] = [];
  if (service.refill === true || service.refill === 'true') features.push('✓ إعادة التعبئة متاحة');
  if (service.cancel === true || service.cancel === 'true') features.push('✓ قابل للإلغاء');
  if (service.dripfeed === true || service.dripfeed === 'true') features.push('✓ التنقيط متاح');
  
  if (features.length > 0) {
    parts.push('');
    parts.push(features.join(' | '));
  }
  
  return parts.join('\n');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider_id, update_prices, update_descriptions, auto_sync } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get providers to sync - either specific one or all active ones (for auto sync)
    let providersQuery = supabase.from('api_providers').select('*').eq('is_active', true);
    
    if (provider_id && !auto_sync) {
      providersQuery = providersQuery.eq('id', provider_id);
    }
    
    const { data: providers, error: providersError } = await providersQuery;
    
    if (providersError || !providers || providers.length === 0) {
      console.error('No providers found:', providersError);
      return new Response(
        JSON.stringify({ error: 'No active providers found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any[] = [];
    
    for (const provider of providers) {
      console.log(`Syncing services from provider: ${provider.name}`);
      
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
            error: `API error: ${response.status}`,
          });
          continue;
        }

        const providerServices = await response.json();
        
        if (!Array.isArray(providerServices)) {
          console.error(`Invalid response from ${provider.name}`);
          results.push({
            provider_id: provider.id,
            provider_name: provider.name,
            success: false,
            error: 'Invalid API response',
          });
          continue;
        }

        // Get existing services for this provider
        const { data: existingServices, error: existingError } = await supabase
          .from('services')
          .select('id, external_service_id, price, description, name')
          .eq('provider_id', provider.id)
          .not('external_service_id', 'is', null);

        if (existingError) {
          console.error(`Error fetching existing services for ${provider.name}:`, existingError);
          continue;
        }

        // Create a map of provider services by ID
        const providerServicesMap = new Map();
        providerServices.forEach((s: any) => {
          providerServicesMap.set(s.service, s);
        });

        let updatedCount = 0;
        let priceUpdates = 0;
        let descriptionUpdates = 0;
        let notFoundCount = 0;

        // Update existing services
        for (const existingService of existingServices || []) {
          const providerService = providerServicesMap.get(existingService.external_service_id);
          
          if (!providerService) {
            notFoundCount++;
            continue;
          }

          const updates: any = {};
          
          // Update price if enabled
          if (update_prices !== false) {
            const newPrice = parseFloat(providerService.rate) * (1 + provider.profit_margin / 100);
            if (Math.abs(newPrice - existingService.price) > 0.001) {
              updates.price = parseFloat(newPrice.toFixed(4));
              priceUpdates++;
            }
          }
          
          // Update description if enabled
          if (update_descriptions !== false) {
            const newDescription = formatServiceDescription(providerService);
            if (newDescription !== existingService.description) {
              updates.description = newDescription;
              descriptionUpdates++;
            }
          }
          
          // Update refill status
          const refillEnabled = providerService.refill === true || providerService.refill === 'true';
          updates.refill_enabled = refillEnabled;
          
          // Update features
          const features = [
            providerService.dripfeed === true || providerService.dripfeed === 'true' ? 'دعم التنقيط' : null,
            refillEnabled ? 'إعادة التعبئة' : null,
            providerService.cancel === true || providerService.cancel === 'true' ? 'قابل للإلغاء' : null,
          ].filter(Boolean);
          updates.features = features;
          updates.updated_at = new Date().toISOString();

          if (Object.keys(updates).length > 1) { // More than just updated_at
            const { error: updateError } = await supabase
              .from('services')
              .update(updates)
              .eq('id', existingService.id);

            if (!updateError) {
              updatedCount++;
            } else {
              console.error(`Error updating service ${existingService.id}:`, updateError);
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
          success: true,
          total_provider_services: providerServices.length,
          existing_services: existingServices?.length || 0,
          updated: updatedCount,
          price_updates: priceUpdates,
          description_updates: descriptionUpdates,
          not_found_in_provider: notFoundCount,
        });

        console.log(`Synced ${provider.name}: ${updatedCount} services updated`);
        
      } catch (providerError) {
        console.error(`Error syncing provider ${provider.name}:`, providerError);
        results.push({
          provider_id: provider.id,
          provider_name: provider.name,
          success: false,
          error: providerError instanceof Error ? providerError.message : 'Unknown error',
        });
      }
    }

    // Log the sync in audit_logs if it's an auto sync
    if (auto_sync) {
      await supabase.from('audit_logs').insert({
        table_name: 'services',
        action: 'AUTO_SYNC',
        new_value: { results, sync_time: new Date().toISOString() },
      });
    }

    const totalUpdated = results.reduce((sum, r) => sum + (r.updated || 0), 0);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `تم تحديث ${totalUpdated} خدمة`,
        results,
        sync_time: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in sync-services:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
