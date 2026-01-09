// ============================================
// Eligibility System Configuration - MaxioCore
// ============================================

import { EligibilityConfig, EligibilityRule } from './types';

export const ELIGIBILITY_CONFIG: EligibilityConfig = {
  minAge: 21,
  maxAge: 65,
  minAccountAge: 30, // 30 days minimum
  minOrders: 1,
  minSpending: 100, // SAR
  minScore: 60,
  scoreThresholds: {
    platinum: 90,
    gold: 80,
    silver: 70,
    bronze: 60,
  },
  amountTiers: {
    platinum: 100000,
    gold: 50000,
    silver: 25000,
    bronze: 10000,
  },
  validityHours: 24,
};

export const ELIGIBILITY_RULES: EligibilityRule[] = [
  // Identity Rules
  {
    id: 'valid_nationality',
    name: 'Valid Nationality',
    condition: (ctx) => ctx.identityResult?.nationality === 'سعودي' || ctx.identityResult?.nationality === 'مقيم',
    score: 10,
    weight: 1,
    failureReason: 'الجنسية غير مؤهلة للتمويل',
    recommendation: 'التمويل متاح للمواطنين السعوديين والمقيمين فقط',
  },
  {
    id: 'valid_age',
    name: 'Valid Age Range',
    condition: (ctx) => {
      const age = ctx.identityResult?.age || 0;
      return age >= ELIGIBILITY_CONFIG.minAge && age <= ELIGIBILITY_CONFIG.maxAge;
    },
    score: 10,
    weight: 1,
    failureReason: 'العمر خارج النطاق المسموح',
    recommendation: `العمر المسموح من ${ELIGIBILITY_CONFIG.minAge} إلى ${ELIGIBILITY_CONFIG.maxAge} سنة`,
  },
  {
    id: 'valid_id',
    name: 'Valid ID',
    condition: (ctx) => ctx.identityResult?.idExpiryValid === true,
    score: 15,
    weight: 1.5,
    failureReason: 'الهوية منتهية الصلاحية أو غير صالحة',
    recommendation: 'يرجى تجديد الهوية قبل التقديم',
  },
  
  // Phone Rules
  {
    id: 'verified_phone',
    name: 'Verified Phone',
    condition: (ctx) => ctx.phoneResult?.verified === true,
    score: 10,
    weight: 1,
    failureReason: 'رقم الجوال غير موثق',
    recommendation: 'يرجى التحقق من رقم الجوال المسجل',
  },
  {
    id: 'registered_phone',
    name: 'Registered Phone',
    condition: (ctx) => ctx.phoneResult?.isRegistered === true,
    score: 5,
    weight: 0.5,
    failureReason: 'رقم الجوال غير مسجل في الحساب',
    recommendation: 'أضف رقم جوال صالح لحسابك',
  },
  
  // Email Rules
  {
    id: 'verified_email',
    name: 'Verified Email',
    condition: (ctx) => ctx.emailResult?.verified === true,
    score: 10,
    weight: 1,
    failureReason: 'البريد الإلكتروني غير موثق',
    recommendation: 'يرجى تأكيد البريد الإلكتروني',
  },
  
  // History Rules
  {
    id: 'min_orders',
    name: 'Minimum Orders',
    condition: (ctx) => (ctx.historyResult?.completedOrders || 0) >= ELIGIBILITY_CONFIG.minOrders,
    score: 15,
    weight: 1.5,
    failureReason: 'عدد الطلبات المكتملة غير كافٍ',
    recommendation: `يجب إكمال ${ELIGIBILITY_CONFIG.minOrders} طلب على الأقل قبل التقديم`,
  },
  {
    id: 'min_spending',
    name: 'Minimum Spending',
    condition: (ctx) => (ctx.historyResult?.totalSpending || 0) >= ELIGIBILITY_CONFIG.minSpending,
    score: 10,
    weight: 1,
    failureReason: 'إجمالي الإنفاق غير كافٍ',
    recommendation: `يجب أن يكون إجمالي الإنفاق ${ELIGIBILITY_CONFIG.minSpending} ر.س على الأقل`,
  },
  {
    id: 'no_defaults',
    name: 'No Payment Defaults',
    condition: (ctx) => ctx.historyResult?.hasDefaults === false,
    score: 20,
    weight: 2,
    failureReason: 'يوجد تعثرات سابقة في السداد',
    recommendation: 'يجب تسوية جميع المستحقات السابقة',
  },
  {
    id: 'account_age',
    name: 'Account Age',
    condition: (ctx) => (ctx.historyResult?.accountAge || 0) >= ELIGIBILITY_CONFIG.minAccountAge,
    score: 5,
    weight: 0.5,
    failureReason: 'الحساب جديد جداً',
    recommendation: `يجب أن يكون عمر الحساب ${ELIGIBILITY_CONFIG.minAccountAge} يوم على الأقل`,
  },
];

export const VERIFICATION_STEPS = [
  {
    id: 'identity',
    name: 'Identity Verification',
    nameAr: 'التحقق من الهوية',
    maxScore: 35,
  },
  {
    id: 'phone',
    name: 'Phone Verification',
    nameAr: 'التحقق من الجوال',
    maxScore: 15,
  },
  {
    id: 'email',
    name: 'Email Verification',
    nameAr: 'التحقق من البريد',
    maxScore: 10,
  },
  {
    id: 'history',
    name: 'History Check',
    nameAr: 'فحص السجل',
    maxScore: 50,
  },
];
