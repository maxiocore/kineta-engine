// Employment Status Types and Configuration
// Financial-grade employment verification system

export type EmploymentStatus = 
  | 'employed'      // موظف
  | 'business_owner' // صاحب عمل
  | 'student'       // طالب
  | 'other';        // أخرى

export type DocumentType = 
  | 'salary_certificate'      // شهادة راتب
  | 'bank_statement'          // كشف حساب بنكي
  | 'employment_letter'       // خطاب تعريف بالراتب
  | 'commercial_register'     // سجل تجاري
  | 'tax_certificate'         // شهادة ضريبية
  | 'financial_statement'     // قوائم مالية
  | 'student_id'              // بطاقة طالب
  | 'enrollment_letter'       // خطاب قيد
  | 'guardian_salary'         // راتب ولي الأمر
  | 'freelance_contract'      // عقد عمل حر
  | 'income_proof'            // إثبات دخل
  | 'bank_account_ownership'; // ملكية حساب بنكي

export type VerificationStatus = 
  | 'not_started'
  | 'pending_documents'
  | 'documents_submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'requires_additional';

export interface RequiredDocument {
  type: DocumentType;
  nameAr: string;
  nameEn: string;
  description: string;
  isRequired: boolean;
  acceptedFormats: string[];
  maxSizeMB: number;
  validityMonths?: number; // How recent the document must be
  verificationMethod: 'manual' | 'ocr' | 'api';
}

export interface IncomeRequirement {
  minMonthlyIncome: number;
  currency: 'SAR';
  verificationType: 'salary_slip' | 'bank_statement' | 'tax_return' | 'self_declared';
  consecutiveMonths: number; // How many months of income proof needed
}

export interface EmploymentRestriction {
  minEmploymentMonths?: number;
  minBusinessAge?: number; // For business owners
  allowedSectors?: string[];
  blockedSectors?: string[];
  requiresGuarantor?: boolean;
  maxFinancingAmount?: number;
  maxFinancingPercentage?: number; // % of income
}

export interface EmploymentTypeConfig {
  status: EmploymentStatus;
  nameAr: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  isEligible: boolean;
  eligibilityScore: number; // Base score for this employment type
  requiredDocuments: RequiredDocument[];
  optionalDocuments: RequiredDocument[];
  incomeRequirement: IncomeRequirement;
  restrictions: EmploymentRestriction;
  verificationSteps: string[];
  rejectionReasons: string[];
  specialConditions?: string[];
}

// Document configurations
const DOCUMENT_CONFIGS: Record<DocumentType, Omit<RequiredDocument, 'isRequired'>> = {
  salary_certificate: {
    type: 'salary_certificate',
    nameAr: 'شهادة راتب',
    nameEn: 'Salary Certificate',
    description: 'شهادة معتمدة من جهة العمل توضح الراتب الشهري',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 5,
    validityMonths: 3,
    verificationMethod: 'ocr',
  },
  bank_statement: {
    type: 'bank_statement',
    nameAr: 'كشف حساب بنكي',
    nameEn: 'Bank Statement',
    description: 'كشف حساب لآخر 3-6 أشهر يوضح الإيداعات',
    acceptedFormats: ['pdf'],
    maxSizeMB: 10,
    validityMonths: 1,
    verificationMethod: 'manual',
  },
  employment_letter: {
    type: 'employment_letter',
    nameAr: 'خطاب تعريف بالراتب',
    nameEn: 'Employment Letter',
    description: 'خطاب رسمي من جهة العمل يوضح المسمى الوظيفي والراتب',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 5,
    validityMonths: 1,
    verificationMethod: 'ocr',
  },
  commercial_register: {
    type: 'commercial_register',
    nameAr: 'سجل تجاري',
    nameEn: 'Commercial Register',
    description: 'سجل تجاري ساري المفعول',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 5,
    validityMonths: 12,
    verificationMethod: 'api',
  },
  tax_certificate: {
    type: 'tax_certificate',
    nameAr: 'شهادة ضريبية',
    nameEn: 'Tax Certificate',
    description: 'شهادة تسجيل في ضريبة القيمة المضافة',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 5,
    validityMonths: 12,
    verificationMethod: 'api',
  },
  financial_statement: {
    type: 'financial_statement',
    nameAr: 'قوائم مالية',
    nameEn: 'Financial Statement',
    description: 'قوائم مالية معتمدة للسنة الأخيرة',
    acceptedFormats: ['pdf'],
    maxSizeMB: 15,
    validityMonths: 12,
    verificationMethod: 'manual',
  },
  student_id: {
    type: 'student_id',
    nameAr: 'بطاقة طالب',
    nameEn: 'Student ID',
    description: 'بطاقة طالب سارية المفعول',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 3,
    validityMonths: 12,
    verificationMethod: 'ocr',
  },
  enrollment_letter: {
    type: 'enrollment_letter',
    nameAr: 'خطاب قيد',
    nameEn: 'Enrollment Letter',
    description: 'خطاب قيد من الجامعة أو المعهد',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 5,
    validityMonths: 6,
    verificationMethod: 'manual',
  },
  guardian_salary: {
    type: 'guardian_salary',
    nameAr: 'راتب ولي الأمر',
    nameEn: 'Guardian Salary Proof',
    description: 'إثبات دخل ولي الأمر أو الكفيل',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 5,
    validityMonths: 3,
    verificationMethod: 'manual',
  },
  freelance_contract: {
    type: 'freelance_contract',
    nameAr: 'عقد عمل حر',
    nameEn: 'Freelance Contract',
    description: 'عقود أو اتفاقيات عمل حر سارية',
    acceptedFormats: ['pdf'],
    maxSizeMB: 10,
    verificationMethod: 'manual',
  },
  income_proof: {
    type: 'income_proof',
    nameAr: 'إثبات دخل',
    nameEn: 'Income Proof',
    description: 'أي مستند يثبت مصدر الدخل',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 10,
    validityMonths: 3,
    verificationMethod: 'manual',
  },
  bank_account_ownership: {
    type: 'bank_account_ownership',
    nameAr: 'ملكية حساب بنكي',
    nameEn: 'Bank Account Ownership',
    description: 'شهادة ملكية حساب بنكي باسم المتقدم',
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 5,
    validityMonths: 1,
    verificationMethod: 'manual',
  },
};

