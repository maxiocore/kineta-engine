import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rawAshApiUrl = (Deno.env.get("ASH_HOLDINGS_API_URL") || "").trim();
const ASH_API_URL = (/^https?:\/\//i.test(rawAshApiUrl) ? rawAshApiUrl : "https://ash.holdings").replace(/\/+$/, "");
const ASH_API_KEY = Deno.env.get("ASH_HOLDINGS_API_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let service_id: string | null = null;
    try {
      const body = await req.json();
      service_id = body?.service_id ?? null;
    } catch {
      service_id = null;
    }

    const ssoEndpoint = `${ASH_API_URL}/api/auth/sso-token`;
    console.log("Calling SSO endpoint:", ssoEndpoint);

    const externalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (ASH_API_KEY) {
      externalHeaders.Authorization = `Bearer ${ASH_API_KEY}`;
      externalHeaders["x-api-key"] = ASH_API_KEY;
    }

    const ssoResponse = await fetch(ssoEndpoint, {
      method: "POST",
      headers: externalHeaders,
      body: JSON.stringify({
        service_id,
        customer: {
          id: userId,
          name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
        },
      }),
    });

    const responseText = await ssoResponse.text();
    console.log("SSO response status:", ssoResponse.status, "body preview:", responseText.substring(0, 200));

    if (!ssoResponse.ok) {
      console.error("SSO API error:", ssoResponse.status, responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to get SSO token", details: `Status ${ssoResponse.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fallbackRedirectUrl = `${ASH_API_URL}/dashboard/new-application`;

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error("SSO returned non-JSON:", responseText.substring(0, 500));
      return new Response(
        JSON.stringify({
          token: null,
          redirect_url: fallbackRedirectUrl,
          fallback: true,
          reason: "invalid_upstream_response",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = parsed?.data ?? parsed;
    const ssoToken = payload?.token;
    const redirectUrl = payload?.redirect_url || payload?.url || (ssoToken ? `${ASH_API_URL}/auth?token=${ssoToken}` : null);

    if (!ssoToken && !redirectUrl) {
      console.error("SSO payload missing token and redirect_url", parsed);
      return new Response(
        JSON.stringify({
          token: null,
          redirect_url: fallbackRedirectUrl,
          fallback: true,
          reason: "invalid_upstream_payload",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        token: ssoToken ?? null,
        redirect_url: redirectUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("sso-token error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
