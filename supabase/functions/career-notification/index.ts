import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CareerNotificationRequest {
  type: 'new_application' | 'status_update';
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  status?: string;
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, applicantName, applicantEmail, jobTitle, status, adminNotes }: CareerNotificationRequest = await req.json();
    
    console.log(`Processing career notification: ${type} for ${applicantEmail}`);

    if (type === 'new_application') {
      // Send confirmation to applicant
      const applicantEmail1 = await resend.emails.send({
        from: "ASH HOLDING Careers <hr@ash-holding.sa>",
        reply_to: "info@ash-holding.sa",
        to: [applicantEmail],
        subject: `تم استلام طلبك للوظيفة: ${jobTitle}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 36px;">✉️</span>
                </div>
                <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">تم استلام طلبك بنجاح!</h1>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                مرحباً <strong>${applicantName}</strong>،
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                شكراً لاهتمامك بالانضمام إلى فريق <strong>ASH HOLDING</strong>! 
                لقد استلمنا طلبك لوظيفة <strong style="color: #667eea;">${jobTitle}</strong>.
              </p>
              
              <div style="background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-right: 4px solid #667eea;">
                <h3 style="color: #1a1a2e; margin: 0 0 12px 0; font-size: 18px;">📋 الخطوات التالية:</h3>
                <ul style="color: #4a5568; margin: 0; padding-right: 20px; line-height: 2;">
                  <li>سيقوم فريق التوظيف بمراجعة طلبك خلال 3-5 أيام عمل</li>
                  <li>إذا كان ملفك مناسباً، سنتواصل معك لترتيب مقابلة</li>
                  <li>ستتلقى إشعاراً بالبريد الإلكتروني عند أي تحديث</li>
                </ul>
              </div>
              
              <div style="background: #fff3cd; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>💡 نصيحة:</strong> تأكد من متابعة بريدك الإلكتروني بانتظام حتى لا تفوتك أي رسائل منا!
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8;">
                نتمنى لك التوفيق!<br>
                <strong>فريق الموارد البشرية - ASH HOLDING</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
                هذه رسالة تلقائية، يرجى عدم الرد عليها مباشرة.
              </p>
            </div>
          </div>
        `,
      });

      console.log("Applicant email sent:", applicantEmail1);

      // Send notification to admin (you can configure admin email)
      const adminNotification = await resend.emails.send({
        from: "ASH HOLDING Careers <hr@ash-holding.sa>",
        reply_to: "info@ash-holding.sa",
        to: ["hr@ash-holding.sa"], // Configure your admin email
        subject: `📥 طلب توظيف جديد: ${jobTitle}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">🔔 طلب توظيف جديد</h1>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #718096; width: 140px;">الوظيفة:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1a1a2e; font-weight: bold;">${jobTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #718096;">اسم المتقدم:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1a1a2e; font-weight: bold;">${applicantName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #718096;">البريد الإلكتروني:</td>
                  <td style="padding: 12px 0; color: #1a1a2e;"><a href="mailto:${applicantEmail}" style="color: #667eea;">${applicantEmail}</a></td>
                </tr>
              </table>
              
              <div style="margin-top: 24px;">
                <a href="https://ash-holding.sa/admin/careers" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  عرض الطلب في لوحة التحكم
                </a>
              </div>
            </div>
          </div>
        `,
      });

      console.log("Admin notification sent:", adminNotification);

    } else if (type === 'status_update' && status) {
      let subject = "";
      let statusText = "";
      let statusEmoji = "";
      let statusColor = "";
      let additionalMessage = "";

      switch (status) {
        case 'reviewing':
          subject = "طلبك قيد المراجعة";
          statusText = "قيد المراجعة";
          statusEmoji = "👀";
          statusColor = "#f59e0b";
          additionalMessage = "فريق التوظيف يراجع طلبك الآن. سنتواصل معك قريباً.";
          break;
        case 'interviewed':
          subject = "تهانينا! دعوة لمقابلة";
          statusText = "تمت دعوتك للمقابلة";
          statusEmoji = "🎯";
          statusColor = "#8b5cf6";
          additionalMessage = "يسعدنا دعوتك لإجراء مقابلة معنا. سنتواصل معك لتحديد الموعد المناسب.";
          break;
        case 'accepted':
          subject = "🎉 تهانينا! تم قبولك";
          statusText = "مقبول";
          statusEmoji = "🎉";
          statusColor = "#10b981";
          additionalMessage = "يسعدنا إبلاغك بأنه تم قبولك للانضمام إلى فريقنا! سنتواصل معك لترتيب الخطوات التالية.";
          break;
        case 'rejected':
          subject = "بخصوص طلب التوظيف";
          statusText = "لم يتم القبول";
          statusEmoji = "📝";
          statusColor = "#ef4444";
          additionalMessage = "نشكرك على اهتمامك بالانضمام إلينا. للأسف، لم يتم اختيارك لهذه الوظيفة في الوقت الحالي. نتمنى لك التوفيق.";
          break;
        default:
          subject = "تحديث حالة طلبك";
          statusText = status;
          statusEmoji = "📋";
          statusColor = "#6b7280";
      }

      const statusEmail = await resend.emails.send({
        from: "ASH HOLDING Careers <hr@ash-holding.sa>",
        reply_to: "info@ash-holding.sa",
        to: [applicantEmail],
        subject: `${subject} - ${jobTitle}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, ${statusColor}22 0%, ${statusColor}11 100%); border-radius: 16px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: ${statusColor}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 36px;">${statusEmoji}</span>
                </div>
                <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">${subject}</h1>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                مرحباً <strong>${applicantName}</strong>،
              </p>
              
              <div style="background: ${statusColor}11; border-radius: 12px; padding: 24px; margin: 24px 0; border-right: 4px solid ${statusColor};">
                <p style="color: ${statusColor}; margin: 0 0 8px 0; font-weight: bold; font-size: 18px;">
                  حالة طلبك: ${statusText}
                </p>
                <p style="color: #4a5568; margin: 0; font-size: 14px;">
                  الوظيفة: ${jobTitle}
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                ${additionalMessage}
              </p>
              
              ${adminNotes ? `
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="color: #1a1a2e; margin: 0; font-size: 14px;">
                  <strong>💬 ملاحظات:</strong><br>
                  ${adminNotes}
                </p>
              </div>
              ` : ''}
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8;">
                مع أطيب التحيات،<br>
                <strong>فريق الموارد البشرية - ASH HOLDING</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
                هذه رسالة تلقائية من نظام التوظيف في ASH HOLDING
              </p>
            </div>
          </div>
        `,
      });

      console.log("Status update email sent:", statusEmail);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in career-notification function:", error);
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
