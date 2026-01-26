/**
 * التحقق من صحة الانتقالات والبيانات
 * Validation Logic
 */

import { 
  ApplicationStatus, 
  ContractStatus,
  TransitionActor, 
  TransitionValidationResult,
  OfferSetup
} from './types';
import { isTerminalState } from './applicationStates';
import { 
  APPLICATION_TRANSITIONS, 
  transitionExists, 
  getTransition 
} from './transitions';

/**
 * التحقق من صحة الانتقال
 */
export function validateTransition(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus,
  actor: TransitionActor
): TransitionValidationResult {
  // التحقق من أن الحالة الحالية ليست نهائية
  if (isTerminalState(currentStatus)) {
    return {
      valid: false,
      error: `Cannot transition from terminal state: ${currentStatus}`,
      errorAr: `لا يمكن الانتقال من حالة نهائية: ${currentStatus}`
    };
  }

  // التحقق من وجود الانتقال
  if (!transitionExists(APPLICATION_TRANSITIONS, currentStatus, targetStatus)) {
    return {
      valid: false,
      error: `Transition from ${currentStatus} to ${targetStatus} is not allowed`,
      errorAr: `الانتقال من ${currentStatus} إلى ${targetStatus} غير مسموح`
    };
  }

  // التحقق من صلاحية المحفز
  const transition = getTransition(APPLICATION_TRANSITIONS, currentStatus, targetStatus);
  if (transition && !transition.actors.includes(actor)) {
    return {
      valid: false,
      error: `Actor '${actor}' is not authorized for this transition`,
      errorAr: `المحفز '${actor}' غير مصرح له بهذا الانتقال`
    };
  }

  return { valid: true };
}

/**
 * التحقق من صحة بيانات ضبط العرض
 */
export function validateOfferSetup(data: Partial<OfferSetup>): TransitionValidationResult {
  // التحقق من القيمة
  if (!data.approvedAmount || data.approvedAmount <= 0) {
    return {
      valid: false,
      error: 'Approved amount must be greater than 0',
      errorAr: 'قيمة التمويل يجب أن تكون أكبر من صفر'
    };
  }

  // التحقق من الحدود (مثال: 1000 - 100000)
  if (data.approvedAmount < 1000) {
    return {
      valid: false,
      error: 'Minimum financing amount is 1000 SAR',
      errorAr: 'الحد الأدنى للتمويل هو 1000 ريال'
    };
  }

  if (data.approvedAmount > 100000) {
    return {
      valid: false,
      error: 'Maximum financing amount is 100000 SAR',
      errorAr: 'الحد الأقصى للتمويل هو 100,000 ريال'
    };
  }

  // التحقق من عدد الأقساط
  if (!data.installmentsCount || data.installmentsCount < 1 || data.installmentsCount > 36) {
    return {
      valid: false,
      error: 'Installments count must be between 1 and 36',
      errorAr: 'عدد الأقساط يجب أن يكون بين 1 و 36'
    };
  }

  // التحقق من الاسم الكامل
  if (!data.fullNameFromId || data.fullNameFromId.trim().length < 5) {
    return {
      valid: false,
      error: 'Full name from ID is required',
      errorAr: 'الاسم الكامل كما في الهوية مطلوب'
    };
  }

  // التحقق من أن الاسم يحتوي على كلمتين على الأقل
  const nameParts = data.fullNameFromId.trim().split(/\s+/);
  if (nameParts.length < 2) {
    return {
      valid: false,
      error: 'Full name must contain at least first and last name',
      errorAr: 'الاسم يجب أن يحتوي على الاسم الأول والأخير على الأقل'
    };
  }

  // التحقق من تاريخ أول قسط
  if (data.firstInstallmentDate) {
    const firstDate = new Date(data.firstInstallmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (firstDate < today) {
      return {
        valid: false,
        error: 'First installment date cannot be in the past',
        errorAr: 'تاريخ أول قسط لا يمكن أن يكون في الماضي'
      };
    }
  }

  return { valid: true };
}

/**
 * التحقق مما إذا كان المستخدم يمكنه إلغاء الطلب
 */
export function canCustomerCancel(status: ApplicationStatus): boolean {
  const cancellableStates: ApplicationStatus[] = [
    'DRAFT',
    'REQUEST_SUBMITTED',
    'UNDER_REVIEW'
  ];
  return cancellableStates.includes(status);
}

/**
 * الحقول المطلوبة لكل مرحلة
 */
export function getRequiredFields(status: ApplicationStatus): string[] {
  switch (status) {
    case 'DRAFT':
      return ['full_name', 'national_id', 'phone', 'email'];
    
    case 'ADMIN_SETUP':
      return ['approved_amount', 'installments_count', 'full_name_from_id'];
    
    case 'CONTRACT_PHASE':
      return ['acceptance_checkbox', 'acceptance_button_clicked', 'scroll_percentage'];
    
    default:
      return [];
  }
}

/**
 * التحقق من صحة بيانات العقد
 */
export function validateContractSignature(data: {
  acceptanceCheckbox: boolean;
  acceptanceButtonClicked: boolean;
  scrollPercentage: number;
  readingTimeSeconds: number;
}): TransitionValidationResult {
  if (!data.acceptanceCheckbox) {
    return {
      valid: false,
      error: 'Contract acceptance checkbox must be checked',
      errorAr: 'يجب الموافقة على شروط العقد'
    };
  }

  if (!data.acceptanceButtonClicked) {
    return {
      valid: false,
      error: 'Contract acceptance button must be clicked',
      errorAr: 'يجب الضغط على زر الموافقة'
    };
  }

  if (data.scrollPercentage < 95) {
    return {
      valid: false,
      error: 'Please read the entire contract before signing',
      errorAr: 'يرجى قراءة العقد كاملاً قبل التوقيع'
    };
  }

  if (data.readingTimeSeconds < 60) {
    return {
      valid: false,
      error: 'Please take more time to read the contract',
      errorAr: 'يرجى أخذ وقت كافٍ لقراءة العقد'
    };
  }

  return { valid: true };
}
