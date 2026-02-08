/**
 * Unified Notification Edge Function
 * نظام الإشعارات الموحد - ASH HOLDING
 * 
 * Handles all notification events across Auth, Financing, and Wallet modules
 * with rate limiting, idempotency, and multi-channel support.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  NOTIFICATION_REGISTRY,
  getNotificationConfig,
  shouldSendNotification,
  type NotificationEventType,
} from "../_shared/notification-registry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  eventType: NotificationEventType;
  userId: string;
  email: string;
  phone?: string;
  name: string;
  // Event-specific data
  data?: Record<string, unknown>;
  // Idempotency
  referenceId?: string;
  deviceFingerprint?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: NotificationRequest = await req.json();
    const { eventType, userId, email, phone, name, data, referenceId, deviceFingerprint } = body;

    console.log(`[Unified-Notification] Processing: ${eventType} for ${userId}`);

    // Get notification config
    const config = getNotificationConfig(eventType);
    if (!config) {
      return new Response(
        JSON.stringify({ success: false, error: "Unknown event type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const idempotencyKey = [eventType, userId, deviceFingerprint, referenceId]
      .filter(Boolean)
      .join("_");

    const { data: existing } = await supabase
      .from("audit_logs")
      .select("created_at")
      .eq("action", `notification_${eventType}`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing && !shouldSendNotification(config, new Date(existing.created_at))) {
      console.log(`[Unified-Notification] Rate limited: ${eventType}`);
      return new Response(
        JSON.stringify({ success: true, action: "rate_limited" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build notification context
    const baseUrl = Deno.env.get("SITE_URL") || "https://ashholding.com";
    const notificationContext = {
      name,
      email,
      phone,
      baseUrl,
      timestamp: new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" }),
      ...data,
    };

    const results = {
      emailSent: false,
      whatsappSent: false,
      errors: [] as string[],
    };

    // Send Email (if enabled)
    if (config.channels.email) {
      try {
        const emailResult = await sendEmail(eventType, email, name, notificationContext);
        results.emailSent = emailResult.success;
        if (!emailResult.success) {
          results.errors.push(`Email: ${emailResult.error}`);
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(`Email error: ${errMessage}`);
      }
    }

    // Send WhatsApp (if enabled and not security-only)
    if (config.channels.whatsapp && phone && !config.requiresEmailOnly) {
      try {
        const { error: waError } = await supabase.functions.invoke("whatsapp-send", {
          body: {
            action: "send_notification",
            phone,
            eventType,
            customerName: name,
            data: notificationContext,
          },
        });

        if (waError) {
          results.errors.push(`WhatsApp: ${waError.message}`);
        } else {
          results.whatsappSent = true;
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(`WhatsApp error: ${errMessage}`);
      }
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      table_name: "notifications",
      action: `notification_${eventType}`,
      user_id: userId,
      user_email: email,
      record_id: referenceId || idempotencyKey,
      metadata: {
        eventType,
        channels: config.channels,
        results,
        priority: config.priority,
        isSecurityEvent: config.isSecurityEvent,
      },
    });

    console.log(`[Unified-Notification] Completed: ${eventType}`, results);

    return new Response(
      JSON.stringify({
        success: results.emailSent || results.whatsappSent,
        action: "sent",
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[Unified-Notification] Error:", error);
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Send email using Resend
 */
