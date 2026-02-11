import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bff-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// ─── Helpers ────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}

// ─── Standardised response envelope ────────────────────────
function envelope<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true, data, meta: { timestamp: new Date().toISOString(), ...meta } };
}

// ─── Auth middleware ────────────────────────────────────────
async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, isAdmin: false, supabase: null };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return { user: null, isAdmin: false, supabase };

  // Check admin role from user_roles table
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    isAdmin: roleData?.role === "admin",
    supabase,
  };
}

// ─── ASH Holdings API client ────────────────────────────────
const ASH_API_URL = Deno.env.get("ASH_HOLDINGS_API_URL") || "";
const ASH_API_KEY = Deno.env.get("ASH_HOLDINGS_API_KEY") || "";

async function ashRequest(
  endpoint: string,
  method = "GET",
  body?: unknown
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${ASH_API_URL}${endpoint}`;
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ASH_API_KEY}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error("[BFF] ASH API error:", e);
    return { ok: false, status: 500, data: { error: String(e) } };
  }
}

// ─── Route: Payments ────────────────────────────────────────
async function handlePayments(
  _req: Request,
  path: string,
  ctx: Awaited<ReturnType<typeof authenticate>>,
  _queryParams: URLSearchParams
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = ctx.supabase || createClient(supabaseUrl, supabaseKey);

  if (path === "/deposits" || path === "/" || path === "") {
    let query = supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!ctx.isAdmin && ctx.user) query = query.eq("user_id", ctx.user.id);

    const { data, error: dbErr } = await query;
    if (dbErr) return error(dbErr.message, 500);
    return json(envelope(data));
  }

  if (path === "/methods") {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    return json(envelope(data));
  }

  return error("Payments endpoint not found", 404);
}

// ─── Route: Users ───────────────────────────────────────────
async function handleUsers(
  _req: Request,
  path: string,
  ctx: Awaited<ReturnType<typeof authenticate>>,
  queryParams: URLSearchParams
) {
  if (!ctx.isAdmin) return error("Admin access required", 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = ctx.supabase || createClient(supabaseUrl, supabaseKey);

  if (path === "" || path === "/") {
    const limit = parseInt(queryParams.get("limit") || "50");

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, balance, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    return json(envelope(data));
  }

  if (path.length > 1) {
    const id = path.replace("/", "");
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) return error("User not found", 404);
    return json(envelope(data));
  }

  return error("Users endpoint not found", 404);
}

// ─── Route: Reports ─────────────────────────────────────────
async function handleReports(
  _req: Request,
  path: string,
  ctx: Awaited<ReturnType<typeof authenticate>>,
  _queryParams: URLSearchParams
) {
  if (!ctx.isAdmin) return error("Admin access required", 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = ctx.supabase || createClient(supabaseUrl, supabaseKey);

  if (path === "/overview") {
    const [ordersRes, depositsRes, usersRes] = await Promise.all([
      supabase.from("orders").select("id, status, total_amount, created_at"),
      supabase.from("deposits").select("id, amount, status, created_at"),
      supabase.from("profiles").select("id, created_at"),
    ]);

    const orders = ordersRes.data || [];
    const deposits = depositsRes.data || [];
    const users = usersRes.data || [];

    return json(
      envelope({
        orders: {
          total: orders.length,
          completed: orders.filter((o) => o.status === "مكتمل").length,
          revenue: orders.reduce((s, o) => s + (o.total_amount || 0), 0),
        },
        deposits: {
          total: deposits.length,
          completed: deposits.filter((d) => d.status === "completed").length,
          total_amount: deposits.reduce((s, d) => s + (d.amount || 0), 0),
        },
        users: { total: users.length },
      })
    );
  }

  return error("Reports endpoint not found", 404);
}

// ─── Main router ────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Support both URL path routing AND body-based path (from supabase.functions.invoke)
  let routePath = "";
  let bodyData: Record<string, unknown> | null = null;

  try {
    const cloned = req.clone();
    const text = await cloned.text();
    if (text) {
      bodyData = JSON.parse(text);
      if (bodyData?.path && typeof bodyData.path === "string") {
        routePath = bodyData.path;
      }
    }
  } catch {
    // Not JSON or no body — fall through to URL path
  }

  if (!routePath) {
    const url = new URL(req.url);
    routePath = url.pathname.replace(/^\/bff-gateway/, "");
  }

  // Strip query params from routePath before routing
  const [cleanPath, queryString] = routePath.split("?");
  const queryParams = new URLSearchParams(queryString || "");
  const segments = cleanPath.split("/").filter(Boolean);
  const module = segments[0] || "";
  const subPath = "/" + segments.slice(1).join("/");

  console.log("[BFF Router] routePath:", routePath, "module:", module, "subPath:", subPath);
  const ctx = await authenticate(req);
  if (!ctx.user && module !== "health") {
    return error("Authentication required", 401);
  }

  // Route
  try {
    switch (module) {
      case "health":
        return json(envelope({ status: "ok", version: "1.0.0" }));
      case "payments":
        return await handlePayments(req, subPath, ctx, queryParams);
      case "users":
        return await handleUsers(req, subPath, ctx, queryParams);
      case "reports":
        return await handleReports(req, subPath, ctx, queryParams);
      default:
        return error(`Unknown module: ${module}`, 404);
    }
  } catch (e) {
    console.error("[BFF] Unhandled error:", e);
    return error("Internal server error", 500);
  }
});
