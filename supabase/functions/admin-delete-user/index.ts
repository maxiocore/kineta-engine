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
    // Verify admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with caller's token to verify they're admin
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

    // Check if caller is admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!callerRole || callerRole.role !== "admin") {
      console.log(`[admin-delete-user] Non-admin attempt by ${caller.id}`);
      return new Response(JSON.stringify({ error: "صلاحيات غير كافية" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userIds } = await req.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ error: "لم يتم تحديد مستخدمين" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (userIds.includes(caller.id)) {
      return new Response(JSON.stringify({ error: "لا يمكنك حذف حسابك الخاص" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[admin-delete-user] Admin ${caller.id} deleting ${userIds.length} users`);

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      try {
        // 1. Delete related data first (cascade)
        const relatedTables = [
          { table: "coupon_usages", column: "user_id" },
          { table: "cashback_transactions", column: "user_id" },
          { table: "balance_logs", column: "user_id" },
          { table: "bank_withdrawal_requests", column: "user_id" },
          { table: "deposits", column: "user_id" },
          { table: "ticket_messages", column: "sender_id" },
          { table: "support_tickets", column: "user_id" },
          { table: "api_keys", column: "user_id" },
          { table: "api_usage_logs", column: "api_key_id", subquery: true },
          { table: "notifications", column: "user_id" },
          { table: "user_badges", column: "user_id" },
          { table: "user_challenges", column: "user_id" },
          { table: "user_notification_reads", column: "user_id" },
          { table: "orders", column: "user_id" },
          { table: "user_roles", column: "user_id" },
          { table: "profiles", column: "id" },
        ];

        for (const { table, column, subquery } of relatedTables) {
          try {
            if (subquery && table === "api_usage_logs") {
              // First get api_key ids for this user
              const { data: keys } = await adminClient
                .from("api_keys")
                .select("id")
                .eq("user_id", userId);
              if (keys && keys.length > 0) {
                for (const key of keys) {
                  await adminClient.from("api_usage_logs").delete().eq("api_key_id", key.id);
                }
              }
            } else {
              await adminClient.from(table).delete().eq(column, userId);
            }
          } catch (e) {
            console.log(`[admin-delete-user] Note: could not delete from ${table} for ${userId}: ${e}`);
          }
        }

        // 2. Delete the auth user (the actual important step!)
        const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteAuthError) {
          console.error(`[admin-delete-user] Failed to delete auth user ${userId}:`, deleteAuthError);
          results.push({ userId, success: false, error: deleteAuthError.message });
        } else {
          console.log(`[admin-delete-user] Successfully deleted user ${userId}`);
          results.push({ userId, success: true });
        }
      } catch (userError) {
        console.error(`[admin-delete-user] Error processing user ${userId}:`, userError);
        results.push({ userId, success: false, error: String(userError) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`[admin-delete-user] Complete: ${successCount} deleted, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        deleted: successCount,
        failed: failCount,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[admin-delete-user] Error:", error);
    return new Response(
      JSON.stringify({ error: "خطأ في الخادم", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
