import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderPayload {
  orderId: string;
  serviceId: string;
  link: string;
  quantity: number;
}

async function sendOrderToProvider(supabase: any, payload: OrderPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  const { orderId, serviceId, link, quantity } = payload;
  
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
    return { success: false, error: 'Service not found' };
  }

  if (!service.external_service_id) {
    console.log('No external service ID, skipping provider API');
    return { success: true, data: { message: 'Local order only - no external service ID' } };
  }

  // Get provider info - either from service or use default
  let apiUrl: string;
  let apiKey: string;
  let providerName: string;
  let providerId: string | null = null;

  if (service.provider_id && service.api_providers) {
    const provider = service.api_providers as any;
    if (!provider.is_active) {
      console.error('Provider is not active:', provider.name);
      
      // Update order with error
      await supabase
        .from('orders')
        .update({ 
          external_status: 'error',
          admin_notes: `المزود ${provider.name} غير نشط`
        })
        .eq('id', orderId);
      
      return { success: false, error: 'Provider is not active' };
    }
    apiUrl = provider.api_url;
    apiKey = provider.api_key;
    providerName = provider.name;
    providerId = provider.id;
  } else {
    // Fallback to default provider
    const { data: defaultProvider, error: defaultError } = await supabase
      .from('api_providers')
      .select('id, name, api_url, api_key, is_active')
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    if (defaultError || !defaultProvider) {
      console.error('No provider found for service and no default provider');
      
      // Update order with error
      await supabase
        .from('orders')
        .update({ 
          external_status: 'error',
          admin_notes: 'لا يوجد مزود مُعيّن لهذه الخدمة'
        })
        .eq('id', orderId);
      
      return { success: false, error: 'No provider configured for this service' };
    }
    
    apiUrl = defaultProvider.api_url;
    apiKey = defaultProvider.api_key;
    providerName = defaultProvider.name;
    providerId = defaultProvider.id;
  }

  // Send order to provider API
  console.log(`Sending to ${providerName}:`, { 
    service: service.external_service_id, 
    link, 
    quantity, 
    apiUrl 
  });

  // Validate required fields
  if (!link || link.trim() === '') {
    await supabase
      .from('orders')
      .update({ 
        external_status: 'error',
        admin_notes: 'الرابط مطلوب'
      })
      .eq('id', orderId);
    return { success: false, error: 'Link is required' };
  }

  if (!quantity || quantity < 1) {
    await supabase
      .from('orders')
      .update({ 
        external_status: 'error',
        admin_notes: 'الكمية يجب أن تكون أكبر من صفر'
      })
      .eq('id', orderId);
    return { success: false, error: 'Invalid quantity' };
  }

  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('action', 'add');
  formData.append('service', service.external_service_id);
  formData.append('link', link.trim());
  formData.append('quantity', quantity.toString());

  try {
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
          admin_notes: `خطأ من ${providerName}: ${result.error}`
        })
        .eq('id', orderId);

      return { success: false, error: result.error };
    }

    // Update order with external order ID and set status to processing
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        external_order_id: result.order?.toString(),
        external_status: 'pending',
        status: 'processing'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
    }

    // Log the order to provider_balance_logs
    if (providerId) {
      const balanceFormData = new FormData();
      balanceFormData.append('key', apiKey);
      balanceFormData.append('action', 'balance');
      
      try {
        const balanceResponse = await fetch(apiUrl, {
          method: 'POST',
          body: balanceFormData,
        });
        const balanceData = await balanceResponse.json();
        const currentBalance = parseFloat(balanceData.balance || balanceData.funds || '0');

        await supabase
          .from('provider_balance_logs')
          .insert({
            provider_id: providerId,
            balance: currentBalance,
            currency: balanceData.currency || 'USD',
            order_id: orderId,
            order_cost: result.charge || null,
            action_type: 'order_placed',
            notes: `طلب رقم ${result.order} - الخدمة: ${service.name}`
          });
        console.log('Order logged to balance logs');
      } catch (logError) {
        console.error('Error logging order to balance logs:', logError);
      }
    }

    return { 
      success: true, 
      data: { 
        external_order_id: result.order,
        provider: providerName,
        message: `Order sent to ${providerName} successfully`
      }
    };

  } catch (fetchError) {
    console.error('Error calling provider API:', fetchError);
    
    // Update order with error
    await supabase
      .from('orders')
      .update({ 
        external_status: 'error',
        admin_notes: `خطأ في الاتصال بـ ${providerName}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
      })
      .eq('id', orderId);

    return { success: false, error: fetchError instanceof Error ? fetchError.message : 'Unknown error' };
  }
}

serve(async (req) => {
  console.log('=== provider-order function called ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { orderId, serviceId, link, quantity } = body;

    if (!orderId || !serviceId || !link || !quantity) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, serviceId, link, quantity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendOrderToProvider(supabase, { orderId, serviceId, link, quantity });

    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, ...result.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Error in provider-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});