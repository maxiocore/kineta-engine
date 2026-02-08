import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSMS as sendSMSHelper } from "../_shared/sms-helper.ts";
import { sendWhatsAppMessage, getTicketStatusMessage } from "../_shared/whatsapp-helper.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyTicketRequest {
  ticketId: string;
  type: "new_reply" | "status_changed" | "ticket_closed" | "ticket_resolved";
  message?: string;
}

const statusTranslations: Record<string, { ar: string; emoji: string; color: string }> = {
  open: { ar: "مفتوحة", emoji: "🔵", color: "#3b82f6" },
  in_progress: { ar: "قيد المعالجة", emoji: "⚙️", color: "#f59e0b" },
  resolved: { ar: "تم الحل", emoji: "✅", color: "#10b981" },
  closed: { ar: "مغلقة", emoji: "🔒", color: "#6b7280" },
};

// Wrapper for SMS
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const result = await sendSMSHelper(phone, message, 'support');
  return { success: result.success, error: result.error };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, type, message }: NotifyTicketRequest = await req.json();
    
    console.log(`Processing ticket notification: ${ticketId}, type: ${type}`);
    
    if (!ticketId || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, status, user_id, priority")
      .eq("id", ticketId)
      .single();
    
    if (ticketError || !ticket) {
      console.error("Error fetching ticket:", ticketError);
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", ticket.user_id)
      .single();
    
    if (profileError || !profile?.email) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const statusInfo = statusTranslations[ticket.status] || { ar: ticket.status, emoji: "📋", color: "#6b7280" };
    
    // Determine email subject and content based on type
    let subject: string;
    let emailContent: string;
    let smsMessage: string;
    
    switch (type) {
      case "new_reply":
        subject = `💬 رد جديد على تذكرة الدعم #${ticket.ticket_number}`;
        smsMessage = `ASH HOLDING: رد جديد على تذكرتك رقم ${ticket.ticket_number}. راجع الرد من حسابك: ashholding.com/dashboard/support`;
        emailContent = `
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 16px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">💬 رد جديد</h1>
            <p style="margin: 10px 0 0;">تذكرة رقم #${ticket.ticket_number}</p>
          </div>
          <div style="padding: 25px;">
            <h2 style="color: #1e293b;">مرحباً ${profile.full_name || 'عميلنا العزيز'}،</h2>
            <p style="color: #64748b; line-height: 1.8;">تم إضافة رد جديد على تذكرتك. يرجى مراجعة الرد والتواصل معنا إذا كنت بحاجة لمزيد من المساعدة.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 10px; color: #64748b;"><strong>الموضوع:</strong> ${ticket.subject}</p>
              <p style="margin: 0; color: #64748b;"><strong>الحالة:</strong> ${statusInfo.emoji} ${statusInfo.ar}</p>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="https://ashholding.com/dashboard/support" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">عرض التذكرة</a>
            </div>
          </div>
        `;
        break;
        
      case "status_changed":
        subject = `${statusInfo.emoji} تحديث حالة تذكرتك #${ticket.ticket_number}`;
        smsMessage = `ASH HOLDING: تم تحديث حالة تذكرتك رقم ${ticket.ticket_number} إلى "${statusInfo.ar}". ashholding.com/dashboard/support`;
        emailContent = `
          <div style="background: ${statusInfo.color}; padding: 30px; border-radius: 16px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">${statusInfo.emoji} تحديث الحالة</h1>
            <p style="margin: 10px 0 0;">تذكرة رقم #${ticket.ticket_number}</p>
          </div>
          <div style="padding: 25px;">
            <h2 style="color: #1e293b;">مرحباً ${profile.full_name || 'عميلنا العزيز'}،</h2>
            <p style="color: #64748b; line-height: 1.8;">تم تحديث حالة تذكرتك.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 15px; color: #64748b;">الحالة الجديدة:</p>
              <span style="display: inline-block; padding: 12px 24px; background: ${statusInfo.color}; color: white; border-radius: 50px; font-size: 18px; font-weight: bold;">
                ${statusInfo.emoji} ${statusInfo.ar}
              </span>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="https://ashholding.com/dashboard/support" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">عرض التذكرة</a>
            </div>
          </div>
        `;
        break;
        
      case "ticket_resolved":
        subject = `✅ تم حل تذكرتك #${ticket.ticket_number}`;
        smsMessage = `ASH HOLDING: تم حل تذكرتك رقم ${ticket.ticket_number}. نتمنى أن نكون قد ساعدناك! ashholding.com/dashboard/support`;
        emailContent = `
          <div style="background: linear-gradient(135deg, #10b981, #14b8a6); padding: 30px; border-radius: 16px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">✅ تم الحل!</h1>
            <p style="margin: 10px 0 0;">تذكرة رقم #${ticket.ticket_number}</p>
          </div>
          <div style="padding: 25px;">
            <h2 style="color: #1e293b;">مرحباً ${profile.full_name || 'عميلنا العزيز'}،</h2>
            <p style="color: #64748b; line-height: 1.8;">يسعدنا إخبارك بأنه تم حل تذكرتك. نتمنى أن نكون قد ساعدناك!</p>
            
            <div style="background: #dcfce7; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="color: #15803d; font-size: 18px; margin: 0;">🎉 شكراً لتواصلك معنا</p>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="https://ashholding.com/dashboard/support" style="background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">فتح تذكرة جديدة</a>
            </div>
          </div>
        `;
        break;
        
      case "ticket_closed":
        subject = `🔒 تم إغلاق تذكرتك #${ticket.ticket_number}`;
        smsMessage = `ASH HOLDING: تم إغلاق تذكرتك رقم ${ticket.ticket_number}. يمكنك فتح تذكرة جديدة إذا احتجت مساعدة.`;
        emailContent = `
          <div style="background: #6b7280; padding: 30px; border-radius: 16px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🔒 تم الإغلاق</h1>
            <p style="margin: 10px 0 0;">تذكرة رقم #${ticket.ticket_number}</p>
          </div>
          <div style="padding: 25px;">
            <h2 style="color: #1e293b;">مرحباً ${profile.full_name || 'عميلنا العزيز'}،</h2>
            <p style="color: #64748b; line-height: 1.8;">تم إغلاق تذكرتك. إذا كنت بحاجة لمزيد من المساعدة، يمكنك فتح تذكرة جديدة.</p>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="https://ashholding.com/dashboard/support" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">فتح تذكرة جديدة</a>
            </div>
          </div>
        `;
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    // Full email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f1f5f9; direction: rtl;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f1f5f9;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <tr>
                  <td>${emailContent}</td>
                </tr>
                <tr>
                  <td style="background: #1e293b; padding: 25px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0; font-size: 14px;">© ${new Date().getFullYear()} ASH HOLDING. جميع الحقوق محفوظة.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    // Send email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ASH HOLDING <noreply@ash-holding.sa>",
        to: [profile.email],
        subject,
        html: emailHtml,
      }),
    });
    
    const emailResult = await emailResponse.json();
    console.log("Email result:", emailResult);
    
    // Log email
    await supabase.from("emails").insert({
      recipient_email: profile.email,
      recipient_name: profile.full_name,
      subject,
      content: `تحديث على تذكرة الدعم #${ticket.ticket_number}`,
      status: emailResponse.ok ? "sent" : "failed",
      sent_at: new Date().toISOString(),
    });
    
    // Send SMS if phone available
    if (profile.phone) {
      const smsResult = await sendSMS(profile.phone, smsMessage);
      console.log("SMS result:", smsResult);
      
      await supabase.from("sms_logs").insert({
        phone: profile.phone,
        message: smsMessage,
        type: 'support',
        status: smsResult.success ? 'sent' : 'failed',
        user_id: ticket.user_id,
        reference_id: ticketId,
        error_message: smsResult.error || null,
      });

      // Send WhatsApp notification
      const whatsappMessage = getTicketStatusMessage(
        ticket.ticket_number,
        ticket.status,
        ticket.subject,
        type === 'new_reply'
      );
      const whatsappResult = await sendWhatsAppMessage({
        phone: profile.phone,
        message: whatsappMessage,
        type: 'ticket'
      });
      console.log("WhatsApp result:", whatsappResult);
      
      // Log WhatsApp
      await supabase.from("sms_logs").insert({
        phone: profile.phone,
        message: whatsappMessage,
        type: 'whatsapp_support',
        status: whatsappResult.success ? 'sent' : 'failed',
        user_id: ticket.user_id,
        reference_id: ticketId,
        error_message: whatsappResult.error || null,
      });
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error("Error in notify-ticket-update:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
