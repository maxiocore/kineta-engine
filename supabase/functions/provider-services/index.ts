import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider_id, categories_only, selected_categories } = await req.json();

    if (!provider_id) {
      console.error('Provider ID is required');
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

    const allServices = await response.json();
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

    // If categories_only is true, return only categories with counts (much smaller response)
    if (categories_only) {
      const categoryMap = new Map<string, number>();
      if (Array.isArray(allServices)) {
        allServices.forEach((service: any) => {
          const count = categoryMap.get(service.category) || 0;
          categoryMap.set(service.category, count + 1);
        });
      }
      
      const categories = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log(`Returning ${categories.length} categories only (not full services)`);

      return new Response(
        JSON.stringify({ 
          categories,
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

    // If selected_categories is provided, filter services by those categories
    let filteredServices = allServices;
    if (selected_categories && Array.isArray(selected_categories) && selected_categories.length > 0) {
      const selectedSet = new Set(selected_categories);
      filteredServices = Array.isArray(allServices) 
        ? allServices.filter((s: any) => selectedSet.has(s.category))
        : [];
      console.log(`Filtered to ${filteredServices.length} services for ${selected_categories.length} categories`);
    }

    // Extract unique categories from filtered services
    const categories = Array.isArray(filteredServices) 
      ? [...new Set(filteredServices.map((s: any) => s.category))]
      : [];

    return new Response(
      JSON.stringify({ 
        services: filteredServices,
        categories,
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
