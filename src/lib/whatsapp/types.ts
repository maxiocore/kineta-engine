/**
 * WhatsApp Integration Types for ASH HOLDING
 * Frontend type definitions matching backend provider
 */

// Error classification
export enum WhatsAppErrorType {
  NETWORK = 'NETWORK_ERROR',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_NUMBER = 'INVALID_NUMBER',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN_ERROR',
  NOT_CONFIGURED = 'NOT_CONFIGURED'
}

export interface WhatsAppError {
  type: WhatsAppErrorType;
  message: string;
  retryable: boolean;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: WhatsAppError;
  attempts: number;
  timestamp: string;
}

export interface WhatsAppMessageMeta {
  type?: 'order' | 'financing' | 'deposit' | 'ticket' | 'balance' | 'auth' | 'general';
  referenceId?: string;
  priority?: 'high' | 'normal' | 'low';
}

// Status types for template messages
export type FinancingStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'APPROVED_WITH_LIMITS'
  | 'CONTRACT_PRESENTED'
  | 'CONTRACT_ACCEPTED'
  | 'PROMISSORY_SIGNED'
  | 'CONTRACT_FINALIZED'
  | 'CREDIT_DEPOSITED'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'in_progress'
  | 'completed'
  | 'partial'
  | 'cancelled'
  | 'refunded';

export interface TemplateStatusParams {
  status: string;
  applicationNumber?: string;
  orderNumber?: string;
  amount?: number;
  customerName?: string;
}

// Notification tracking
export interface WhatsAppNotificationLog {
  id: string;
  phone: string;
  messageType: string;
  referenceId?: string;
  status: 'sent' | 'failed' | 'pending';
  attempts: number;
  error?: WhatsAppError;
  createdAt: string;
  sentAt?: string;
}

// Rate limiting
export interface RateLimitInfo {
  remaining: number;
  resetAt: string;
  isLimited: boolean;
}

// Provider status
export interface WhatsAppProviderStatus {
  configured: boolean;
  healthy: boolean;
  lastCheckAt: string;
  rateLimitInfo?: RateLimitInfo;
}
