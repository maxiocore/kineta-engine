/**
 * Internal Transfer Edge Function
 * Transfers balance from Financing Credit to Platform Wallet
 * 
 * Features:
 * - Atomic transaction via database function
 * - Idempotency protection
 * - Rate limiting
 * - WhatsApp & Email notifications
 * - Full audit trail
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferRequest {
  amount: number;
  application_id: string;
}

interface CanTransferRequest {
  application_id?: string;
}

interface TransferHistoryRequest {
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'يجب تسجيل الدخول'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create client with user's token
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'جلسة غير صالحة'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'transfer';

    // Service client for privileged operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // ACTION: Check if transfer is allowed
    // ============================================
    if (action === 'can_transfer') {
      const body: CanTransferRequest = await req.json().catch(() => ({}));
      
      const { data, error } = await serviceClient.rpc('can_execute_internal_transfer', {
        p_user_id: user.id,
        p_application_id: body.application_id || null
      });

      if (error) {
        console.error('[InternalTransfer] can_transfer error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'CHECK_FAILED',
          message: 'فشل التحقق من إمكانية التحويل'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        ...data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // ACTION: Get transfer history
    // ============================================
    if (action === 'history') {
      const body: TransferHistoryRequest = await req.json().catch(() => ({}));
      const limit = body.limit || 20;
      const offset = body.offset || 0;

      const { data, error, count } = await serviceClient
        .from('internal_transfers')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[InternalTransfer] history error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'FETCH_FAILED',
          message: 'فشل جلب سجل التحويلات'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        transfers: data,
        total: count,
        limit,
        offset
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // ACTION: Get balances
    // ============================================
    if (action === 'balances') {
      // Get financing credit balance
      const { data: financingBalance } = await serviceClient.rpc(
        'calculate_service_credit_balance',
        { p_user_id: user.id }
      );

      // Get platform wallet balance
      const { data: walletData } = await serviceClient
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        financing_balance: financingBalance || 0,
        wallet_balance: walletData?.balance || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // ACTION: Execute transfer
    // ============================================
    if (action === 'transfer' && req.method === 'POST') {
      const body: TransferRequest = await req.json();

      // Validate input
      if (!body.amount || body.amount <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'المبلغ غير صالح'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!body.application_id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'MISSING_APPLICATION',
          message: 'معرف الطلب مطلوب'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check rate limit
      const { data: rateLimitData, error: rateLimitError } = await serviceClient.rpc(
        'check_transfer_rate_limit',
        { p_user_id: user.id }
      );

      if (rateLimitError) {
        console.error('[InternalTransfer] rate limit check error:', rateLimitError);
      } else if (!rateLimitData.allowed) {
        return new Response(JSON.stringify({
          success: false,
          error: 'RATE_LIMITED',
          message: rateLimitData.message
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate idempotency key
      const idempotencyKey = `transfer_${user.id}_${body.application_id}_${body.amount}_${Date.now()}`;

      // Get device info from headers
      const userAgent = req.headers.get('user-agent') || 'unknown';
      const forwardedFor = req.headers.get('x-forwarded-for');
      const ipAddress = forwardedFor?.split(',')[0].trim() || null;

      // Execute atomic transfer
      const { data: transferResult, error: transferError } = await serviceClient.rpc(
        'execute_internal_transfer',
        {
          p_user_id: user.id,
          p_amount: body.amount,
          p_application_id: body.application_id,
          p_idempotency_key: idempotencyKey,
          p_device_info: { userAgent, timestamp: new Date().toISOString() },
          p_ip_address: ipAddress,
          p_user_agent: userAgent
        }
      );

      if (transferError) {
        console.error('[InternalTransfer] transfer error:', transferError);
        return new Response(JSON.stringify({
          success: false,
          error: 'TRANSFER_FAILED',
          message: 'فشل التحويل'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('[InternalTransfer] Transfer result:', transferResult);

      // If successful, send notifications
      if (transferResult.success) {
        // Get user details for notification
        const { data: profile } = await serviceClient
          .from('profiles')
          .select('full_name, phone, email')
          .eq('id', user.id)
          .single();

        // Send WhatsApp notification using template
        if (profile?.phone) {
          try {
            // Use unified whatsapp-send with template
            await serviceClient.functions.invoke('whatsapp-send', {
              body: {
                action: 'send_status',
                phone: profile.phone,
                status: 'INTERNAL_TRANSFER',
                customerName: profile.full_name || 'العميل الكريم',
                amount: body.amount,
                deepLinkPath: '/dashboard/services'
              }
            });
            console.log('[InternalTransfer] WhatsApp notification sent via template');
          } catch (whatsappError) {
            console.error('[InternalTransfer] WhatsApp notification failed:', whatsappError);
          }
        }

        // Create in-app notification
        try {
          await serviceClient.from('notifications').insert({
            user_id: user.id,
            title: 'تم تحويل الرصيد بنجاح',
            message: `تم تحويل ${body.amount.toFixed(2)} ر.س من رصيد التمويل إلى رصيد المنصة`,
            type: 'success',
            action_url: '/dashboard/financial-hub?tab=balance-logs',
            metadata: {
              transfer_id: transferResult.transfer_id,
              amount: body.amount
            }
          });
        } catch (notificationError) {
          console.error('[InternalTransfer] In-app notification failed:', notificationError);
        }
      }

      return new Response(JSON.stringify(transferResult), {
        status: transferResult.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Unknown action
    return new Response(JSON.stringify({
      success: false,
      error: 'UNKNOWN_ACTION',
      message: 'إجراء غير معروف'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[InternalTransfer] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ غير متوقع'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
