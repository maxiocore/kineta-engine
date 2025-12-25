import { supabase } from "@/integrations/supabase/client";

export type AdminNotificationType = 
  | 'new_user'
  | 'new_deposit'
  | 'deposit_pending'
  | 'new_order'
  | 'new_ticket'
  | 'ticket_reply'
  | 'new_withdrawal'
  | 'new_contact'
  | 'low_provider_balance'
  | 'order_cancelled'
  | 'refund_requested';

interface AdminNotifyResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function notifyAdmins(
  type: AdminNotificationType,
  data: Record<string, any>
): Promise<AdminNotifyResult> {
  try {
    console.log(`Sending admin notification: ${type}`);
    
    const { data: response, error } = await supabase.functions.invoke('admin-notify', {
      body: { type, data },
    });

    if (error) {
      console.error('Error notifying admins:', error);
      return { success: false, error: error.message };
    }

    console.log('Admin notification sent:', response);
    return { success: true, data: response };
  } catch (err: any) {
    console.error('Exception notifying admins:', err);
    return { success: false, error: err.message };
  }
}

// Helper functions for specific notification types
export async function notifyNewUser(userData: {
  name?: string;
  email: string;
  phone?: string;
  referralCode?: string;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('new_user', userData);
}

export async function notifyNewDeposit(depositData: {
  amount: number;
  userName?: string;
  userEmail: string;
  paymentMethod?: string;
  transactionId?: string;
  bonusAmount?: number;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('new_deposit', depositData);
}

export async function notifyDepositPending(depositData: {
  amount: number;
  userName?: string;
  userEmail: string;
  paymentMethod?: string;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('deposit_pending', depositData);
}

export async function notifyNewOrder(orderData: {
  orderNumber: string;
  userName?: string;
  userEmail: string;
  serviceName?: string;
  quantity?: number;
  totalPrice: number;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('new_order', orderData);
}

export async function notifyNewTicket(ticketData: {
  ticketNumber?: string;
  userName?: string;
  userEmail: string;
  subject: string;
  priority: string;
  description?: string;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('new_ticket', ticketData);
}

export async function notifyTicketReply(ticketData: {
  ticketNumber: string;
  userName?: string;
  userEmail: string;
  subject: string;
  message?: string;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('ticket_reply', ticketData);
}

export async function notifyNewWithdrawal(withdrawalData: {
  amount: number;
  userName?: string;
  userEmail: string;
  bankName: string;
  accountHolderName: string;
  iban: string;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('new_withdrawal', withdrawalData);
}

export async function notifyNewContact(contactData: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('new_contact', contactData);
}

export async function notifyLowProviderBalance(providerData: {
  providerName: string;
  balance: number;
  minBalance?: number;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('low_provider_balance', providerData);
}

export async function notifyOrderCancelled(orderData: {
  orderNumber: string;
  userName?: string;
  userEmail: string;
  refundAmount: number;
  reason?: string;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('order_cancelled', orderData);
}

export async function notifyRefundRequested(refundData: {
  orderNumber: string;
  userName?: string;
  userEmail: string;
  amount: number;
  reason?: string;
}): Promise<AdminNotifyResult> {
  return notifyAdmins('refund_requested', refundData);
}
