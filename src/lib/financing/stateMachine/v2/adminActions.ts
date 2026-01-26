/**
 * إجراءات الأدمن
 * Admin Actions
 */

import { AdminAction, ApplicationStatus, AdminPermission } from './types';

export const ADMIN_ACTIONS: AdminAction[] = [
  // ==========================================
  // إجراءات مرحلة المراجعة
  // ==========================================
  {
    id: 'request_info',
    name: 'Request Additional Info',
    nameAr: 'طلب معلومات إضافية',
    description: 'طلب مستندات أو معلومات إضافية من العميل',
    permission: 'financing.review',
    applicableStatuses: ['UNDER_REVIEW'],
    targetStatus: 'INFO_REQUIRED',
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد طلب معلومات إضافية من العميل؟',
    icon: 'MessageSquare',
    color: 'warning'
  },
  {
    id: 'approve_preliminary',
    name: 'Preliminary Approval',
    nameAr: 'موافقة مبدئية',
    description: 'الموافقة المبدئية والانتقال لضبط العرض',
    permission: 'financing.review',
    applicableStatuses: ['UNDER_REVIEW'],
    targetStatus: 'ADMIN_SETUP',
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد الموافقة المبدئية على الطلب والانتقال لضبط العرض؟',
    icon: 'ThumbsUp',
    color: 'success'
  },
  {
    id: 'decline_application',
    name: 'Decline Application',
    nameAr: 'رفض الطلب',
    description: 'رفض طلب التمويل نهائياً',
    permission: 'financing.decline',
    applicableStatuses: ['UNDER_REVIEW', 'ADMIN_SETUP'],
    targetStatus: 'DECLINED',
    requiresConfirmation: true,
    confirmationMessage: 'هل أنت متأكد من رفض هذا الطلب؟ هذا الإجراء لا يمكن التراجع عنه.',
    icon: 'XCircle',
    color: 'destructive'
  },
  
  // ==========================================
  // إجراءات مرحلة الضبط
  // ==========================================
  {
    id: 'complete_setup',
    name: 'Complete Offer Setup',
    nameAr: 'إكمال ضبط العرض',
    description: 'حفظ تفاصيل العرض (القيمة، المدة، الاسم) والانتقال لمرحلة العرض الجاهز',
    permission: 'financing.setup',
    applicableStatuses: ['ADMIN_SETUP'],
    targetStatus: 'OFFER_READY',
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد حفظ تفاصيل العرض؟ تأكد من مراجعة جميع البيانات.',
    icon: 'Save',
    color: 'success'
  },
  
  // ==========================================
  // إجراءات مرحلة العقد
  // ==========================================
  {
    id: 'send_contract',
    name: 'Send Contract',
    nameAr: 'إرسال العقد',
    description: 'إنشاء وإرسال العقد PDF للعميل',
    permission: 'financing.contract.send',
    applicableStatuses: ['OFFER_READY'],
    targetStatus: 'CONTRACT_PHASE',
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد إرسال العقد للعميل؟ سيتم إنشاء ملف PDF رسمي.',
    icon: 'FileText',
    color: 'primary'
  },
  {
    id: 'finalize_contract',
    name: 'Finalize Contract',
    nameAr: 'اعتماد العقد',
    description: 'اعتماد العقد بعد توقيع العميل',
    permission: 'financing.contract.finalize',
    applicableStatuses: ['CONTRACT_PHASE'],
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد اعتماد العقد نهائياً؟',
    icon: 'BadgeCheck',
    color: 'success'
  },
  
  // ==========================================
  // إجراءات مرحلة الإقرار
  // ==========================================
  {
    id: 'send_acknowledgment',
    name: 'Send Acknowledgment',
    nameAr: 'إرسال الإقرار',
    description: 'إنشاء وإرسال إقرار الشروط للعميل',
    permission: 'financing.ack.send',
    applicableStatuses: ['CONTRACT_PHASE'],
    targetStatus: 'ACK_PHASE',
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد إرسال إقرار الشروط للعميل؟',
    icon: 'FileCheck',
    color: 'primary'
  },
  
  // ==========================================
  // إجراءات مرحلة سند الأمر
  // ==========================================
  {
    id: 'start_bond_issuance',
    name: 'Start Bond Issuance',
    nameAr: 'بدء إصدار السند',
    description: 'بدء إجراءات إصدار سند الأمر في نافذ',
    permission: 'financing.bond.issue',
    applicableStatuses: ['ACK_PHASE'],
    targetStatus: 'BOND_PHASE',
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد بدء إصدار سند الأمر؟',
    icon: 'Stamp',
    color: 'primary'
  },
  {
    id: 'confirm_bond_sent',
    name: 'Confirm Bond Notification',
    nameAr: 'تأكيد إرسال إشعار السند',
    description: 'تأكيد إرسال إشعار السند للعميل',
    permission: 'financing.bond.confirm',
    applicableStatuses: ['BOND_PHASE'],
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد تأكيد إرسال إشعار السند للعميل؟',
    icon: 'Bell',
    color: 'primary'
  },
  {
    id: 'confirm_bond_signed',
    name: 'Confirm Bond Signed',
    nameAr: 'تأكيد توقيع السند',
    description: 'تأكيد أن العميل وقّع على السند في نافذ',
    permission: 'financing.bond.confirm',
    applicableStatuses: ['BOND_PHASE'],
    targetStatus: 'CREDIT_PENDING',
    requiresConfirmation: true,
    confirmationMessage: 'هل تأكدت من توقيع العميل على السند في نافذ؟',
    icon: 'CheckSquare',
    color: 'success'
  },
  
  // ==========================================
  // إجراءات مرحلة التفعيل
  // ==========================================
  {
    id: 'activate_credit',
    name: 'Activate Credit',
    nameAr: 'تفعيل الرصيد',
    description: 'إضافة رصيد الخدمات لحساب العميل',
    permission: 'financing.credit.activate',
    applicableStatuses: ['CREDIT_PENDING'],
    targetStatus: 'CREDIT_ACTIVE',
    requiresConfirmation: true,
    confirmationMessage: 'هل تريد تفعيل رصيد الخدمات للعميل؟',
    icon: 'Wallet',
    color: 'success'
  }
];

