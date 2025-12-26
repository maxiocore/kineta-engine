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
      from: "MaxioCore <noreply@maxiocore.com>",
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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>رسالة جديدة من صفحة التواصل</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f0f4f8; direction: rtl; text-align: right;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 35px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 18px; margin: 0 auto 15px; line-height: 70px;">
                      <span style="font-size: 36px;">📩</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      رسالة جديدة من صفحة التواصل
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px; direction: rtl; text-align: right;">
              
              <!-- Sender Info Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; border-right: 4px solid #6366f1; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 22px;">
                    <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px; font-weight: 700; text-align: right;">معلومات المرسل:</h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">الاسم</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px; font-weight: 600;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">البريد الإلكتروني</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: left;">
                          <a href="mailto:${email}" style="color: #6366f1; text-decoration: none; font-size: 14px;">${email}</a>
                        </td>
                      </tr>
                      ${phone ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">رقم الجوال</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px;" dir="ltr">${phone}</td>
                      </tr>
                      ` : ''}
                      ${company ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">الشركة</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px;">${company}</td>
                      </tr>
                      ` : ''}
                      ${subject ? `
                      <tr>
                        <td style="padding: 10px 0; text-align: right; color: #64748b; font-size: 14px;">الموضوع</td>
                        <td style="padding: 10px 0; text-align: left; color: #1e293b; font-size: 14px; font-weight: 600;">${subject}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Message Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 14px; border-right: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 22px;">
                    <h3 style="margin: 0 0 12px; color: #92400e; font-size: 16px; font-weight: 700; text-align: right;">الرسالة:</h3>
                    <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.8; white-space: pre-wrap; text-align: right;">${message}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Timestamp -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #64748b; font-size: 12px;">
                      تم الإرسال في: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      © ${new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.
                    </p>
                  </td>
                </tr>
              </table>
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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>تم استلام رسالتك</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f0f4f8; direction: rtl; text-align: right;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%); padding: 35px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 18px; margin: 0 auto 15px; line-height: 70px;">
                      <span style="font-size: 36px;">✅</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      تم استلام رسالتك بنجاح
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px; direction: rtl; text-align: right;">
              <p style="margin: 0 0 15px; color: #1e293b; font-size: 18px; font-weight: 600;">
                مرحباً <strong>${name}</strong>،
              </p>
              <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.8;">
                شكراً لتواصلك معنا. لقد استلمنا رسالتك وسيقوم فريقنا بالرد عليك في أقرب وقت ممكن خلال 24 ساعة.
              </p>
              
              <!-- Message Summary -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%); border-radius: 14px; border-right: 4px solid #22c55e; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 22px;">
                    <h3 style="margin: 0 0 12px; color: #166534; font-size: 14px; font-weight: 700; text-align: right;">ملخص رسالتك:</h3>
                    <p style="margin: 0; color: #15803d; font-size: 14px; line-height: 1.7; text-align: right; white-space: pre-wrap;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.8;">
                مع أطيب التحيات،<br>
                <strong style="color: #1e293b;">فريق MaxioCore</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه مباشرة.
                    </p>
                  </td>
                </tr>
              </table>
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
