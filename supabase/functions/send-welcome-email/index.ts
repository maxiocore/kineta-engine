import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, name }: WelcomeEmailRequest = await req.json();

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

    const dashboardUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/dashboard`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً بك في MaxioCore</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header with Logo -->
    <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 20px 20px 0 0;">
      <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px; font-weight: bold; color: white;">M</span>
      </div>
      <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: white;">🎉 مرحباً بك في MaxioCore!</h1>
      <p style="margin: 15px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">رحلة نجاحك الرقمي تبدأ الآن</p>
    </div>
    
    <!-- Main Content -->
    <div style="background: linear-gradient(180deg, #13131a 0%, #1a1a24 100%); padding: 40px 30px; border-radius: 0 0 20px 20px; border: 1px solid rgba(99, 102, 241, 0.2); border-top: none;">
      
      <!-- Welcome Message -->
      <div style="text-align: center; margin-bottom: 35px;">
        <h2 style="margin: 0 0 15px; font-size: 24px; color: #ffffff;">أهلاً بك ${name}! 👋</h2>
        <p style="margin: 0; font-size: 16px; color: #a0a0b0; line-height: 1.8;">
          يسعدنا انضمامك إلى عائلة MaxioCore. أنت الآن جزء من مجتمع يضم آلاف المسوقين الناجحين.
        </p>
      </div>
      
      <!-- Account Info Card -->
      <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; padding: 25px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 20px; font-size: 18px; color: #8b5cf6; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">📋</span> معلومات حسابك
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #a0a0b0; font-size: 14px;">الاسم</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #ffffff; font-size: 14px; text-align: left;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #a0a0b0; font-size: 14px;">البريد الإلكتروني</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #ffffff; font-size: 14px; text-align: left;" dir="ltr">${email}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #a0a0b0; font-size: 14px;">تاريخ التسجيل</td>
            <td style="padding: 12px 0; color: #ffffff; font-size: 14px; text-align: left;">${currentDate}</td>
          </tr>
          ${referralCode ? `
          <tr>
            <td style="padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.1); color: #a0a0b0; font-size: 14px;">كود الإحالة الخاص بك</td>
            <td style="padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: left;">
              <span style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 6px 16px; border-radius: 8px; font-weight: bold; font-size: 14px;">${referralCode.code}</span>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Features Grid -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 20px; font-size: 18px; color: #ffffff; text-align: center;">
          ✨ ما يمكنك فعله الآن
        </h3>
        <div style="display: grid; gap: 15px;">
          
          <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="font-size: 28px;">💰</span>
              <div>
                <h4 style="margin: 0 0 5px; font-size: 16px; color: #22c55e;">اشحن رصيدك</h4>
                <p style="margin: 0; font-size: 13px; color: #a0a0b0;">ابدأ بشحن رصيدك واستفد من عروض الكاش باك</p>
              </div>
            </div>
          </div>
          
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="font-size: 28px;">🚀</span>
              <div>
                <h4 style="margin: 0 0 5px; font-size: 16px; color: #3b82f6;">استكشف الخدمات</h4>
                <p style="margin: 0; font-size: 13px; color: #a0a0b0;">أكثر من 500 خدمة تسويقية لجميع المنصات</p>
              </div>
            </div>
          </div>
          
          <div style="background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 12px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="font-size: 28px;">🎯</span>
              <div>
                <h4 style="margin: 0 0 5px; font-size: 16px; color: #f97316;">أكمل التحديات</h4>
                <p style="margin: 0; font-size: 13px; color: #a0a0b0;">اجمع النقاط واصعد في المستويات للحصول على مكافآت</p>
              </div>
            </div>
          </div>
          
          <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="font-size: 28px;">👥</span>
              <div>
                <h4 style="margin: 0 0 5px; font-size: 16px; color: #a855f7;">ادعُ أصدقاءك</h4>
                <p style="margin: 0; font-size: 13px; color: #a0a0b0;">احصل على عمولات من كل طلب يقوم به من تدعوهم</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 50px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);">
          🚀 ابدأ الآن
        </a>
      </div>
      
      <!-- Support Note -->
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #a0a0b0;">
          💬 فريق الدعم متاح على مدار الساعة لمساعدتك
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 30px 20px;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #a0a0b0;">
        مع تحيات فريق MaxioCore
      </p>
      <p style="margin: 0; font-size: 12px; color: #606070;">
        هذه الرسالة آلية، لا تحتاج للرد عليها
      </p>
    </div>
    
  </div>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "MaxioCore <onboarding@resend.dev>",
      to: [email],
      subject: "🎉 مرحباً بك في MaxioCore - رحلة نجاحك تبدأ الآن!",
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    // Log email in database
    await supabase.from('emails').insert({
      recipient_email: email,
      recipient_name: name,
      subject: "مرحباً بك في MaxioCore",
      content: emailHtml,
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_by: userId
    });

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
