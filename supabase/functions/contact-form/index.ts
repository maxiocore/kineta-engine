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
      from: "ASH HOLDING <noreply@ash-holding.sa>",
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
        const adminEmailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رسالة جديدة من صفحة التواصل</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f8fafc; direction: rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 22px; font-weight: 700;">
                📩 رسالة جديدة
              </h1>
              <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                من صفحة التواصل - ASH HOLDING
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              
              <!-- Sender Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <h3 style="margin: 0 0 16px; color: #0f172a; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                      👤 معلومات المرسل
                    </h3>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 13px; display: block; margin-bottom: 4px;">الاسم</span>
                          <span style="color: #0f172a; font-size: 15px; font-weight: 600;">${name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 13px; display: block; margin-bottom: 4px;">البريد الإلكتروني</span>
                          <a href="mailto:${email}" style="color: #0ea5e9; font-size: 15px; text-decoration: none; font-weight: 500;">${email}</a>
                        </td>
                      </tr>
                      ${phone ? `
                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 13px; display: block; margin-bottom: 4px;">رقم الجوال</span>
                          <span style="color: #0f172a; font-size: 15px; font-weight: 500;" dir="ltr">${phone}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${company ? `
                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 13px; display: block; margin-bottom: 4px;">الشركة</span>
                          <span style="color: #0f172a; font-size: 15px; font-weight: 500;">${company}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${subject ? `
                      <tr>
                        <td style="padding: 16px 20px;">
                          <span style="color: #64748b; font-size: 13px; display: block; margin-bottom: 4px;">الموضوع</span>
                          <span style="color: #0f172a; font-size: 15px; font-weight: 600;">${subject}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <h3 style="margin: 0 0 16px; color: #0f172a; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                      💬 نص الرسالة
                    </h3>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px;">
                      <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">${message}</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Timestamp -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 24px;">
                <tr>
                  <td align="center" style="padding-top: 16px; border-top: 1px solid #e2e8f0;">
                    <span style="color: #94a3b8; font-size: 12px;">
                      🕐 تم الإرسال: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'full', timeStyle: 'short' })}
                    </span>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                © ${new Date().getFullYear()} ASH HOLDING - جميع الحقوق محفوظة
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

        await sendEmail(
          adminEmails,
          `📩 رسالة جديدة من ${name}${subject ? ` - ${subject}` : ''}`,
          adminEmailHtml
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
  <title>تم استلام رسالتك</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f8fafc; direction: rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; line-height: 80px;">
                <span style="font-size: 40px;">✅</span>
              </div>
              <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 24px; font-weight: 700;">
                تم استلام رسالتك بنجاح!
              </h1>
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px;">
                شكراً لتواصلك مع ASH HOLDING
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px; color: #0f172a; font-size: 18px; font-weight: 600;">
                مرحباً ${name} 👋
              </p>
              
              <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.8;">
                شكراً لتواصلك معنا! لقد استلمنا رسالتك وسيقوم فريقنا المختص بمراجعتها والرد عليك في أقرب وقت ممكن.
              </p>
              
              <!-- Message Summary Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <h3 style="margin: 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                      📝 ملخص رسالتك:
                    </h3>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; border-right: 4px solid #10b981;">
                      <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${message.substring(0, 250)}${message.length > 250 ? '...' : ''}</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Response Time Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <span style="font-size: 24px;">⏰</span>
                        </td>
                        <td>
                          <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">وقت الرد المتوقع</p>
                          <p style="margin: 4px 0 0; color: #3b82f6; font-size: 13px;">سنقوم بالرد عليك خلال 24 ساعة عمل</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Signature -->
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.7;">
                مع أطيب التحيات،<br>
                <strong style="color: #0f172a;">فريق ASH HOLDING</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
                هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه مباشرة.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} ASH HOLDING - جميع الحقوق محفوظة
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

        await sendEmail(
          [email],
          "✅ تم استلام رسالتك - ASH HOLDING",
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
