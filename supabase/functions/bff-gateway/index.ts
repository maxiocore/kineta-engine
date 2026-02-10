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

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    user,
    isAdmin: profile?.role === "admin",
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

// ─── Route: Finance ─────────────────────────────────────────
async function handleFinance(
  req: Request,
  path: string,
  ctx: Awaited<ReturnType<typeof authenticate>>
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = ctx.supabase || createClient(supabaseUrl, supabaseKey);

  // GET /finance/applications - list applications
  if (req.method === "GET" && (path === "/applications" || path === "")) {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("financing_applications")
      .select("id, application_number, full_name, phone, email, status, requested_amount, approved_amount, service_description, created_at, updated_at, workflow_status, current_phase")
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (!ctx.isAdmin && ctx.user) query = query.eq("user_id", ctx.user.id);

    const { data, error: dbErr, count } = await query;
    if (dbErr) return error(dbErr.message, 500);

    return json(envelope(data, { total: count, limit, offset }));
  }

  // GET /finance/applications/:id
  if (req.method === "GET" && path.startsWith("/applications/")) {
    const id = path.replace("/applications/", "");
    let query = supabase
      .from("financing_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (!ctx.isAdmin && ctx.user) query = query.eq("user_id", ctx.user.id);

    const { data, error: dbErr } = await query;
    if (dbErr) return error("Application not found", 404);

    return json(envelope(data));
  }

  // POST /finance/sync/:id - sync single application with ASH
  if (req.method === "POST" && path.startsWith("/sync/")) {
    if (!ctx.isAdmin) return error("Admin access required", 403);
    const appId = path.replace("/sync/", "");

    const { data: app } = await supabase
      .from("financing_applications")
      .select("application_number")
      .eq("id", appId)
      .single();

    if (!app) return error("Application not found", 404);

    const result = await ashRequest(`/api/finance/status/${app.application_number}`);
    if (!result.ok) return error("Failed to sync with ASH Holdings", 502);

    const ashData = result.data as Record<string, unknown>;

    // Update local record
    await supabase
      .from("financing_applications")
      .update({
        status: ashData.status || undefined,
        workflow_status: ashData.workflow_status || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appId);

    // Log to activity
    await supabase.from("financing_activity_log").insert({
      application_id: appId,
      event_type: "bff_sync",
      from_status: "",
      to_status: String(ashData.status || "unknown"),
      triggered_by: "bff_gateway",
      actor_id: ctx.user?.id,
    });

    return json(envelope({ synced: true, ash_status: ashData.status }));
  }

  // GET /finance/stats - dashboard stats
  if (req.method === "GET" && path === "/stats") {
    if (!ctx.isAdmin) return error("Admin access required", 403);

    const { data: apps } = await supabase
      .from("financing_applications")
      .select("status, requested_amount, approved_amount");

    const stats = {
      total: apps?.length || 0,
      pending: apps?.filter((a) => ["pending", "PENDING"].includes(a.status)).length || 0,
      approved: apps?.filter((a) => ["approved", "APPROVED", "CREDIT_DEPOSITED", "CONTRACT_FINALIZED"].includes(a.status)).length || 0,
      rejected: apps?.filter((a) => ["rejected", "REJECTED", "DECLINED"].includes(a.status)).length || 0,
      total_requested: apps?.reduce((s, a) => s + (a.requested_amount || 0), 0) || 0,
      total_approved: apps?.reduce((s, a) => s + (a.approved_amount || 0), 0) || 0,
    };

    return json(envelope(stats));
  }

  return error("Finance endpoint not found", 404);
}

// ─── Route: Payments ────────────────────────────────────────
async function handlePayments(
  req: Request,
  path: string,
  ctx: Awaited<ReturnType<typeof authenticate>>
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = ctx.supabase || createClient(supabaseUrl, supabaseKey);

  // GET /payments/deposits
  if (req.method === "GET" && (path === "/deposits" || path === "")) {
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

  // GET /payments/methods
  if (req.method === "GET" && path === "/methods") {
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
  req: Request,
  path: string,
  ctx: Awaited<ReturnType<typeof authenticate>>
) {
  if (!ctx.isAdmin) return error("Admin access required", 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = ctx.supabase || createClient(supabaseUrl, supabaseKey);

  // GET /users - list
  if (req.method === "GET" && (path === "" || path === "/")) {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, balance, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    return json(envelope(data));
  }

  // GET /users/:id
  if (req.method === "GET" && path.length > 1) {
    const id = path.replace("/", "");
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) return error("User not found", 404);
    return json(envelope(data));
  }

  return error("Users endpoint not found", 404);
}

// ─── Route: Reports ─────────────────────────────────────────
async function handleReports(
  req: Request,
  path: string,
  ctx: Awaited<ReturnType<typeof authenticate>>
) {
  if (!ctx.isAdmin) return error("Admin access required", 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = ctx.supabase || createClient(supabaseUrl, supabaseKey);

  // GET /reports/overview
  if (req.method === "GET" && path === "/overview") {
    const [ordersRes, depositsRes, usersRes, financeRes] = await Promise.all([
      supabase.from("orders").select("id, status, total_amount, created_at"),
      supabase.from("deposits").select("id, amount, status, created_at"),
      supabase.from("profiles").select("id, created_at"),
      supabase.from("financing_applications").select("id, status, requested_amount, approved_amount"),
    ]);

    const orders = ordersRes.data || [];
    const deposits = depositsRes.data || [];
    const users = usersRes.data || [];
    const finance = financeRes.data || [];

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
        finance: {
          total: finance.length,
          approved: finance.filter((f) => ["approved", "APPROVED", "CREDIT_DEPOSITED"].includes(f.status)).length,
          total_requested: finance.reduce((s, f) => s + (f.requested_amount || 0), 0),
        },
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

  // Extract module and sub-path: /finance/applications/123 → module=finance, subPath=/applications/123
  const segments = routePath.split("/").filter(Boolean);
  const module = segments[0] || "";
  const subPath = "/" + segments.slice(1).join("/");

  // Authenticate
  const ctx = await authenticate(req);
  if (!ctx.user && module !== "health") {
    return error("Authentication required", 401);
  }

  // Route
  try {
    switch (module) {
      case "health":
        return json(envelope({ status: "ok", version: "1.0.0" }));
      case "finance":
        return await handleFinance(req, subPath, ctx);
      case "payments":
        return await handlePayments(req, subPath, ctx);
      case "users":
        return await handleUsers(req, subPath, ctx);
      case "reports":
        return await handleReports(req, subPath, ctx);
      default:
        return error(`Unknown module: ${module}`, 404);
    }
  } catch (e) {
    console.error("[BFF] Unhandled error:", e);
    return error("Internal server error", 500);
  }
});
