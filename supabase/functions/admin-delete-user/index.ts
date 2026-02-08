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
        console.log(`[admin-delete-user] Processing user ${userId}`);

        // ============================================================
        // STEP 1: SET NULL on reference/admin columns (non-ownership FKs)
        // These are columns where the user is referenced as an actor/admin
        // but doesn't own the row. We preserve the data but remove the FK.
        // ============================================================
        const nullifyRefs = [
          { table: "audit_logs", column: "user_id" },
          { table: "coupons", column: "created_by" },
          { table: "email_campaigns", column: "created_by" },
          { table: "email_templates", column: "created_by" },
          { table: "emails", column: "sent_by" },
          { table: "executive_bond_events", column: "actor_id" },
          { table: "financing_acknowledgments", column: "sent_by" },
          { table: "financing_applications", column: "cancelled_by" },
          { table: "financing_applications", column: "reviewed_by" },
          { table: "financing_contract_documents", column: "finalized_by" },
          { table: "financing_contract_documents", column: "sent_by" },
          { table: "financing_executive_bonds", column: "sent_to_client_by" },
          { table: "financing_executive_bonds", column: "verified_by_admin_id" },
          { table: "financing_executive_bonds", column: "issued_by" },
          { table: "financing_executive_bonds", column: "sent_by" },
          { table: "financing_offer_setup", column: "setup_by" },
          { table: "financing_workflow_audit", column: "actor_id" },
          { table: "financing_admin_audit", column: "admin_id" },
          { table: "financing_activity_log", column: "actor_id" },
          { table: "system_settings", column: "updated_by" },
          { table: "contact_messages", column: "replied_by" },
          { table: "app_notifications", column: "created_by" },
          { table: "admin_notifications", column: "related_user_id" },
        ];

        for (const { table, column } of nullifyRefs) {
          try {
            await adminClient.from(table).update({ [column]: null }).eq(column, userId);
          } catch (e) {
            console.log(`[admin-delete-user] Note: nullify ${table}.${column} for ${userId}: ${e}`);
          }
        }

        // ============================================================
        // STEP 2: DELETE owned data (child tables first, then parents)
        // Order matters due to FK constraints between these tables
        // ============================================================

        // 2a. Delete api_usage_logs (child of api_keys)
        try {
          const { data: keys } = await adminClient
            .from("api_keys")
            .select("id")
            .eq("user_id", userId);
          if (keys && keys.length > 0) {
            const keyIds = keys.map(k => k.id);
            for (const keyId of keyIds) {
              await adminClient.from("api_usage_logs").delete().eq("api_key_id", keyId);
            }
          }
        } catch (e) {
          console.log(`[admin-delete-user] Note: api_usage_logs cleanup: ${e}`);
        }

        // 2b. Delete ticket_messages before support_tickets
        // 2c. Delete coupon_usages (child of orders + coupons)
        // 2d. Delete order-related children
        try {
          const { data: orders } = await adminClient
            .from("orders")
            .select("id")
            .eq("user_id", userId);
          if (orders && orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            for (const orderId of orderIds) {
              await adminClient.from("coupon_usages").delete().eq("order_id", orderId);
            }
          }
        } catch (e) {
          console.log(`[admin-delete-user] Note: order children cleanup: ${e}`);
        }

        // 2e. Delete financing children (contract_signing_otps, eligibility_audit_logs, etc.)
        try {
          const { data: apps } = await adminClient
            .from("financing_applications")
            .select("id")
            .eq("user_id", userId);
          if (apps && apps.length > 0) {
            for (const app of apps) {
              // Delete children of financing_applications
              await adminClient.from("contract_signing_otps").delete().eq("application_id", app.id);
              await adminClient.from("eligibility_audit_logs").delete().eq("application_id", app.id);
              await adminClient.from("financing_activity_log").delete().eq("application_id", app.id);
              await adminClient.from("financing_admin_audit").delete().eq("application_id", app.id);
              await adminClient.from("financing_acknowledgments").delete().eq("application_id", app.id);
              
              // Delete contract events (child of contracts)
              const { data: contracts } = await adminClient
                .from("financing_contracts")
                .select("id")
                .eq("application_id", app.id);
              if (contracts && contracts.length > 0) {
                for (const contract of contracts) {
                  await adminClient.from("financing_contract_events").delete().eq("contract_id", contract.id);
                }
                await adminClient.from("financing_contracts").delete().eq("application_id", app.id);
              }

              // Delete contract documents
              await adminClient.from("financing_contract_documents").delete().eq("application_id", app.id);
              
              // Delete executive bond events (child of bonds)
              await adminClient.from("executive_bond_events").delete().eq("application_id", app.id);
              
              // Delete deposit ledger
              const { data: appData } = await adminClient
                .from("financing_applications")
                .select("deposit_ledger_id, executive_bond_id")
                .eq("id", app.id)
                .single();

              // Nullify FKs on the application before deleting related records
              await adminClient
                .from("financing_applications")
                .update({ deposit_ledger_id: null, executive_bond_id: null })
                .eq("id", app.id);

              if (appData?.deposit_ledger_id) {
                await adminClient.from("financing_deposit_ledger").delete().eq("id", appData.deposit_ledger_id);
              }
              if (appData?.executive_bond_id) {
                await adminClient.from("financing_executive_bonds").delete().eq("id", appData.executive_bond_id);
              }
            }
            // Now delete the applications themselves
            await adminClient.from("financing_applications").delete().eq("user_id", userId);
          }
        } catch (e) {
          console.log(`[admin-delete-user] Note: financing cleanup: ${e}`);
        }

        // 2f. Delete dev_orders children then dev_orders
        try {
          const { data: devOrders } = await adminClient
            .from("dev_orders")
            .select("id")
            .eq("user_id", userId);
          if (devOrders && devOrders.length > 0) {
            for (const devOrder of devOrders) {
              await adminClient.from("dev_order_events").delete().eq("order_id", devOrder.id);
              await adminClient.from("dev_order_files").delete().eq("order_id", devOrder.id);
              await adminClient.from("dev_order_invoices").delete().eq("order_id", devOrder.id);
            }
            await adminClient.from("dev_orders").delete().eq("user_id", userId);
          }
        } catch (e) {
          console.log(`[admin-delete-user] Note: dev_orders cleanup: ${e}`);
        }

        // 2g. Delete remaining owned tables (order matters: children first)
        const deleteOwned = [
          { table: "coupon_usages", column: "user_id" },
          { table: "cashback_transactions", column: "user_id" },
          { table: "balance_logs", column: "user_id" },
          { table: "bank_withdrawal_requests", column: "user_id" },
          { table: "deposits", column: "user_id" },
          { table: "ticket_messages", column: "sender_id" },
          { table: "support_tickets", column: "user_id" },
          { table: "api_keys", column: "user_id" },
          { table: "notifications", column: "user_id" },
          { table: "user_badges", column: "user_id" },
          { table: "user_challenges", column: "user_id" },
          { table: "user_notification_reads", column: "user_id" },
          { table: "refill_requests", column: "user_id" },
          { table: "user_balances", column: "user_id" },
          { table: "email_verifications", column: "user_id" },
          { table: "device_fingerprints", column: "user_id" },
          { table: "favorite_import_categories", column: "user_id" },
          { table: "orders", column: "user_id" },
          { table: "user_roles", column: "user_id" },
          { table: "profiles", column: "id" },
        ];

        for (const { table, column } of deleteOwned) {
          try {
            await adminClient.from(table).delete().eq(column, userId);
          } catch (e) {
            console.log(`[admin-delete-user] Note: delete ${table} for ${userId}: ${e}`);
          }
        }

        // ============================================================
        // STEP 3: Delete the auth user
        // ============================================================
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
