import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivityLogRequest {
  applicationId: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string;
  triggeredBy: 'customer' | 'system' | 'reviewer' | 'admin';
  actorId?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
  isVisibleToCustomer?: boolean;
}

interface ActivityLogResponse {
  success: boolean;
  id?: string;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: ActivityLogRequest = await req.json();

    // Validate required fields
    if (!body.applicationId || !body.eventType || !body.toStatus || !body.triggeredBy) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: applicationId, eventType, toStatus, triggeredBy"
        } as ActivityLogResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Validate triggeredBy
    const validTriggers = ['customer', 'system', 'reviewer', 'admin'];
    if (!validTriggers.includes(body.triggeredBy)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid triggeredBy value. Must be one of: ${validTriggers.join(', ')}`
        } as ActivityLogResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Insert activity log
    const { data, error } = await supabase
      .from('financing_activity_log')
      .insert({
        application_id: body.applicationId,
        event_type: body.eventType,
        from_status: body.fromStatus,
        to_status: body.toStatus,
        triggered_by: body.triggeredBy,
        actor_id: body.actorId || null,
        reason: body.reason,
        metadata: body.metadata || {},
        is_visible_to_customer: body.isVisibleToCustomer ?? true
      })
      .select('id')
      .single();

    if (error) {
      console.error("Failed to insert activity log:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message
        } as ActivityLogResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Activity logged in ${duration}ms:`, {
      id: data.id,
      applicationId: body.applicationId,
      eventType: body.eventType,
      toStatus: body.toStatus
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id
      } as ActivityLogResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error) {
    console.error("Error in financing-activity-log:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      } as ActivityLogResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);