// Employment type configurations
export const EMPLOYMENT_CONFIGS: Record<EmploymentStatus, EmploymentTypeConfig> = {
  employed: {
    status: 'employed',
    nameAr: 'موظف',
    nameEn: 'Employed',
    description: 'موظف في القطاع الحكومي أو الخاص',
    icon: 'Briefcase',
    color: 'blue',
    isEligible: true,
    eligibilityScore: 85,
    requiredDocuments: [
      { ...DOCUMENT_CONFIGS.salary_certificate, isRequired: true },
      { ...DOCUMENT_CONFIGS.employment_letter, isRequired: true },
      { ...DOCUMENT_CONFIGS.bank_statement, isRequired: true },
    ],
    optionalDocuments: [
      { ...DOCUMENT_CONFIGS.bank_account_ownership, isRequired: false },
    ],
    incomeRequirement: {
      minMonthlyIncome: 4000,
      currency: 'SAR',
      verificationType: 'salary_slip',
      consecutiveMonths: 3,
    },
    restrictions: {
      minEmploymentMonths: 6,
      maxFinancingPercentage: 40, // 40% of salary
      requiresGuarantor: false,
    },
    verificationSteps: [
      'التحقق من صحة شهادة الراتب',
      'مطابقة البيانات مع كشف الحساب البنكي',
      'التحقق من استمرارية العمل',
      'حساب نسبة الاستقطاع المسموحة',
    ],
    rejectionReasons: [
      'الراتب أقل من الحد الأدنى المطلوب',
      'مدة العمل أقل من 6 أشهر',
      'عدم تطابق البيانات بين المستندات',
      'مستندات منتهية الصلاحية',
    ],
  },

  business_owner: {
    status: 'business_owner',
    nameAr: 'صاحب عمل',
    nameEn: 'Business Owner',
    description: 'صاحب منشأة تجارية أو مؤسسة',
    icon: 'Building2',
    color: 'emerald',
    isEligible: true,
    eligibilityScore: 80,
    requiredDocuments: [
      { ...DOCUMENT_CONFIGS.commercial_register, isRequired: true },
      { ...DOCUMENT_CONFIGS.tax_certificate, isRequired: true },
      { ...DOCUMENT_CONFIGS.bank_statement, isRequired: true },
      { ...DOCUMENT_CONFIGS.financial_statement, isRequired: true },
    ],
    optionalDocuments: [
      { ...DOCUMENT_CONFIGS.income_proof, isRequired: false },
    ],
    incomeRequirement: {
      minMonthlyIncome: 10000,
      currency: 'SAR',
      verificationType: 'bank_statement',
      consecutiveMonths: 6,
    },
    restrictions: {
      minBusinessAge: 12, // 12 months minimum
      maxFinancingPercentage: 30,
      requiresGuarantor: false,
      blockedSectors: ['gambling', 'tobacco', 'alcohol'],
    },
    verificationSteps: [
      'التحقق من السجل التجاري عبر API وزارة التجارة',
      'التحقق من الشهادة الضريبية',
      'تحليل القوائم المالية',
      'مراجعة التدفقات النقدية',
      'تقييم المخاطر التجارية',
    ],
    rejectionReasons: [
      'السجل التجاري منتهي أو موقوف',
      'عمر المنشأة أقل من سنة',
      'قطاع غير مؤهل للتمويل',
      'إيرادات غير كافية',
      'سجل ضريبي غير نظامي',
    ],
    specialConditions: [
      'يجب أن تكون المنشأة نشطة ومسجلة',
      'لا يوجد إيقافات أو مخالفات جسيمة',
    ],
  },

  student: {
    status: 'student',
    nameAr: 'طالب',
    nameEn: 'Student',
    description: 'طالب جامعي أو في مرحلة الدراسات العليا',
    icon: 'GraduationCap',
    color: 'purple',
    isEligible: true,
    eligibilityScore: 60,
    requiredDocuments: [
      { ...DOCUMENT_CONFIGS.student_id, isRequired: true },
      { ...DOCUMENT_CONFIGS.enrollment_letter, isRequired: true },
      { ...DOCUMENT_CONFIGS.guardian_salary, isRequired: true },
    ],
    optionalDocuments: [
      { ...DOCUMENT_CONFIGS.income_proof, isRequired: false },
      { ...DOCUMENT_CONFIGS.bank_statement, isRequired: false },
    ],
    incomeRequirement: {
      minMonthlyIncome: 0, // Through guarantor
      currency: 'SAR',
      verificationType: 'self_declared',
      consecutiveMonths: 0,
    },
    restrictions: {
      requiresGuarantor: true,
      maxFinancingAmount: 15000, // Maximum 15,000 SAR
      maxFinancingPercentage: 100, // Of guarantor's allowed amount
    },
    verificationSteps: [
      'التحقق من بطاقة الطالب',
      'التحقق من خطاب القيد',
      'التحقق من دخل ولي الأمر/الكفيل',
      'الحصول على موافقة الكفيل',
    ],
    rejectionReasons: [
      'بطاقة طالب منتهية',
      'غير مسجل حالياً',
      'عدم توفر كفيل مؤهل',
      'رفض الكفيل',
    ],
    specialConditions: [
      'يجب توفير كفيل موظف أو صاحب عمل',
      'الحد الأقصى للتمويل 15,000 ر.س',
      'يجب أن يكون الطالب مسجلاً حالياً',
    ],
  },

  other: {
    status: 'other',
    nameAr: 'أخرى',
    nameEn: 'Other',
    description: 'عمل حر، متقاعد، أو وضع آخر',
    icon: 'UserCircle',
    color: 'amber',
    isEligible: true, // Conditionally eligible
    eligibilityScore: 50,
    requiredDocuments: [
      { ...DOCUMENT_CONFIGS.income_proof, isRequired: true },
      { ...DOCUMENT_CONFIGS.bank_statement, isRequired: true },
      { ...DOCUMENT_CONFIGS.bank_account_ownership, isRequired: true },
    ],
    optionalDocuments: [
      { ...DOCUMENT_CONFIGS.freelance_contract, isRequired: false },
    ],
    incomeRequirement: {
      minMonthlyIncome: 5000,
      currency: 'SAR',
      verificationType: 'bank_statement',
      consecutiveMonths: 6,
    },
    restrictions: {
      requiresGuarantor: true,
      maxFinancingAmount: 20000,
      maxFinancingPercentage: 25,
    },
    verificationSteps: [
      'التحقق من مصادر الدخل',
      'تحليل كشوف الحساب البنكي',
      'التحقق من استقرار الدخل',
      'الحصول على كفيل إضافي',
    ],
    rejectionReasons: [
      'دخل غير مستقر',
      'عدم توفر كفيل',
      'مصدر دخل غير واضح',
      'كشف حساب لا يثبت دخل منتظم',
    ],
    specialConditions: [
      'يتطلب كفيل موظف أو صاحب عمل',
      'مراجعة يدوية إضافية',
      'قد يستغرق وقتاً أطول للموافقة',
    ],
  },
};

