import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { getProvider } from "./providers.ts";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("power"), server_id: z.string().uuid(), type: z.enum(["start", "stop", "restart"]) }),
  z.object({ action: z.literal("snapshot"), server_id: z.string().uuid(), name: z.string().trim().min(2).max(63) }),
]);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;

    const { data: server } = await admin.from("cloud_servers").select("*").eq("id", body.server_id).maybeSingle();
    if (!server || server.user_id !== user.id) return json({ error: "not found" }, 404);
    if (["pending", "suspended", "cancelled"].includes(server.status)) return json({ error: "server_not_ready" }, 409);

    const provider = getProvider(server.provider);
    if (body.action === "power") {
      const r = await provider.power(server.provider_server_id, body.type);
      await admin.from("cloud_server_actions").insert({ server_id: server.id, user_id: user.id, action: body.type, status: r.status, error: r.error ?? null });
      await admin.from("cloud_activity_logs").insert({ user_id: user.id, server_id: server.id, event: `power_${body.type}`, details: { status: r.status } });
      return json({ ok: true, status: r.status });
    }
    const r = await provider.createSnapshot(server.provider_server_id, body.name);
    await admin.from("cloud_snapshots").insert({ server_id: server.id, user_id: user.id, name: body.name, status: "pending" });
    await admin.from("cloud_activity_logs").insert({ user_id: user.id, server_id: server.id, event: "snapshot_requested", details: { name: body.name, status: r.status } });
    return json({ ok: true, status: r.status });
  } catch (e) {
    console.error("cloud-api", e);
    return json({ error: "internal_error" }, 500);
  }
});
