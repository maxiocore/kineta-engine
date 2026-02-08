import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSMS, formatPhoneNumber } from "../_shared/sms-helper.ts";
import { sendWhatsAppMessage, getBalanceChangeMessage } from "../_shared/whatsapp-helper.ts";

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

// Generate unique transaction reference
const generateTransactionRef = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${random}`;
};

// Format date in Arabic
const formatArabicDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh'
  };
  return date.toLocaleDateString('ar-SA', options);
};

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

    // Get user profile with phone
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, phone")
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
    const transactionRef = generateTransactionRef();
    const transactionDate = new Date();
    const formattedDate = formatArabicDate(transactionDate);

    const emailHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade { animation: fadeIn 0.6s ease-out; }
        .animate-pulse { animation: pulse 2s infinite; }
        .animate-slide { animation: slideIn 0.5s ease-out; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%); direction: rtl; min-height: 100vh;">
      
      <!-- Main Container -->
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="650" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);">
              
              <!-- Bank Header with Logo -->
              <tr>
                <td style="background: ${isAdd ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)'}; padding: 0;">
                  
                  <!-- Top Bar -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 16px 32px; border-bottom: 1px solid rgba(255,255,255,0.2);">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color: rgba(255,255,255,0.9); font-size: 12px;">
                              رقم المرجع: <strong style="color: #fff;">${transactionRef}</strong>
                            </td>
                            <td align="left" style="color: rgba(255,255,255,0.9); font-size: 12px;">
                              ${formattedDate}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Logo Section -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 32px 32px 24px 32px;">
                        <!-- Bank Logo Circle -->
                        <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-block; line-height: 80px; text-align: center; backdrop-filter: blur(10px); border: 3px solid rgba(255,255,255,0.3);">
                          <span style="font-size: 36px;">${isAdd ? '💰' : '📤'}</span>
                        </div>
                        <h1 style="color: #ffffff; margin: 20px 0 0 0; font-size: 28px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          ASH HOLDING
                        </h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px; letter-spacing: 3px; font-weight: 300;">
                          ASH HOLDING FINANCIAL
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Transaction Type Banner -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: rgba(0,0,0,0.15); padding: 16px 32px; backdrop-filter: blur(10px);">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <span style="display: inline-block; background: rgba(255,255,255,0.25); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                                ${isAdd ? '✓ إشعار إيداع' : '⚡ إشعار سحب'}
                              </span>
                            </td>
                            <td align="left">
                              <span style="color: rgba(255,255,255,0.9); font-size: 13px;">
                                المملكة العربية السعودية
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 0;">
                  
                  <!-- Greeting Section -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 40px 40px 24px 40px; background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);">
                        <p style="color: #64748b; font-size: 15px; margin: 0 0 8px 0;">مرحباً بك،</p>
                        <h2 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 700;">
                          ${profile.full_name || 'عزيزي العميل'} 👋
                        </h2>
                      </td>
                    </tr>
                  </table>

                  <!-- Transaction Amount Card -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 0 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: ${isAdd ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fca5a5 100%)'}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px -10px ${isAdd ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                          
                          <!-- Amount Section -->
                          <tr>
                            <td style="padding: 32px; text-align: center;">
                              <p style="color: ${isAdd ? '#059669' : '#dc2626'}; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                                ${isAdd ? '💵 مبلغ الإيداع' : '💸 مبلغ السحب'}
                              </p>
                              <div style="display: inline-block; position: relative;">
                                <span style="font-size: 56px; font-weight: 800; color: ${isAdd ? '#059669' : '#dc2626'}; line-height: 1; text-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                  ${isAdd ? '+' : '-'}${amount.toLocaleString('ar-SA')}
                                </span>
                                <span style="font-size: 24px; color: ${isAdd ? '#10b981' : '#ef4444'}; margin-right: 8px; font-weight: 600;">
                                  ر.س
                                </span>
                              </div>
                            </td>
                          </tr>
                          
                          <!-- Status Badge -->
                          <tr>
                            <td align="center" style="padding: 0 32px 24px 32px;">
                              <span style="display: inline-block; background: ${isAdd ? '#059669' : '#dc2626'}; color: #ffffff; padding: 10px 24px; border-radius: 30px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 15px ${isAdd ? 'rgba(5, 150, 105, 0.4)' : 'rgba(220, 38, 38, 0.4)'};">
                                ${isAdd ? '✓ تمت العملية بنجاح' : '✓ تم الخصم بنجاح'}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Transaction Details -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 32px 40px;">
                        <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center;">
                          <span style="display: inline-block; width: 4px; height: 24px; background: linear-gradient(180deg, #6366f1, #8b5cf6); border-radius: 2px; margin-left: 12px;"></span>
                          تفاصيل المعاملة
                        </h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 16px; overflow: hidden;">
                          <!-- Row 1 -->
                          <tr>
                            <td style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px;">
                                    <span style="margin-left: 8px;">📋</span> نوع المعاملة
                                  </td>
                                  <td align="left" style="color: #1e293b; font-size: 14px; font-weight: 600;">
                                    ${isAdd ? 'إيداع في الحساب' : 'سحب من الحساب'}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!-- Row 2 -->
                          <tr>
                            <td style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px;">
                                    <span style="margin-left: 8px;">🔢</span> رقم المرجع
                                  </td>
                                  <td align="left" style="color: #1e293b; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">
                                    ${transactionRef}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!-- Row 3 -->
                          <tr>
                            <td style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px;">
                                    <span style="margin-left: 8px;">📅</span> تاريخ العملية
                                  </td>
                                  <td align="left" style="color: #1e293b; font-size: 14px; font-weight: 600;">
                                    ${formattedDate}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!-- Row 4 -->
                          <tr>
                            <td style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px;">
                                    <span style="margin-left: 8px;">💳</span> طريقة العملية
                                  </td>
                                  <td align="left" style="color: #1e293b; font-size: 14px; font-weight: 600;">
                                    ${isAdd ? 'تحويل إداري' : 'خصم إداري'}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!-- Row 5 - Reason if exists -->
                          ${reason ? `
                          <tr>
                            <td style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px;">
                                    <span style="margin-left: 8px;">📝</span> سبب العملية
                                  </td>
                                  <td align="left" style="color: #1e293b; font-size: 14px; font-weight: 600;">
                                    ${reason}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          ` : ''}
                          <!-- Row 6 - Status -->
                          <tr>
                            <td style="padding: 18px 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px;">
                                    <span style="margin-left: 8px;">✅</span> حالة العملية
                                  </td>
                                  <td align="left">
                                    <span style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                      مكتملة
                                    </span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Balance Summary Card -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 0 40px 32px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(30, 41, 59, 0.5);">
                          <tr>
                            <td style="padding: 32px; text-align: center;">
                              <p style="color: rgba(255,255,255,0.7); margin: 0 0 8px 0; font-size: 14px; font-weight: 500; letter-spacing: 1px;">
                                💼 رصيدك الحالي
                              </p>
                              <p style="color: #ffffff; margin: 0 0 16px 0; font-size: 44px; font-weight: 800; text-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                                ${newBalance.toLocaleString('ar-SA')} <span style="font-size: 24px; font-weight: 500;">ر.س</span>
                              </p>
                              <div style="display: inline-block; background: rgba(255,255,255,0.1); padding: 8px 20px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.2);">
                                <span style="color: rgba(255,255,255,0.9); font-size: 13px;">
                                  🔒 حساب محمي ومؤمن
                                </span>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 0 40px 40px 40px;">
                        <a href="https://ashholding.com/dashboard/financial" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 30px -5px rgba(99, 102, 241, 0.5); transition: all 0.3s ease;">
                          📊 عرض تفاصيل حسابي
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 0 40px 32px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border-right: 4px solid #f59e0b;">
                          <tr>
                            <td style="padding: 16px 20px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td width="40" valign="top">
                                    <span style="font-size: 24px;">🔐</span>
                                  </td>
                                  <td>
                                    <p style="color: #92400e; margin: 0 0 4px 0; font-size: 14px; font-weight: 700;">
                                      تنبيه أمني هام
                                    </p>
                                    <p style="color: #a16207; margin: 0; font-size: 13px; line-height: 1.6;">
                                      إذا لم تقم بهذه العملية، يرجى التواصل معنا فوراً عبر الدعم الفني لحماية حسابك.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%); padding: 32px 40px;">
                  <!-- Contact Info -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <p style="color: #64748b; margin: 0 0 16px 0; font-size: 14px; font-weight: 600;">
                          تواصل معنا
                        </p>
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 0 12px;">
                              <a href="mailto:support@ash-holding.sa" style="display: inline-block; background: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none; color: #475569; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                📧 support@ash-holding.sa
                              </a>
                            </td>
                            <td style="padding: 0 12px;">
                              <a href="https://ashholding.com" style="display: inline-block; background: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none; color: #475569; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                🌐 ashholding.com
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="border-top: 1px solid #cbd5e1; padding-top: 24px;">
                        <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 12px; text-align: center;">
                          هذا البريد الإلكتروني تم إرساله تلقائياً - لا تقم بالرد عليه مباشرة
                        </p>
                        <p style="color: #94a3b8; margin: 0; font-size: 12px; text-align: center;">
                          © ${new Date().getFullYear()} ASH HOLDING. جميع الحقوق محفوظة
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>

            <!-- Bottom Branding -->
            <table width="650" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
              <tr>
                <td align="center">
                  <p style="color: #94a3b8; margin: 0; font-size: 11px;">
                    🏦 خدمات مالية موثوقة من ASH HOLDING
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
        from: "ASH HOLDING <noreply@ash-holding.sa>",
        to: [profile.email],
        subject: isAdd 
          ? `🏦 إيصال إيداع | تم إضافة ${amount.toLocaleString('ar-SA')} ر.س لحسابك` 
          : `🏦 إيصال سحب | تم خصم ${amount.toLocaleString('ar-SA')} ر.س من حسابك`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Balance change email sent successfully:", emailData);

    // Send SMS notification if phone is available
    if (profile.phone) {
      const smsMessage = isAdd 
        ? `ASH HOLDING: تم إضافة ${amount.toLocaleString('ar-SA')} ر.س لحسابك. رصيدك الجديد: ${newBalance.toLocaleString('ar-SA')} ر.س`
        : `ASH HOLDING: تم خصم ${amount.toLocaleString('ar-SA')} ر.س من حسابك. رصيدك الجديد: ${newBalance.toLocaleString('ar-SA')} ر.س`;
      
      const smsResult = await sendSMS(profile.phone, smsMessage, 'balance', userId, transactionRef);
      console.log("SMS result:", smsResult);

      // Send WhatsApp notification
      const whatsappMessage = getBalanceChangeMessage(
        amount,
        isAdd ? 'credit' : 'debit',
        reason,
        newBalance
      );
      const whatsappResult = await sendWhatsAppMessage({
        phone: profile.phone,
        message: whatsappMessage,
        type: 'balance'
      });
      console.log("WhatsApp balance result:", whatsappResult);
      
      // Log WhatsApp
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from("sms_logs").insert({
        phone: profile.phone,
        message: whatsappMessage,
        type: 'whatsapp_balance',
        status: whatsappResult.success ? 'sent' : 'failed',
        user_id: userId,
        reference_id: transactionRef,
        error_message: whatsappResult.error || null,
      });
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id, transactionRef }),
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
