/**
 * MaxioCore Financing System v2 - Status Configuration
 * تكوين الحالات للنظام الجديد
 */

import type { StatusConfig, FinancingStatus, FinancingPhase } from '../types';

// ═══════════════════════════════════════════════════════════════════
// Status Definitions - All statuses with Arabic labels
// ═══════════════════════════════════════════════════════════════════

export const STATUS_CONFIG: Record<FinancingStatus, StatusConfig> = {
  DRAFT: {
    status: 'DRAFT',
    phase: 'application',
    nameAr: 'مسودة',
    descriptionAr: 'طلب غير مكتمل',
    customerMessageAr: 'أكمل طلبك للحصول على تمويل الخدمات',
    color: 'gray',
    icon: 'FileEdit',
    isTerminal: false,
    requiredAction: 'إكمال الطلب',
    requiredActionActor: 'customer',
  },
  SUBMITTED: {
    status: 'SUBMITTED',
    phase: 'application',
    nameAr: 'تم التقديم',
    descriptionAr: 'طلبك قيد الاستلام',
    customerMessageAr: 'تم استلام طلبك بنجاح',
    color: 'blue',
    icon: 'Send',
    isTerminal: false,
  },
  UNDER_REVIEW: {
    status: 'UNDER_REVIEW',
    phase: 'review',
    nameAr: 'قيد المراجعة',
    descriptionAr: 'يراجع فريقنا طلبك',
    customerMessageAr: 'طلبك قيد الدراسة من فريق التمويل',
    color: 'blue',
    icon: 'Search',
    isTerminal: false,
    requiredAction: 'مراجعة الطلب',
    requiredActionActor: 'admin',
  },
  OFFER_READY: {
    status: 'OFFER_READY',
    phase: 'offer',
    nameAr: 'العرض جاهز',
    descriptionAr: 'عرض التمويل جاهز لك',
    customerMessageAr: 'تمت الموافقة المبدئية! سيتم إرسال إقرار الشروط قريباً',
    color: 'green',
    icon: 'CheckCircle',
    isTerminal: false,
    requiredAction: 'إرسال الإقرار',
    requiredActionActor: 'admin',
  },
  ACK_PENDING: {
    status: 'ACK_PENDING',
    phase: 'acknowledgment',
    nameAr: 'بانتظار توقيع الإقرار',
    descriptionAr: 'يرجى مراجعة وتوقيع إقرار الشروط',
    customerMessageAr: 'يرجى قراءة إقرار الشروط والأحكام وتوقيعه',
    color: 'yellow',
    icon: 'FileCheck',
    isTerminal: false,
    requiredAction: 'توقيع الإقرار',
    requiredActionActor: 'customer',
  },
  ACK_SIGNED: {
    status: 'ACK_SIGNED',
    phase: 'acknowledgment',
    nameAr: 'تم توقيع الإقرار',
    descriptionAr: 'تم توقيع إقرار الشروط',
    customerMessageAr: 'تم توقيع الإقرار بنجاح. سيتم إرسال العقد قريباً',
    color: 'green',
    icon: 'CheckCircle2',
    isTerminal: false,
    requiredAction: 'إرسال العقد',
    requiredActionActor: 'admin',
  },
  CONTRACT_PENDING: {
    status: 'CONTRACT_PENDING',
    phase: 'contract',
    nameAr: 'بانتظار توقيع العقد',
    descriptionAr: 'يرجى مراجعة وتوقيع عقد التمويل',
    customerMessageAr: 'يرجى قراءة عقد التمويل بعناية وتوقيعه',
    color: 'yellow',
    icon: 'FileText',
    isTerminal: false,
    requiredAction: 'توقيع العقد',
    requiredActionActor: 'customer',
  },
  CONTRACT_SIGNED: {
    status: 'CONTRACT_SIGNED',
    phase: 'contract',
    nameAr: 'تم توقيع العقد',
    descriptionAr: 'تم توقيع عقد التمويل',
    customerMessageAr: 'تم توقيع العقد بنجاح. جاري إصدار سند الأمر',
    color: 'green',
    icon: 'CheckCircle2',
    isTerminal: false,
    requiredAction: 'إصدار السند',
    requiredActionActor: 'admin',
  },
  BOND_PENDING: {
    status: 'BOND_PENDING',
    phase: 'bond',
    nameAr: 'بانتظار توقيع السند',
    descriptionAr: 'تم إصدار سند الأمر',
    customerMessageAr: 'تم إصدار سند الأمر عبر نافذ. يرجى تأكيد التوقيع',
    color: 'purple',
    icon: 'Stamp',
    isTerminal: false,
    requiredAction: 'تأكيد توقيع السند',
    requiredActionActor: 'customer',
  },
  BOND_SIGNED: {
    status: 'BOND_SIGNED',
    phase: 'bond',
    nameAr: 'تم توقيع السند',
    descriptionAr: 'تم توقيع سند الأمر',
    customerMessageAr: 'تم توقيع السند. جاري تفعيل رصيد الخدمات',
    color: 'green',
    icon: 'CheckCircle2',
    isTerminal: false,
    requiredAction: 'تفعيل الرصيد',
    requiredActionActor: 'admin',
  },
  CREDIT_ACTIVE: {
    status: 'CREDIT_ACTIVE',
    phase: 'active',
    nameAr: 'الرصيد نشط',
    descriptionAr: 'رصيد الخدمات جاهز للاستخدام',
    customerMessageAr: 'رصيد الخدمات متاح! يمكنك استخدامه الآن',
    color: 'green',
    icon: 'Wallet',
    isTerminal: false,
    requiredAction: 'استخدام الرصيد',
    requiredActionActor: 'customer',
  },
  COMPLETED: {
    status: 'COMPLETED',
    phase: 'terminal',
    nameAr: 'مكتمل',
    descriptionAr: 'تم إتمام عقد التمويل بنجاح',
    customerMessageAr: 'تهانينا! تم إتمام عقد التمويل بنجاح',
    color: 'green',
    icon: 'Trophy',
    isTerminal: true,
  },
  CANCELLED: {
    status: 'CANCELLED',
    phase: 'terminal',
    nameAr: 'ملغي',
    descriptionAr: 'تم إلغاء الطلب',
    customerMessageAr: 'تم إلغاء طلب التمويل',
    color: 'gray',
    icon: 'Ban',
    isTerminal: true,
  },
  DECLINED: {
    status: 'DECLINED',
    phase: 'terminal',
    nameAr: 'مرفوض',
    descriptionAr: 'لم تتم الموافقة على الطلب',
    customerMessageAr: 'نعتذر، لم تتم الموافقة على طلبك',
    color: 'red',
    icon: 'XCircle',
    isTerminal: true,
  },
};

