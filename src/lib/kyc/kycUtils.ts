// ============================================
// KYC Utilities - Status & Restrictions
// ============================================

export type KYCDisplayStatus = 'not_started' | 'pending_review' | 'approved' | 'rejected';

export interface KYCStatus {
  status: KYCDisplayStatus;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  notStarted: boolean;
  canAccessFeatures: boolean;
}

/**
 * Determine KYC display status from verification status
 */
export function getKYCDisplayStatus(
  verificationStatus?: string
): KYCDisplayStatus {
  if (!verificationStatus) return 'not_started';
  
  switch (verificationStatus) {
    case 'PASSED':
      return 'approved';
    case 'PENDING':
      return 'pending_review';
    case 'FAILED':
      return 'rejected';
    default:
      return 'not_started';
  }
}

/**
 * Get KYC status flags for easy feature gating
 */
export function getKYCStatusFlags(displayStatus: KYCDisplayStatus): KYCStatus {
  return {
    status: displayStatus,
    isApproved: displayStatus === 'approved',
    isPending: displayStatus === 'pending_review',
    isRejected: displayStatus === 'rejected',
    notStarted: displayStatus === 'not_started',
    canAccessFeatures: displayStatus === 'approved',
  };
}

/**
 * Features that require KYC approval
 */
export const KYC_RESTRICTED_FEATURES = {
  DEPOSITS: {
    name: 'التحويلات المالية',
    description: 'يجب أن تكون موثقاً لإجراء تحويلات مالية',
    arabic: 'يتطلب التحقق من الهوية',
  },
  WITHDRAWALS: {
    name: 'السحب',
    description: 'يجب أن تكون موثقاً للسحب من حسابك',
    arabic: 'يتطلب التحقق من الهوية',
  },
  ORDERS: {
    name: 'الطلبات',
    description: 'يجب أن تكون موثقاً لإنشاء وإدارة الطلبات',
    arabic: 'يتطلب التحقق من الهوية',
  },
  SERVICES: {
    name: 'الخدمات',
    description: 'يجب أن تكون موثقاً للوصول إلى جميع الخدمات',
    arabic: 'يتطلب التحقق من الهوية',
  },
  CRYPTO_TRADING: {
    name: 'تداول العملات الرقمية',
    description: 'يجب أن تكون موثقاً للتداول',
    arabic: 'يتطلب التحقق من الهوية',
  },
  HIGH_VALUE_TRANSFERS: {
    name: 'التحويلات الكبيرة',
    description: 'التحويلات فوق حد معين تتطلب التحقق',
    arabic: 'يتطلب التحقق من الهوية',
  },
} as const;

/**
 * Get next action message based on KYC status
 */
export function getNextActionMessage(status: KYCDisplayStatus): string {
  switch (status) {
    case 'not_started':
      return 'ابدأ عملية التحقق الآن للوصول إلى جميع المميزات';
    case 'pending_review':
      return 'سنراجع طلبك قريباً. عادة يستغرق 24 ساعة';
    case 'rejected':
      return 'يرجى تصحيح الملاحظات وإعادة تقديم الطلب';
    case 'approved':
      return 'حسابك مفعل بالكامل وجاهز للاستخدام';
  }
}

/**
 * Get warning message for restricted features
 */
export function getFeatureRestrictionMessage(
  featureKey: keyof typeof KYC_RESTRICTED_FEATURES
): string {
  const feature = KYC_RESTRICTED_FEATURES[featureKey];
  return `${feature.name} — ${feature.description}`;
}
