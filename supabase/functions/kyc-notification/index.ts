import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/email-gateway.ts";

const FROM = "ASH HOLDING - التحقق من الهوية <kyc@ash-holding.sa>";
const REPLY_TO = "kyc@ash-holding.sa";
const SITE = "https://ash-holding.sa";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function layout(title: string, accent: string, badge: string, name: string, body: string, cta?: { label: string; url: string }) {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 12px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0b1424;border-radius:20px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:28px;text-align:center;">
<div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">ASH HOLDING</div>
<div style="color:#e0f7ff;font-size:13px;margin-top:4px;">قسم التحقق من الهوية</div></td></tr>
<tr><td style="padding:32px 28px;color:#e2e8f0;text-align:right;">
<span style="display:inline-block;background:${accent}22;color:${accent};border:1px solid ${accent};border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;">${badge}</span>
<h1 style="color:#ffffff;font-size:22px;margin:18px 0 8px;">${title}</h1>
<p style="font-size:15px;line-height:1.9;margin:0 0 12px;">مرحباً ${esc(name)}،</p>
${body}
${cta ? `<div style="text-align:center;margin:28px 0 8px;"><a href="${cta.url}" style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;display:inline-block;">${cta.label}</a></div>` : ""}
<div style="margin-top:24px;padding:14px;background:#111c30;border-radius:12px;font-size:12px;color:#94a3b8;line-height:1.8;">
لأي استفسار يمكنك الرد مباشرة على هذه الرسالة وسيتواصل معك فريق التحقق.<br>بياناتك محمية ومشفرة ولن نطلب منك كلمة المرور أبداً.</div>
</td></tr>
<tr><td style="padding:18px;text-align:center;color:#64748b;font-size:11px;border-top:1px solid #1e293b;">© ASH HOLDING · ash-holding.sa · 0555812567</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const event = body?.event;
    const id = typeof body?.verificationId === "string" ? body.verificationId : null;
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
    if (!["submitted", "approved", "rejected"].includes(event) || (!id && !sessionId)) {
      return json({ error: "invalid input" }, 400);
    }

    let q = admin.from("kyc_verifications").select("id,user_id,status,rejection_reason").limit(1);
    q = id ? q.eq("id", id) : q.eq("session_id", sessionId!);
    const { data: kyc } = await q.maybeSingle();
    if (!kyc) return json({ error: "not found" }, 404);

    if (event === "submitted") {
      if (kyc.user_id !== user.id) return json({ error: "forbidden" }, 403);
    } else {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "forbidden" }, 403);
      if (event === "approved" && kyc.status !== "PASSED") return json({ error: "status mismatch" }, 409);
      if (event === "rejected" && kyc.status !== "FAILED") return json({ error: "status mismatch" }, 409);
    }

    const { data: target } = await admin.auth.admin.getUserById(kyc.user_id);
    const email = target?.user?.email;
    if (!email) return json({ skipped: "no email" });
    const { data: profile } = await admin.from("profiles").select("full_name").eq("id", kyc.user_id).maybeSingle();
    const name = profile?.full_name || "عميلنا العزيز";
    const p = (t: string) => `<p style="font-size:15px;line-height:1.9;margin:0 0 12px;">${t}</p>`;

    let subject = "", html = "";
    if (event === "submitted") {
      subject = "استلمنا طلب التحقق من هويتك";
      html = layout("تم استلام طلب التحقق", "#38bdf8", "قيد المراجعة", name,
        p("شكراً لك، استلمنا وثائق التحقق من هويتك بنجاح وهي الآن قيد المراجعة من فريقنا المختص.") +
        p("تستغرق المراجعة عادة من بضع ساعات حتى يوم عمل واحد، وسنرسل لك النتيجة على بريدك فور الانتهاء."),
        { label: "متابعة حالة التحقق", url: `${SITE}/dashboard/kyc` });
    } else if (event === "approved") {
      subject = "تم التحقق من هويتك بنجاح";
      html = layout("تهانينا! تم توثيق حسابك", "#22c55e", "موثّق", name,
        p("يسعدنا إبلاغك بأنه تم التحقق من هويتك بنجاح، وحسابك الآن مفعّل بالكامل.") +
        p("يمكنك الآن الاستفادة من جميع الخدمات: التحويلات المالية، إنشاء الطلبات، والسحب البنكي."),
        { label: "الدخول إلى حسابي", url: `${SITE}/dashboard` });
    } else {
      const reason = esc(String(kyc.rejection_reason || "لم يتم تحديد السبب"));
      subject = "تحديث بخصوص طلب التحقق من هويتك";
      html = layout("لم يكتمل التحقق من هويتك", "#f59e0b", "يحتاج إلى تعديل", name,
        p("راجع فريقنا طلبك ولم نتمكن من إتمام التحقق للسبب التالي:") +
        `<div style="background:#1f1a0e;border-right:4px solid #f59e0b;padding:14px;border-radius:10px;color:#fde68a;font-size:14px;margin:0 0 14px;">${reason}</div>` +
        p("يمكنك إعادة تقديم الطلب بعد تصحيح الملاحظة أعلاه."),
        { label: "إعادة تقديم الطلب", url: `${SITE}/dashboard/kyc` });
    }

    const { error } = await sendEmail({ from: FROM, to: email, reply_to: REPLY_TO, subject, html });
    if (error) return json({ error: error.message }, 502);
    return json({ sent: true });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
