/**
 * =====================================================
 * MaxioCore Financing Application Journey Configuration
 * =====================================================
 * 
 * Professional FinTech Lending Journey Design
 * Based on Bank-Grade UX Patterns
 * 
 * @author Senior Product Designer - FinTech Lending Journeys
 * @version 2.0
 */

// =====================================================
// 1. JOURNEY STRUCTURE - SCREENS & STATES
// =====================================================

export type JourneyScreen = 
  | 'welcome'           // شاشة الترحيب والتعريف
  | 'eligibility'       // فحص الأهلية
  | 'identity'          // التحقق من الهوية (KYC)
  | 'employment'        // معلومات التوظيف
  | 'financing_details' // تفاصيل التمويل المطلوب
  | 'terms_disclosure'  // الإفصاح عن الشروط والرسوم
  | 'review'            // مراجعة الطلب
  | 'verification'      // التحقق النهائي (OTP)
  | 'decision'          // نتيجة القرار
  | 'contract'          // توقيع العقد
  | 'completion';       // اكتمال الطلب

export type DecisionState = 
  | 'approved'          // موافقة كاملة
  | 'approved_limited'  // موافقة بحد أقل
  | 'pending_review'    // بانتظار المراجعة اليدوية
  | 'declined'          // مرفوض
  | 'documents_required'; // مستندات إضافية مطلوبة

// =====================================================
// 2. JOURNEY SCREENS CONFIGURATION
// =====================================================

export interface ScreenConfig {
  id: JourneyScreen;
  order: number;
  title: string;
  title_ar: string;
  subtitle: string;
  subtitle_ar: string;
  icon: string;
  estimatedTime: string; // بالدقائق
  canSkip: boolean;
  canGoBack: boolean;
  requiredFields: string[];
  validations: string[];
}

