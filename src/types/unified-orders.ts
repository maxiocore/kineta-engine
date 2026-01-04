// =============================================
// Unified Orders System - Types & Interfaces
// =============================================

// Unified order domains
export type OrderDomain = 
  | 'dev'        // خدمات البرمجة
  | 'design'     // خدمات التصميم
  | 'marketing'  // خدمات التسويق
  | 'smm'        // خدمات السوشيال ميديا
  | 'hosting'    // خدمات الاستضافة
  | 'other';     // أخرى

// Domain labels in Arabic
export const domainLabels: Record<OrderDomain, string> = {
  dev: 'برمجة',
  design: 'تصميم',
  marketing: 'تسويق',
  smm: 'سوشيال ميديا',
  hosting: 'استضافة',
  other: 'أخرى',
};

// Domain colors for badges
export const domainColors: Record<OrderDomain, string> = {
  dev: 'bg-violet-500',
  design: 'bg-pink-500',
  marketing: 'bg-amber-500',
  smm: 'bg-cyan-500',
  hosting: 'bg-blue-500',
  other: 'bg-gray-500',
};

// Domain icons
export const domainIcons: Record<OrderDomain, string> = {
  dev: 'Code',
  design: 'Palette',
  marketing: 'Megaphone',
  smm: 'Share2',
  hosting: 'Server',
  other: 'Package',
};

// =============================================
// Unified Status System
// =============================================

export type UnifiedStatus = 
  | 'draft'
  | 'pending_verification'
  | 'submitted'
  | 'under_review'
  | 'action_required'
  | 'in_progress'
  | 'invoice_sent'
  | 'waiting_payment'
  | 'completed'
  | 'cancelled'
  | 'rejected';

// Status configuration with rank, label, and styling
export interface StatusConfig {
  rank: number;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const unifiedStatusConfig: Record<UnifiedStatus, StatusConfig> = {
  draft: {
    rank: 1,
    label: 'مسودة',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'FileText',
  },
  pending_verification: {
    rank: 2,
    label: 'بانتظار التحقق',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'Mail',
  },
  submitted: {
    rank: 3,
    label: 'تم الاستلام',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'Inbox',
  },
  under_review: {
    rank: 4,
    label: 'قيد المراجعة',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    icon: 'Search',
  },
  action_required: {
    rank: 5,
    label: 'بانتظار إجراء منك',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: 'AlertCircle',
  },
  in_progress: {
    rank: 6,
    label: 'قيد التنفيذ',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: 'Settings',
  },
  invoice_sent: {
    rank: 7,
    label: 'فاتورة مرسلة',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    icon: 'Receipt',
  },
  waiting_payment: {
    rank: 8,
    label: 'بانتظار الدفع',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: 'CreditCard',
  },
  completed: {
    rank: 9,
    label: 'مكتمل',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'CheckCircle',
  },
  cancelled: {
    rank: 10,
    label: 'ملغي',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'XCircle',
  },
  rejected: {
    rank: 11,
    label: 'مرفوض',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: 'Ban',
  },
};

// =============================================
// Status Mapping from Source Tables
// =============================================

// Dev Orders status mapping
export const devOrderStatusMap: Record<string, UnifiedStatus> = {
  'draft': 'draft',
  'pending_email_verification': 'pending_verification',
  'under_review': 'under_review',
  'need_info': 'action_required',
  'quoted': 'action_required',
  'invoice_sent': 'invoice_sent',
  'approved': 'in_progress',
  'accepted': 'in_progress',
  'in_progress': 'in_progress',
  'testing': 'in_progress',
  'completed': 'completed',
  'rejected': 'rejected',
  'cancelled': 'cancelled',
};

// SMM/Regular Orders status mapping
export const smmOrderStatusMap: Record<string, UnifiedStatus> = {
  'pending': 'submitted',
  'confirmed': 'in_progress',
  'processing': 'in_progress',
  'in_progress': 'in_progress',
  'completed': 'completed',
  'partial': 'completed',
  'cancelled': 'cancelled',
  'refunded': 'cancelled',
};

// Hosting Orders status mapping
export const hostingOrderStatusMap: Record<string, UnifiedStatus> = {
  'pending': 'submitted',
  'provisioning': 'in_progress',
  'active': 'completed',
  'suspended': 'cancelled',
  'terminated': 'cancelled',
  'failed': 'rejected',
};

// =============================================
// Unified Order Interface
// =============================================

export interface UnifiedOrder {
  id: string;
  order_no: string;
  domain: OrderDomain;
  domain_label: string;
  service_id: string | null;
  service_title: string;
  status: UnifiedStatus;
  status_label: string;
  status_rank: number;
  status_config: StatusConfig;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  due_at?: string;
  action_required: boolean;
  action_label?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  total_price?: number;
  meta: Record<string, any>;
  source_table: string;
  source_id: string;
}

// =============================================
// Filter & Sort Types
// =============================================

export type OrderSortField = 'created_at' | 'updated_at' | 'due_at' | 'status_rank';
export type OrderSortDirection = 'asc' | 'desc';

export interface OrderFilters {
  search?: string;
  domain?: OrderDomain | 'all';
  status?: UnifiedStatus | 'all';
  dateRange?: {
    from: Date;
    to: Date;
  };
  actionRequired?: boolean;
  userId?: string;
}

export interface OrderSort {
  field: OrderSortField;
  direction: OrderSortDirection;
}

// =============================================
// Tab Configuration
// =============================================

export interface OrderTab {
  id: string;
  label: string;
  filter: Partial<OrderFilters>;
  icon?: string;
}

export const orderTabs: OrderTab[] = [
  { id: 'all', label: 'الكل', filter: {}, icon: 'List' },
  { id: 'action_required', label: 'بانتظار إجراء مني', filter: { actionRequired: true }, icon: 'AlertCircle' },
  { id: 'in_progress', label: 'قيد المعالجة', filter: { status: 'in_progress' }, icon: 'Settings' },
  { id: 'completed', label: 'مكتمل', filter: { status: 'completed' }, icon: 'CheckCircle' },
  { id: 'cancelled', label: 'ملغي/مرفوض', filter: {}, icon: 'XCircle' },
  { id: 'draft', label: 'مسودات', filter: { status: 'draft' }, icon: 'FileText' },
];

// =============================================
// KPI Stats Interface
// =============================================

export interface OrderStats {
  total: number;
  inProgress: number;
  actionRequired: number;
  completed: number;
  cancelled: number;
  draft: number;
}

// =============================================
// Timeline Event Interface
// =============================================

export interface OrderTimelineEvent {
  id: string;
  order_id: string;
  event_type: string;
  event_label: string;
  actor_role: 'user' | 'admin' | 'system';
  actor_name?: string;
  message?: string;
  created_at: string;
  payload?: Record<string, any>;
}
