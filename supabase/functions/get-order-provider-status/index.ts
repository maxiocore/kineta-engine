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
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching provider status for order:', orderId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with service and provider details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        external_order_id,
        external_status,
        status,
        quantity,
        services (
          id,
          name,
          provider_id,
          api_providers (
            id,
            name,
            api_url,
            api_key,
            is_active
          )
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order has external ID
    if (!order.external_order_id) {
      console.log('Order has no external order ID');
      return new Response(
        JSON.stringify({ 
          success: true, 
          hasExternalOrder: false,
          message: 'This order was not sent to an external provider'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get provider API details
    const service = order.services as any;
    let apiUrl: string | null = null;
    let apiKey: string | null = null;
    let providerName: string = 'Unknown';

    if (service?.provider_id && service?.api_providers?.is_active) {
      apiUrl = service.api_providers.api_url;
      apiKey = service.api_providers.api_key;
      providerName = service.api_providers.name;
    } else {
      // Get default provider
      const { data: defaultProvider } = await supabase
        .from('api_providers')
        .select('id, name, api_url, api_key')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();

      if (defaultProvider) {
        apiUrl = defaultProvider.api_url;
        apiKey = defaultProvider.api_key;
        providerName = defaultProvider.name;
      }
    }

    if (!apiUrl || !apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active provider found for this order'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching status from provider: ${providerName} for external order: ${order.external_order_id}`);

    // Fetch status from provider API
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('action', 'status');
    formData.append('order', order.external_order_id);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('Provider response:', result);

    if (result.error) {
      console.error('Provider API error:', result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          providerName 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return provider status with all details
    const startCount = result.start_count !== undefined ? parseInt(result.start_count) : null;
    const remains = result.remains !== undefined ? parseInt(result.remains) : null;

    // Update order with start_count and remains if available
    if (startCount !== null || remains !== null) {
      const updateData: any = {};
      if (startCount !== null) updateData.start_count = startCount;
      if (remains !== null) updateData.remains = remains;
      
      await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
    }

    const providerStatus = {
      success: true,
      hasExternalOrder: true,
      externalOrderId: order.external_order_id,
      providerName,
      status: result.status || null,
      startCount,
      remains,
      charge: result.charge !== undefined ? parseFloat(result.charge) : null,
      currency: result.currency || 'USD',
      // Calculate delivered count
      delivered: startCount !== null && remains !== null 
        ? startCount + (order.quantity || 0) - remains
        : null,
      orderedQuantity: order.quantity,
    };

    console.log('Returning provider status:', providerStatus);

    return new Response(
      JSON.stringify(providerStatus),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-order-provider-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