export const JOURNEY_SCREENS: Record<JourneyScreen, ScreenConfig> = {
  welcome: {
    id: 'welcome',
    order: 0,
    title: 'Welcome',
    title_ar: 'مرحباً بك في تمويل MaxioCore',
    subtitle: 'Get financing for your digital services',
    subtitle_ar: 'احصل على تمويل لخدماتك الرقمية بدون فوائد',
    icon: 'Sparkles',
    estimatedTime: '1',
    canSkip: false,
    canGoBack: false,
    requiredFields: [],
    validations: []
  },
  eligibility: {
    id: 'eligibility',
    order: 1,
    title: 'Eligibility Check',
    title_ar: 'فحص الأهلية',
    subtitle: 'Quick assessment of your eligibility',
    subtitle_ar: 'تقييم سريع لأهليتك للتمويل',
    icon: 'UserCheck',
    estimatedTime: '2',
    canSkip: false,
    canGoBack: true,
    requiredFields: ['nationality', 'age', 'employment_status'],
    validations: ['age_18_plus', 'valid_nationality', 'employment_active']
  },
  identity: {
    id: 'identity',
    order: 2,
    title: 'Identity Verification',
    title_ar: 'التحقق من الهوية',
    subtitle: 'Verify your identity securely',
    subtitle_ar: 'تحقق من هويتك بشكل آمن',
    icon: 'Fingerprint',
    estimatedTime: '3',
    canSkip: false,
    canGoBack: true,
    requiredFields: ['national_id', 'full_name', 'date_of_birth'],
    validations: ['valid_national_id', 'name_match', 'id_not_expired']
  },
  employment: {
    id: 'employment',
    order: 3,
    title: 'Employment Information',
    title_ar: 'معلومات التوظيف',
    subtitle: 'Tell us about your work',
    subtitle_ar: 'أخبرنا عن عملك',
    icon: 'Briefcase',
    estimatedTime: '2',
    canSkip: false,
    canGoBack: true,
    requiredFields: ['employment_type', 'employer_name', 'monthly_income'],
    validations: ['income_minimum', 'employment_duration']
  },
  financing_details: {
    id: 'financing_details',
    order: 4,
    title: 'Financing Request',
    title_ar: 'تفاصيل التمويل',
    subtitle: 'Choose your financing plan',
    subtitle_ar: 'اختر خطة التمويل المناسبة',
    icon: 'CreditCard',
    estimatedTime: '3',
    canSkip: false,
    canGoBack: true,
    requiredFields: ['amount', 'plan_id', 'service_type'],
    validations: ['amount_within_limit', 'plan_available']
  },
  terms_disclosure: {
    id: 'terms_disclosure',
    order: 5,
    title: 'Terms & Fees Disclosure',
    title_ar: 'الإفصاح عن الشروط والرسوم',
    subtitle: 'Review all terms and fees',
    subtitle_ar: 'راجع جميع الشروط والرسوم',
    icon: 'FileText',
    estimatedTime: '3',
    canSkip: false,
    canGoBack: true,
    requiredFields: ['accept_terms', 'acknowledge_fees'],
    validations: ['terms_read_time', 'scroll_to_bottom']
  },
  review: {
    id: 'review',
    order: 6,
    title: 'Review Application',
    title_ar: 'مراجعة الطلب',
    subtitle: 'Confirm your information',
    subtitle_ar: 'تأكد من صحة معلوماتك',
    icon: 'Eye',
    estimatedTime: '2',
    canSkip: false,
    canGoBack: true,
    requiredFields: ['confirm_accuracy'],
    validations: ['all_sections_reviewed']
  },
  verification: {
    id: 'verification',
    order: 7,
    title: 'Final Verification',
    title_ar: 'التحقق النهائي',
    subtitle: 'Verify via OTP',
    subtitle_ar: 'تأكيد عبر رمز التحقق',
    icon: 'ShieldCheck',
    estimatedTime: '1',
    canSkip: false,
    canGoBack: false,
    requiredFields: ['otp_code'],
    validations: ['otp_valid', 'otp_not_expired']
  },
  decision: {
    id: 'decision',
    order: 8,
    title: 'Decision',
    title_ar: 'نتيجة الطلب',
    subtitle: 'Your application result',
    subtitle_ar: 'نتيجة طلبك',
    icon: 'Award',
    estimatedTime: '1',
    canSkip: false,
    canGoBack: false,
    requiredFields: [],
    validations: []
  },
  contract: {
    id: 'contract',
    order: 9,
    title: 'Contract Signing',
    title_ar: 'توقيع العقد',
    subtitle: 'Sign your financing contract',
    subtitle_ar: 'وقّع عقد التمويل',
    icon: 'PenTool',
    estimatedTime: '5',
    canSkip: false,
    canGoBack: false,
    requiredFields: ['digital_signature', 'promissory_note'],
    validations: ['signature_valid', 'contract_reviewed']
  },
  completion: {
    id: 'completion',
    order: 10,
    title: 'Completed',
    title_ar: 'تم بنجاح',
    subtitle: 'Your financing is ready',
    subtitle_ar: 'تمويلك جاهز للاستخدام',
    icon: 'CheckCircle2',
    estimatedTime: '1',
    canSkip: false,
    canGoBack: false,
    requiredFields: [],
    validations: []
  }
};

// =====================================================
// 3. DECISION STATES CONFIGURATION
// =====================================================

export interface DecisionConfig {
  state: DecisionState;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  actions: DecisionAction[];
  showAmount: boolean;
  showConditions: boolean;
  nextSteps: string[];
  nextSteps_ar: string[];
}

export interface DecisionAction {
  id: string;
  label: string;
  label_ar: string;
  variant: 'primary' | 'secondary' | 'outline';
  action: 'proceed' | 'upload' | 'appeal' | 'restart' | 'contact';
  icon: string;
}

