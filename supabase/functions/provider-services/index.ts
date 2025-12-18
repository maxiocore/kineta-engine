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
    const { provider_id } = await req.json();

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

    const services = await response.json();
    const servicesCount = Array.isArray(services) ? services.length : 0;
    console.log(`Fetched ${servicesCount} services from ${provider.name}`);

    // Update provider's last_sync_at and services_count
    await supabase
      .from('api_providers')
      .update({ 
        last_sync_at: new Date().toISOString(),
        services_count: servicesCount 
      })
      .eq('id', provider_id);

    // Extract unique categories from services
    const categories = Array.isArray(services) 
      ? [...new Set(services.map((s: any) => s.category))]
      : [];

    return new Response(
      JSON.stringify({ 
        services,
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
