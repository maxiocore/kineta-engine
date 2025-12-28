import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "approved" | "rejected";
  email: string;
  name: string;
  amount?: number;
  installments_count?: number;
  monthly_installment?: number;
  rejection_reason?: string;
  application_number: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    console.log("Sending financing notification:", data);

    let subject: string;
    let htmlContent: string;

    if (data.type === "approved") {
      subject = `🎉 تمت الموافقة على طلب التمويل #${data.application_number}`;
      htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #14b8a6); padding: 30px; border-radius: 16px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎉 مبروك!</h1>
            <p style="margin: 10px 0 0; font-size: 18px;">تمت الموافقة على طلب التمويل الخاص بك</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin: 0 0 20px;">مرحباً ${data.name}،</h2>
            <p style="color: #64748b; line-height: 1.8;">يسعدنا إبلاغك بأنه تمت الموافقة على طلب التمويل الخاص بك. تم إضافة الرصيد إلى حسابك ويمكنك استخدامه فوراً.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px 0; color: #64748b;">رقم الطلب:</td><td style="text-align: left; font-weight: bold;">${data.application_number}</td></tr>
                <tr><td style="padding: 10px 0; color: #64748b;">مبلغ التمويل:</td><td style="text-align: left; font-weight: bold; color: #10b981;">${data.amount} ر.س</td></tr>
                <tr><td style="padding: 10px 0; color: #64748b;">عدد الأقساط:</td><td style="text-align: left; font-weight: bold;">${data.installments_count}</td></tr>
                <tr><td style="padding: 10px 0; color: #64748b;">القسط الشهري:</td><td style="text-align: left; font-weight: bold;">${data.monthly_installment?.toFixed(2)} ر.س</td></tr>
              </table>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">⚠️ تذكير: الرصيد المضاف لحسابك صالح للاستخدام داخل المنصة فقط ولا يمكن سحبه.</p>
            </div>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">فريق ماكسيو كور - Maxiocore</p>
        </div>
      `;
    } else {
      subject = `طلب التمويل #${data.application_number} - نتيجة المراجعة`;
      htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fee2e2; padding: 30px; border-radius: 16px; text-align: center;">
            <h1 style="color: #dc2626; margin: 0; font-size: 24px;">نتيجة مراجعة طلب التمويل</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin: 0 0 20px;">مرحباً ${data.name}،</h2>
            <p style="color: #64748b; line-height: 1.8;">نأسف لإبلاغك بأنه لم تتم الموافقة على طلب التمويل رقم <strong>${data.application_number}</strong> في الوقت الحالي.</p>
            
            ${data.rejection_reason ? `
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc2626;">
              <p style="color: #64748b; margin: 0;"><strong>السبب:</strong> ${data.rejection_reason}</p>
            </div>
            ` : ''}
            
            <p style="color: #64748b; line-height: 1.8;">يمكنك التقديم مرة أخرى بعد استيفاء الشروط المطلوبة. لأي استفسار، تواصل معنا.</p>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">فريق ماكسيو كور - Maxiocore</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Maxiocore <noreply@resend.dev>",
      to: [data.email],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
