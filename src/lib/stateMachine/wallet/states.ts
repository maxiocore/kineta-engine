/**
 * MaxioCore - Wallet State Machine States
 * نظام حالات المحفظة والمركز المالي
 */

import { StateDefinition, WalletStatus } from '../core/types';

/**
 * تعريفات حالات المحفظة
 */
export const WALLET_STATE_DEFINITIONS: Record<WalletStatus, StateDefinition<WalletStatus>> = {
  // ============================================
  // حالات توفر المحفظة
  // ============================================
  
  WALLET_NOT_AVAILABLE: {
    status: 'WALLET_NOT_AVAILABLE',
    domain: 'WALLET',
    nameAr: 'المحفظة غير متاحة',
    nameEn: 'Wallet Not Available',
    internalDescription: 'المستخدم لم يُفعّل المحفظة بعد أو غير مؤهل',
    userMessage: 'يجب إكمال إعداد حسابك لتفعيل المحفظة',
    isTerminal: false,
    requiredAction: 'إكمال الملف الشخصي والتحقق',
    color: 'gray',
    icon: 'Wallet',
    severity: 'info',
    hideSecurityDetails: false
  },

  WALLET_ACTIVE: {
    status: 'WALLET_ACTIVE',
    domain: 'WALLET',
    nameAr: 'المحفظة نشطة',
    nameEn: 'Wallet Active',
    internalDescription: 'المحفظة مفعّلة وجاهزة للاستخدام',
    userMessage: 'محفظتك جاهزة للاستخدام',
    isTerminal: false,
    color: 'green',
    icon: 'Wallet',
    severity: 'success',
    hideSecurityDetails: false
  },

  WALLET_SUSPENDED: {
    status: 'WALLET_SUSPENDED',
    domain: 'WALLET',
    nameAr: 'المحفظة موقوفة',
    nameEn: 'Wallet Suspended',
    // لا نكشف سبب الإيقاف بالتفصيل
    internalDescription: 'تم إيقاف المحفظة بسبب نشاط مشبوه أو مخالفة للشروط',
    userMessage: 'محفظتك موقوفة مؤقتاً. يرجى التواصل مع الدعم',
    isTerminal: false,
    color: 'red',
    icon: 'Ban',
    severity: 'error',
    hideSecurityDetails: true // مهم: إخفاء سبب الإيقاف
  },

  // ============================================
  // عمليات الرصيد
  // ============================================

  WALLET_CREDITED: {
    status: 'WALLET_CREDITED',
    domain: 'WALLET',
    nameAr: 'تم إضافة رصيد',
    nameEn: 'Wallet Credited',
    internalDescription: 'تم إضافة رصيد خدمات إلى المحفظة',
    userMessage: 'تم إضافة الرصيد بنجاح',
    isTerminal: false,
    color: 'green',
    icon: 'Plus',
    severity: 'success',
    hideSecurityDetails: false
  },

  WALLET_DEBITED: {
    status: 'WALLET_DEBITED',
    domain: 'WALLET',
    nameAr: 'تم خصم رصيد',
    nameEn: 'Wallet Debited',
    internalDescription: 'تم خصم رصيد مقابل شراء خدمة',
    userMessage: 'تم خصم الرصيد بنجاح',
    isTerminal: false,
    color: 'blue',
    icon: 'Minus',
    severity: 'info',
    hideSecurityDetails: false
  },

  WALLET_INSUFFICIENT: {
    status: 'WALLET_INSUFFICIENT',
    domain: 'WALLET',
    nameAr: 'رصيد غير كافٍ',
    nameEn: 'Insufficient Balance',
    internalDescription: 'الرصيد غير كافٍ لإتمام العملية المطلوبة',
    userMessage: 'الرصيد غير كافٍ. يرجى شحن المحفظة',
    isTerminal: false,
    requiredAction: 'إضافة رصيد للمحفظة',
    color: 'yellow',
    icon: 'AlertCircle',
    severity: 'warning',
    hideSecurityDetails: false
  },

  // ============================================
  // عمليات الإيداع
  // ============================================

  WALLET_PENDING_DEPOSIT: {
    status: 'WALLET_PENDING_DEPOSIT',
    domain: 'WALLET',
    nameAr: 'بانتظار الإيداع',
    nameEn: 'Pending Deposit',
    internalDescription: 'عملية إيداع قيد المعالجة',
    userMessage: 'جاري معالجة عملية الإيداع...',
    isTerminal: false,
    color: 'blue',
    icon: 'Loader',
    severity: 'info',
    hideSecurityDetails: false
  },

  WALLET_DEPOSIT_FAILED: {
    status: 'WALLET_DEPOSIT_FAILED',
    domain: 'WALLET',
    nameAr: 'فشل الإيداع',
    nameEn: 'Deposit Failed',
    // لا نكشف السبب التقني للفشل
    internalDescription: 'فشلت عملية الإيداع - قد يكون السبب تقني أو رفض من البنك',
    userMessage: 'تعذر إتمام عملية الإيداع. يرجى المحاولة لاحقاً أو التواصل مع الدعم',
    isTerminal: false,
    color: 'red',
    icon: 'XCircle',
    severity: 'error',
    hideSecurityDetails: true // مهم: إخفاء السبب التقني
  }
};

/**
 * الحصول على تعريف حالة معينة
 */
export function getWalletStateDefinition(status: WalletStatus): StateDefinition<WalletStatus> {
  return WALLET_STATE_DEFINITIONS[status];
}

/**
 * الحالات النهائية للمحفظة
 */
export function getWalletTerminalStates(): WalletStatus[] {
  return Object.values(WALLET_STATE_DEFINITIONS)
    .filter(state => state.isTerminal)
    .map(state => state.status);
}

/**
 * هل الحالة نهائية
 */
export function isWalletTerminalState(status: WalletStatus): boolean {
  return WALLET_STATE_DEFINITIONS[status].isTerminal;
}

/**
 * الحصول على رسالة آمنة للمستخدم
 */
export function getWalletUserMessage(status: WalletStatus): string {
  return WALLET_STATE_DEFINITIONS[status].userMessage;
}

/**
 * الحالات التي تتطلب إجراء من المستخدم
 */
export function getWalletStatesRequiringAction(): WalletStatus[] {
  return Object.values(WALLET_STATE_DEFINITIONS)
    .filter(state => state.requiredAction)
    .map(state => state.status);
}
