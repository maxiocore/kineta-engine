/**
 * محتوى البريد الإلكتروني لكل حالة من حالات طلب التمويل
 * Email Content for Financing Application Status Updates
 * 
 * شركة علي صالح الشهري القابضة - MaxioCore
 */

import { FinancingApplicationStatus } from './types';

export interface EmailContent {
  /** عنوان البريد (Subject) */
  subject: string;
  /** العنوان الرئيسي داخل البريد */
  headline: string;
  /** وصف الحالة */
  description: string;
  /** نص زر الإجراء */
  ctaText: string;
  /** رابط زر الإجراء (نسبي) */
  ctaPath: string;
  /** ملاحظة إضافية */
  additionalNote?: string;
  /** نوع الإشعار للتنسيق */
  type: 'info' | 'success' | 'warning' | 'error';
  /** النسخة النصية */
  plainText: string;
}

// ملاحظة التمويل غير النقدي الثابتة
export const FINANCING_DISCLAIMER = `تنويه مهم: التمويل غير نقدي ويتم إضافة القيمة كرصيد خدمات داخل المنصة ولا يمكن سحبها أو تحويلها. رصيد الخدمات مخصص حصريًا لشراء خدمات شركة علي صالح الشهري القابضة والجهات التابعة لها.`;

export const EMAIL_CONTENT: Partial<Record<FinancingApplicationStatus, EmailContent>> = {
  SUBMITTED: {
    subject: 'تم استلام طلب تمويل الخدمات | MaxioCore',
    headline: 'تم استلام طلبكم بنجاح',
    description: 'شكرًا لتقديمكم طلب تمويل الخدمات. تم استلام طلبكم وسيتم مراجعته من قِبل الفريق المختص في أقرب وقت ممكن. سنقوم بإشعاركم بأي تحديثات على حالة الطلب.',
    ctaText: 'عرض حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    plainText: `تم استلام طلب تمويل الخدمات الخاص بكم بنجاح.

شكرًا لتقديمكم الطلب. سيتم مراجعته من قِبل الفريق المختص وسنقوم بإشعاركم بأي تحديثات.

${FINANCING_DISCLAIMER}`
  },

  UNDER_REVIEW: {
    subject: 'طلبكم قيد المراجعة | MaxioCore',
    headline: 'طلبكم قيد المراجعة',
    description: 'يقوم فريقنا المختص حاليًا بمراجعة طلب تمويل الخدمات المقدم منكم. تستغرق هذه المرحلة عادةً من يوم إلى ثلاثة أيام عمل. سنقوم بإشعاركم فور وجود أي تحديث.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    plainText: `طلب تمويل الخدمات الخاص بكم قيد المراجعة الآن.

يقوم فريقنا المختص بمراجعة طلبكم وسنوافيكم بالنتيجة قريبًا.

${FINANCING_DISCLAIMER}`
  },

  ADDITIONAL_INFO_REQUIRED: {
    subject: '⚠️ مطلوب معلومات إضافية لطلب التمويل | MaxioCore',
    headline: 'مطلوب معلومات إضافية',
    description: 'لاستكمال دراسة طلبكم، نحتاج إلى بعض المعلومات أو المستندات الإضافية. يُرجى تزويدنا بها خلال 14 يومًا لضمان استمرارية معالجة طلبكم.',
    ctaText: 'رفع المستندات المطلوبة',
    ctaPath: '/dashboard/financing/documents',
    additionalNote: 'المهلة المتاحة: 14 يومًا من تاريخ هذا الإشعار. عدم الاستجابة قد يؤدي لانتهاء صلاحية الطلب.',
    type: 'warning',
    plainText: `مطلوب معلومات إضافية لطلب تمويل الخدمات.

لاستكمال دراسة طلبكم، نحتاج إلى بعض المستندات الإضافية. يُرجى الدخول للمنصة وتحميل المستندات المطلوبة خلال 14 يومًا.

${FINANCING_DISCLAIMER}`
  },

  APPROVED: {
    subject: '✅ تهانينا! تمت الموافقة على طلب التمويل | MaxioCore',
    headline: 'تهانينا! تمت الموافقة على طلبكم',
    description: 'يسرنا إبلاغكم بالموافقة على طلب تمويل الخدمات الخاص بكم بالكامل. الخطوة التالية هي مراجعة العقد والموافقة عليه إلكترونيًا لاستكمال العملية.',
    ctaText: 'مراجعة العقد والتوقيع',
    ctaPath: '/dashboard/financing/contract',
    type: 'success',
    plainText: `تهانينا! تمت الموافقة على طلب تمويل الخدمات.

يسرنا إبلاغكم بالموافقة على طلبكم. يُرجى الدخول للمنصة لمراجعة العقد والتوقيع إلكترونيًا.

${FINANCING_DISCLAIMER}`
  },

  APPROVED_WITH_LIMITS: {
    subject: '✅ تمت الموافقة على طلب التمويل بقيمة معدّلة | MaxioCore',
    headline: 'تمت الموافقة بقيمة معدّلة',
    description: 'تمت الموافقة على طلب تمويل الخدمات الخاص بكم بقيمة معدّلة بناءً على دراسة الطلب. يمكنكم مراجعة التفاصيل والقيمة المعتمدة في العقد المرفق.',
    ctaText: 'مراجعة العقد والقيمة المعتمدة',
    ctaPath: '/dashboard/financing/contract',
    additionalNote: 'في حال عدم الموافقة على القيمة المعدّلة، يمكنكم رفض العقد وتقديم طلب جديد لاحقًا.',
    type: 'success',
    plainText: `تمت الموافقة على طلب تمويل الخدمات بقيمة معدّلة.

يُرجى الدخول للمنصة لمراجعة العقد والقيمة المعتمدة.

${FINANCING_DISCLAIMER}`
  },

  CONTRACT_PRESENTED: {
    subject: '📄 العقد جاهز للتوقيع | MaxioCore',
    headline: 'العقد جاهز للمراجعة والتوقيع',
    description: 'تم إعداد عقد تمويل الخدمات الخاص بكم. يُرجى مراجعة جميع البنود والشروط بعناية قبل التوقيع الإلكتروني. المهلة المتاحة للتوقيع: 7 أيام.',
    ctaText: 'عرض العقد والتوقيع',
    ctaPath: '/dashboard/financing/contract',
    additionalNote: 'عدم التوقيع خلال 7 أيام سيؤدي لانتهاء صلاحية العرض.',
    type: 'info',
    plainText: `العقد جاهز للمراجعة والتوقيع.

تم إعداد عقد تمويل الخدمات الخاص بكم. يُرجى الدخول للمنصة لمراجعة العقد والتوقيع إلكترونيًا خلال 7 أيام.

${FINANCING_DISCLAIMER}`
  },

  CONTRACT_ACCEPTED: {
    subject: '✅ تم قبول العقد بنجاح | MaxioCore',
    headline: 'تم قبول العقد بنجاح',
    description: 'شكرًا لتوقيعكم على عقد تمويل الخدمات. العقد الآن بانتظار الاعتماد النهائي من الإدارة المختصة. سنقوم بإشعاركم فور اعتماد العقد وإضافة رصيد الخدمات.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'success',
    plainText: `تم قبول العقد بنجاح.

شكرًا لتوقيعكم على العقد. بانتظار الاعتماد النهائي وسنقوم بإشعاركم قريبًا.

${FINANCING_DISCLAIMER}`
  },

  CONTRACT_FINALIZED: {
    subject: '🎉 تم اعتماد العقد رسميًا | MaxioCore',
    headline: 'تم اعتماد العقد رسميًا',
    description: 'تم اعتماد عقد تمويل الخدمات الخاص بكم بشكل نهائي. جارٍ الآن إضافة رصيد الخدمات إلى حسابكم. سنقوم بإشعاركم فور تفعيل الرصيد.',
    ctaText: 'عرض حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'success',
    plainText: `تم اعتماد العقد رسميًا.

جارٍ إضافة رصيد الخدمات إلى حسابكم وسنقوم بإشعاركم فور التفعيل.

${FINANCING_DISCLAIMER}`
  },

  CREDIT_DEPOSITED: {
    subject: '🎉 رصيد الخدمات جاهز للاستخدام! | MaxioCore',
    headline: 'رصيد الخدمات جاهز للاستخدام!',
    description: 'تم بنجاح إضافة رصيد الخدمات إلى حسابكم. يمكنكم الآن استخدامه لشراء الخدمات المتاحة داخل منصة MaxioCore. صلاحية الرصيد: 12 شهرًا.',
    ctaText: 'تصفّح الخدمات واستخدم الرصيد',
    ctaPath: '/dashboard/services',
    additionalNote: 'استكشفوا مجموعة الخدمات المتاحة واستفيدوا من رصيدكم الآن.',
    type: 'success',
    plainText: `رصيد الخدمات جاهز للاستخدام!

تم إضافة رصيد الخدمات إلى حسابكم بنجاح. يمكنكم استخدامه الآن لشراء الخدمات داخل المنصة. صلاحية الرصيد: 12 شهرًا.

${FINANCING_DISCLAIMER}`
  },

  DECLINED: {
    subject: 'نتيجة طلب تمويل الخدمات | MaxioCore',
    headline: 'نتيجة طلب التمويل',
    description: 'نأسف لإبلاغكم بأنه لم يتم الموافقة على طلب تمويل الخدمات في الوقت الحالي، وذلك لعدم استيفاء بعض متطلبات الأهلية. يمكنكم التقدم بطلب جديد في أي وقت.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    additionalNote: 'قرار الرفض لا يعكس تقييمًا شخصيًا ويمكنكم المحاولة مجددًا بعد استيفاء المتطلبات.',
    type: 'error',
    plainText: `نتيجة طلب تمويل الخدمات.

نأسف، لم تتم الموافقة على طلبكم الحالي لعدم استيفاء بعض متطلبات الأهلية. يمكنكم تقديم طلب جديد في أي وقت.`
  },

  EXPIRED: {
    subject: 'انتهت صلاحية طلب التمويل | MaxioCore',
    headline: 'انتهت صلاحية الطلب',
    description: 'نأسف لإبلاغكم بأن طلب تمويل الخدمات قد انتهت صلاحيته بسبب عدم استكمال الإجراءات المطلوبة خلال المهلة المحددة. يمكنكم التقدم بطلب جديد في أي وقت.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    type: 'warning',
    plainText: `انتهت صلاحية طلب تمويل الخدمات.

لم يتم استكمال الإجراءات المطلوبة خلال المهلة المحددة. يمكنكم تقديم طلب جديد في أي وقت.`
  },

  CANCELLED: {
    subject: 'تم إلغاء طلب التمويل | MaxioCore',
    headline: 'تم إلغاء الطلب',
    description: 'تم إلغاء طلب تمويل الخدمات بناءً على طلبكم. لم يتم اتخاذ أي إجراء على الطلب. يمكنكم التقدم بطلب جديد في أي وقت تشاؤون.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    type: 'info',
    plainText: `تم إلغاء طلب تمويل الخدمات.

تم إلغاء طلبكم بنجاح. يمكنكم تقديم طلب جديد في أي وقت.`
  }
};

/**
 * الحصول على محتوى البريد لحالة معينة
 */
export function getEmailContent(status: FinancingApplicationStatus): EmailContent | null {
  return EMAIL_CONTENT[status] || null;
}

/**
 * التحقق مما إذا كانت الحالة تتطلب إرسال بريد
 */
export function shouldSendEmail(status: FinancingApplicationStatus): boolean {
  return !!EMAIL_CONTENT[status];
}

/**
 * الحصول على جميع الحالات التي تتطلب إرسال بريد
 */
export function getEmailTriggerStatuses(): FinancingApplicationStatus[] {
  return Object.keys(EMAIL_CONTENT) as FinancingApplicationStatus[];
}
