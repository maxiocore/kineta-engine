import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BULKFOLLOWS_API_KEY = Deno.env.get('BULKFOLLOWS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!BULKFOLLOWS_API_KEY) {
      console.error('BULKFOLLOWS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { action, order_id, order_ids } = await req.json();
    console.log(`Action: ${action}, Order ID: ${order_id}, Order IDs: ${order_ids}`);

    // Check status for single order
    if (action === 'status' && order_id) {
      const formData = new FormData();
      formData.append('key', BULKFOLLOWS_API_KEY);
      formData.append('action', 'status');
      formData.append('order', order_id);

      const response = await fetch('https://bulkfollows.com/api/v2', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('BulkFollows status response:', result);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check status for multiple orders
    if (action === 'multi_status' && order_ids) {
      const formData = new FormData();
      formData.append('key', BULKFOLLOWS_API_KEY);
      formData.append('action', 'status');
      formData.append('orders', order_ids.join(','));

      const response = await fetch('https://bulkfollows.com/api/v2', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('BulkFollows multi-status response:', result);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sync all orders - fetch orders with external_order_id and update their status
    if (action === 'sync_all') {
      const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('id, external_order_id, external_status, status')
        .not('external_order_id', 'is', null)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (fetchError) {
        console.error('Error fetching orders:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch orders' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!orders || orders.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No orders to sync', updated: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${orders.length} orders to sync`);

      const externalIds = orders.map(o => o.external_order_id);
      
      const formData = new FormData();
      formData.append('key', BULKFOLLOWS_API_KEY);
      formData.append('action', 'status');
      formData.append('orders', externalIds.join(','));

      const response = await fetch('https://bulkfollows.com/api/v2', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('BulkFollows sync response:', result);

      let updatedCount = 0;
      const updates = [];

      // Map BulkFollows status to our status
      const mapStatus = (bfStatus: string): string => {
        switch (bfStatus?.toLowerCase()) {
          case 'pending':
            return 'pending';
          case 'processing':
          case 'in progress':
            return 'in_progress';
          case 'completed':
            return 'completed';
          case 'partial':
            return 'completed';
          case 'cancelled':
          case 'canceled':
            return 'cancelled';
          case 'refunded':
            return 'refunded';
          default:
            return 'in_progress';
        }
      };

      // Update each order
      for (const order of orders) {
        const externalStatus = result[order.external_order_id];
        if (externalStatus && externalStatus.status) {
          const newStatus = mapStatus(externalStatus.status);
          const externalStatusStr = externalStatus.status;

          if (order.external_status !== externalStatusStr || order.status !== newStatus) {
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                external_status: externalStatusStr,
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            if (!updateError) {
              updatedCount++;
              updates.push({
                id: order.id,
                external_order_id: order.external_order_id,
                old_status: order.status,
                new_status: newStatus,
                external_status: externalStatusStr,
              });
            } else {
              console.error(`Error updating order ${order.id}:`, updateError);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          message: `Synced ${updatedCount} orders`,
          updated: updatedCount,
          total: orders.length,
          updates,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bulkfollows-status function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
