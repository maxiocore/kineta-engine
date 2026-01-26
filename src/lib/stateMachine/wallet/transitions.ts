/**
 * MaxioCore - Wallet State Machine Transitions
 * انتقالات حالات المحفظة
 */

import { StateTransition, WalletStatus, TransitionTrigger } from '../core/types';

/**
 * جميع الانتقالات المسموح بها في نظام المحفظة
 */
export const WALLET_TRANSITIONS: StateTransition<WalletStatus>[] = [
  // ============================================
  // تفعيل المحفظة
  // ============================================
  
  {
    from: 'WALLET_NOT_AVAILABLE',
    to: 'WALLET_ACTIVE',
    trigger: ['system'],
    condition: 'User profile completed and verified',
    conditionAr: 'اكتمال الملف الشخصي والتحقق منه',
    sideEffects: ['LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  // ============================================
  // إيقاف وتفعيل المحفظة
  // ============================================

  {
    from: 'WALLET_ACTIVE',
    to: 'WALLET_SUSPENDED',
    trigger: ['admin', 'system'],
    condition: 'Suspicious activity detected or policy violation',
    conditionAr: 'اكتشاف نشاط مشبوه أو مخالفة للشروط',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'WALLET_SUSPENDED',
    to: 'WALLET_ACTIVE',
    trigger: ['admin'],
    condition: 'Admin review completed and wallet cleared',
    conditionAr: 'اكتمال المراجعة الإدارية ورفع الإيقاف',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  // ============================================
  // عمليات الإيداع
  // ============================================

  {
    from: 'WALLET_ACTIVE',
    to: 'WALLET_PENDING_DEPOSIT',
    trigger: ['customer'],
    condition: 'User initiates deposit request',
    conditionAr: 'بدء طلب إيداع',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'WALLET_PENDING_DEPOSIT',
    to: 'WALLET_CREDITED',
    trigger: ['system'],
    condition: 'Payment confirmed by payment gateway',
    conditionAr: 'تأكيد الدفع من بوابة الدفع',
    sideEffects: ['UPDATE_BALANCE', 'SEND_EMAIL', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'WALLET_PENDING_DEPOSIT',
    to: 'WALLET_DEPOSIT_FAILED',
    trigger: ['system'],
    condition: 'Payment failed or declined - generic error shown',
    conditionAr: 'فشل الدفع أو رفضه',
    sideEffects: ['LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'WALLET_PENDING_DEPOSIT',
    to: 'WALLET_ACTIVE',
    trigger: ['customer', 'system'],
    condition: 'Deposit cancelled or timed out',
    conditionAr: 'إلغاء الإيداع أو انتهاء المهلة',
    timeoutDays: 1,
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'WALLET_DEPOSIT_FAILED',
    to: 'WALLET_ACTIVE',
    trigger: ['system'],
    condition: 'Return to active state for retry',
    conditionAr: 'العودة للحالة النشطة للمحاولة مجدداً',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'WALLET_DEPOSIT_FAILED',
    to: 'WALLET_PENDING_DEPOSIT',
    trigger: ['customer'],
    condition: 'User retries deposit',
    conditionAr: 'إعادة محاولة الإيداع',
    sideEffects: ['LOG_ACTIVITY']
  },

  // ============================================
  // عمليات الإضافة (Credit)
  // ============================================

  {
    from: 'WALLET_CREDITED',
    to: 'WALLET_ACTIVE',
    trigger: ['system'],
    condition: 'Balance update completed, return to active',
    conditionAr: 'اكتمال تحديث الرصيد، العودة للنشاط',
    sideEffects: ['LOG_ACTIVITY']
  },

  // إضافة رصيد من التمويل
  {
    from: 'WALLET_ACTIVE',
    to: 'WALLET_CREDITED',
    trigger: ['system', 'admin'],
    condition: 'Service credit from financing or admin action',
    conditionAr: 'إضافة رصيد خدمات من التمويل أو المسؤول',
    sideEffects: ['UPDATE_BALANCE', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  // ============================================
  // عمليات الخصم (Debit)
  // ============================================

  {
    from: 'WALLET_ACTIVE',
    to: 'WALLET_DEBITED',
    trigger: ['customer', 'system'],
    condition: 'Service purchase with sufficient balance',
    conditionAr: 'شراء خدمة برصيد كافٍ',
    sideEffects: ['UPDATE_BALANCE', 'LOG_ACTIVITY']
  },

  {
    from: 'WALLET_DEBITED',
    to: 'WALLET_ACTIVE',
    trigger: ['system'],
    condition: 'Debit completed, return to active',
    conditionAr: 'اكتمال الخصم، العودة للنشاط',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'WALLET_ACTIVE',
    to: 'WALLET_INSUFFICIENT',
    trigger: ['system'],
    condition: 'Purchase attempt with insufficient balance',
    conditionAr: 'محاولة شراء برصيد غير كافٍ',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'WALLET_INSUFFICIENT',
    to: 'WALLET_ACTIVE',
    trigger: ['system'],
    condition: 'User cancels or navigates away',
    conditionAr: 'إلغاء العملية أو المغادرة',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'WALLET_INSUFFICIENT',
    to: 'WALLET_PENDING_DEPOSIT',
    trigger: ['customer'],
    condition: 'User initiates deposit to cover shortfall',
    conditionAr: 'بدء إيداع لتغطية النقص',
    sideEffects: ['LOG_ACTIVITY']
  }
];

/**
 * الحصول على الانتقالات المسموح بها من حالة معينة
 */
export function getAvailableWalletTransitions(currentStatus: WalletStatus): StateTransition<WalletStatus>[] {
  return WALLET_TRANSITIONS.filter(t => t.from === currentStatus);
}

/**
 * الحصول على الانتقالات لمحفز معين
 */
export function getWalletTransitionsForTrigger(
  currentStatus: WalletStatus,
  trigger: TransitionTrigger
): StateTransition<WalletStatus>[] {
  return WALLET_TRANSITIONS.filter(
    t => t.from === currentStatus && t.trigger.includes(trigger)
  );
}

/**
 * التحقق من وجود انتقال
 */
export function walletTransitionExists(from: WalletStatus, to: WalletStatus): boolean {
  return WALLET_TRANSITIONS.some(t => t.from === from && t.to === to);
}

/**
 * الحصول على تفاصيل انتقال
 */
export function getWalletTransition(from: WalletStatus, to: WalletStatus): StateTransition<WalletStatus> | undefined {
  return WALLET_TRANSITIONS.find(t => t.from === from && t.to === to);
}

/**
 * الحالات التالية الممكنة
 */
export function getNextWalletStates(currentStatus: WalletStatus): WalletStatus[] {
  return getAvailableWalletTransitions(currentStatus).map(t => t.to);
}

/**
 * هل يمكن للعميل إجراء عمليات على المحفظة
 */
export function canCustomerOperateWallet(status: WalletStatus): boolean {
  const operableStates: WalletStatus[] = [
    'WALLET_ACTIVE',
    'WALLET_INSUFFICIENT',
    'WALLET_DEPOSIT_FAILED'
  ];
  return operableStates.includes(status);
}
