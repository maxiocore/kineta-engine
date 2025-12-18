import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { orderId, serviceId, link, quantity } = await req.json();

    console.log('Processing order:', { orderId, serviceId, link, quantity });

    // Get service with provider information
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select(`
        external_service_id, 
        name,
        provider_id,
        api_providers (
          id,
          name,
          api_url,
          api_key,
          is_active
        )
      `)
      .eq('id', serviceId)
      .maybeSingle();

    if (serviceError || !service) {
      console.error('Service not found:', serviceError);
      return new Response(
        JSON.stringify({ error: 'Service not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!service.external_service_id) {
      console.log('No external service ID, skipping provider API');
      return new Response(
        JSON.stringify({ success: true, message: 'Local order only - no external service ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get provider info - either from service or use default
    let apiUrl: string;
    let apiKey: string;
    let providerName: string;

    if (service.provider_id && service.api_providers) {
      const provider = service.api_providers as any;
      if (!provider.is_active) {
        console.error('Provider is not active:', provider.name);
        return new Response(
          JSON.stringify({ error: 'Provider is not active' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      apiUrl = provider.api_url;
      apiKey = provider.api_key;
      providerName = provider.name;
    } else {
      // Fallback to default provider
      const { data: defaultProvider, error: defaultError } = await supabase
        .from('api_providers')
        .select('id, name, api_url, api_key, is_active')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();

      if (defaultError || !defaultProvider) {
        // Try legacy BulkFollows API key
        const legacyApiKey = Deno.env.get('BULKFOLLOWS_API_KEY');
        if (legacyApiKey) {
          apiUrl = 'https://bulkfollows.com/api/v2';
          apiKey = legacyApiKey;
          providerName = 'BulkFollows (Legacy)';
        } else {
          console.error('No provider found for service and no default provider');
          return new Response(
            JSON.stringify({ error: 'No provider configured for this service' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        apiUrl = defaultProvider.api_url;
        apiKey = defaultProvider.api_key;
        providerName = defaultProvider.name;
      }
    }

    // Send order to provider API
    console.log(`Sending to ${providerName}:`, { service: service.external_service_id, link, quantity, apiUrl });

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('action', 'add');
    formData.append('service', service.external_service_id);
    formData.append('link', link);
    formData.append('quantity', quantity.toString());

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log(`${providerName} response:`, result);

    if (result.error) {
      // Update order with error status
      await supabase
        .from('orders')
        .update({ 
          external_status: 'error',
          admin_notes: `${providerName} Error: ${result.error}`
        })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with external order ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        external_order_id: result.order?.toString(),
        external_status: 'pending'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        external_order_id: result.order,
        provider: providerName,
        message: `Order sent to ${providerName} successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in provider-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
