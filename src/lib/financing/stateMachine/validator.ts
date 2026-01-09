import { 
  FinancingApplicationStatus, 
  TransitionTrigger, 
  TransitionValidationResult 
} from './types';
import { isTerminalState } from './states';
import { transitionExists, getTransition, getTransitionsForTrigger } from './transitions';

/**
 * التحقق من صحة الانتقال
 */
export function validateTransition(
  currentStatus: FinancingApplicationStatus,
  targetStatus: FinancingApplicationStatus,
  trigger: TransitionTrigger
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
  if (!transitionExists(currentStatus, targetStatus)) {
    return {
      valid: false,
      error: `Transition from ${currentStatus} to ${targetStatus} is not allowed`,
      errorAr: `الانتقال من ${currentStatus} إلى ${targetStatus} غير مسموح`
    };
  }

  // التحقق من صلاحية المحفز
  const transition = getTransition(currentStatus, targetStatus);
  if (transition && !transition.trigger.includes(trigger)) {
    return {
      valid: false,
      error: `Trigger '${trigger}' is not authorized for this transition`,
      errorAr: `المحفز '${trigger}' غير مصرح له بهذا الانتقال`
    };
  }

  return { valid: true };
}

/**
 * التحقق مما إذا كان المستخدم يمكنه إلغاء الطلب
 */
export function canCustomerCancel(status: FinancingApplicationStatus): boolean {
  const cancellableStates: FinancingApplicationStatus[] = [
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW'
  ];
  return cancellableStates.includes(status);
}

/**
 * التحقق مما إذا كان الطلب يتطلب إجراء من العميل
 */
export function requiresCustomerAction(status: FinancingApplicationStatus): boolean {
  const customerActionStates: FinancingApplicationStatus[] = [
    'DRAFT',
    'ADDITIONAL_INFO_REQUIRED',
    'CONTRACT_PRESENTED',
    'CREDIT_DEPOSITED'
  ];
  return customerActionStates.includes(status);
}

/**
 * التحقق مما إذا كان الطلب يتطلب إجراء من المراجع
 */
export function requiresReviewerAction(status: FinancingApplicationStatus): boolean {
  const reviewerActionStates: FinancingApplicationStatus[] = [
    'UNDER_REVIEW',
    'RISK_CHECK'
  ];
  return reviewerActionStates.includes(status);
}

/**
 * التحقق مما إذا كان الطلب يتطلب إجراء من المسؤول
 */
export function requiresAdminAction(status: FinancingApplicationStatus): boolean {
  const adminActionStates: FinancingApplicationStatus[] = [
    'CONTRACT_ACCEPTED'
  ];
  return adminActionStates.includes(status);
}

/**
 * الحصول على الإجراءات المتاحة للعميل
 */
export function getCustomerActions(
  status: FinancingApplicationStatus
): { action: string; targetStatus: FinancingApplicationStatus; label: string }[] {
  const transitions = getTransitionsForTrigger(status, 'customer');
  
  return transitions.map(t => ({
    action: `transition_to_${t.to.toLowerCase()}`,
    targetStatus: t.to,
    label: getActionLabel(t.to)
  }));
}

/**
 * الحصول على تسمية الإجراء
 */
function getActionLabel(targetStatus: FinancingApplicationStatus): string {
  const labels: Partial<Record<FinancingApplicationStatus, string>> = {
    SUBMITTED: 'إرسال الطلب',
    CANCELLED: 'إلغاء الطلب',
    UNDER_REVIEW: 'تقديم المستندات',
    CONTRACT_ACCEPTED: 'قبول العقد',
    DECLINED: 'رفض العقد',
    ORDER_PAYMENT_IN_PROGRESS: 'استخدام الرصيد',
    CREDIT_DEPOSITED: 'إلغاء العملية'
  };
  return labels[targetStatus] || targetStatus;
}

/**
 * التحقق من صحة البيانات للانتقال
 */
export function validateTransitionData(
  currentStatus: FinancingApplicationStatus,
  targetStatus: FinancingApplicationStatus,
  data: Record<string, unknown>
): TransitionValidationResult {
  // التحقق من البيانات حسب نوع الانتقال
  switch (`${currentStatus}_TO_${targetStatus}`) {
    case 'DRAFT_TO_SUBMITTED':
      return validateDraftToSubmitted(data);
    
    case 'CONTRACT_PRESENTED_TO_CONTRACT_ACCEPTED':
      return validateContractAcceptance(data);
    
    case 'CREDIT_DEPOSITED_TO_ORDER_PAYMENT_IN_PROGRESS':
      return validateOrderPayment(data);
    
    default:
      return { valid: true };
  }
}

/**
 * التحقق من بيانات إرسال الطلب
 */
function validateDraftToSubmitted(data: Record<string, unknown>): TransitionValidationResult {
  const requiredFields = ['full_name', 'national_id', 'phone', 'email', 'requested_amount'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return {
        valid: false,
        error: `Missing required field: ${field}`,
        errorAr: `الحقل مطلوب: ${field}`
      };
    }
  }

  // التحقق من صحة رقم الهوية
  if (typeof data.national_id === 'string' && !/^\d{10}$/.test(data.national_id)) {
    return {
      valid: false,
      error: 'Invalid national ID format',
      errorAr: 'صيغة رقم الهوية غير صحيحة'
    };
  }

  return { valid: true };
}

/**
 * التحقق من بيانات قبول العقد
 */
function validateContractAcceptance(data: Record<string, unknown>): TransitionValidationResult {
  if (!data.acceptance_checkbox) {
    return {
      valid: false,
      error: 'Contract acceptance checkbox must be checked',
      errorAr: 'يجب الموافقة على شروط العقد'
    };
  }

  if (!data.acceptance_button_clicked) {
    return {
      valid: false,
      error: 'Contract acceptance button must be clicked',
      errorAr: 'يجب الضغط على زر الموافقة'
    };
  }

  return { valid: true };
}

/**
 * التحقق من بيانات استخدام الرصيد
 */
function validateOrderPayment(data: Record<string, unknown>): TransitionValidationResult {
  if (!data.service_id) {
    return {
      valid: false,
      error: 'Service ID is required',
      errorAr: 'يجب تحديد الخدمة'
    };
  }

  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    return {
      valid: false,
      error: 'Valid amount is required',
      errorAr: 'المبلغ غير صحيح'
    };
  }

  return { valid: true };
}