export const DECISION_STATES: Record<DecisionState, DecisionConfig> = {
  approved: {
    state: 'approved',
    title: 'Congratulations!',
    title_ar: 'مبروك! تمت الموافقة على طلبك',
    description: 'Your financing application has been approved',
    description_ar: 'تمت الموافقة على طلب التمويل الخاص بك بالكامل',
    icon: 'CheckCircle2',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    actions: [
      {
        id: 'proceed_contract',
        label: 'Proceed to Contract',
        label_ar: 'المتابعة لتوقيع العقد',
        variant: 'primary',
        action: 'proceed',
        icon: 'ArrowLeft'
      }
    ],
    showAmount: true,
    showConditions: false,
    nextSteps: [
      'Sign the financing contract',
      'Sign the promissory note',
      'Amount will be added to your balance'
    ],
    nextSteps_ar: [
      'توقيع عقد التمويل',
      'توقيع السند لأمر',
      'سيُضاف المبلغ لرصيدك مباشرة'
    ]
  },
  approved_limited: {
    state: 'approved_limited',
    title: 'Approved with Adjusted Amount',
    title_ar: 'تمت الموافقة بمبلغ معدّل',
    description: 'We can offer you a lower amount based on your profile',
    description_ar: 'بناءً على ملفك، يمكننا تقديم مبلغ أقل من المطلوب',
    icon: 'AlertCircle',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    actions: [
      {
        id: 'accept_adjusted',
        label: 'Accept Adjusted Amount',
        label_ar: 'قبول المبلغ المعدّل',
        variant: 'primary',
        action: 'proceed',
        icon: 'Check'
      },
      {
        id: 'request_review',
        label: 'Request Review',
        label_ar: 'طلب مراجعة',
        variant: 'outline',
        action: 'appeal',
        icon: 'RefreshCw'
      }
    ],
    showAmount: true,
    showConditions: true,
    nextSteps: [
      'Review the adjusted amount',
      'Accept or request a review',
      'Proceed to contract signing'
    ],
    nextSteps_ar: [
      'راجع المبلغ المعدّل',
      'اقبل أو اطلب مراجعة',
      'تابع لتوقيع العقد'
    ]
  },
  pending_review: {
    state: 'pending_review',
    title: 'Under Manual Review',
    title_ar: 'قيد المراجعة اليدوية',
    description: 'Your application needs additional review',
    description_ar: 'طلبك يحتاج مراجعة إضافية من فريقنا',
    icon: 'Clock',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    actions: [
      {
        id: 'track_status',
        label: 'Track Status',
        label_ar: 'تتبع الحالة',
        variant: 'primary',
        action: 'proceed',
        icon: 'Eye'
      },
      {
        id: 'contact_support',
        label: 'Contact Support',
        label_ar: 'تواصل معنا',
        variant: 'outline',
        action: 'contact',
        icon: 'MessageCircle'
      }
    ],
    showAmount: false,
    showConditions: false,
    nextSteps: [
      'Our team will review your application',
      'You will receive a notification within 24-48 hours',
      'You may be contacted for additional information'
    ],
    nextSteps_ar: [
      'سيقوم فريقنا بمراجعة طلبك',
      'ستصلك إشعار خلال 24-48 ساعة',
      'قد نتواصل معك للحصول على معلومات إضافية'
    ]
  },
  declined: {
    state: 'declined',
    title: 'Application Not Approved',
    title_ar: 'لم تتم الموافقة على الطلب',
    description: 'Unfortunately, we cannot approve your application at this time',
    description_ar: 'للأسف، لا يمكننا الموافقة على طلبك في الوقت الحالي',
    icon: 'XCircle',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    actions: [
      {
        id: 'view_reasons',
        label: 'View Reasons',
        label_ar: 'عرض الأسباب',
        variant: 'outline',
        action: 'proceed',
        icon: 'Info'
      },
      {
        id: 'try_later',
        label: 'Try Again Later',
        label_ar: 'حاول لاحقاً',
        variant: 'secondary',
        action: 'restart',
        icon: 'RefreshCw'
      }
    ],
    showAmount: false,
    showConditions: false,
    nextSteps: [
      'Review the decline reasons',
      'Improve your eligibility factors',
      'Reapply after 30 days'
    ],
    nextSteps_ar: [
      'راجع أسباب الرفض',
      'حسّن عوامل الأهلية لديك',
      'أعد التقديم بعد 30 يوماً'
    ]
  },
  documents_required: {
    state: 'documents_required',
    title: 'Additional Documents Required',
    title_ar: 'مستندات إضافية مطلوبة',
    description: 'Please upload the required documents to proceed',
    description_ar: 'يرجى رفع المستندات المطلوبة للمتابعة',
    icon: 'FileUp',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    actions: [
      {
        id: 'upload_documents',
        label: 'Upload Documents',
        label_ar: 'رفع المستندات',
        variant: 'primary',
        action: 'upload',
        icon: 'Upload'
      }
    ],
    showAmount: false,
    showConditions: true,
    nextSteps: [
      'Upload the requested documents',
      'Documents will be verified within 24 hours',
      'You will receive the final decision'
    ],
    nextSteps_ar: [
      'ارفع المستندات المطلوبة',
      'سيتم التحقق منها خلال 24 ساعة',
      'ستصلك النتيجة النهائية'
    ]
  }
};

