/**
 * نصوص حالات طلب تمويل الخدمات
 * محتوى عربي رسمي بصياغة بنكية عالية الثقة
 * 
 * ASH HOLDING - Ali Saleh Al-Shehri Holding Company
 * ملاحظة: التمويل غير نقدي - رصيد خدمات داخل المنصة فقط
 */

import { FinancingApplicationStatus } from './types';

export interface StateContent {
  /** عنوان قصير - سطر واحد */
  title: string;
  /** وصف مبسط - 2-3 سطور */
  description: string;
  /** الخطوة التالية - Call to Action */
  nextAction: string;
  /** رسالة إضافية توضيحية */
  additionalNote?: string;
  /** رسالة تأكيد طبيعة التمويل */
  financingNote?: string;
  /** رسالة للإشعارات */
  notificationMessage: string;
  /** رسالة SMS قصيرة */
  smsMessage: string;
}

export const STATE_CONTENT: Record<FinancingApplicationStatus, StateContent> = {
  DRAFT: {
    title: 'طلب تمويل خدمات قيد الإعداد',
    description: 'لم يتم إرسال طلبكم بعد. يُرجى استكمال البيانات والمستندات المطلوبة للمتابعة في عملية التقديم على تمويل الخدمات.',
    nextAction: 'استكمال الطلب وإرساله',
    additionalNote: 'تأكد من صحة جميع البيانات قبل الإرسال لتسريع عملية المراجعة.',
    financingNote: 'تمويل الخدمات يُضاف كرصيد خدمات داخل المنصة ولا يُصرف نقدًا.',
    notificationMessage: 'طلب تمويل الخدمات الخاص بكم قيد الإعداد. أكملوا البيانات للمتابعة.',
    smsMessage: 'ASH HOLDING: طلبكم قيد الإعداد. أكملوا البيانات للمتابعة.'
  },

  SUBMITTED: {
    title: 'تم استلام طلبكم بنجاح',
    description: 'شكرًا لتقديمكم طلب تمويل الخدمات. تم استلام طلبكم وسيتم مراجعته من قِبل الفريق المختص في أقرب وقت ممكن.',
    nextAction: 'انتظار المراجعة الأولية',
    additionalNote: 'سيتم إشعاركم فور وجود أي تحديث على حالة طلبكم.',
    notificationMessage: 'تم استلام طلب تمويل الخدمات الخاص بكم بنجاح. سنتواصل معكم قريبًا.',
    smsMessage: 'ASH HOLDING: تم استلام طلب التمويل بنجاح. رقم الطلب: {application_number}'
  },

  UNDER_REVIEW: {
    title: 'طلبكم قيد المراجعة',
    description: 'يقوم فريقنا المختص حاليًا بمراجعة طلب تمويل الخدمات المقدم منكم. تستغرق هذه المرحلة عادةً من يوم إلى ثلاثة أيام عمل.',
    nextAction: 'انتظار نتيجة المراجعة',
    additionalNote: 'قد نتواصل معكم في حال الحاجة لأي استفسارات إضافية.',
    notificationMessage: 'طلب تمويل الخدمات الخاص بكم قيد المراجعة من الفريق المختص.',
    smsMessage: 'ASH HOLDING: طلبكم قيد المراجعة. سنوافيكم بالنتيجة قريبًا.'
  },

  ADDITIONAL_INFO_REQUIRED: {
    title: 'مطلوب معلومات إضافية',
    description: 'لاستكمال دراسة طلبكم، نحتاج إلى بعض المعلومات أو المستندات الإضافية. يُرجى تزويدنا بها في أقرب وقت لضمان استمرارية معالجة طلبكم.',
    nextAction: 'تحميل المستندات المطلوبة',
    additionalNote: 'المهلة المتاحة: 14 يومًا من تاريخ هذا الإشعار. عدم الاستجابة قد يؤدي لانتهاء صلاحية الطلب.',
    notificationMessage: 'يُرجى تزويدنا بالمستندات الإضافية المطلوبة لاستكمال طلبكم.',
    smsMessage: 'ASH HOLDING: مطلوب مستندات إضافية لطلبكم. يرجى الدخول للمنصة.'
  },

  RISK_CHECK: {
    title: 'جارٍ التحقق من الطلب',
    description: 'يتم حاليًا إجراء عمليات التحقق اللازمة للطلب المقدم. هذه خطوة روتينية ضمن إجراءات الموافقة المعتمدة.',
    nextAction: 'انتظار اكتمال التحقق',
    additionalNote: 'لا يتطلب هذا أي إجراء من طرفكم. سيتم إشعاركم فور الانتهاء.',
    notificationMessage: 'جارٍ إجراء التحققات اللازمة لطلب تمويل الخدمات الخاص بكم.',
    smsMessage: 'ASH HOLDING: جارٍ التحقق من طلبكم. سنوافيكم بالنتيجة قريبًا.'
  },

  APPROVED: {
    title: 'تهانينا! تمت الموافقة على طلبكم',
    description: 'يسرنا إبلاغكم بالموافقة على طلب تمويل الخدمات الخاص بكم بالكامل. الخطوة التالية هي مراجعة العقد والموافقة عليه إلكترونيًا.',
    nextAction: 'مراجعة العقد والتوقيع',
    financingNote: 'سيتم إضافة قيمة التمويل كرصيد خدمات في حسابكم داخل المنصة فور اعتماد العقد. هذا الرصيد مخصص حصريًا لشراء الخدمات ولا يُصرف نقدًا.',
    notificationMessage: 'تهانينا! تمت الموافقة على طلب تمويل الخدمات. راجعوا العقد للمتابعة.',
    smsMessage: 'ASH HOLDING: تهانينا! تمت الموافقة على طلب التمويل. راجعوا العقد في المنصة.'
  },

  APPROVED_WITH_LIMITS: {
    title: 'تمت الموافقة بقيمة معدّلة',
    description: 'تمت الموافقة على طلب تمويل الخدمات الخاص بكم بقيمة معدّلة بناءً على دراسة الطلب. يمكنكم مراجعة التفاصيل في العقد المرفق.',
    nextAction: 'مراجعة العقد والموافقة على القيمة المعتمدة',
    financingNote: 'المبلغ المعتمد سيُضاف كرصيد خدمات داخل المنصة ولا يُصرف نقدًا. يمكن استخدامه لشراء خدمات شركة علي صالح الشهري القابضة والجهات التابعة لها.',
    additionalNote: 'في حال عدم الموافقة على القيمة المعدّلة، يمكنكم رفض العقد وتقديم طلب جديد لاحقًا.',
    notificationMessage: 'تمت الموافقة على طلبكم بقيمة معدّلة. راجعوا التفاصيل في العقد.',
    smsMessage: 'ASH HOLDING: تمت الموافقة بقيمة معدّلة. راجعوا العقد في المنصة.'
  },

  DECLINED: {
    title: 'لم تتم الموافقة على الطلب',
    description: 'نأسف لإبلاغكم بأنه لم يتم الموافقة على طلب تمويل الخدمات في الوقت الحالي، وذلك لعدم استيفاء بعض متطلبات الأهلية.',
    nextAction: 'يمكنكم تقديم طلب جديد بعد مراجعة متطلبات الأهلية',
    additionalNote: 'قرار الرفض لا يعكس تقييمًا شخصيًا. يمكنكم التقدم بطلب جديد في أي وقت بعد استيفاء المتطلبات.',
    notificationMessage: 'نأسف، لم تتم الموافقة على طلبكم الحالي. يمكنكم تقديم طلب جديد لاحقًا.',
    smsMessage: 'ASH HOLDING: نأسف، لم تتم الموافقة على طلبكم. يمكنكم التقدم بطلب جديد.'
  },

  CONTRACT_PRESENTED: {
    title: 'العقد جاهز للمراجعة والتوقيع',
    description: 'تم إعداد عقد تمويل الخدمات الخاص بكم. يُرجى مراجعة جميع البنود والشروط بعناية قبل التوقيع الإلكتروني.',
    nextAction: 'مراجعة العقد والتوقيع إلكترونيًا',
    additionalNote: 'المهلة المتاحة للتوقيع: 7 أيام. عدم التوقيع خلال هذه المدة سيؤدي لانتهاء صلاحية العرض.',
    financingNote: 'يُرجى ملاحظة أن هذا تمويل خدمات غير نقدي. القيمة المعتمدة ستُضاف كرصيد خدمات يُستخدم حصريًا داخل منصة ASH HOLDING.',
    notificationMessage: 'عقد تمويل الخدمات جاهز للتوقيع. راجعوه ووقّعوا إلكترونيًا.',
    smsMessage: 'ASH HOLDING: العقد جاهز للتوقيع. ادخلوا المنصة للمراجعة والتوقيع خلال 7 أيام.'
  },

  CONTRACT_ACCEPTED: {
    title: 'تم قبول العقد بنجاح',
    description: 'شكرًا لتوقيعكم على عقد تمويل الخدمات. العقد الآن بانتظار الاعتماد النهائي من الإدارة المختصة.',
    nextAction: 'انتظار الاعتماد النهائي',
    additionalNote: 'سيتم إشعاركم فور اعتماد العقد وإضافة رصيد الخدمات لحسابكم.',
    notificationMessage: 'تم قبول العقد بنجاح. بانتظار الاعتماد النهائي.',
    smsMessage: 'ASH HOLDING: تم قبول العقد. بانتظار الاعتماد النهائي.'
  },

  CONTRACT_FINALIZED: {
    title: 'تم اعتماد العقد رسميًا',
    description: 'تم اعتماد عقد تمويل الخدمات الخاص بكم بشكل نهائي. جارٍ الآن إضافة رصيد الخدمات إلى حسابكم.',
    nextAction: 'انتظار تفعيل رصيد الخدمات',
    financingNote: 'سيتم إضافة الرصيد خلال لحظات. هذا الرصيد مخصص حصريًا لشراء الخدمات داخل المنصة ولا يمكن سحبه أو تحويله نقدًا.',
    notificationMessage: 'تم اعتماد العقد! جارٍ إضافة رصيد الخدمات لحسابكم.',
    smsMessage: 'ASH HOLDING: تم اعتماد العقد! جارٍ تفعيل رصيد الخدمات.'
  },

  CREDIT_DEPOSIT_PENDING: {
    title: 'جارٍ إضافة رصيد الخدمات',
    description: 'يتم حاليًا إضافة رصيد الخدمات إلى حسابكم. ستكتمل العملية خلال لحظات قليلة.',
    nextAction: 'انتظار اكتمال العملية',
    financingNote: 'رصيد الخدمات مخصص للاستخدام داخل منصة ASH HOLDING وخدمات شركة علي صالح الشهري القابضة والجهات التابعة لها فقط.',
    notificationMessage: 'جارٍ إضافة رصيد الخدمات إلى حسابكم...',
    smsMessage: 'ASH HOLDING: جارٍ تفعيل رصيد الخدمات في حسابكم.'
  },

  CREDIT_DEPOSITED: {
    title: 'رصيد الخدمات جاهز للاستخدام',
    description: 'تم بنجاح إضافة رصيد الخدمات إلى حسابكم. يمكنكم الآن استخدامه لشراء الخدمات المتاحة داخل المنصة.',
    nextAction: 'تصفّح الخدمات واستخدام الرصيد',
    financingNote: 'تذكير: رصيد الخدمات مخصص حصريًا لشراء الخدمات داخل المنصة. لا يمكن سحبه نقدًا أو تحويله. صلاحية الرصيد: 12 شهرًا.',
    additionalNote: 'استكشفوا مجموعة الخدمات المتاحة واستفيدوا من رصيدكم الآن.',
    notificationMessage: 'رصيد الخدمات جاهز! ابدأوا باستخدامه لشراء الخدمات.',
    smsMessage: 'ASH HOLDING: رصيدكم جاهز! استخدموه الآن لشراء الخدمات. صلاحيته 12 شهرًا.'
  },

  ORDER_PAYMENT_IN_PROGRESS: {
    title: 'جارٍ تنفيذ طلب الخدمة',
    description: 'يتم حاليًا تطبيق رصيد الخدمات على طلبكم. يُرجى عدم إغلاق الصفحة حتى اكتمال العملية.',
    nextAction: 'انتظار اكتمال العملية',
    notificationMessage: 'جارٍ استخدام رصيد الخدمات لإتمام طلبكم...',
    smsMessage: 'ASH HOLDING: جارٍ تنفيذ طلبكم باستخدام رصيد الخدمات.'
  },

  COMPLETED: {
    title: 'اكتمل استخدام رصيد الخدمات',
    description: 'تم استخدام رصيد الخدمات بالكامل بنجاح. شكرًا لثقتكم في خدمات منصة ASH HOLDING.',
    nextAction: 'استكشاف المزيد من الخدمات أو تقديم طلب تمويل جديد',
    additionalNote: 'يمكنكم التقدم بطلب تمويل خدمات جديد في أي وقت.',
    notificationMessage: 'تم استخدام رصيد الخدمات بالكامل. شكرًا لثقتكم.',
    smsMessage: 'ASH HOLDING: اكتمل استخدام رصيدكم. شكرًا لثقتكم!'
  },

  EXPIRED: {
    title: 'انتهت صلاحية الطلب',
    description: 'نأسف لإبلاغكم بأن طلب تمويل الخدمات قد انتهت صلاحيته بسبب عدم استكمال الإجراءات المطلوبة خلال المهلة المحددة.',
    nextAction: 'تقديم طلب جديد',
    additionalNote: 'يمكنكم التقدم بطلب تمويل خدمات جديد في أي وقت.',
    notificationMessage: 'انتهت صلاحية طلبكم. يمكنكم تقديم طلب جديد.',
    smsMessage: 'ASH HOLDING: انتهت صلاحية طلبكم. يمكنكم تقديم طلب جديد.'
  },

  CANCELLED: {
    title: 'تم إلغاء الطلب',
    description: 'تم إلغاء طلب تمويل الخدمات بناءً على طلبكم. لم يتم اتخاذ أي إجراء على الطلب.',
    nextAction: 'تقديم طلب جديد عند الرغبة',
    additionalNote: 'يمكنكم التقدم بطلب تمويل خدمات جديد في أي وقت تشاؤون.',
    notificationMessage: 'تم إلغاء طلبكم بنجاح. يمكنكم تقديم طلب جديد.',
    smsMessage: 'ASH HOLDING: تم إلغاء طلبكم. يمكنكم تقديم طلب جديد.'
  }
};

