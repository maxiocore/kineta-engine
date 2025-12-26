import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyDepositRequest {
  depositId: string;
}

function getEmailTemplate(
  customerName: string,
  amount: number,
  bonusAmount: number | null,
  totalCredited: number,
  transactionId: string | null,
  paymentMethod: string,
  depositDate: string,
  newBalance: number
): string {
  const formattedDate = new Date(depositDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>تأكيد عملية الإيداع</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f0f4f8; direction: rtl; text-align: right;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Bank Style -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%); padding: 35px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <!-- Success Icon -->
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; margin: 0 auto 20px; line-height: 80px; box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);">
                      <span style="font-size: 40px;">✓</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">
                      تم إيداع رصيدك بنجاح
                    </h1>
                    <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                      إيصال المعاملة المالية
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Amount Display Card -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border: 2px solid #e2e8f0;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">المبلغ المضاف للرصيد</p>
                    <p style="margin: 0; color: #166534; font-size: 42px; font-weight: 800; letter-spacing: -1px;">
                      $${totalCredited.toFixed(2)}
                    </p>
                    ${bonusAmount && bonusAmount > 0 ? `
                    <p style="margin: 12px 0 0; color: #22c55e; font-size: 14px; font-weight: 600;">
                      🎁 يشمل مكافأة إيداع: $${bonusAmount.toFixed(2)}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Transaction Details -->
          <tr>
            <td style="padding: 0 30px 25px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="padding-bottom: 15px;">
                    <h3 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; text-align: right;">
                      📋 تفاصيل المعاملة
                    </h3>
                  </td>
                </tr>
              </table>
              
              <!-- Details Grid -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; border-right: 4px solid #3b82f6; overflow: hidden;">
                ${transactionId ? `
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">رقم المعاملة</td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px; font-weight: 600; font-family: monospace;" dir="ltr">${transactionId}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">تاريخ المعاملة</td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px; font-weight: 500;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">طريقة الدفع</td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px; font-weight: 500;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">المبلغ المدفوع</td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px; font-weight: 600;">$${amount.toFixed(2)}</td>
                </tr>
                ${bonusAmount && bonusAmount > 0 ? `
                <tr style="background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);">
                  <td style="padding: 15px 20px; border-bottom: 1px solid #bbf7d0; text-align: right; color: #166534; font-size: 13px;">🎁 المكافأة</td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #bbf7d0; text-align: left; color: #166534; font-size: 14px; font-weight: 700;">+$${bonusAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);">
                  <td style="padding: 18px 20px; text-align: right; color: #1e40af; font-size: 14px; font-weight: 600;">💰 رصيدك الجديد</td>
                  <td style="padding: 18px 20px; text-align: left; color: #1e40af; font-size: 20px; font-weight: 800;">$${newBalance.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 30px 25px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #fef3c7; border-radius: 12px; border-right: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 16px 20px; text-align: right; direction: rtl;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.7;">
                      🔒 <strong>ملاحظة أمنية:</strong> هذا إيصال رسمي لعملية الإيداع. إذا لم تقم بهذه العملية، يرجى التواصل معنا فوراً.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Buttons -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="padding: 5px;">
                    <a href="https://maxiocore.com/dashboard" style="display: block; width: 100%; padding: 16px 30px; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; text-align: center; box-sizing: border-box;">
                      🏦 الذهاب للوحة التحكم
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 5px 5px;">
                    <a href="https://maxiocore.com/dashboard/services" style="display: block; width: 100%; padding: 14px 30px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center; box-sizing: border-box;">
                      🛒 تصفح الخدمات
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 25px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 10px; font-size: 14px; color: rgba(255,255,255,0.9);">
                      شكراً لثقتك بنا، ${customerName || 'عميلنا العزيز'}
                    </p>
                    <p style="margin: 0 0 15px; font-size: 13px; color: rgba(255,255,255,0.7);">
                      للاستفسارات والدعم الفني، لا تتردد في التواصل معنا
                    </p>
                    <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; margin-top: 5px;">
                      <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5);">
                        © ${new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req: Request): Promise<Response> => {
  console.log("notify-deposit-success function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { depositId }: NotifyDepositRequest = await req.json();
    
    console.log(`Processing deposit notification for: ${depositId}`);
    
    if (!depositId) {
      return new Response(
        JSON.stringify({ error: "Missing depositId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch deposit details with payment method
    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .select(`
        id,
        amount,
        bonus_amount,
        total_credited,
        transaction_id,
        completed_at,
        user_id,
        payment_methods (name_ar)
      `)
      .eq("id", depositId)
      .single();
    
    if (depositError || !deposit) {
      console.error("Error fetching deposit:", depositError);
      return new Response(
        JSON.stringify({ error: "Deposit not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", deposit.user_id)
      .single();
    
    if (profileError || !profile?.email) {
      console.error("Error fetching profile or no email:", profileError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch current user balance
    const { data: balance } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", deposit.user_id)
      .single();
    
    const paymentMethod = (deposit.payment_methods as any)?.name_ar || "غير محدد";
    
    // Generate email HTML
    const emailHtml = getEmailTemplate(
      profile.full_name || "",
      deposit.amount,
      deposit.bonus_amount,
      deposit.total_credited,
      deposit.transaction_id,
      paymentMethod,
      deposit.completed_at || new Date().toISOString(),
      balance?.balance || 0
    );
    
    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MaxioCore <noreply@maxiocore.com>",
        to: [profile.email],
        subject: `✅ تم إيداع $${deposit.total_credited.toFixed(2)} في حسابك بنجاح`,
        html: emailHtml,
      }),
    });
    
    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Error sending email:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Email sent successfully:", emailResult);
    
    // Log the email in the emails table
    await supabase.from("emails").insert({
      recipient_email: profile.email,
      recipient_name: profile.full_name,
      subject: `تم إيداع $${deposit.total_credited.toFixed(2)} في حسابك`,
      content: `تم إيداع مبلغ $${deposit.total_credited.toFixed(2)} في حسابك بنجاح`,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
    
    return new Response(
      JSON.stringify({ success: true, message: "Deposit notification sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error("Error in notify-deposit-success:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
