import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];
    
    // Get API key from header
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract prefix from API key (first 8 characters)
    const prefix = apiKey.substring(0, 8);
    
    // Hash the API key for comparison
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Validate API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*, user:profiles!api_keys_user_id_fkey(id, email)')
      .eq('prefix', prefix)
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .maybeSingle();

    if (keyError || !apiKeyData) {
      console.log('Invalid API key:', prefix);
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiration
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'API key expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = apiKeyData.user_id;

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id);

    let responseData: any;
    let statusCode = 200;
    const body = req.method === 'POST' ? await req.json() : {};

    // Route handling
    switch (action) {
      case 'services':
        // Get all active services
        const { data: services } = await supabase
          .from('services')
          .select('id, name, category, price, description, external_service_id, refill_enabled, refill_days')
          .eq('status', 'active')
          .order('category');
        responseData = services || [];
        break;

      case 'balance':
        // Get user balance
        const { data: balance } = await supabase
          .from('user_balances')
          .select('balance, total_deposited, total_spent')
          .eq('user_id', userId)
          .maybeSingle();
        responseData = balance || { balance: 0, total_deposited: 0, total_spent: 0 };
        break;

      case 'order':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'POST method required' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const { service, link, quantity } = body;
        
        if (!service || !link || !quantity) {
          return new Response(JSON.stringify({ error: 'service, link, and quantity required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get service details
        const { data: serviceData } = await supabase
          .from('services')
          .select('*')
          .eq('id', service)
          .eq('status', 'active')
          .maybeSingle();

        if (!serviceData) {
          return new Response(JSON.stringify({ error: 'Service not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const totalPrice = (serviceData.price / 1000) * quantity;

        // Check balance
        const { data: userBalance } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (!userBalance || userBalance.balance < totalPrice) {
          return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create order
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            service_id: service,
            order_number: orderNumber,
            link,
            quantity,
            total_price: totalPrice,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          return new Response(JSON.stringify({ error: 'Failed to create order' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Deduct balance
        await supabase
          .from('user_balances')
          .update({ 
            balance: userBalance.balance - totalPrice,
            total_spent: (userBalance as any).total_spent + totalPrice
          })
          .eq('user_id', userId);

        responseData = { order: newOrder.id, order_number: newOrder.order_number };
        break;

      case 'status':
        // Get order status
        const { order: orderId } = body;
        
        if (!orderId) {
          return new Response(JSON.stringify({ error: 'order ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: orderStatus } = await supabase
          .from('orders')
          .select('id, order_number, status, external_status, quantity, link, total_price, created_at')
          .eq('id', orderId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!orderStatus) {
          return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        responseData = orderStatus;
        break;

      case 'orders':
        // Get user orders
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data: orders, count } = await supabase
          .from('orders')
          .select('id, order_number, status, external_status, quantity, link, total_price, created_at, service:services(name)', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        responseData = { orders: orders || [], total: count || 0, limit, offset };
        break;

      case 'refill':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'POST method required' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { order: refillOrderId } = body;

        if (!refillOrderId) {
          return new Response(JSON.stringify({ error: 'order ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get order with service info
        const { data: refillOrder } = await supabase
          .from('orders')
          .select('*, service:services(*)')
          .eq('id', refillOrderId)
          .eq('user_id', userId)
          .eq('status', 'completed')
          .maybeSingle();

        if (!refillOrder) {
          return new Response(JSON.stringify({ error: 'Order not found or not eligible for refill' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!refillOrder.service?.refill_enabled) {
          return new Response(JSON.stringify({ error: 'Service does not support refill' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if refill already exists
        const { data: existingRefill } = await supabase
          .from('refill_requests')
          .select('id')
          .eq('order_id', refillOrderId)
          .in('status', ['pending', 'processing'])
          .maybeSingle();

        if (existingRefill) {
          return new Response(JSON.stringify({ error: 'Refill request already pending' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create refill request
        const { data: refillRequest, error: refillError } = await supabase
          .from('refill_requests')
          .insert({
            order_id: refillOrderId,
            user_id: userId,
            original_quantity: refillOrder.quantity,
            status: 'pending'
          })
          .select()
          .single();

        if (refillError) {
          console.error('Refill creation error:', refillError);
          return new Response(JSON.stringify({ error: 'Failed to create refill request' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        responseData = { refill: refillRequest.id };
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Log API usage
    const responseTime = Date.now() - startTime;
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: apiKeyData.id,
        endpoint: action,
        method: req.method,
        status_code: statusCode,
        response_time_ms: responseTime,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

    return new Response(JSON.stringify(responseData), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
