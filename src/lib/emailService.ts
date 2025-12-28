import { supabase } from "@/integrations/supabase/client";

export type EmailType = 
  | 'order_created'
  | 'order_status_changed'
  | 'deposit_completed'
  | 'deposit_pending'
  | 'points_earned'
  | 'points_redeemed'
  | 'cashback_earned'
  | 'cashback_withdrawn'
  | 'welcome'
  | 'bank_withdrawal_pending'
  | 'bank_withdrawal_completed'
  | 'bank_withdrawal_rejected'
  | 'offer_notification'
  | 'tier_upgrade'
  | 'challenge_completed'
  | 'refund_processed'
  | 'financing_approved'
  | 'financing_rejected'
  | 'financing_new_application'
  | 'financing_documents_required'
  | 'financing_under_review'
  | 'financing_application_received'
  | 'financing_promissory_note'
  | 'financing_contract'
  | 'custom';

interface SendEmailParams {
  to: string;
  type: EmailType;
  data: Record<string, any>;
  customSubject?: string;
  customContent?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  try {
    console.log(`Sending ${params.type} email to ${params.to}`);
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: params.to,
        type: params.type,
        data: params.data,
        customSubject: params.customSubject,
        customContent: params.customContent,
      },
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('Exception sending email:', err);
    return { success: false, error: err.message };
  }
}

// Helper functions for specific email types
export async function sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'welcome',
    data: { name },
  });
}

export async function sendOrderCreatedEmail(
  email: string,
  orderData: {
    orderNumber: string;
    serviceName: string;
    quantity: number;
    totalPrice: number;
    link?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'order_created',
    data: orderData,
  });
}

export async function sendOrderStatusChangedEmail(
  email: string,
  orderData: {
    orderNumber: string;
    serviceName?: string;
    oldStatus: string;
    newStatus: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'order_status_changed',
    data: orderData,
  });
}

export async function sendDepositCompletedEmail(
  email: string,
  depositData: {
    amount: number;
    originalAmount: number;
    bonusAmount?: number;
    paymentMethod?: string;
    transactionId?: string;
    newBalance: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'deposit_completed',
    data: depositData,
  });
}

export async function sendDepositPendingEmail(
  email: string,
  depositData: {
    amount: number;
    paymentMethod?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'deposit_pending',
    data: depositData,
  });
}

export async function sendPointsEarnedEmail(
  email: string,
  pointsData: {
    points: number;
    description?: string;
    totalPoints: number;
    tierName?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'points_earned',
    data: pointsData,
  });
}

export async function sendCashbackEarnedEmail(
  email: string,
  cashbackData: {
    amount: number;
    depositAmount: number;
    percentage: number;
    totalCashback: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'cashback_earned',
    data: cashbackData,
  });
}

export async function sendCashbackWithdrawnEmail(
  email: string,
  cashbackData: {
    amount: number;
    remainingCashback: number;
    newBalance: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'cashback_withdrawn',
    data: cashbackData,
  });
}

export async function sendBankWithdrawalPendingEmail(
  email: string,
  withdrawalData: {
    amount: number;
    bankName: string;
    accountHolderName: string;
    iban: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'bank_withdrawal_pending',
    data: withdrawalData,
  });
}

export async function sendBankWithdrawalCompletedEmail(
  email: string,
  withdrawalData: {
    amount: number;
    bankName: string;
    iban: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'bank_withdrawal_completed',
    data: withdrawalData,
  });
}

export async function sendBankWithdrawalRejectedEmail(
  email: string,
  withdrawalData: {
    amount: number;
    bankName: string;
    reason?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'bank_withdrawal_rejected',
    data: withdrawalData,
  });
}

export async function sendTierUpgradeEmail(
  email: string,
  tierData: {
    tierName: string;
    tierColor?: string;
    multiplier: number;
    benefits?: string[];
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'tier_upgrade',
    data: tierData,
  });
}

export async function sendChallengeCompletedEmail(
  email: string,
  challengeData: {
    challengeTitle: string;
    challengeType: string;
    rewardPoints: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'challenge_completed',
    data: challengeData,
  });
}

export async function sendRefundProcessedEmail(
  email: string,
  refundData: {
    amount: number;
    orderNumber: string;
    reason?: string;
    newBalance: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'refund_processed',
    data: refundData,
  });
}

export async function sendOfferNotificationEmail(
  email: string,
  offerData: {
    offerTitle: string;
    offerDescription?: string;
    discountPercentage: number;
    originalPrice?: number;
    offerPrice?: number;
    endDate?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'offer_notification',
    data: offerData,
  });
}

export async function sendCustomEmail(
  email: string,
  customData: {
    subject: string;
    title: string;
    message: string;
    customHtml?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'custom',
    data: customData,
    customSubject: customData.subject,
  });
}

// Financing email functions
export async function sendFinancingApprovedEmail(
  email: string,
  data: {
    name: string;
    applicationNumber: string;
    amount: number;
    installmentsCount: number;
    monthlyInstallment: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'financing_approved',
    data,
  });
}

export async function sendFinancingRejectedEmail(
  email: string,
  data: {
    name: string;
    applicationNumber: string;
    rejectionReason?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'financing_rejected',
    data,
  });
}

export async function sendFinancingNewApplicationEmail(
  adminEmail: string,
  data: {
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    applicationNumber: string;
    requestedAmount: number;
    serviceDescription?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: adminEmail,
    type: 'financing_new_application',
    data,
  });
}

export async function sendFinancingDocumentsRequiredEmail(
  email: string,
  data: {
    name: string;
    applicationNumber: string;
    requiredDocuments: string;
    adminNotes?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'financing_documents_required',
    data,
  });
}

export async function sendFinancingUnderReviewEmail(
  email: string,
  data: {
    name: string;
    applicationNumber: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'financing_under_review',
    data,
  });
}

export async function sendFinancingApplicationReceivedEmail(
  email: string,
  data: {
    name: string;
    applicationNumber: string;
    requestedAmount: number;
    installmentsCount: number;
    monthlyInstallment: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'financing_application_received',
    data,
  });
}

export async function sendFinancingPromissoryNoteEmail(
  email: string,
  data: {
    name: string;
    nationalId: string;
    applicationNumber: string;
    contractNumber: string;
    amount: number;
    installmentsCount: number;
    monthlyInstallment: number;
    startDate: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'financing_promissory_note',
    data,
  });
}

export async function sendFinancingContractEmail(
  email: string,
  data: {
    name: string;
    applicationNumber: string;
    contractNumber: string;
    amount: number;
    installmentsCount: number;
    monthlyInstallment: number;
    durationMonths: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    type: 'financing_contract',
    data,
  });
}
