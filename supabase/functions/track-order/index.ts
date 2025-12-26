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
    const { orderNumber } = await req.json();

    if (!orderNumber) {
      return new Response(
        JSON.stringify({ error: 'رقم الطلب مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert Arabic numerals to Western numerals
    const arabicToWestern = (str: string): string => {
      const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      let result = str;
      arabicNumerals.forEach((arabic, index) => {
        result = result.replace(new RegExp(arabic, 'g'), index.toString());
      });
      return result;
    };

    const normalizedOrderNumber = arabicToWestern(orderNumber.trim()).toUpperCase();
    console.log('Tracking order:', orderNumber, '-> normalized:', normalizedOrderNumber);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with service details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        external_status,
        quantity,
        total_price,
        link,
        created_at,
        updated_at,
        service:services(
          name,
          category,
          features
        )
      `)
      .eq('order_number', normalizedOrderNumber)
      .maybeSingle();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'حدث خطأ أثناء البحث عن الطلب' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'لم يتم العثور على الطلب', found: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order status history
    const { data: history } = await supabase
      .from('order_status_history')
      .select('old_status, new_status, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    // Calculate progress percentage based on status
    const statusProgress: Record<string, number> = {
      pending: 10,
      confirmed: 30,
      in_progress: 60,
      completed: 100,
      cancelled: 0,
      refunded: 0,
    };

    const progress = statusProgress[order.status] || 0;

    // Return sanitized order data (no user info)
    const response = {
      found: true,
      order: {
        orderNumber: order.order_number,
        status: order.status,
        externalStatus: order.external_status,
        quantity: order.quantity,
        totalPrice: order.total_price,
        link: order.link ? order.link.substring(0, 50) + '...' : null, // Partial link for privacy
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        service: order.service,
        progress,
        history: history || [],
      }
    };

    console.log('Order found:', order.order_number);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in track-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