/**
 * الحصول على محتوى حالة معينة
 */
export function getStateContent(status: FinancingApplicationStatus): StateContent {
  return STATE_CONTENT[status];
}

/**
 * الحصول على رسالة الإشعار لحالة معينة
 */
export function getNotificationMessage(
  status: FinancingApplicationStatus,
  variables?: Record<string, string>
): string {
  let message = STATE_CONTENT[status].notificationMessage;
  
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
  }
  
  return message;
}

/**
 * الحصول على رسالة SMS لحالة معينة
 */
export function getSmsMessage(
  status: FinancingApplicationStatus,
  variables?: Record<string, string>
): string {
  let message = STATE_CONTENT[status].smsMessage;
  
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
  }
  
  return message;
}

/**
 * التحقق من أن الحالة تتضمن ملاحظة عن طبيعة التمويل
 */
export function hasFinancingNote(status: FinancingApplicationStatus): boolean {
  return !!STATE_CONTENT[status].financingNote;
}

/**
 * الحصول على جميع الحالات التي تتطلب توضيح طبيعة التمويل
 */
export function getStatesWithFinancingNote(): FinancingApplicationStatus[] {
  return (Object.keys(STATE_CONTENT) as FinancingApplicationStatus[])
    .filter(status => hasFinancingNote(status));
}