/**
 * الحصول على الإجراءات المتاحة للحالة الحالية
 */
export function getActionsForStatus(status: ApplicationStatus): AdminAction[] {
  return ADMIN_ACTIONS.filter(action => 
    action.applicableStatuses.includes(status)
  );
}

/**
 * الحصول على الإجراءات حسب الصلاحية
 */
export function getActionsForPermission(permission: AdminPermission): AdminAction[] {
  return ADMIN_ACTIONS.filter(action => action.permission === permission);
}

/**
 * الحصول على إجراء معين
 */
export function getAction(actionId: string): AdminAction | undefined {
  return ADMIN_ACTIONS.find(action => action.id === actionId);
}

/**
 * التحقق من إمكانية تنفيذ إجراء
 */
export function canExecuteAction(
  actionId: string, 
  currentStatus: ApplicationStatus,
  userPermissions: AdminPermission[]
): boolean {
  const action = getAction(actionId);
  if (!action) return false;
  
  return (
    action.applicableStatuses.includes(currentStatus) &&
    userPermissions.includes(action.permission)
  );
}

/**
 * مصفوفة الصلاحيات والأوصاف
 */
export const PERMISSION_DESCRIPTIONS: Record<AdminPermission, string> = {
  'financing.view': 'عرض طلبات التمويل',
  'financing.review': 'مراجعة الطلبات والموافقة المبدئية',
  'financing.setup': 'ضبط تفاصيل العرض (القيمة، المدة، الاسم)',
  'financing.contract.send': 'إرسال العقود',
  'financing.contract.finalize': 'اعتماد العقود',
  'financing.ack.send': 'إرسال الإقرارات',
  'financing.bond.issue': 'إصدار سندات الأمر',
  'financing.bond.confirm': 'تأكيد إجراءات السند',
  'financing.credit.activate': 'تفعيل رصيد الخدمات',
  'financing.decline': 'رفض الطلبات',
  'financing.audit.view': 'عرض سجل التدقيق'
};
