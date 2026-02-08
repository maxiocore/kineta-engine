// ============================================
// Service Financing Policy - ASH HOLDING
// Non-Cash Financing Configuration & Microcopy
// ============================================

/**
 * الشركة المالكة للخدمات
 */
export const COMPANY_INFO = {
  name: "شركة علي صالح الشهري القابضة",
  nameEn: "Ali Saleh Al-Shehri Holding Company",
  shortName: "مجموعة الشهري",
};

/**
 * تنويه التمويل الثابت - يظهر في الشاشات الأساسية
 */
export const SERVICE_FINANCING_NOTICE = {
  title: "تمويل خدمات فقط",
  titleIcon: "🏢",
  message: `هذا التمويل مخصص حصرياً لشراء الخدمات المقدمة من ${COMPANY_INFO.name} أو الخدمات التابعة لها داخل المنصة. لا يتم صرف أي مبالغ نقدية للعميل.`,
  shortMessage: "تمويل لشراء الخدمات فقط - لا يوجد صرف نقدي",
};

/**
 * نصوص الشاشة الأولى (IntroStep)
 */
export const INTRO_MICROCOPY = {
  badge: "تمويل الخدمات الرقمية",
  title: "طلب تمويل لشراء الخدمات",
  subtitle: "احصل على خدماتك الآن وسدد لاحقاً بأقساط ميسّرة. يتم الدفع مباشرة لمزود الخدمة.",
  
  features: [
    {
      icon: "Clock",
      title: "موافقة سريعة",
      description: "نتيجة فورية أو خلال 24 ساعة",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: "Shield",
      title: "تمويل آمن",
      description: "بدون صرف نقدي - الدفع لمزود الخدمة",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: "FileText",
      title: "خدمات متنوعة",
      description: "تصميم، تطوير، تسويق، واستضافة",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ],
  
  conditions: [
    "أن يكون عمرك 21 سنة فأكثر",
    "أن تكون سعودي الجنسية أو مقيم",
    "أن يكون لديك دخل شهري ثابت",
    "اختيار خدمات من الكتالوج المتاح",
  ],
  
  termsLabel: `أقر بأنني قرأت وفهمت الشروط والأحكام وسياسة الخصوصية، وأعلم أن هذا التمويل مخصص لشراء خدمات ${COMPANY_INFO.shortName} فقط وليس تمويلاً نقدياً.`,
  
  conditionsLabel: "أقر بأنني أستوفي جميع شروط التقديم، وأن قيمة التمويل ستُدفع مباشرة لمزود الخدمة وليس لي شخصياً.",
  
  ctaButton: "اختيار الخدمات",
  footerNote: "يمكنك حفظ طلبك والعودة لإكماله لاحقاً",
};

/**
 * نصوص شاشة اختيار نوع الخدمة (ProductSelectionStep)
 */
export const PRODUCT_SELECTION_MICROCOPY = {
  title: "اختر فئة الخدمات",
  subtitle: "حدد نوع الخدمات التي تريد تمويلها من كتالوج خدماتنا",
  
  products: [
    {
      id: "development" as const,
      title: "خدمات التطوير",
      description: "تصميم وتطوير المواقع والتطبيقات",
      icon: "Wrench",
      color: "from-blue-500 to-indigo-500",
      features: ["مواقع إلكترونية", "تطبيقات جوال", "أنظمة متكاملة"],
    },
    {
      id: "marketing" as const,
      title: "خدمات التسويق",
      description: "حملات تسويقية وإدارة منصات",
      icon: "TrendingUp",
      color: "from-purple-500 to-pink-500",
      features: ["إعلانات مدفوعة", "إدارة حسابات", "SEO"],
    },
  ],
  
  selectPrompt: "اختر فئة الخدمات",
};

/**
 * نصوص شاشة اختيار الخدمات والمبلغ (AmountTenorStep)
 * ملاحظة: المبلغ يتم حسابه تلقائياً من الخدمات المختارة
 */
export const AMOUNT_STEP_MICROCOPY = {
  title: "اختر الخدمات المطلوبة",
  subtitle: "حدد الخدمات من الكتالوج وسيتم حساب قيمة التمويل تلقائياً",
  
  // يظهر بدلاً من "الحد المتاح"
  catalogLabel: "كتالوج الخدمات المتاحة",
  
  // يظهر بدلاً من "مبلغ التمويل"
  servicesValueLabel: "قيمة الخدمات المختارة",
  
  // تنويه عدم وجود حقل مبلغ حر
  noFreeAmountNote: "قيمة التمويل = قيمة الخدمات المختارة فقط",
  
  tenorLabel: "مدة السداد",
  tenorNote: "اختر فترة السداد المناسبة لك",
  
  installmentPreviewLabel: "القسط الشهري المتوقع",
  
  // تذكير في أسفل البطاقة
  paymentNote: "سيتم دفع قيمة الخدمات مباشرة لـ" + COMPANY_INFO.shortName,
};

/**
 * نصوص شاشة محاكاة الأقساط (InstallmentSimulatorStep)
 */
export const SIMULATOR_MICROCOPY = {
  badge: "محاكاة تمويل الخدمات",
  title: "تفاصيل التمويل والأقساط",
  subtitle: "كل المعلومات واضحة وشفافة - الدفع لمزود الخدمة مباشرة",
  
  monthlyInstallmentLabel: "القسط الشهري",
  monthlyInstallmentTooltip: "المبلغ الذي ستسدده شهرياً مقابل الخدمات",
  
  totalLabel: "إجمالي السداد",
  feesLabel: "التكلفة الإضافية",
  
  servicesValueLabel: "قيمة الخدمات",
  servicesValueTooltip: "القيمة الإجمالية للخدمات المختارة من الكتالوج",
  
  adminFeeLabel: "رسوم إدارية",
  adminFeeTooltip: "رسوم معالجة الطلب - تُحسب مرة واحدة",
  
  vatLabel: "ضريبة القيمة المضافة",
  vatTooltip: "الضريبة على الرسوم الإدارية فقط",
  
  totalDueLabel: "إجمالي المبلغ المستحق",
  totalDueTooltip: "المبلغ الكلي الذي ستسدده مقابل الخدمات",
  
  // تنويه مهم
  paymentFlowNote: "💡 سيتم تحويل قيمة الخدمات مباشرة إلى مزود الخدمة بعد الموافقة على طلبك",
};

/**
 * نصوص شاشة المراجعة (ReviewConfirmStep)
 */
export const REVIEW_MICROCOPY = {
  badge: "الخطوة الأخيرة",
  title: "مراجعة طلب تمويل الخدمات",
  subtitle: "راجع تفاصيل الخدمات المختارة ووافق على الشروط",
  
  summaryTitle: "ملخص طلب التمويل",
  summaryLabel: "تمويل خدمات",
  
  servicesValueLabel: "قيمة الخدمات",
  tenorLabel: "مدة السداد",
  monthlyInstallmentLabel: "القسط الشهري",
  feesLabel: "الرسوم الإدارية",
  totalLabel: "الإجمالي",
  
  keyTerms: [
    { icon: "Banknote", text: "التمويل متوافق مع أحكام الشريعة الإسلامية" },
    { icon: "Building2", text: `الدفع مباشرة لـ${COMPANY_INFO.shortName} وليس للعميل` },
    { icon: "Scale", text: "لا يوجد فوائد - هامش ربح ثابت ومعلن" },
    { icon: "Lock", text: "بياناتك محمية ولا تُشارك مع أطراف خارجية" },
  ],
  
  termsAgreement: `أوافق على الشروط والأحكام وأقر بأنني أفهم أن هذا تمويل لشراء خدمات وليس تمويلاً نقدياً، وأن المبلغ سيُدفع لمزود الخدمة مباشرة.`,
  
  privacyAgreement: "أوافق على سياسة الخصوصية ومعالجة بياناتي لأغراض طلب التمويل.",
  
  submitButton: "إرسال الطلب",
  backButton: "رجوع",
};

/**
 * نصوص شاشة النتيجة (ResultStep)
 */
export const RESULT_MICROCOPY = {
  approved: {
    title: "تمت الموافقة على طلبك!",
    subtitle: "سيتم تفعيل الخدمات المختارة وتحويل قيمتها لمزود الخدمة",
    nextSteps: [
      "سيتم التواصل معك لتأكيد تفاصيل الخدمات",
      "ستُفعّل الخدمات خلال 24-48 ساعة عمل",
      "ستصلك رسالة بجدول الأقساط على جوالك",
    ],
  },
  underReview: {
    title: "طلبك قيد المراجعة",
    subtitle: "سنراجع طلبك ونتواصل معك خلال 24-48 ساعة",
    note: "قد نحتاج مستندات إضافية للتحقق",
  },
  rejected: {
    title: "عذراً، لم تتم الموافقة",
    subtitle: "لا يمكننا الموافقة على طلبك في الوقت الحالي",
    suggestions: [
      "يمكنك شراء الخدمات بالدفع المباشر",
      "تواصل مع فريق الدعم للمساعدة",
    ],
  },
};

/**
 * المصطلحات الممنوعة - يجب تجنبها
 */
export const FORBIDDEN_TERMS = [
  "صرف مبلغ",
  "تحويل للعميل",
  "قرض شخصي",
  "سلفة",
  "تمويل نقدي",
  "سحب نقدي",
  "المبلغ المصروف",
  "استلام المبلغ",
];

/**
 * البدائل المسموحة
 */
export const ALLOWED_TERMS = {
  "مبلغ التمويل": "قيمة الخدمات",
  "تمويل شخصي": "تمويل خدمات",
  "صرف المبلغ": "تفعيل الخدمات",
  "استلام التمويل": "بدء الخدمات",
  "تحويل المبلغ": "دفع قيمة الخدمات لمزودها",
};
