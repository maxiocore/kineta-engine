/**
 * MaxioCore - Unified State Machine
 * نظام إدارة الحالات الموحد
 * 
 * يغطي: Auth + Wallet + Financing
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
// Financing State Machine
// ============================================
export * from './financing/states';
export * from './financing/transitions';

// ============================================
// Convenience Imports
// ============================================
import { AUTH_STATE_DEFINITIONS } from './auth/states';
import { WALLET_STATE_DEFINITIONS } from './wallet/states';
import { FINANCING_STATE_DEFINITIONS } from './financing/states';
import { AUTH_TRANSITIONS } from './auth/transitions';
import { WALLET_TRANSITIONS } from './wallet/transitions';
import { FINANCING_TRANSITIONS } from './financing/transitions';

/**
 * جميع تعريفات الحالات
 */
export const ALL_STATE_DEFINITIONS = {
  AUTH: AUTH_STATE_DEFINITIONS,
  WALLET: WALLET_STATE_DEFINITIONS,
  FINANCING: FINANCING_STATE_DEFINITIONS
} as const;

/**
 * جميع الانتقالات
 */
export const ALL_TRANSITIONS = {
  AUTH: AUTH_TRANSITIONS,
  WALLET: WALLET_TRANSITIONS,
  FINANCING: FINANCING_TRANSITIONS
} as const;

/**
 * الحالات النهائية (Terminal States)
 */
export const TERMINAL_STATES = {
  AUTH: ['SIGNUP_COMPLETED', 'LOGIN_SUCCESS', 'ACCOUNT_LOCKED', 'PASSWORD_RESET_COMPLETED', 'SESSION_EXPIRED', 'LOGGED_OUT'],
  WALLET: [], // لا توجد حالات نهائية للمحفظة
  FINANCING: ['FIN_DECLINED', 'FIN_COMPLETED', 'FIN_EXPIRED', 'FIN_CANCELLED']
} as const;