async function sendEmail(
  eventType: NotificationEventType,
  recipientEmail: string,
  recipientName: string,
  context: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const template = getEmailTemplate(eventType, context);
  if (!template) {
    return { success: false, error: "Email template not found" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ASH HOLDING <noreply@ash-holding.sa>",
      to: [recipientEmail],
      subject: template.subject,
      html: template.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  return { success: true };
}

/**
 * Get email template by event type
 */
function getEmailTemplate(
  eventType: NotificationEventType,
  context: Record<string, unknown>
): { subject: string; html: string } | null {
  const name = context.name as string;
  const baseUrl = context.baseUrl as string;
  const amount = context.amount as number;
  const newBalance = context.newBalance as number;
  const source = context.source as string;
  const reason = context.reason as string;
  const applicationNumber = context.applicationNumber as string;
  const timestamp = context.timestamp as string;

  const baseStyle = `
    font-family: 'Segoe UI', Tahoma, sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
    padding: 40px 20px;
    margin: 0;
  `;

  const cardStyle = `
    max-width: 500px;
    margin: 0 auto;
    background: linear-gradient(145deg, #1a1a2e, #16213e);
    border-radius: 16px;
    padding: 40px;
    border: 1px solid #2a2a4a;
  `;

  const formatAmount = (amt: number) =>
    new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amt) + " ر.س";

  switch (eventType) {
    case "WALLET_INSUFFICIENT":
      return {
        subject: "رصيد غير كافٍ - ASH HOLDING",
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="${baseStyle}">
            <div style="${cardStyle}">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">ASH HOLDING</h1>
                <p style="color: #94a3b8; margin-top: 8px;">إشعار المحفظة</p>
              </div>
              
              <div style="background: #f59e0b20; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; border: 1px solid #f59e0b40;">
                <p style="color: #f59e0b; font-size: 24px; margin: 0 0 15px 0;">⚠️ رصيد غير كافٍ</p>
                <p style="color: #fbbf24; margin: 10px 0;">
                  مرحباً ${name}،
                </p>
                <p style="color: #94a3b8; margin: 10px 0;">
                  لم تتم العملية لأن رصيد محفظتك غير كافٍ.
                </p>
                <p style="color: #94a3b8; margin: 10px 0;">
                  الرصيد الحالي: <strong style="color: #f59e0b;">${formatAmount(newBalance || 0)}</strong>
                </p>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${baseUrl}/dashboard/wallet" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
                  شحن المحفظة
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                ASH HOLDING - شريكك التقني
              </p>
            </div>
          </body>
          </html>
        `,
      };

    case "FIN_CANCELLED":
      return {
        subject: "تم إلغاء طلب التمويل - ASH HOLDING",
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="${baseStyle}">
            <div style="${cardStyle}">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">ASH HOLDING</h1>
                <p style="color: #94a3b8; margin-top: 8px;">إشعار التمويل</p>
              </div>
              
              <div style="background: #0f172a; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <p style="color: #94a3b8; font-size: 20px; margin: 0 0 15px 0;">📋 تم إلغاء الطلب</p>
                <p style="color: #e2e8f0; margin: 10px 0;">
                  مرحباً ${name}،
                </p>
                <p style="color: #94a3b8; margin: 10px 0;">
                  تم إلغاء طلب التمويل رقم: <strong style="color: #60a5fa;">${applicationNumber || "N/A"}</strong>
                </p>
                ${reason ? `<p style="color: #94a3b8; margin: 10px 0;">السبب: ${reason}</p>` : ""}
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${baseUrl}/dashboard/financing" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
                  تقديم طلب جديد
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                ASH HOLDING - شريكك التقني
              </p>
            </div>
          </body>
          </html>
        `,
      };

    case "FIN_EXPIRED":
      return {
        subject: "انتهت صلاحية طلب التمويل - ASH HOLDING",
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="${baseStyle}">
            <div style="${cardStyle}">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">ASH HOLDING</h1>
                <p style="color: #94a3b8; margin-top: 8px;">إشعار التمويل</p>
              </div>
              
              <div style="background: #7f1d1d20; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; border: 1px solid #7f1d1d40;">
                <p style="color: #f87171; font-size: 20px; margin: 0 0 15px 0;">⏰ انتهت صلاحية الطلب</p>
                <p style="color: #e2e8f0; margin: 10px 0;">
                  مرحباً ${name}،
                </p>
                <p style="color: #94a3b8; margin: 10px 0;">
                  انتهت صلاحية طلب التمويل رقم: <strong style="color: #f87171;">${applicationNumber || "N/A"}</strong>
                </p>
                <p style="color: #94a3b8; margin: 10px 0;">
                  يمكنك تقديم طلب جديد في أي وقت.
                </p>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${baseUrl}/dashboard/financing/apply" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
                  تقديم طلب جديد
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                ASH HOLDING - شريكك التقني
              </p>
            </div>
          </body>
          </html>
        `,
      };

    default:
      // Fallback for other templates - let other functions handle them
      return null;
  }
}