// =====================================================
// 4. PROFESSIONAL ARABIC MICROCOPY
// =====================================================

export const MICROCOPY = {
  // ===== Welcome Screen =====
  welcome: {
    hero_title: 'تمويل خدماتك الرقمية',
    hero_subtitle: 'احصل على ما تحتاجه الآن وادفع لاحقاً بدون فوائد',
    cta_primary: 'ابدأ طلب التمويل',
    cta_secondary: 'تعرف على المزيد',
    trust_badge: 'تمويل متوافق مع الشريعة الإسلامية',
    features: [
      { icon: 'Percent', text: 'بدون فوائد أو رسوم خفية' },
      { icon: 'Clock', text: 'موافقة فورية خلال دقائق' },
      { icon: 'Shield', text: 'بياناتك محمية ومشفرة' },
      { icon: 'CreditCard', text: 'أقساط مرنة تناسب ميزانيتك' }
    ],
    time_estimate: 'العملية تستغرق 5-7 دقائق فقط'
  },

  // ===== Eligibility Screen =====
  eligibility: {
    title: 'فحص الأهلية السريع',
    subtitle: 'أجب على بضعة أسئلة لمعرفة أهليتك للتمويل',
    nationality_label: 'الجنسية',
    nationality_saudi: 'سعودي',
    nationality_resident: 'مقيم',
    age_label: 'العمر',
    age_hint: 'يجب أن يكون عمرك 18 سنة على الأقل',
    employment_label: 'الحالة الوظيفية',
    employment_options: {
      government: 'موظف حكومي',
      private: 'موظف قطاع خاص',
      military: 'عسكري',
      retired: 'متقاعد',
      self_employed: 'عمل حر',
      business_owner: 'صاحب منشأة'
    },
    cta: 'تحقق من أهليتي',
    processing: 'جارٍ التحقق من الأهلية...',
    privacy_note: 'لن نشارك بياناتك مع أي طرف ثالث'
  },

  // ===== Identity Screen =====
  identity: {
    title: 'التحقق من الهوية',
    subtitle: 'أدخل بيانات هويتك للتحقق منها',
    national_id_label: 'رقم الهوية الوطنية / الإقامة',
    national_id_hint: 'أدخل 10 أرقام تبدأ بـ 1 أو 2',
    full_name_label: 'الاسم الكامل (كما في الهوية)',
    full_name_hint: 'تأكد من مطابقة الاسم للهوية',
    dob_label: 'تاريخ الميلاد',
    cta: 'التحقق من الهوية',
    processing: 'جارٍ التحقق من بياناتك...',
    security_badge: 'اتصال مشفر وآمن',
    verification_note: 'نستخدم نظام التحقق الحكومي'
  },

  // ===== Employment Screen =====
  employment: {
    title: 'معلومات التوظيف',
    subtitle: 'نحتاج معرفة وضعك الوظيفي لتحديد الخطة المناسبة',
    employer_label: 'جهة العمل',
    employer_hint: 'اسم الشركة أو المؤسسة',
    job_title_label: 'المسمى الوظيفي',
    income_label: 'الدخل الشهري (ر.س)',
    income_hint: 'الراتب الأساسي بدون البدلات',
    employment_duration_label: 'مدة الخدمة',
    employment_duration_options: {
      less_than_3_months: 'أقل من 3 شهور',
      '3_to_6_months': '3 - 6 شهور',
      '6_to_12_months': '6 شهور - سنة',
      '1_to_3_years': '1 - 3 سنوات',
      more_than_3_years: 'أكثر من 3 سنوات'
    },
    cta: 'متابعة',
    income_note: 'هذه المعلومات تساعدنا في تحديد الحد الأقصى للتمويل'
  },

  // ===== Financing Details Screen =====
  financing_details: {
    title: 'تفاصيل التمويل',
    subtitle: 'اختر المبلغ وخطة السداد المناسبة',
    amount_label: 'مبلغ التمويل المطلوب',
    amount_hint: 'الحد الأدنى {min} ر.س - الحد الأقصى {max} ر.س',
    plan_label: 'خطة السداد',
    plan_hint: 'اختر عدد الأقساط المناسب لك',
    installment_preview: 'القسط الشهري المتوقع',
    service_type_label: 'نوع الخدمة المطلوبة',
    service_types: {
      development: 'برمجة وتطوير',
      design: 'تصميم جرافيك',
      marketing: 'تسويق رقمي',
      hosting: 'استضافة وخوادم',
      other: 'خدمات أخرى'
    },
    cta: 'متابعة للشروط',
    calculation_note: 'الحساب تقريبي وقد يختلف بناءً على التقييم النهائي'
  },

  // ===== Terms Disclosure Screen =====
  terms_disclosure: {
    title: 'الإفصاح عن الشروط والرسوم',
    subtitle: 'يرجى قراءة الشروط والرسوم بعناية قبل المتابعة',
    section_fees: 'الرسوم والتكاليف',
    fee_items: [
      { label: 'رسوم إدارية', value: '500 ر.س', note: 'تُخصم من المبلغ الممول لمرة واحدة' },
      { label: 'رسوم التأخير', value: '100 ر.س', note: 'عن كل قسط متأخر بعد 5 أيام من تاريخ الاستحقاق' },
      { label: 'فائدة تأخير', value: '0%', note: 'لا توجد فوائد على التأخير - فقط رسوم ثابتة' }
    ],
    section_conditions: 'شروط التمويل',
    conditions: [
      'التمويل مخصص لشراء خدمات MaxioCore فقط وليس نقدياً',
      'يُضاف المبلغ الممول كرصيد في حسابك لدى المنصة',
      'يجب توقيع عقد التمويل والسند لأمر إلكترونياً',
      'في حال التعثر، يحق للمنصة اتخاذ الإجراءات النظامية',
      'يمكنك السداد المبكر بدون أي رسوم إضافية'
    ],
    section_rights: 'حقوقك كعميل',
    rights: [
      'الحصول على نسخة من العقد إلكترونياً',
      'معرفة جميع الرسوم قبل التوقيع',
      'السداد المبكر بدون غرامات',
      'تقديم شكوى في حال عدم الرضا'
    ],
    accept_checkbox: 'قرأت وفهمت جميع الشروط والرسوم المذكورة أعلاه وأوافق عليها',
    acknowledge_checkbox: 'أقر بأن المعلومات المقدمة صحيحة وأتحمل مسؤوليتها',
    cta: 'الموافقة والمتابعة',
    scroll_warning: 'يرجى قراءة جميع الشروط للمتابعة'
  },

  // ===== Review Screen =====
  review: {
    title: 'مراجعة الطلب',
    subtitle: 'تأكد من صحة جميع المعلومات قبل الإرسال',
    section_personal: 'البيانات الشخصية',
    section_employment: 'بيانات التوظيف',
    section_financing: 'تفاصيل التمويل',
    edit_button: 'تعديل',
    summary_title: 'ملخص التمويل',
    summary_items: {
      amount: 'مبلغ التمويل',
      admin_fee: 'الرسوم الإدارية',
      net_amount: 'صافي المبلغ',
      installments: 'عدد الأقساط',
      monthly_payment: 'القسط الشهري',
      first_due: 'أول قسط',
      last_due: 'آخر قسط'
    },
    confirm_checkbox: 'أؤكد أن جميع المعلومات المقدمة صحيحة ودقيقة',
    cta: 'إرسال الطلب',
    cta_processing: 'جارٍ إرسال الطلب...'
  },

  // ===== Verification Screen =====
  verification: {
    title: 'التحقق النهائي',
    subtitle: 'أدخل رمز التحقق المرسل إلى جوالك',
    otp_label: 'رمز التحقق',
    otp_hint: 'أدخل الرمز المكون من 6 أرقام',
    otp_sent: 'تم إرسال رمز التحقق إلى {phone}',
    resend_button: 'إعادة إرسال الرمز',
    resend_timer: 'إعادة الإرسال بعد {seconds} ثانية',
    cta: 'تأكيد',
    cta_processing: 'جارٍ التحقق...',
    security_note: 'لا تشارك هذا الرمز مع أي شخص'
  },

  // ===== Decision Screen =====
  decision: {
    processing_title: 'جارٍ تقييم طلبك',
    processing_subtitle: 'يرجى الانتظار بضع ثوانٍ...',
    processing_steps: [
      'التحقق من البيانات الشخصية',
      'مراجعة السجل الائتماني',
      'حساب الحد التمويلي',
      'إصدار القرار النهائي'
    ]
  },

  // ===== Contract Screen =====
  contract: {
    title: 'توقيع العقد',
    subtitle: 'راجع العقد والسند لأمر ووقّع إلكترونياً',
    contract_section: 'عقد التمويل',
    promissory_section: 'السند لأمر',
    download_button: 'تحميل PDF',
    signature_label: 'التوقيع الإلكتروني',
    signature_hint: 'وقّع باستخدام إصبعك أو الماوس',
    clear_signature: 'مسح التوقيع',
    cta: 'توقيع وإتمام العقد',
    cta_processing: 'جارٍ معالجة التوقيع...',
    legal_note: 'بتوقيعك أدناه، فإنك توافق على جميع شروط وأحكام العقد'
  },

  // ===== Completion Screen =====
  completion: {
    title: 'تم بنجاح!',
    subtitle: 'تمت الموافقة على تمويلك وإضافته لرصيدك',
    balance_added: 'تم إضافة {amount} ر.س لرصيدك',
    next_steps_title: 'الخطوات التالية',
    next_steps: [
      'يمكنك الآن استخدام رصيدك لشراء خدماتنا',
      'ستجد جدول الأقساط في صفحة التمويل',
      'سنذكّرك قبل موعد كل قسط'
    ],
    cta_primary: 'تصفح الخدمات',
    cta_secondary: 'عرض تفاصيل التمويل',
    share_text: 'احصل على خصم عند دعوة أصدقائك!'
  },

  // ===== Common / Errors =====
  common: {
    back_button: 'السابق',
    next_button: 'التالي',
    cancel_button: 'إلغاء',
    close_button: 'إغلاق',
    loading: 'جارٍ التحميل...',
    error_generic: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    error_network: 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
    error_session: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.',
    required_field: 'هذا الحقل مطلوب',
    invalid_format: 'الصيغة غير صحيحة',
    step_indicator: 'الخطوة {current} من {total}',
    estimated_time: 'الوقت المتوقع: {time} دقائق'
  },

  // ===== Validation Messages =====
  validations: {
    national_id_required: 'رقم الهوية مطلوب',
    national_id_invalid: 'رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2',
    name_required: 'الاسم الكامل مطلوب',
    name_too_short: 'الاسم قصير جداً',
    phone_required: 'رقم الجوال مطلوب',
    phone_invalid: 'رقم الجوال غير صحيح',
    email_required: 'البريد الإلكتروني مطلوب',
    email_invalid: 'البريد الإلكتروني غير صحيح',
    amount_required: 'مبلغ التمويل مطلوب',
    amount_min: 'الحد الأدنى للتمويل {min} ر.س',
    amount_max: 'الحد الأقصى للتمويل {max} ر.س',
    plan_required: 'يرجى اختيار خطة السداد',
    terms_required: 'يجب الموافقة على الشروط والأحكام',
    otp_required: 'رمز التحقق مطلوب',
    otp_invalid: 'رمز التحقق غير صحيح',
    otp_expired: 'انتهت صلاحية رمز التحقق',
    signature_required: 'التوقيع الإلكتروني مطلوب'
  },

  // ===== Decline Reasons =====
  decline_reasons: {
    low_score: 'نقاط الأهلية أقل من الحد المطلوب',
    age_not_eligible: 'العمر خارج النطاق المسموح',
    employment_duration: 'مدة الخدمة أقل من المطلوب',
    income_insufficient: 'الدخل الشهري أقل من الحد الأدنى',
    previous_default: 'سجل تعثر سابق',
    fraud_detected: 'اكتشاف نشاط مشبوه',
    duplicate_application: 'طلب مكرر',
    documents_invalid: 'المستندات المقدمة غير صالحة',
    identity_mismatch: 'عدم تطابق بيانات الهوية'
  }
};

