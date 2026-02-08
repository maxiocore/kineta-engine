/**
 * ASH HOLDING Financing System v3 - Index
 * تصدير النظام الجديد
 */

// Main Dashboard
export { default as ClientFinancingV3 } from './ClientFinancingV3';

// Components
export {
  FinancingHeroCard,
  FinancingEmptyState,
  FinancingStatsCards,
  InstallmentsProgress,
  FinancingTimeline,
  CompactTimeline,
  QuickActions,
  PrimaryCTA,
  ActivityLog,
  ActivityItem,
  WalletCard,
  MiniWalletCard,
  RTLSegmentedControl,
  NextActionCard,
  OnboardingCard,
  EligibilitySection,
  HeroCardSkeleton,
  StatsCardsSkeleton,
  TimelineSkeleton,
  WalletCardSkeleton,
  ActivityLogSkeleton,
  FinancingPageSkeleton,
  TabTransition,
  StaggerContainer,
  StaggerItem,
} from './components';

// Types
export type {
  FinancingStats,
  QuickAction,
  ActivityItem as ActivityItemType,
  ViewMode,
  SegmentItem,
} from './types';

// Config
export {
  STATUS_CONFIG,
  STATUS_COLORS,
  TIMELINE_ORDER,
  getStatusConfig,
  getPhaseStatuses,
  isTerminalStatus,
  getStatusIndex,
  getNextStatus,
  FINANCING_JOURNEY_STEPS,
  EMPTY_STATE_FEATURES,
} from './config';
