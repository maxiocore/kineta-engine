import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Fetch user profile
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

    const { service_id } = await req.json();

    // Call external SSO API
    const ASH_API_URL = Deno.env.get("ASH_HOLDINGS_API_URL") || "https://ash.holdings";
    const ssoEndpoint = `${ASH_API_URL}/api/auth/sso-token`;
    
    console.log("Calling SSO endpoint:", ssoEndpoint);
    
    const ssoResponse = await fetch(ssoEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: service_id || null,
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

    let ssoData;
    try {
      ssoData = JSON.parse(responseText);
    } catch {
      console.error("SSO returned non-JSON:", responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "SSO service returned invalid response" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const redirectUrl = ssoData.redirect_url || ssoData.url || `${ASH_API_URL}/auth?token=${ssoData.token}`;

    return new Response(
      JSON.stringify({
        token: ssoData.token,
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