// =====================================================
// 5. RESPONSIVE BREAKPOINTS
// =====================================================

export const RESPONSIVE_CONFIG = {
  mobile: {
    maxWidth: 640,
    progressStyle: 'compact',
    formLayout: 'stacked',
    buttonSize: 'full'
  },
  tablet: {
    maxWidth: 1024,
    progressStyle: 'standard',
    formLayout: 'stacked',
    buttonSize: 'large'
  },
  desktop: {
    maxWidth: 1920,
    progressStyle: 'expanded',
    formLayout: 'grid',
    buttonSize: 'auto'
  }
};

// =====================================================
// 6. FRAUD PREVENTION CHECKS
// =====================================================

export const FRAUD_CHECKS = [
  {
    id: 'velocity',
    name: 'Velocity Check',
    name_ar: 'فحص السرعة',
    description: 'Multiple applications in short time',
    threshold: 3, // max 3 applications per 30 days
    action: 'block'
  },
  {
    id: 'device',
    name: 'Device Check',
    name_ar: 'فحص الجهاز',
    description: 'Device fingerprint analysis',
    threshold: 2, // max 2 identities per device
    action: 'flag'
  },
  {
    id: 'ip',
    name: 'IP Check',
    name_ar: 'فحص العنوان',
    description: 'VPN/Proxy detection',
    threshold: 0,
    action: 'block'
  },
  {
    id: 'identity',
    name: 'Identity Check',
    name_ar: 'فحص الهوية',
    description: 'Duplicate identity detection',
    threshold: 1,
    action: 'block'
  }
];

