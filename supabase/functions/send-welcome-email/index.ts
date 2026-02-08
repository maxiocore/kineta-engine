import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSMS, formatPhoneNumber } from "../_shared/sms-helper.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  name: string;
  phone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, name, phone }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get referral code if exists
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .single();

    const currentDate = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const dashboardUrl = 'https://ash-holding.sa/dashboard';

    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>مرحباً بك في ASH HOLDING</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f0f4f8; direction: rtl; text-align: right;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 40px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                     <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 20px; margin: 0 auto 20px; line-height: 80px;">
                      <span style="font-size: 42px; font-weight: 800; color: white;">A</span>
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white;">🎉 مرحباً بك في ASH HOLDING!</h1>
                    <p style="margin: 12px 0 0; font-size: 15px; color: rgba(255,255,255,0.9);">رحلة نجاحك الرقمي تبدأ الآن</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 35px 30px; direction: rtl; text-align: right;">
              
              <!-- Welcome Message -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <h2 style="margin: 0 0 12px; font-size: 24px; color: #1e293b; font-weight: 700;">أهلاً بك ${name}! 👋</h2>
                    <p style="margin: 0; font-size: 16px; color: #475569; line-height: 1.8;">
                      يسعدنا انضمامك إلى عائلة ASH HOLDING. أنت الآن جزء من مجتمع يضم آلاف المسوقين الناجحين.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Account Info Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border-right: 4px solid #6366f1; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 18px; font-size: 16px; color: #6366f1; text-align: right;">
                      📋 معلومات حسابك
                    </h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">الاسم</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px; font-weight: 600;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">البريد الإلكتروني</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px;" dir="ltr">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; ${referralCode ? 'border-bottom: 1px solid #e2e8f0;' : ''} text-align: right; color: #64748b; font-size: 14px;">تاريخ التسجيل</td>
                        <td style="padding: 12px 0; ${referralCode ? 'border-bottom: 1px solid #e2e8f0;' : ''} text-align: left; color: #1e293b; font-size: 14px;">${currentDate}</td>
                      </tr>
                      ${referralCode ? `
                      <tr>
                        <td style="padding: 12px 0; text-align: right; color: #64748b; font-size: 14px;">كود الإحالة الخاص بك</td>
                        <td style="padding: 12px 0; text-align: left;">
                          <span style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 14px;">${referralCode.code}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Features Grid -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 25px;">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 700;">
                      ✨ ما يمكنك فعله الآن
                    </h3>
                  </td>
                </tr>
              </table>
              
              <!-- Feature 1 -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%); border-radius: 14px; border-right: 4px solid #22c55e; margin-bottom: 12px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <span style="font-size: 28px;">💰</span>
                        </td>
                        <td style="text-align: right;">
                          <h4 style="margin: 0 0 5px; font-size: 16px; color: #166534; font-weight: 600;">اشحن رصيدك</h4>
                          <p style="margin: 0; font-size: 13px; color: #475569;">ابدأ بشحن رصيدك واستفد من عروض الكاش باك</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Feature 2 -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%); border-radius: 14px; border-right: 4px solid #3b82f6; margin-bottom: 12px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <span style="font-size: 28px;">🚀</span>
                        </td>
                        <td style="text-align: right;">
                          <h4 style="margin: 0 0 5px; font-size: 16px; color: #1e40af; font-weight: 600;">استكشف الخدمات</h4>
                          <p style="margin: 0; font-size: 13px; color: #475569;">أكثر من 500 خدمة تسويقية لجميع المنصات</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Feature 3 -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%); border-radius: 14px; border-right: 4px solid #f97316; margin-bottom: 12px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <span style="font-size: 28px;">🎯</span>
                        </td>
                        <td style="text-align: right;">
                          <h4 style="margin: 0 0 5px; font-size: 16px; color: #c2410c; font-weight: 600;">أكمل التحديات</h4>
                          <p style="margin: 0; font-size: 13px; color: #475569;">اجمع النقاط واصعد في المستويات للحصول على مكافآت</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Feature 4 -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%); border-radius: 14px; border-right: 4px solid #a855f7; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <span style="font-size: 28px;">👥</span>
                        </td>
                        <td style="text-align: right;">
                          <h4 style="margin: 0 0 5px; font-size: 16px; color: #7c3aed; font-weight: 600;">ادعُ أصدقاءك</h4>
                          <p style="margin: 0; font-size: 13px; color: #475569;">احصل على عمولات من كل طلب يقوم به من تدعوهم</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 18px 55px; border-radius: 14px; font-size: 18px; font-weight: 700; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);">
                      🚀 ابدأ الآن
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Support Note -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; margin-bottom: 15px;">
                <tr>
                  <td style="padding: 18px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #475569;">
                      💬 فريق الدعم متاح على مدار الساعة لمساعدتك
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 25px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 10px; font-size: 14px; color: rgba(255,255,255,0.9);">
                      مع تحيات فريق ASH HOLDING
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      هذه الرسالة آلية، لا تحتاج للرد عليها
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

    const emailResponse = await resend.emails.send({
      from: "ASH HOLDING <noreply@ash-holding.sa>",
      to: [email],
      subject: "🎉 مرحباً بك في ASH HOLDING - رحلة نجاحك تبدأ الآن!",
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    // Log email in database
    await supabase.from('emails').insert({
      recipient_email: email,
      recipient_name: name,
      subject: "مرحباً بك في ASH HOLDING",
      content: emailHtml,
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_by: userId
    });

    // Send welcome SMS if phone is provided
    if (phone) {
      const smsMessage = `مرحباً بك ${name} في ASH HOLDING! 🎉 حسابك جاهز الآن. ابدأ رحلتك: ash-holding.sa/dashboard`;
      const smsResult = await sendSMS(phone, smsMessage);
      console.log("Welcome SMS result:", smsResult);
      
      // Log SMS
      await supabase.from("sms_logs").insert({
        phone: phone,
        message: smsMessage,
        type: 'notification',
        status: smsResult.success ? 'sent' : 'failed',
        user_id: userId,
        reference_id: 'welcome',
        error_message: smsResult.error || null,
      });
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
