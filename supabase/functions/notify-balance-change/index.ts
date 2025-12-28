import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BalanceChangeRequest {
  userId: string;
  action: "add" | "deduct";
  amount: number;
  newBalance: number;
  reason?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, action, amount, newBalance, reason }: BalanceChangeRequest = await req.json();

    console.log(`Processing balance change notification for user: ${userId}`);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdd = action === "add";
    const actionText = isAdd ? "إضافة رصيد" : "خصم رصيد";
    const actionColor = isAdd ? "#10b981" : "#f97316";
    const actionIcon = isAdd ? "+" : "-";

    const emailHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f8fafc; direction: rtl;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ماكسيو كور</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">MAXIOCORE</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; margin: 0 0 24px 0; font-size: 22px; text-align: center;">
                    ${isAdd ? '🎉 تم إضافة رصيد لحسابك!' : '⚠️ تم خصم رصيد من حسابك'}
                  </h2>
                  
                  <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    مرحباً ${profile.full_name || 'عزيزي العميل'}،
                  </p>

                  <!-- Amount Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                    <tr>
                      <td style="background: ${isAdd ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'}; border-radius: 12px; padding: 24px; text-align: center; border: 2px solid ${actionColor}20;">
                        <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">${actionText}</p>
                        <p style="color: ${actionColor}; margin: 0; font-size: 36px; font-weight: bold;">
                          ${actionIcon}${amount.toLocaleString('ar-SA')} ر.س
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Balance Info -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin: 24px 0;">
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">رصيدك الحالي</p>
                        <p style="color: #1e293b; margin: 0; font-size: 28px; font-weight: bold;">
                          ${newBalance.toLocaleString('ar-SA')} ر.س
                        </p>
                      </td>
                    </tr>
                  </table>

                  ${reason ? `
                  <!-- Reason -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                    <tr>
                      <td style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; border-right: 4px solid ${actionColor};">
                        <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px;">السبب:</p>
                        <p style="color: #1e293b; margin: 0; font-size: 14px;">${reason}</p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="https://maxiocore.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          عرض حسابي
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 12px;">
                    هذا البريد الإلكتروني تم إرساله تلقائياً من نظام ماكسيو كور
                  </p>
                  <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                    © ${new Date().getFullYear()} MAXIOCORE. جميع الحقوق محفوظة
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MAXIOCORE <noreply@maxiocore.com>",
        to: [profile.email],
        subject: isAdd ? `✅ تم إضافة ${amount} ر.س لرصيدك` : `⚠️ تم خصم ${amount} ر.س من رصيدك`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Balance change email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in notify-balance-change:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});