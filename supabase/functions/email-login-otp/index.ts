import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { sendEmail } from "../_shared/email-gateway.ts";
import { renderBrandedEmail } from "../_shared/email-template.ts";

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

      const html = renderBrandedEmail({
        title: "رمز تسجيل الدخول",
        preheader: "رمز آمن لإكمال تسجيل دخولك إلى ASH HOLDING",
        department: "الأمن الرقمي",
        tone: "security",
        status: "طلب تسجيل دخول",
        intro: "استخدم الرمز التالي لإكمال تسجيل الدخول. الرمز صالح لمدة 10 دقائق ولمرة واحدة فقط.",
        code,
        noticeTitle: "حماية حسابك",
        notice: "لا تشارك هذا الرمز مع أي شخص. إذا لم تطلب تسجيل الدخول، تجاهل الرسالة وراجع أمان حسابك.",
        replyEmail: "security@ash-holding.sa",
        legal: "security",
      });
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
