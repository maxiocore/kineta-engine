import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map external status to internal status
function mapExternalStatus(externalStatus: string): string | null {
  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'In progress': 'in_progress',
    'Processing': 'in_progress',
    'Completed': 'completed',
    'Partial': 'completed',
    'Canceled': 'cancelled',
    'Cancelled': 'cancelled',
    'Refunded': 'refunded',
  };
  return statusMap[externalStatus] || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting orders status sync...');

    // Get all orders with external_order_id that are not completed/cancelled/refunded
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        external_order_id,
        external_status,
        status,
        service_id,
        services (
          id,
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
      .not('external_order_id', 'is', null)
      .not('status', 'in', '("completed","cancelled","refunded")');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orders || orders.length === 0) {
      console.log('No orders to sync');
      return new Response(
        JSON.stringify({ success: true, message: 'No orders to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${orders.length} orders to sync`);

    // Group orders by provider
    const ordersByProvider = new Map<string, { apiUrl: string; apiKey: string; providerName: string; orders: any[] }>();

    // Get default provider
    const { data: defaultProvider } = await supabase
      .from('api_providers')
      .select('id, name, api_url, api_key')
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    for (const order of orders) {
      const service = order.services as any;
      let apiUrl: string | null = null;
      let apiKey: string | null = null;
      let providerName: string = 'Unknown';
      let providerKey: string = 'unknown';

      if (service?.provider_id && service?.api_providers?.is_active) {
        apiUrl = service.api_providers.api_url;
        apiKey = service.api_providers.api_key;
        providerName = service.api_providers.name;
        providerKey = service.api_providers.id;
      } else if (defaultProvider) {
        apiUrl = defaultProvider.api_url;
        apiKey = defaultProvider.api_key;
        providerName = defaultProvider.name;
        providerKey = defaultProvider.id;
      }

      if (apiUrl && apiKey) {
        if (!ordersByProvider.has(providerKey)) {
          ordersByProvider.set(providerKey, { apiUrl, apiKey, providerName, orders: [] });
        }
        ordersByProvider.get(providerKey)!.orders.push(order);
      }
    }

    let syncedCount = 0;
    let errorCount = 0;
    const results: any[] = [];

    // Process each provider
    for (const [providerKey, providerData] of ordersByProvider) {
      console.log(`Syncing ${providerData.orders.length} orders from ${providerData.providerName}`);

      for (const order of providerData.orders) {
        try {
          // Fetch status from provider API
          const formData = new FormData();
          formData.append('key', providerData.apiKey);
          formData.append('action', 'status');
          formData.append('order', order.external_order_id);

          const response = await fetch(providerData.apiUrl, {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          console.log(`Order ${order.external_order_id} status from ${providerData.providerName}:`, result);

          if (result.error) {
            console.error(`Error from ${providerData.providerName} for order ${order.external_order_id}:`, result.error);
            errorCount++;
            continue;
          }

          // Update order status
          const externalStatus = result.status;
          const mappedStatus = mapExternalStatus(externalStatus);
          
          const updateData: any = {
            external_status: externalStatus?.toLowerCase() || order.external_status,
          };

          // Track if status will change for notification
          const oldStatus = order.status;
          let newStatus = oldStatus;

          // Only update internal status if we have a valid mapping and it's different
          if (mappedStatus && mappedStatus !== order.status) {
            updateData.status = mappedStatus;
            newStatus = mappedStatus;
          }

          // Add start_count and remains if available
          if (result.start_count !== undefined) {
            updateData.start_count = parseInt(result.start_count) || 0;
          }
          if (result.remains !== undefined) {
            updateData.remains = parseInt(result.remains) || 0;
          }

          const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', order.id);

          if (updateError) {
            console.error(`Error updating order ${order.id}:`, updateError);
            errorCount++;
          } else {
            syncedCount++;
            
            // Send email notification to client if status changed
            if (oldStatus !== newStatus) {
              try {
                await fetch(`${supabaseUrl}/functions/v1/notify-order-status`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({ 
                    orderId: order.id, 
                    oldStatus, 
                    newStatus 
                  }),
                });
                console.log(`Notification sent for order ${order.id}: ${oldStatus} -> ${newStatus}`);
              } catch (notifyError) {
                console.error(`Failed to send notification for order ${order.id}:`, notifyError);
              }
            }
            
            results.push({
              orderId: order.id,
              externalOrderId: order.external_order_id,
              provider: providerData.providerName,
              oldStatus: order.external_status,
              newStatus: externalStatus,
            });
          }
        } catch (error) {
          console.error(`Error syncing order ${order.id}:`, error);
          errorCount++;
        }
      }
    }

    console.log(`Sync completed: ${syncedCount} synced, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        errors: errorCount,
        results,
        message: `Synced ${syncedCount} orders, ${errorCount} errors`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in sync-orders-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
