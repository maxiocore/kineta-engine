/**
 * نظام حالات طلب تمويل الخدمات - الإصدار الثاني
 * Service Financing Application State Machine V2
 * 
 * MaxioCore - Ali Saleh Al-Shehri Holding Company
 * 
 * ⚠️ تنبيه: التمويل غير نقدي - رصيد خدمات داخل المنصة فقط
 */

// ==========================================
// حالات الطلب الرئيسية
// ==========================================
export type ApplicationStatus =
  | 'DRAFT'                    // مسودة
  | 'REQUEST_SUBMITTED'        // طلب مقدم (بدون تفاصيل نهائية)
  | 'UNDER_REVIEW'             // قيد المراجعة
  | 'INFO_REQUIRED'            // مطلوب معلومات إضافية
  | 'ADMIN_SETUP'              // الأدمن يضبط التفاصيل
  | 'OFFER_READY'              // العرض جاهز
  | 'CONTRACT_PHASE'           // مرحلة العقد
  | 'ACK_PHASE'                // مرحلة الإقرار
  | 'BOND_PHASE'               // مرحلة سند الأمر
  | 'CREDIT_PENDING'           // قيد إضافة الرصيد
  | 'CREDIT_ACTIVE'            // رصيد الخدمات نشط
  | 'IN_USE'                   // جاري الاستخدام
  | 'COMPLETED'                // مكتمل
  | 'DECLINED'                 // مرفوض
  | 'CANCELLED'                // ملغي
  | 'EXPIRED';                 // منتهي الصلاحية

// ==========================================
// حالات العقد
// ==========================================
export type ContractStatus =
  | 'NOT_SENT'       // لم يُرسل بعد
  | 'SENT'           // تم الإرسال
  | 'VIEWED'         // تم الاطلاع
  | 'SIGNED'         // تم التوقيع
  | 'FINALIZED'      // معتمد
  | 'EXPIRED'        // منتهي
  | 'REJECTED';      // مرفوض

// ==========================================
// حالات الإقرار
// ==========================================
export type AcknowledgmentStatus =
  | 'NOT_SENT'       // لم يُرسل بعد
  | 'SENT'           // تم الإرسال
  | 'VIEWED'         // تم الاطلاع
  | 'SIGNED';        // تم التوقيع

// ==========================================
// حالات سند الأمر
// ==========================================
export type ExecutiveBondStatus =
  | 'NOT_ISSUED'     // لم يصدر بعد
  | 'ISSUING'        // جاري الإصدار (نافذ)
  | 'ISSUED'         // تم الإصدار
  | 'SENT'           // تم إرسال الإشعار
  | 'SIGNED';        // موقّع من العميل

// ==========================================
// من يمكنه تحفيز الانتقال
// ==========================================
export type TransitionActor = 'customer' | 'admin' | 'system';

// ==========================================
// المراحل الرئيسية
// ==========================================
export type WorkflowPhase =
  | 'application'    // مرحلة الطلب
  | 'admin_setup'    // مرحلة الضبط الإداري
  | 'contract'       // مرحلة العقد
  | 'acknowledgment' // مرحلة الإقرار
  | 'bond'           // مرحلة سند الأمر
  | 'activation'     // مرحلة التفعيل
  | 'usage'          // مرحلة الاستخدام
  | 'terminal';      // حالة نهائية

// ==========================================
// تعريف الانتقال
// ==========================================
export interface StateTransition<T extends string = string> {
  from: T;
  to: T;
  actors: TransitionActor[];
  condition?: string;
  conditionAr?: string;
  timeoutDays?: number;
  requiresAudit: boolean;
  customerVisible: boolean;
}

// ==========================================
// تعريف الحالة
// ==========================================
export interface StateDefinition<T extends string = string> {
  status: T;
  nameAr: string;
  nameEn: string;
  description: string;
  customerMessage: string;
  phase: WorkflowPhase;
  isTerminal: boolean;
  requiredAction?: string;
  requiredActionActor?: TransitionActor;
  timeoutDays?: number;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'orange';
  icon: string;
  customerVisible: boolean;
}

// ==========================================
// نتيجة التحقق من الانتقال
// ==========================================
export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
  errorAr?: string;
}

// ==========================================
// ضبط العرض الإداري
// ==========================================
export interface OfferSetup {
  id: string;
  applicationId: string;
  approvedAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  firstInstallmentDate: string;
  fullNameFromId: string;
  nationalIdVerified: boolean;
  adminNotes?: string;
  setupBy: string;
  setupAt: string;
  updatedBy?: string;
  updatedAt: string;
}

// ==========================================
// سجل التدقيق المتقدم
// ==========================================
export interface WorkflowAuditEntry {
  id: string;
  applicationId: string;
  entityType: 'application' | 'contract' | 'acknowledgment' | 'bond' | 'offer_setup';
  entityId?: string;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  actorId?: string;
  actorRole: TransitionActor;
  actorEmail?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
  createdAt: string;
  isCustomerVisible: boolean;
}

// ==========================================
// صلاحيات الأدمن
// ==========================================
export type AdminPermission =
  | 'financing.view'                  // عرض الطلبات
  | 'financing.review'                // مراجعة الطلبات
  | 'financing.setup'                 // ضبط العرض
  | 'financing.contract.send'         // إرسال العقد
  | 'financing.contract.finalize'     // اعتماد العقد
  | 'financing.ack.send'              // إرسال الإقرار
  | 'financing.bond.issue'            // إصدار السند
  | 'financing.bond.confirm'          // تأكيد إرسال إشعار السند
  | 'financing.credit.activate'       // تفعيل الرصيد
  | 'financing.decline'               // رفض الطلب
  | 'financing.audit.view';           // عرض سجل التدقيق

// ==========================================
// إجراء الأدمن
// ==========================================
export interface AdminAction {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  permission: AdminPermission;
  applicableStatuses: ApplicationStatus[];
  targetStatus?: ApplicationStatus;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'destructive';
}

// ==========================================
// حالة Workflow الكاملة
// ==========================================
export interface FinancingWorkflowState {
  application: {
    id: string;
    status: ApplicationStatus;
    phase: WorkflowPhase;
  };
  contract?: {
    id: string;
    status: ContractStatus;
  };
  acknowledgment?: {
    id: string;
    status: AcknowledgmentStatus;
  };
  bond?: {
    id: string;
    status: ExecutiveBondStatus;
  };
  offerSetup?: OfferSetup;
}
