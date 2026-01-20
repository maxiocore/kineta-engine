import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  sendWhatsAppMessage, 
  getInstallmentPaymentMessage,
  type InstallmentPaymentDetails 
} from "../_shared/whatsapp-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InstallmentPaymentRequest {
  installmentId: string;
  applicationId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: InstallmentPaymentRequest = await req.json();
    console.log("📧 Processing installment payment notification:", request);

    // 1. Get installment details
    const { data: installment, error: installmentError } = await supabase
      .from("financing_installments")
      .select("*")
      .eq("id", request.installmentId)
      .single();

    if (installmentError || !installment) {
      console.error("Failed to fetch installment:", installmentError);
      return new Response(
        JSON.stringify({ success: false, error: "Installment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get application details
    const { data: application, error: appError } = await supabase
      .from("financing_applications")
      .select("*")
      .eq("id", request.applicationId)
      .single();

    if (appError || !application) {
      console.error("Failed to fetch application:", appError);
      return new Response(
        JSON.stringify({ success: false, error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Get all installments to calculate totals
    const { data: allInstallments, error: allInstError } = await supabase
      .from("financing_installments")
      .select("*")
      .eq("application_id", request.applicationId)
      .order("installment_number", { ascending: true });

    if (allInstError || !allInstallments) {
      console.error("Failed to fetch all installments:", allInstError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch installments" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Calculate payment summary
    const paidInstallments = allInstallments.filter(i => i.status === "paid");
    const remainingInstallments = allInstallments.filter(i => i.status !== "paid");
    const remainingAmount = remainingInstallments.reduce((sum, i) => sum + Number(i.amount), 0);
    const nextInstallment = remainingInstallments.find(i => i.id !== request.installmentId);
    const isLastInstallment = remainingInstallments.length === 0 || 
      (remainingInstallments.length === 1 && remainingInstallments[0].id === request.installmentId);

    // Get phone number from application
    const phone = application.phone;

    if (!phone) {
      console.log("No phone number found for user");
      return new Response(
        JSON.stringify({ success: false, error: "No phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Format next due date
    let nextDueDate: string | undefined;
    if (nextInstallment?.due_date) {
      const date = new Date(nextInstallment.due_date);
      nextDueDate = date.toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    // 6. Build payment details
    const paymentDetails: InstallmentPaymentDetails = {
      applicationNumber: application.application_number,
      customerName: application.full_name,
      installmentNumber: installment.installment_number,
      totalInstallments: allInstallments.length,
      paidAmount: Number(installment.amount),
      remainingAmount: isLastInstallment ? 0 : remainingAmount,
      remainingInstallments: isLastInstallment ? 0 : remainingInstallments.length,
      nextDueDate,
      isLastInstallment
    };

    console.log("Payment details:", paymentDetails);

    // 7. Generate and send WhatsApp message
    const whatsappMessage = getInstallmentPaymentMessage(paymentDetails);
    
    const whatsappResult = await sendWhatsAppMessage({
      phone: phone,
      message: whatsappMessage,
      type: 'financing'
    });

    console.log("WhatsApp notification result:", whatsappResult);

    // 8. Log the notification
    await supabase.from("sms_logs").insert({
      phone: phone,
      message: whatsappMessage,
      type: 'whatsapp_financing_payment',
      status: whatsappResult.success ? 'sent' : 'failed',
      user_id: application.user_id,
      reference_id: request.installmentId,
      error_message: whatsappResult.error || null,
    });

    // 9. Create activity log entry
    await supabase.from("financing_activity_log").insert({
      application_id: request.applicationId,
      event_type: isLastInstallment ? 'FINANCING_COMPLETED' : 'INSTALLMENT_PAID',
      from_status: 'active',
      to_status: isLastInstallment ? 'completed' : 'active',
      triggered_by: 'admin',
      is_visible_to_customer: true,
      reason: `تم سداد القسط رقم ${installment.installment_number} بمبلغ ${paymentDetails.paidAmount.toLocaleString('ar-SA')} ريال`,
      metadata: {
        installment_id: request.installmentId,
        installment_number: installment.installment_number,
        amount: paymentDetails.paidAmount,
        remaining_amount: paymentDetails.remainingAmount,
        remaining_installments: paymentDetails.remainingInstallments,
        is_last_installment: isLastInstallment,
        whatsapp_sent: whatsappResult.success
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        whatsappSent: whatsappResult.success,
        isLastInstallment,
        paymentDetails: {
          installmentNumber: paymentDetails.installmentNumber,
          paidAmount: paymentDetails.paidAmount,
          remainingAmount: paymentDetails.remainingAmount,
          remainingInstallments: paymentDetails.remainingInstallments
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in financing-installment-paid:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
