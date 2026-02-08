import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "مستخدم غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!callerRole || callerRole.role !== "admin") {
      console.log(`[admin-create-user] Non-admin attempt by ${caller.id}`);
      return new Response(JSON.stringify({ error: "صلاحيات غير كافية" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone, full_name, email, password } = await req.json();

    // Validate required fields
    if (!phone || typeof phone !== "string" || phone.trim().length < 9) {
      return new Response(JSON.stringify({ error: "رقم الجوال مطلوب (9 أرقام على الأقل)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "الاسم الكامل مطلوب (حرفين على الأقل)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize phone number
    let cleanPhone = phone.trim().replace(/\s+/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "966" + cleanPhone.substring(1);
    }
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = "+" + cleanPhone;
    }

    // Generate email if not provided (use phone-based email)
    const userEmail = email?.trim() || `${cleanPhone.replace("+", "")}@phone.local`;
    const userPassword = password?.trim() || Math.random().toString(36).slice(-10) + "Aa1!";

    console.log(`[admin-create-user] Admin ${caller.id} creating user: ${full_name}, phone: ${cleanPhone}`);

    // Check if phone already exists in profiles
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, phone, email")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ 
        error: "رقم الجوال مسجل مسبقاً",
        existing_email: existingProfile.email 
      }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if email already exists
    if (email?.trim()) {
      const { data: existingEmail } = await adminClient
        .from("profiles")
        .select("id, email")
        .eq("email", email.trim())
        .maybeSingle();

      if (existingEmail) {
        return new Response(JSON.stringify({ error: "البريد الإلكتروني مسجل مسبقاً" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create auth user (auto-confirmed)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        phone: cleanPhone,
      },
    });

    if (createError) {
      console.error(`[admin-create-user] Failed to create auth user:`, createError);
      
      if (createError.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ error: "البريد الإلكتروني مسجل مسبقاً" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "فشل في إنشاء الحساب", details: createError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!newUser?.user) {
      return new Response(JSON.stringify({ error: "فشل في إنشاء الحساب" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with phone and verified status
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: full_name.trim(),
        phone: cleanPhone,
        is_verified: true,
        phone_verified: true,
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      console.log(`[admin-create-user] Profile update note:`, profileError);
      // Try upsert if update failed (profile might not exist yet due to trigger timing)
      await adminClient.from("profiles").upsert({
        id: newUser.user.id,
        email: userEmail,
        full_name: full_name.trim(),
        phone: cleanPhone,
        is_verified: true,
        phone_verified: true,
      });
    }

    console.log(`[admin-create-user] Successfully created user ${newUser.user.id} with phone ${cleanPhone}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: userEmail,
          phone: cleanPhone,
          full_name: full_name.trim(),
        },
        generated_password: password ? undefined : userPassword,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[admin-create-user] Error:", error);
    return new Response(
      JSON.stringify({ error: "خطأ في الخادم", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