// =====================================================
// 7. AUDIT LOG EVENTS
// =====================================================

export const AUDIT_EVENTS = {
  // Journey Events
  JOURNEY_STARTED: 'journey_started',
  JOURNEY_STEP_COMPLETED: 'journey_step_completed',
  JOURNEY_ABANDONED: 'journey_abandoned',
  JOURNEY_COMPLETED: 'journey_completed',
  
  // Verification Events
  IDENTITY_VERIFIED: 'identity_verified',
  IDENTITY_FAILED: 'identity_failed',
  OTP_SENT: 'otp_sent',
  OTP_VERIFIED: 'otp_verified',
  OTP_FAILED: 'otp_failed',
  
  // Decision Events
  DECISION_APPROVED: 'decision_approved',
  DECISION_DECLINED: 'decision_declined',
  DECISION_PENDING: 'decision_pending',
  DECISION_LIMITED: 'decision_limited',
  
  // Contract Events
  CONTRACT_VIEWED: 'contract_viewed',
  CONTRACT_SIGNED: 'contract_signed',
  PROMISSORY_SIGNED: 'promissory_signed',
  
  // Fraud Events
  FRAUD_DETECTED: 'fraud_detected',
  FRAUD_BLOCKED: 'fraud_blocked'
};

export default {
  JOURNEY_SCREENS,
  DECISION_STATES,
  MICROCOPY,
  RESPONSIVE_CONFIG,
  FRAUD_CHECKS,
  AUDIT_EVENTS
};
