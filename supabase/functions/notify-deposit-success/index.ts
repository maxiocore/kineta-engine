import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { brandedEmailPayload, emailGatewayHeaders } from "../_shared/email-gateway.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSMS as sendSMSHelper, formatPhoneNumber } from "../_shared/sms-helper.ts";
import { sendWhatsAppMessage, getDepositStatusMessage } from "../_shared/whatsapp-helper.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wrapper to maintain compatibility with existing code
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const result = await sendSMSHelper(phone, message, 'deposit');
  return { success: result.success, error: result.error };
}

interface NotifyDepositRequest {
  depositId: string;
}

// Format amount in Arabic style
function formatAmountArabic(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getEmailTemplate(
  customerName: string,
  amount: number,
  bonusAmount: number | null,
  totalCredited: number,
  transactionId: string | null,
  paymentMethod: string,
  depositDate: string,
  newBalance: number,
  receiptNumber: string
): string {
  const formattedDate = new Date(depositDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;

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
          
          <!-- Bank Style Header -->
          <tr>
            <td style="background: linear-gradient(to right, #00805A, #004d36); padding: 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <div style="width: 70px; height: 70px; background: #ffffff; border-radius: 15px; margin: 0 auto 15px; line-height: 70px;">
                      <span style="font-size: 32px; font-weight: 800; color: #00805A;">A</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      ASH HOLDING
                    </h1>
                    <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 12px;">
                      ASH HOLDING Digital Services
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Success Badge -->
          <tr>
            <td style="padding: 25px 30px 15px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); width: 70px; height: 70px; border-radius: 50%; line-height: 70px; box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);">
                <span style="font-size: 35px; color: #fff;">✓</span>
              </div>
              <h2 style="margin: 15px 0 5px; color: #1e293b; font-size: 22px; font-weight: 700;">
                تم إيداع رصيدك بنجاح
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 13px;">
                إيصال المعاملة المالية
              </p>
            </td>
          </tr>
          
          <!-- Receipt Number -->
          <tr>
            <td style="padding: 0 30px 15px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 12px 20px; text-align: center;">
                    <span style="color: #64748b; font-size: 12px;">رقم الإيصال: </span>
                    <span style="color: #00805A; font-size: 14px; font-weight: 700; font-family: monospace;" dir="ltr">${receiptNumber}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Amount Display Card -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(to right, #00805A, #004d36); border-radius: 16px;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <p style="margin: 0 0 8px; color: rgba(255,255,255,0.85); font-size: 13px;">إجمالي المبلغ المضاف للرصيد</p>
                    <p style="margin: 0; color: #ffffff; font-size: 38px; font-weight: 800; direction: ltr;">
                      <span style="font-size: 18px; margin-left: 5px;">ر.س</span>${formatAmountArabic(totalCredited)}
                    </p>
                    ${bonusAmount && bonusAmount > 0 ? `
                    <p style="margin: 12px 0 0; color: #a7f3d0; font-size: 13px; font-weight: 600;">
                      🎁 يشمل مكافأة إيداع: ${formatAmountArabic(bonusAmount)} ر.س
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Transaction Details Section -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #00805A; border-radius: 8px 8px 0 0;">
                <tr>
                  <td style="padding: 12px 20px; color: #fff; font-size: 14px; font-weight: 600;">
                    📋 تفاصيل المعاملة
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                ${transactionId ? `
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">رقم المرجع</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 13px; font-weight: 600; font-family: monospace;" dir="ltr">${transactionId}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">تاريخ العملية</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 13px; font-weight: 500;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">طريقة الدفع</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 13px; font-weight: 500;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">المبلغ المدفوع</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 13px; font-weight: 600;">${formatAmountArabic(amount)} ر.س</td>
                </tr>
                ${bonusAmount && bonusAmount > 0 ? `
                <tr style="background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);">
                  <td style="padding: 14px 20px; border-bottom: 1px solid #bbf7d0; text-align: right; color: #166534; font-size: 13px;">🎁 المكافأة</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #bbf7d0; text-align: left; color: #166534; font-size: 13px; font-weight: 700;">+${formatAmountArabic(bonusAmount)} ر.س</td>
                </tr>
                ` : ''}
                <tr style="background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);">
                  <td style="padding: 16px 20px; text-align: right; color: #1e40af; font-size: 14px; font-weight: 600;">💰 رصيدك الجديد</td>
                  <td style="padding: 16px 20px; text-align: left; color: #1e40af; font-size: 18px; font-weight: 800;">${formatAmountArabic(newBalance)} ر.س</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Digital Signature -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(to right, #f0fdf4, #dcfce7); border-radius: 12px; border: 2px solid #22c55e;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="width: 50px; text-align: center;">
                          <div style="width: 45px; height: 45px; background: #22c55e; border-radius: 50%; line-height: 45px; text-align: center;">
                            <span style="color: #fff; font-size: 20px;">✓</span>
                          </div>
                        </td>
                        <td style="padding-right: 15px; text-align: right;">
                          <p style="margin: 0 0 4px; color: #16a34a; font-size: 14px; font-weight: 600;">تم التحقق والاعتماد رقمياً</p>
                          <p style="margin: 0; color: #64748b; font-size: 11px;">
                            كود التحقق: <span style="background: #fff; padding: 2px 8px; border-radius: 4px; font-family: monospace; direction: ltr;">${signatureCode}</span>
                          </p>
                        </td>
                        <td style="text-align: left; color: #64748b; font-size: 10px; line-height: 1.6;">
                          تاريخ الإصدار<br/>
                          ${new Date().toLocaleDateString('ar-SA')}<br/>
                          ${new Date().toLocaleTimeString('ar-SA')}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 30px 20px;">
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
            <td style="padding: 0 30px 25px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="padding: 5px;">
                    <a href="https://ash-holding.sa/dashboard" style="display: block; width: 100%; padding: 16px 30px; background: linear-gradient(to right, #00805A, #004d36); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; text-align: center; box-sizing: border-box;">
                      🏦 الذهاب للوحة التحكم
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 5px 5px;">
                    <a href="https://ash-holding.sa/dashboard/services" style="display: block; width: 100%; padding: 14px 30px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center; box-sizing: border-box;">
                      🛒 تصفح الخدمات
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(to right, #00805A, #004d36); padding: 25px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #ffffff;">ASH HOLDING</p>
                    <p style="margin: 0 0 10px; font-size: 13px; color: rgba(255,255,255,0.9);">
                      شكراً لثقتك بنا، ${customerName || 'عميلنا العزيز'}
                    </p>
                    <p style="margin: 0 0 12px; font-size: 12px; color: rgba(255,255,255,0.7);">
                      هذا إيصال إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم
                    </p>
                    <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; margin-top: 5px;">
                      <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.6);">
                        © ${new Date().getFullYear()} ASH HOLDING. جميع الحقوق محفوظة.
                      </p>
                      <p style="margin: 5px 0 0; font-size: 10px; color: rgba(255,255,255,0.5);">
                        رقم المرجع: ${receiptNumber} | للاستفسارات: support@ash-holding.sa
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Bottom Bar -->
          <tr>
            <td style="height: 8px; background: linear-gradient(to right, #22c55e, #00805A);"></td>
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
    
    // Fetch user profile with phone
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
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
    const receiptNumber = `DEP-${deposit.id.slice(0, 8).toUpperCase()}`;
    
    // Generate email HTML
    const emailHtml = getEmailTemplate(
      profile.full_name || "",
      deposit.amount,
      deposit.bonus_amount,
      deposit.total_credited,
      deposit.transaction_id,
      paymentMethod,
      deposit.completed_at || new Date().toISOString(),
      balance?.balance || 0,
      receiptNumber
    );
    
    // Send email using Resend API
    const emailResponse = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        ...emailGatewayHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(brandedEmailPayload({
        from: "ASH HOLDING Billing <billing@ash-holding.sa>",
        reply_to: "info@ash-holding.sa",
        to: [profile.email],
        subject: `✅ تم إيداع ${formatAmountArabic(deposit.total_credited)} ر.س في حسابك بنجاح`,
        html: emailHtml,
      })), 
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
      subject: `تم إيداع ${formatAmountArabic(deposit.total_credited)} ر.س في حسابك`,
      content: `تم إيداع مبلغ ${formatAmountArabic(deposit.total_credited)} ر.س في حسابك بنجاح`,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
    
    // Send SMS notification if phone is available - Banking Style
    if (profile.phone) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Riyadh' });
      const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Riyadh' });
      const txnRef = deposit.transaction_id || deposit.id?.substring(0, 8).toUpperCase();
      
      let smsMessage = `✅ تم إيداع مبلغ في حسابكم\n\n💰 المبلغ: +${formatAmountArabic(deposit.total_credited)} ر.س`;
      if (deposit.bonus_amount && deposit.bonus_amount > 0) {
        smsMessage += `\n🎁 مكافأة: +${formatAmountArabic(deposit.bonus_amount)} ر.س`;
      }
      smsMessage += `\n💳 الرصيد المتاح: ${formatAmountArabic(balance?.balance || 0)} ر.س`;
      smsMessage += `\n💳 طريقة الدفع: ${paymentMethod}`;
      smsMessage += `\n📋 المرجع: ${txnRef}`;
      smsMessage += `\n📅 ${dateStr} | ${timeStr}`;
      smsMessage += `\n\n🔒 إذا لم تقم بهذه العملية تواصل معنا فوراً`;
      smsMessage += `\n━━━━━━━━━━━━━━`;
      smsMessage += `\nفريق المالية | ASH HOLDING`;
      smsMessage += `\nash-holding.sa`;
      
      const smsResult = await sendSMS(profile.phone, smsMessage);
      console.log("SMS result:", smsResult);
      
      // Log SMS
      await supabase.from("sms_logs").insert({
        phone: profile.phone,
        message: smsMessage,
        type: 'deposit',
        status: smsResult.success ? 'sent' : 'failed',
        user_id: deposit.user_id,
        reference_id: depositId,
        error_message: smsResult.error || null,
      });

      // Send WhatsApp notification
      const whatsappMessage = getDepositStatusMessage(
        deposit.total_credited,
        'completed',
        deposit.transaction_id
      );
      const whatsappResult = await sendWhatsAppMessage({
        phone: profile.phone,
        message: whatsappMessage,
        type: 'deposit'
      });
      console.log("WhatsApp result:", whatsappResult);
      
      // Log WhatsApp
      await supabase.from("sms_logs").insert({
        phone: profile.phone,
        message: whatsappMessage,
        type: 'whatsapp_deposit',
        status: whatsappResult.success ? 'sent' : 'failed',
        user_id: deposit.user_id,
        reference_id: depositId,
        error_message: whatsappResult.error || null,
      });
    }
    
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
