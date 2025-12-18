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
    const apiKey = Deno.env.get('BULKFOLLOWS_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!apiKey) {
      console.error('BULKFOLLOWS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { orderId, serviceId, link, quantity } = await req.json();

    console.log('Processing order:', { orderId, serviceId, link, quantity });

    // Get service external ID
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('external_service_id, name')
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
      console.log('No external service ID, skipping BulkFollows API');
      return new Response(
        JSON.stringify({ success: true, message: 'Local order only - no external service ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send order to BulkFollows API
    console.log('Sending to BulkFollows:', { service: service.external_service_id, link, quantity });

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('action', 'add');
    formData.append('service', service.external_service_id);
    formData.append('link', link);
    formData.append('quantity', quantity.toString());

    const response = await fetch('https://bulkfollows.com/api/v2', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('BulkFollows response:', result);

    if (result.error) {
      // Update order with error status
      await supabase
        .from('orders')
        .update({ 
          external_status: 'error',
          admin_notes: `BulkFollows Error: ${result.error}`
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
        message: 'Order sent to BulkFollows successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in bulkfollows-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
