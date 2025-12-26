import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MaxioCore <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Resend API error:", errorData);
    throw new Error(`Failed to send email: ${response.status}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Contact form submission received");

    const { name, email, phone, company, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "الحقول المطلوبة: الاسم، البريد الإلكتروني، الرسالة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format");
      return new Response(
        JSON.stringify({ error: "صيغة البريد الإلكتروني غير صحيحة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save message to database
    const { data: contactMessage, error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        subject: subject?.trim() || null,
        message: message.trim(),
        status: "new",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving contact message:", insertError);
      return new Response(
        JSON.stringify({ error: "حدث خطأ أثناء حفظ الرسالة" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Contact message saved:", contactMessage.id);

    // Get admin emails from profiles
    const { data: admins, error: adminsError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
    }

    let adminEmails: string[] = [];
    if (admins && admins.length > 0) {
      const adminIds = admins.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email")
        .in("id", adminIds)
        .not("email", "is", null);

      if (profiles) {
        adminEmails = profiles.map(p => p.email).filter(Boolean) as string[];
      }
    }

    console.log(`Found ${adminEmails.length} admin emails`);

    // Send email notification to admins
    if (adminEmails.length > 0 && RESEND_API_KEY) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📩 رسالة جديدة من صفحة التواصل</h1>
              </div>
              <div style="padding: 30px;">
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">معلومات المرسل:</h3>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>الاسم:</strong> ${name}</p>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>البريد الإلكتروني:</strong> <a href="mailto:${email}" style="color: #6366f1;">${email}</a></p>
                  ${phone ? `<p style="margin: 8px 0; color: #4b5563;"><strong>رقم الجوال:</strong> <span dir="ltr">${phone}</span></p>` : ''}
                  ${company ? `<p style="margin: 8px 0; color: #4b5563;"><strong>الشركة:</strong> ${company}</p>` : ''}
                  ${subject ? `<p style="margin: 8px 0; color: #4b5563;"><strong>الموضوع:</strong> ${subject}</p>` : ''}
                </div>
                <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
                  <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">الرسالة:</h3>
                  <p style="color: #78350f; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    تم الإرسال في: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail(
          adminEmails,
          `📩 رسالة جديدة من ${name}${subject ? ` - ${subject}` : ''}`,
          emailHtml
        );
        console.log("Admin notification email sent successfully");
      } catch (emailErr) {
        console.error("Error sending admin email:", emailErr);
      }
    }

    // Send confirmation email to the user
    if (RESEND_API_KEY) {
      try {
        const confirmationHtml = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ تم استلام رسالتك بنجاح</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.8;">
                  مرحباً <strong>${name}</strong>،
                </p>
                <p style="color: #4b5563; font-size: 15px; line-height: 1.8;">
                  شكراً لتواصلك معنا. لقد استلمنا رسالتك وسيقوم فريقنا بالرد عليك في أقرب وقت ممكن خلال 24 ساعة.
                </p>
                <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 14px;">ملخص رسالتك:</h3>
                  <p style="color: #15803d; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                  مع أطيب التحيات،<br>
                  <strong>فريق MaxioCore</strong>
                </p>
              </div>
              <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه مباشرة.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail(
          [email],
          "✅ تم استلام رسالتك - MaxioCore",
          confirmationHtml
        );
        console.log("Confirmation email sent to user");
      } catch (confirmErr) {
        console.error("Error sending confirmation email:", confirmErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم إرسال رسالتك بنجاح",
        id: contactMessage.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in contact-form function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "حدث خطأ غير متوقع" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
