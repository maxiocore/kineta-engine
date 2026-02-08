import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNotificationRequest {
  notification_id: string;
  send_push?: boolean;
  send_email?: boolean;
}

interface AppNotification {
  id: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: string;
  image_url?: string;
  action_url?: string;
  target_audience: string;
  target_user_ids: string[];
  send_push: boolean;
  send_email: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface SendResult {
  sent: number;
  failed: number;
  removed: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const { notification_id, send_push = true, send_email = false }: SendNotificationRequest = await req.json();

    console.log("[send-app-notification] Processing notification:", notification_id);

    // Get the notification
    const { data: notification, error: notifError } = await supabase
      .from("app_notifications")
      .select("*")
      .eq("id", notification_id)
      .single();

    if (notifError || !notification) {
      console.error("[send-app-notification] Notification not found:", notifError);
      throw new Error("Notification not found");
    }

    const appNotification = notification as AppNotification;

    // Get target users
    let users: UserProfile[] = [];

    if (appNotification.target_audience === "all") {
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id, email, full_name");
      
      if (usersError) {
        console.error("[send-app-notification] Error fetching users:", usersError);
      }
      users = (allUsers || []) as UserProfile[];
    } else if (appNotification.target_user_ids && appNotification.target_user_ids.length > 0) {
      const { data: targetUsers, error: targetError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", appNotification.target_user_ids);
      
      if (targetError) {
        console.error("[send-app-notification] Error fetching target users:", targetError);
      }
      users = (targetUsers || []) as UserProfile[];
    }

    console.log(`[send-app-notification] Found ${users.length} target users`);

    const pushResult: SendResult = { sent: 0, failed: 0, removed: 0 };
    const emailResult: SendResult = { sent: 0, failed: 0, removed: 0 };

    // Unified notification payload
    const unifiedPayload = {
      id: appNotification.id,
      title: appNotification.title_ar || appNotification.title,
      title_ar: appNotification.title_ar,
      body: appNotification.message_ar || appNotification.message,
      message: appNotification.message,
      message_ar: appNotification.message_ar,
      url: appNotification.action_url || "/dashboard/notifications",
      action_url: appNotification.action_url,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      image: appNotification.image_url || null,
      type: appNotification.type,
      tag: `app-notif-${appNotification.id}`,
      requireInteraction: false,
      renotify: true,
      timestamp: new Date().toISOString(),
    };

    // Send push notifications (insert into notifications table)
    if (send_push) {
      console.log("[send-app-notification] Sending push notifications...");
      
      for (const user of users) {
        try {
          const { error: insertError } = await supabase.from("notifications").insert({
            user_id: user.id,
            title: unifiedPayload.title,
            message: unifiedPayload.body,
            type: appNotification.type,
            related_order_id: null,
          });

          if (insertError) {
            // Check for subscription expiry errors (404/410 equivalent)
            if (insertError.code === "23503" || insertError.message?.includes("foreign key")) {
              console.log(`[send-app-notification] User ${user.id} no longer exists, removing...`);
              pushResult.removed++;
            } else {
              console.error(`[send-app-notification] Failed to send push to user ${user.id}:`, insertError);
              pushResult.failed++;
            }
          } else {
            pushResult.sent++;
          }
        } catch (err) {
          console.error(`[send-app-notification] Exception sending push to user ${user.id}:`, err);
          pushResult.failed++;
        }
      }
      
      console.log(`[send-app-notification] Push results: sent=${pushResult.sent}, failed=${pushResult.failed}, removed=${pushResult.removed}`);
    }

    // Send emails
    if (send_email && resend) {
      console.log("[send-app-notification] Sending emails...");
      
      for (const user of users) {
        if (!user.email) {
          emailResult.failed++;
          continue;
        }

        try {
          const { error: emailError } = await resend.emails.send({
            from: "ASH HOLDING <notifications@ash-holding.sa>",
            to: [user.email],
            subject: appNotification.title_ar || appNotification.title,
            html: getEmailTemplate(appNotification, user),
          });

          if (emailError) {
            // Check for bounced/invalid email addresses
            if (emailError.message?.includes("bounced") || emailError.message?.includes("invalid")) {
              console.log(`[send-app-notification] Email ${user.email} bounced, marking for removal`);
              emailResult.removed++;
            } else {
              console.error(`[send-app-notification] Failed to send email to ${user.email}:`, emailError);
              emailResult.failed++;
            }
          } else {
            emailResult.sent++;
          }
        } catch (err) {
          console.error(`[send-app-notification] Exception sending email to ${user.email}:`, err);
          emailResult.failed++;
        }
      }
      
      console.log(`[send-app-notification] Email results: sent=${emailResult.sent}, failed=${emailResult.failed}, removed=${emailResult.removed}`);
    }

    // Update notification stats
    const { error: updateError } = await supabase
      .from("app_notifications")
      .update({
        sent_count: pushResult.sent,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", notification_id);

    if (updateError) {
      console.error("[send-app-notification] Failed to update notification stats:", updateError);
    }

    const totalSent = pushResult.sent + emailResult.sent;
    const totalFailed = pushResult.failed + emailResult.failed;
    const totalRemoved = pushResult.removed + emailResult.removed;

    console.log(`[send-app-notification] Complete! Total: sent=${totalSent}, failed=${totalFailed}, removed=${totalRemoved}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: totalSent,
        failed_count: totalFailed,
        removed_count: totalRemoved,
        push_results: pushResult,
        email_results: emailResult,
        total_users: users.length,
        notification_id,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[send-app-notification] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function getEmailTemplate(notification: AppNotification, user: UserProfile): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title_ar}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f0f4f8; direction: rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 35px 30px; text-align: center;">
              <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 18px; margin: 0 auto 15px; line-height: 70px;">
                <span style="font-size: 36px; font-weight: 800; color: #ffffff;">A</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">ASH HOLDING</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 35px 30px; text-align: right;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #1e293b;">
                مرحباً ${user.full_name || 'عزيزي العميل'}
              </h2>
              
              <h3 style="margin: 0 0 15px; font-size: 20px; font-weight: 600; color: #6366f1;">
                ${notification.title_ar}
              </h3>
              
              <p style="margin: 0 0 25px; font-size: 16px; color: #475569; line-height: 1.8;">
                ${notification.message_ar}
              </p>
              
              ${notification.image_url ? `
              <div style="margin-bottom: 25px;">
                <img src="${notification.image_url}" alt="" style="max-width: 100%; border-radius: 12px;" />
              </div>
              ` : ''}
              
              ${notification.action_url ? `
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 25px;">
                <tr>
                  <td align="center">
                    <a href="${notification.action_url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 16px 45px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">
                      عرض التفاصيل
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #1e293b; padding: 25px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                © ${new Date().getFullYear()} ASH HOLDING. جميع الحقوق محفوظة.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
