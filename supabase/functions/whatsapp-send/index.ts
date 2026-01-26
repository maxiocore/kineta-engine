/**
 * WhatsApp Send Edge Function
 * Unified endpoint for sending WhatsApp messages via SmartWats API v1.3
 * 
 * Features:
 * - Text message sending
 * - Template-based status notifications
 * - Retry with exponential backoff
 * - Error classification
 * - Rate limiting awareness
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  WhatsAppProvider,
  formatPhoneNumber,
  isValidSaudiNumber,
  WhatsAppErrorType
} from '../_shared/whatsapp-provider.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendTextRequest {
  action: 'send_text';
  phone: string;
  message: string;
  type?: 'order' | 'financing' | 'deposit' | 'ticket' | 'balance' | 'auth' | 'general';
  referenceId?: string;
}

interface SendStatusRequest {
  action: 'send_status';
  phone: string;
  status: string;
  applicationNumber?: string;
  orderNumber?: string;
  amount?: number;
  customerName?: string;
  deepLinkPath?: string;
}

interface SendOTPFallbackRequest {
  action: 'send_otp_fallback';
  phone: string;
}

interface SendWelcomeRequest {
  action: 'send_welcome';
  phone: string;
  customerName?: string;
}

interface ValidateNumberRequest {
  action: 'validate';
  phone: string;
}

interface HealthCheckRequest {
  action: 'health';
}

type RequestBody = 
  | SendTextRequest 
  | SendStatusRequest 
  | SendOTPFallbackRequest 
  | SendWelcomeRequest
  | ValidateNumberRequest
  | HealthCheckRequest;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    
    console.log(`[WhatsApp-Send] Action: ${body.action}`);

    // Health check
    if (body.action === 'health') {
      return new Response(JSON.stringify({
        success: true,
        configured: WhatsAppProvider.isConfigured(),
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate number
    if (body.action === 'validate') {
      const validation = WhatsAppProvider.validateNumber(body.phone);
      return new Response(JSON.stringify({
        success: true,
        valid: validation.valid,
        formatted: validation.formatted,
        original: body.phone
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check configuration
    if (!WhatsAppProvider.isConfigured()) {
      console.error('[WhatsApp-Send] Provider not configured');
      return new Response(JSON.stringify({
        success: false,
        error: {
          type: WhatsAppErrorType.NOT_CONFIGURED,
          message: 'خدمة الواتساب غير مُعدة',
          retryable: false
        }
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send text message
    if (body.action === 'send_text') {
      const { phone, message, type, referenceId } = body as SendTextRequest;
      
      if (!phone || !message) {
        return new Response(JSON.stringify({
          success: false,
          error: { message: 'رقم الجوال والرسالة مطلوبان' }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await WhatsAppProvider.sendText(phone, message, { 
        type: type || 'general',
        referenceId 
      });

      // Log to database if we have a reference
      if (referenceId) {
        await logNotification(phone, type || 'general', referenceId, result);
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send status notification with template
    if (body.action === 'send_status') {
      const { phone, status, applicationNumber, orderNumber, amount, customerName, deepLinkPath } = body as SendStatusRequest;
      
      if (!phone || !status) {
        return new Response(JSON.stringify({
          success: false,
          error: { message: 'رقم الجوال والحالة مطلوبان' }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await WhatsAppProvider.sendTemplateStatus(
        phone,
        { status, applicationNumber, orderNumber, amount, customerName },
        deepLinkPath || '/dashboard'
      );

      // Log notification
      const refId = applicationNumber || orderNumber;
      const type = applicationNumber ? 'financing' : 'order';
      if (refId) {
        await logNotification(phone, type, refId, result);
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send OTP fallback notice
    if (body.action === 'send_otp_fallback') {
      const { phone } = body as SendOTPFallbackRequest;
      
      if (!phone) {
        return new Response(JSON.stringify({
          success: false,
          error: { message: 'رقم الجوال مطلوب' }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await WhatsAppProvider.sendOTPEmailFallbackNotice(phone);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send welcome message
    if (body.action === 'send_welcome') {
      const { phone, customerName } = body as SendWelcomeRequest;
      
      if (!phone) {
        return new Response(JSON.stringify({
          success: false,
          error: { message: 'رقم الجوال مطلوب' }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await WhatsAppProvider.sendWelcome(phone, customerName);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Unknown action
    return new Response(JSON.stringify({
      success: false,
      error: { message: 'إجراء غير معروف' }
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[WhatsApp-Send] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        type: WhatsAppErrorType.UNKNOWN,
        message: error?.message || 'حدث خطأ غير متوقع',
        retryable: false
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Log notification to database for tracking
 */
async function logNotification(
  phone: string,
  type: string,
  referenceId: string,
  result: any
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('audit_logs').insert({
      action: 'whatsapp_notification',
      table_name: 'whatsapp_notifications',
      record_id: referenceId,
      new_value: {
        phone: formatPhoneNumber(phone),
        type,
        success: result.success,
        messageId: result.messageId,
        error: result.error?.message,
        attempts: result.attempts
      }
    });
  } catch (logError) {
    console.error('[WhatsApp-Send] Failed to log notification:', logError);
    // Don't throw - logging failure shouldn't affect the main operation
  }
}
