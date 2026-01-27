/**
 * MaxioCore Financing System v3 - Configuration
 * تكوين النظام الجديد
 */

// Re-export V2 status config
export {
  STATUS_CONFIG,
  STATUS_COLORS,
  TIMELINE_ORDER,
  getStatusConfig,
  getPhaseStatuses,
  isTerminalStatus,
  getStatusIndex,
  getNextStatus,
} from '../../v2/config/statusConfig';

// ═══════════════════════════════════════════════════════════════════
// V3 Timeline Steps - Complete Journey
// ═══════════════════════════════════════════════════════════════════

export const FINANCING_JOURNEY_STEPS: {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  statuses: string[];
}[] = [
  {
    id: 'submit',
    label: 'تقديم الطلب',
    shortLabel: 'تقديم',
    icon: 'Send',
    statuses: ['SUBMITTED'],
  },
  {
    id: 'review',
    label: 'مراجعة الطلب',
    shortLabel: 'مراجعة',
    icon: 'Search',
    statuses: ['UNDER_REVIEW'],
  },
  {
    id: 'offer',
    label: 'العرض والإقرار',
    shortLabel: 'إقرار',
    icon: 'FileCheck',
    statuses: ['OFFER_READY', 'ACK_PENDING', 'ACK_SIGNED'],
  },
  {
    id: 'contract',
    label: 'توقيع العقد',
    shortLabel: 'عقد',
    icon: 'FileText',
    statuses: ['CONTRACT_PENDING', 'CONTRACT_SIGNED'],
  },
  {
    id: 'bond',
    label: 'سند الأمر',
    shortLabel: 'سند',
    icon: 'Stamp',
    statuses: ['BOND_PENDING', 'BOND_SIGNED'],
  },
  {
    id: 'deposit',
    label: 'إيداع الرصيد',
    shortLabel: 'إيداع',
    icon: 'Wallet',
    statuses: ['CREDIT_ACTIVE'],
  },
  {
    id: 'use',
    label: 'استخدام الرصيد',
    shortLabel: 'استخدام',
    icon: 'ShoppingCart',
    statuses: ['COMPLETED'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// Quick Actions Config
// ═══════════════════════════════════════════════════════════════════

export const EMPTY_STATE_FEATURES = [
  {
    icon: 'CreditCard',
    title: 'تمويل غير نقدي',
    description: 'رصيد خدمات فقط - لا يوجد تحويل نقدي',
  },
  {
    icon: 'Clock',
    title: 'موافقة سريعة',
    description: 'مراجعة الطلب خلال 24 ساعة',
  },
  {
    icon: 'Shield',
    title: 'آمن ومضمون',
    description: 'حماية كاملة لبياناتك',
  },
  {
    icon: 'Percent',
    title: 'أقساط مرنة',
    description: 'خطط سداد متنوعة',
  },
] as const;