// Helper functions
export function getEmploymentConfig(status: EmploymentStatus): EmploymentTypeConfig {
  return EMPLOYMENT_CONFIGS[status];
}

export function getAllEmploymentTypes(): EmploymentTypeConfig[] {
  return Object.values(EMPLOYMENT_CONFIGS);
}

export function getRequiredDocuments(status: EmploymentStatus): RequiredDocument[] {
  return EMPLOYMENT_CONFIGS[status].requiredDocuments;
}

export function getOptionalDocuments(status: EmploymentStatus): RequiredDocument[] {
  return EMPLOYMENT_CONFIGS[status].optionalDocuments;
}

export function getMinIncome(status: EmploymentStatus): number {
  return EMPLOYMENT_CONFIGS[status].incomeRequirement.minMonthlyIncome;
}

export function requiresGuarantor(status: EmploymentStatus): boolean {
  return EMPLOYMENT_CONFIGS[status].restrictions.requiresGuarantor || false;
}

export function getMaxFinancingAmount(status: EmploymentStatus, monthlyIncome?: number): number {
  const config = EMPLOYMENT_CONFIGS[status];
  
  if (config.restrictions.maxFinancingAmount) {
    return config.restrictions.maxFinancingAmount;
  }
  
  if (monthlyIncome && config.restrictions.maxFinancingPercentage) {
    // Calculate based on income percentage (e.g., 40% of annual income)
    return Math.floor((monthlyIncome * 12) * (config.restrictions.maxFinancingPercentage / 100));
  }
  
  return 50000; // Default max
}
