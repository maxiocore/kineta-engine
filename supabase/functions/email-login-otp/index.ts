import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { sendEmail } from "../_shared/email-gateway.ts";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send"), email: z.string().trim().toLowerCase().email().max(255) }),
  z.object({ action: z.literal("verify"), email: z.string().trim().toLowerCase().email().max(255), code: z.string().regex(/^\d{6}$/) }),
]);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { email } = parsed.data;

    if (parsed.data.action === "send") {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count } = await admin.from("email_login_codes").select("id", { count: "exact", head: true })
        .eq("email", email).gte("created_at", since);
      if ((count ?? 0) > 0) return json({ error: "rate_limited" }, 429);

      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
      await admin.from("email_login_codes").update({ used: true }).eq("email", email).eq("used", false);
      await admin.from("email_login_codes").insert({
        email, code_hash: await sha256(email + code), expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      });

      const year = new Date().getFullYear();
      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#070b16;font-family:'Segoe UI',Tahoma,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">رمز الدخول الخاص بك: ${code}</div>

<!-- Top accent bar -->
<div style="height:6px;background:linear-gradient(90deg,#06b6d4,#3b82f6,#8b5cf6);"></div>

<div style="background:#070b16;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;">

    <!-- Card -->
    <div style="background:linear-gradient(160deg,#101a33 0%,#0c1428 60%,#0a1024 100%);border:1px solid rgba(96,165,250,0.25);border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(3,7,18,0.6);">

      <!-- Header -->
      <div style="padding:36px 40px 8px;text-align:center;">
        <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:20px;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#ffffff;font-size:26px;font-weight:bold;letter-spacing:1px;">A</div>
        <h1 style="color:#ffffff;font-size:24px;margin:18px 0 6px;letter-spacing:2px;">ASH HOLDING</h1>
        <p style="color:#60a5fa;font-size:13px;margin:0;letter-spacing:3px;">تسجيل دخول آمن</p>
      </div>

      <!-- Divider -->
      <div style="margin:24px 40px 0;height:1px;background:linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent);"></div>

      <!-- Body -->
      <div style="padding:28px 40px 40px;text-align:center;">

        <h2 style="color:#ffffff;font-size:20px;font-weight:bold;margin:0 0 10px;">مرحباً بك من جديد</h2>
        <p style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0 0 26px;">
          استخدم الرمز التالي لإكمال تسجيل الدخول إلى حسابك
        </p>

        <!-- Code -->
        <div style="background:linear-gradient(145deg,#0f172a,#0d1a3a);border:2px solid rgba(59,130,246,0.45);border-radius:18px;padding:26px 20px;margin-bottom:22px;">
          <div style="font-size:40px;font-weight:bold;letter-spacing:14px;color:#ffffff;text-indent:14px;direction:ltr;font-family:'Courier New',monospace;text-shadow:0 0 30px rgba(59,130,246,0.5);">${code}</div>
        </div>

        <!-- Expiry chip -->
        <div style="display:inline-block;background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.35);border-radius:999px;padding:8px 22px;">
          <span style="color:#22d3ee;font-size:13px;font-weight:bold;">⏱ صالح لمدة 10 دقائق فقط</span>
        </div>

        <!-- Security note -->
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:14px;padding:16px 20px;margin-top:28px;text-align:right;">
          <p style="color:#fca5a5;font-size:13px;line-height:1.8;margin:0;">
            🔒 <strong style="color:#ffffff;">للحماية:</strong> لا تشارك هذا الرمز مع أي شخص — فريق ASH HOLDING لن يطلبه منك أبداً. إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:28px 20px 8px;text-align:center;">
      <p style="color:#64748b;font-size:12px;margin:0 0 8px;">
        ASH HOLDING — شريكك التقني الموثوق
      </p>
      <p style="color:#475569;font-size:11px;margin:0;">
        <a href="tel:0555812567" style="color:#64748b;text-decoration:none;">0555812567</a> &nbsp;•&nbsp; ash-holding.sa &nbsp;•&nbsp; ${year}
      </p>
    </div>

  </div>
</div>
</body>
</html>`;
      const { error } = await sendEmail({
        from: "ASH HOLDING <security@ash-holding.sa>", to: email, reply_to: "info@ash-holding.sa",
        subject: `رمز الدخول: ${code}`, html,
      });
      if (error) return json({ error: "send_failed" }, 502);
      return json({ ok: true });
    }

    // verify
    const { data: row } = await admin.from("email_login_codes").select("*")
      .eq("email", email).eq("used", false).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!row || new Date(row.expires_at) < new Date() || row.attempts >= 5) return json({ error: "invalid_code" }, 400);
    if (row.code_hash !== (await sha256(email + parsed.data.code))) {
      await admin.from("email_login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return json({ error: "invalid_code" }, 400);
    }
    await admin.from("email_login_codes").update({ used: true }).eq("id", row.id);

    // create user if missing, then mint a magic-link token for the client to exchange
    let link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (link.error) {
      await admin.auth.admin.createUser({ email, email_confirm: true });
      link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    }
    if (link.error || !link.data?.properties?.hashed_token) return json({ error: "session_failed" }, 500);
    return json({ ok: true, token_hash: link.data.properties.hashed_token });
  } catch (e) {
    console.error(e);
    return json({ error: "server_error" }, 500);
  }
});
