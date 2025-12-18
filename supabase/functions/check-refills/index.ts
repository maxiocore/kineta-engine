import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const bulkfollowsApiKey = Deno.env.get('BULKFOLLOWS_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Starting refill check...');

    // Get all completed orders with auto-refill enabled services
    const { data: ordersToCheck, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        service:services!inner(*)
      `)
      .eq('status', 'completed')
      .eq('service.auto_refill_enabled', true)
      .not('external_order_id', 'is', null);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log(`Found ${ordersToCheck?.length || 0} orders to check`);

    const results = {
      checked: 0,
      refillsCreated: 0,
      errors: 0
    };

    for (const order of ordersToCheck || []) {
      try {
        results.checked++;

        // Skip if order is too old (beyond refill days)
        const orderDate = new Date(order.created_at);
        const refillDays = order.service.refill_days || 30;
        const expiryDate = new Date(orderDate.getTime() + refillDays * 24 * 60 * 60 * 1000);
        
        if (new Date() > expiryDate) {
          console.log(`Order ${order.id} expired for refill`);
          continue;
        }

        // Check if there's already a pending refill
        const { data: existingRefill } = await supabase
          .from('refill_requests')
          .select('id')
          .eq('order_id', order.id)
          .in('status', ['pending', 'processing'])
          .maybeSingle();

        if (existingRefill) {
          console.log(`Order ${order.id} already has pending refill`);
          continue;
        }

        // Check current count from BulkFollows API
        if (bulkfollowsApiKey && order.external_order_id) {
          const statusResponse = await fetch('https://bulkfollows.com/api/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: bulkfollowsApiKey,
              action: 'status',
              order: order.external_order_id
            })
          });

          const statusData = await statusResponse.json();
          
          if (statusData.status === 'Completed' && statusData.remains > 0) {
            // There's a drop, create refill request
            const dropPercentage = (statusData.remains / order.quantity) * 100;
            
            // Only create refill if drop is more than 5%
            if (dropPercentage > 5) {
              const { error: refillError } = await supabase
                .from('refill_requests')
                .insert({
                  order_id: order.id,
                  user_id: order.user_id,
                  original_quantity: order.quantity,
                  current_quantity: order.quantity - statusData.remains,
                  refill_quantity: statusData.remains,
                  status: 'pending',
                  auto_created: true,
                  notes: `تم إنشاؤه تلقائياً - انخفاض ${dropPercentage.toFixed(1)}%`
                });

              if (refillError) {
                console.error(`Error creating refill for order ${order.id}:`, refillError);
                results.errors++;
              } else {
                console.log(`Created refill for order ${order.id} - drop: ${statusData.remains}`);
                results.refillsCreated++;

                // Create notification for user
                await supabase
                  .from('notifications')
                  .insert({
                    user_id: order.user_id,
                    title: 'طلب إعادة تعبئة تلقائي',
                    message: `تم إنشاء طلب إعادة تعبئة تلقائي للطلب ${order.order_number}`,
                    type: 'info',
                    related_order_id: order.id
                  });
              }
            }
          }
        }
      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
        results.errors++;
      }
    }

    console.log('Refill check completed:', results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Refill check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