// ═══════════════════════════════════════════════════════════════════
// Timeline Order - The visual order of statuses
// ═══════════════════════════════════════════════════════════════════

export const TIMELINE_ORDER: FinancingStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'OFFER_READY',
  'ACK_PENDING',
  'ACK_SIGNED',
  'CONTRACT_PENDING',
  'CONTRACT_SIGNED',
  'BOND_PENDING',
  'BOND_SIGNED',
  'CREDIT_ACTIVE',
  'COMPLETED',
];

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

export function getStatusConfig(status: FinancingStatus): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
}

export function getPhaseStatuses(phase: FinancingPhase): FinancingStatus[] {
  return Object.values(STATUS_CONFIG)
    .filter((config) => config.phase === phase)
    .map((config) => config.status);
}

export function isTerminalStatus(status: FinancingStatus): boolean {
  return STATUS_CONFIG[status]?.isTerminal ?? false;
}

export function getStatusIndex(status: FinancingStatus): number {
  return TIMELINE_ORDER.indexOf(status);
}

export function getNextStatus(status: FinancingStatus): FinancingStatus | null {
  const index = getStatusIndex(status);
  if (index === -1 || index >= TIMELINE_ORDER.length - 1) return null;
  return TIMELINE_ORDER[index + 1];
}

// Color mappings for Tailwind classes
export const STATUS_COLORS = {
  gray: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
    badge: 'bg-muted/50 text-muted-foreground',
  },
  blue: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
    badge: 'bg-primary/10 text-primary',
  },
  green: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
    badge: 'bg-success/10 text-success',
  },
  yellow: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
    badge: 'bg-warning/10 text-warning',
  },
  red: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
    badge: 'bg-destructive/10 text-destructive',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
} as const;
