/**
 * ASH HOLDING - Unified State Machine
 * نظام إدارة الحالات الموحد
 * 
 * يغطي: Auth + Wallet
 */

// ============================================
// Core Types
// ============================================
export * from './core/types';

// ============================================
// Auth State Machine
// ============================================
export * from './auth/states';
export * from './auth/transitions';

// ============================================
// Wallet State Machine
// ============================================
export * from './wallet/states';
export * from './wallet/transitions';

// ============================================
// Convenience Imports
// ============================================
import { AUTH_STATE_DEFINITIONS } from './auth/states';
import { WALLET_STATE_DEFINITIONS } from './wallet/states';
import { AUTH_TRANSITIONS } from './auth/transitions';
import { WALLET_TRANSITIONS } from './wallet/transitions';

/**
 * جميع تعريفات الحالات
 */
export const ALL_STATE_DEFINITIONS = {
  AUTH: AUTH_STATE_DEFINITIONS,
  WALLET: WALLET_STATE_DEFINITIONS,
} as const;

/**
 * جميع الانتقالات
 */
export const ALL_TRANSITIONS = {
  AUTH: AUTH_TRANSITIONS,
  WALLET: WALLET_TRANSITIONS,
} as const;

/**
 * الحالات النهائية (Terminal States)
 */
export const TERMINAL_STATES = {
  AUTH: ['SIGNUP_COMPLETED', 'LOGIN_SUCCESS', 'ACCOUNT_LOCKED', 'PASSWORD_RESET_COMPLETED', 'SESSION_EXPIRED', 'LOGGED_OUT'],
  WALLET: [],
} as const;
