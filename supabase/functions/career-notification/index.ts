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
  status?: 'reviewing' | 'interviewed' | 'accepted' | 'rejected' | string;
  adminNotes?: string;
  interviewDate?: string;      // ISO string
  interviewLocation?: string;  // link or address
  interviewType?: 'online' | 'in_person';
}

const FROM = "ASH HOLDING Careers <hr@ash-holding.sa>";
const REPLY = "info@ash-holding.sa";

function wrap(content: string, color = "#667eea") {
  return `<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',Tahoma,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:linear-gradient(135deg,${color}22 0%,${color}11 100%);border-radius:16px">
    <div style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 10px 40px rgba(0,0,0,.08)">
      ${content}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:30px 0">
      <p style="color:#a0aec0;font-size:12px;text-align:center;margin:0">
        للرد والاستفسار: <a href="mailto:info@ash-holding.sa" style="color:${color}">info@ash-holding.sa</a><br>
        ASH HOLDING — فريق الموارد البشرية
      </p>
    </div>
  </div>`;
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ar-SA", {
      dateStyle: "full", timeStyle: "short", timeZone: "Asia/Riyadh",
    });
  } catch { return iso; }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: CareerNotificationRequest = await req.json();
    const { type, applicantName, applicantEmail, jobTitle, status, adminNotes,
            interviewDate, interviewLocation, interviewType } = body;

    console.log(`career-notification: ${type} -> ${applicantEmail} (status=${status || '-'})`);

    // ---- Auto-reply on new application ----
    if (type === 'new_application') {
      await resend.emails.send({
        from: FROM,
        reply_to: REPLY,
        to: [applicantEmail],
        subject: `تم استلام طلبك للوظيفة: ${jobTitle}`,
        html: wrap(`
          <div style="text-align:center;margin-bottom:24px">
            <div style="width:72px;height:72px;background:#667eea;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px">✉️</div>
            <h1 style="color:#1a1a2e;margin:0;font-size:24px">تم استلام طلبك بنجاح</h1>
          </div>
          <p style="color:#4a5568;font-size:16px;line-height:1.9">مرحباً <strong>${applicantName}</strong>،</p>
          <p style="color:#4a5568;font-size:16px;line-height:1.9">
            شكراً لتقدمك لوظيفة <strong style="color:#667eea">${jobTitle}</strong> في ASH HOLDING.
            هذه رسالة تأكيد تلقائية — طلبك وصلنا، وفريق التوظيف سيراجعه خلال 3-5 أيام عمل.
          </p>
          <div style="background:#f6f9fc;border-right:4px solid #667eea;border-radius:10px;padding:18px;margin:20px 0">
            <strong style="color:#1a1a2e">الخطوات التالية:</strong>
            <ul style="color:#4a5568;margin:8px 0 0;padding-right:20px;line-height:2">
              <li>مراجعة الطلب والسيرة الذاتية</li>
              <li>إذا كان ملفك مناسباً، سنتواصل معك لتحديد موعد مقابلة</li>
              <li>ستصلك إشعارات بالبريد عند أي تحديث لحالة طلبك</li>
            </ul>
          </div>
        `),
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ---- Status update ----
    if (type === 'status_update' && status) {
      const map: Record<string, { subject: string; title: string; emoji: string; color: string; body: string }> = {
        reviewing: {
          subject: "طلبك قيد المراجعة",
          title: "طلبك قيد المراجعة الآن",
          emoji: "👀", color: "#f59e0b",
          body: `فريق التوظيف يراجع طلبك لوظيفة <strong>${jobTitle}</strong>. سنتواصل معك قريباً بالخطوة التالية.`,
        },
        interviewed: {
          subject: "دعوة لمقابلة",
          title: "🎯 تمت دعوتك لمقابلة",
          emoji: "🎯", color: "#8b5cf6",
          body: `يسعدنا دعوتك لمقابلة بخصوص وظيفة <strong>${jobTitle}</strong>.` +
            (interviewDate ? `<div style="background:#8b5cf611;border-right:4px solid #8b5cf6;border-radius:10px;padding:16px;margin:18px 0">
              <div style="font-weight:bold;color:#1a1a2e;margin-bottom:6px">📅 موعد المقابلة</div>
              <div style="color:#4a5568">${fmtDate(interviewDate)}</div>
              ${interviewLocation ? `<div style="margin-top:10px;color:#4a5568"><strong>${interviewType === 'in_person' ? 'العنوان' : 'الرابط'}:</strong> ${interviewType === 'online' ? `<a href="${interviewLocation}" style="color:#8b5cf6;word-break:break-all">${interviewLocation}</a>` : interviewLocation}</div>` : ''}
              <div style="margin-top:10px;color:#718096;font-size:13px">${interviewType === 'in_person' ? 'مقابلة حضورية' : 'مقابلة عن بُعد'}</div>
            </div>` : ''),
        },
        accepted: {
          subject: "🎉 تهانينا — تم قبولك",
          title: "🎉 تم قبولك",
          emoji: "🎉", color: "#10b981",
          body: `يسعدنا إبلاغك بقبولك لوظيفة <strong>${jobTitle}</strong>. سيتواصل معك فريق الموارد البشرية خلال وقت قصير لإتمام إجراءات الانضمام.`,
        },
        rejected: {
          subject: "بخصوص طلب التوظيف",
          title: "تحديث حول طلبك",
          emoji: "📝", color: "#ef4444",
          body: `نشكرك على اهتمامك بـ ASH HOLDING. بعد مراجعة طلبك لوظيفة <strong>${jobTitle}</strong>، لم يتم اختيارك لهذه الوظيفة حالياً. سنحتفظ بسيرتك الذاتية لفرص مستقبلية مناسبة. نتمنى لك التوفيق.`,
        },
      };

      const t = map[status];
      if (!t) {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      await resend.emails.send({
        from: FROM,
        reply_to: REPLY,
        to: [applicantEmail],
        subject: `${t.subject} — ${jobTitle}`,
        html: wrap(`
          <div style="text-align:center;margin-bottom:24px">
            <div style="width:72px;height:72px;background:${t.color};border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px">${t.emoji}</div>
            <h1 style="color:#1a1a2e;margin:0;font-size:24px">${t.title}</h1>
          </div>
          <p style="color:#4a5568;font-size:16px;line-height:1.9">مرحباً <strong>${applicantName}</strong>،</p>
          <p style="color:#4a5568;font-size:16px;line-height:1.9">${t.body}</p>
          ${adminNotes ? `<div style="background:#f8fafc;border-radius:10px;padding:16px;margin:18px 0">
            <strong style="color:#1a1a2e">ملاحظات من فريق التوظيف:</strong>
            <div style="color:#4a5568;margin-top:6px;white-space:pre-wrap">${adminNotes}</div>
          </div>` : ''}
        `, t.color),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("career-notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
