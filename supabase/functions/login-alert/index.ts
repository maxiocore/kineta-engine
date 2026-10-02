/**
 * Login Alert Edge Function
 * إشعار تسجيل الدخول الأمني - Banking Grade
 * 
 * Features:
 * - Rate limiting (1 alert per device per 30 minutes)
 * - Idempotency with event hashing
 * - Device fingerprint tracking
 * - Geolocation (approximate city/country only - no exact IP)
 * - Multi-channel (Email + WhatsApp)
 * - Activity logging
 * 
 * Security:
 * - No full IP logging
 * - No sensitive data in WhatsApp
 * - Secure hash for idempotency
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  getLoginAlertEmailHtml,
  getLoginAlertEmailPlain,
  getLoginAlertWhatsApp,
  type LoginAlertData
} from '../_shared/auth-templates.ts';
import {
  WhatsAppProvider
} from '../_shared/whatsapp-provider.ts';
import {
  getNotificationConfig,
  generateIdempotencyKey
} from '../_shared/notification-registry.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginAlertRequest {
  userId: string;
  email: string;
  phone?: string;
  name: string;
  deviceFingerprint?: string;
  deviceType?: string;
  userAgent?: string;
  geoCity?: string;
  geoCountry?: string;
  isEmailVerified: boolean;
  baseUrl: string;
}

interface LoginEventRecord {
  id: string;
  user_id: string;
  event_type: string;
  device_fingerprint: string | null;
  device_type: string | null;
  geo_city: string | null;
  geo_country: string | null;
  created_at: string;
  notification_sent: boolean;
  notification_channels: string[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: LoginAlertRequest = await req.json();
    const { 
      userId, 
      email, 
      phone, 
      name,
      deviceFingerprint,
      deviceType,
      userAgent,
      geoCity,
      geoCountry,
      isEmailVerified,
      baseUrl
    } = body;

    console.log(`[Login-Alert] User: ${userId}, Email verified: ${isEmailVerified}`);

    // ─────────────────────────────────────────────────────────────
    // CHECK: Only send if email is verified
    // ─────────────────────────────────────────────────────────────
    if (!isEmailVerified) {
      console.log('[Login-Alert] Skipping - email not verified');
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        reason: 'Email not verified'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // IDEMPOTENCY CHECK
    // ─────────────────────────────────────────────────────────────
    const idempotencyKey = generateIdempotencyKey(
      'LOGIN_SUCCESS',
      userId,
      deviceFingerprint
    );

    // Check for recent notification with same key
    const { data: existingNotification } = await supabase
      .from('audit_logs')
      .select('id, created_at')
      .eq('action', 'LOGIN_ALERT_SENT')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint || 'unknown')
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 min
      .maybeSingle();

    if (existingNotification) {
      console.log('[Login-Alert] Rate limited - recent notification exists');
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        reason: 'Rate limited',
        lastNotification: existingNotification.created_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // PREPARE NOTIFICATION DATA
    // ─────────────────────────────────────────────────────────────
    const loginTime = new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Riyadh'
    }).format(new Date());

    const securityLink = `${baseUrl}/dashboard/security`;

    const alertData: LoginAlertData = {
      name: name || 'العميل',
      loginTime,
      deviceType: deviceType || parseDeviceFromUA(userAgent),
      city: geoCity,
      country: geoCountry,
      securityLink
    };

    const config = getNotificationConfig('LOGIN_SUCCESS');
    const results = {
      emailSent: false,
      whatsappSent: false,
      errors: [] as string[]
    };

    // ─────────────────────────────────────────────────────────────
    // SEND EMAIL (Primary channel)
    // ─────────────────────────────────────────────────────────────
    try {
      const { error: emailError } = await resend.emails.send({
        from: "ASH HOLDING Security <security@ash-holding.sa>",
        reply_to: "info@ash-holding.sa",
        to: [email],
        subject: "🔐 تم تسجيل الدخول إلى حسابك - ASH HOLDING",
        html: getLoginAlertEmailHtml(alertData),
        text: getLoginAlertEmailPlain(alertData),
      });

      results.emailSent = !emailError;
      if (emailError) {
        console.error('[Login-Alert] Email error:', emailError);
        results.errors.push(`Email: ${emailError.message}`);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error('[Login-Alert] Email exception:', e);
      results.errors.push(`Email exception: ${errorMessage}`);
    }

    // ─────────────────────────────────────────────────────────────
    // SEND WHATSAPP (Secondary channel - optional)
    // ─────────────────────────────────────────────────────────────
    if (phone && config?.channels.whatsapp) {
      try {
        const whatsappMessage = getLoginAlertWhatsApp(
          name || 'العميل',
          loginTime,
          geoCity
        );

        const whatsappResult = await WhatsAppProvider.sendText(
          phone,
          whatsappMessage,
          { type: 'auth', referenceId: userId }
        );

        results.whatsappSent = whatsappResult.success;
        if (!whatsappResult.success) {
          results.errors.push(`WhatsApp: ${whatsappResult.error?.message || 'Failed'}`);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error('[Login-Alert] WhatsApp exception:', e);
        results.errors.push(`WhatsApp exception: ${errorMessage}`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // LOG TO ACTIVITY / AUDIT
    // ─────────────────────────────────────────────────────────────
    const notificationChannels = [];
    if (results.emailSent) notificationChannels.push('email');
    if (results.whatsappSent) notificationChannels.push('whatsapp');

    await supabase.from('audit_logs').insert({
      action: 'LOGIN_ALERT_SENT',
      table_name: 'auth_events',
      user_id: userId,
      user_email: email,
      device_fingerprint: deviceFingerprint || null,
      geo_city: geoCity || null,
      geo_country: geoCountry || null,
      user_agent: userAgent?.substring(0, 255) || null,
      metadata: {
        event_type: 'LOGIN_SUCCESS',
        idempotency_key: idempotencyKey,
        notification_channels: notificationChannels,
        email_sent: results.emailSent,
        whatsapp_sent: results.whatsappSent,
        device_type: deviceType || parseDeviceFromUA(userAgent)
      }
    });

    console.log(`[Login-Alert] Sent - Email: ${results.emailSent}, WhatsApp: ${results.whatsappSent}`);

    return new Response(JSON.stringify({
      success: true,
      email_sent: results.emailSent,
      whatsapp_sent: results.whatsappSent,
      channels: notificationChannels,
      errors: results.errors.length > 0 ? results.errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Login-Alert] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse device type from User-Agent string
 */
function parseDeviceFromUA(userAgent?: string): string {
  if (!userAgent) return 'جهاز غير معروف';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('iphone')) return 'آيفون';
  if (ua.includes('ipad')) return 'آيباد';
  if (ua.includes('android') && ua.includes('mobile')) return 'هاتف أندرويد';
  if (ua.includes('android')) return 'جهاز أندرويد';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'ماك';
  if (ua.includes('windows')) return 'ويندوز';
  if (ua.includes('linux')) return 'لينكس';
  
  return 'متصفح ويب';
}
