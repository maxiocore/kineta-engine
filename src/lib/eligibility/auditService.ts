/**
 * Audit Logging Service for Financial Compliance
 * 
 * This service provides comprehensive audit logging for:
 * - Every step in the eligibility process
 * - Every verification attempt
 * - Device, IP, and timing information
 * - Immutable logs that cannot be deleted
 */

import { supabase } from '@/integrations/supabase/client';

// Session ID generator - unique per browser session
const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('audit_session_id');
  if (stored) return stored;
  
  const newId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  sessionStorage.setItem('audit_session_id', newId);
  return newId;
};

// Get or create session ID
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server_session';
  return generateSessionId();
};

// Device info collector
export const getDeviceInfo = (): {
  userAgent: string;
  deviceFingerprint: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
} => {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      deviceFingerprint: 'server',
      screenResolution: 'N/A',
      timezone: 'UTC',
      language: 'en',
      platform: 'server'
    };
  }

  const nav = navigator;
  const screen = window.screen;
  
  // Simple fingerprint based on browser characteristics
  const fingerprintData = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 'unknown',
    nav.platform
  ].join('|');
  
  // Create hash of fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return {
    userAgent: nav.userAgent,
    deviceFingerprint: `fp_${Math.abs(hash).toString(36)}`,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: nav.language,
    platform: nav.platform
  };
};

// Geo info interface
interface GeoInfo {
  country: string;
  city: string;
  ip: string;
}

// Cache for geo info
let geoInfoCache: GeoInfo | null = null;

// Get geo information
export const getGeoInfo = async (): Promise<GeoInfo> => {
  if (geoInfoCache) return geoInfoCache;
  
  try {
    // Using a free geo IP service
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      geoInfoCache = {
        country: data.country_code || 'Unknown',
        city: data.city || 'Unknown',
        ip: data.ip || 'Unknown'
      };
      return geoInfoCache;
    }
  } catch (error) {
    console.warn('Could not fetch geo info:', error);
  }
  
  return {
    country: 'Unknown',
    city: 'Unknown',
    ip: 'Unknown'
  };
};

// Audit log entry types
export type AuditAction = 
  | 'STEP_STARTED'
  | 'STEP_COMPLETED'
  | 'STEP_FAILED'
  | 'VERIFICATION_STARTED'
  | 'VERIFICATION_SUCCESS'
  | 'VERIFICATION_FAILED'
  | 'FRAUD_DETECTED'
  | 'DECISION_MADE'
  | 'APPLICATION_CREATED'
  | 'APPLICATION_UPDATED'
  | 'DOCUMENT_UPLOADED'
  | 'CONTRACT_SIGNED'
  | 'MANUAL_REVIEW_TRIGGERED'
  | 'HARD_DECLINE_TRIGGERED';

export type VerificationType = 
  | 'EMAIL_OTP'
  | 'PHONE_OTP'
  | 'NATIONAL_ID'
  | 'FACE_MATCH'
  | 'LIVENESS'
  | 'DOCUMENT_OCR'
  | 'EMPLOYMENT'
  | 'INCOME'
  | 'CREDIT_CHECK';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Eligibility step audit interface
export interface EligibilityAuditEntry {
  applicationId?: string;
  stepName: string;
  stepOrder: number;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
  riskSignals?: Record<string, unknown>;
}

// Verification audit interface
export interface VerificationAuditEntry {
  verificationType: VerificationType;
  verificationTarget?: string; // e.g., masked email or phone
  attemptNumber: number;
  status: 'pending' | 'success' | 'failed' | 'expired' | 'blocked';
  inputHash?: string; // Hash of input for security
  resultCode?: string;
  resultMessage?: string;
  isSuspicious?: boolean;
  fraudSignals?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// General audit interface
export interface GeneralAuditEntry {
  tableName: string;
  recordId?: string;
  action: AuditAction | string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  riskLevel?: RiskLevel;
  verificationStep?: string;
  isSuspicious?: boolean;
  metadata?: Record<string, unknown>;
}

// Timer for tracking step duration
const stepTimers: Map<string, number> = new Map();

/**
 * Audit Logger Class
 * Provides comprehensive logging for financial compliance
 */
class AuditLogger {
  private sessionId: string;
  private deviceInfo: ReturnType<typeof getDeviceInfo>;
  private geoInfo: GeoInfo | null = null;
  private userId: string | null = null;

  constructor() {
    this.sessionId = getSessionId();
    this.deviceInfo = getDeviceInfo();
    this.initGeoInfo();
    this.initUserId();
  }

  private async initGeoInfo() {
    this.geoInfo = await getGeoInfo();
  }

  private async initUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((_, session) => {
      this.userId = session?.user?.id || null;
    });
  }

  private async getBaseContext() {
    if (!this.geoInfo) {
      this.geoInfo = await getGeoInfo();
    }
    
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      deviceFingerprint: this.deviceInfo.deviceFingerprint,
      userAgent: this.deviceInfo.userAgent,
      geoCountry: this.geoInfo.country,
      geoCity: this.geoInfo.city,
      ipAddress: this.geoInfo.ip
    };
  }

  /**
   * Start tracking a step
   */
  startStep(stepKey: string): void {
    stepTimers.set(stepKey, Date.now());
  }

  /**
   * Get duration since step started
   */
  getStepDuration(stepKey: string): number {
    const startTime = stepTimers.get(stepKey);
    if (!startTime) return 0;
    return Date.now() - startTime;
  }

  /**
   * Log an eligibility step
   */
  async logEligibilityStep(entry: EligibilityAuditEntry): Promise<void> {
    const context = await this.getBaseContext();
    const stepKey = `${entry.applicationId || 'new'}_${entry.stepName}`;
    
    // Calculate duration if step was started
    const durationMs = entry.status !== 'started' 
      ? this.getStepDuration(stepKey) 
      : undefined;
    
    // Start timer if step is starting
    if (entry.status === 'started') {
      this.startStep(stepKey);
    }

    try {
      const insertData = {
        application_id: entry.applicationId || null,
        user_id: context.userId,
        session_id: context.sessionId,
        step_name: entry.stepName,
        step_order: entry.stepOrder,
        status: entry.status,
        started_at: entry.status === 'started' ? new Date().toISOString() : undefined,
        completed_at: entry.status !== 'started' ? new Date().toISOString() : undefined,
        duration_ms: durationMs,
        input_data: entry.inputData || null,
        output_data: entry.outputData || null,
        error_message: entry.errorMessage || null,
        ip_address: context.ipAddress,
        device_fingerprint: context.deviceFingerprint,
        user_agent: context.userAgent,
        geo_country: context.geoCountry,
        geo_city: context.geoCity,
        risk_signals: entry.riskSignals || null
      };

      // Use RPC or direct insert with type assertion for new tables
      const { error } = await supabase
        .from('eligibility_audit_logs' as any)
        .insert(insertData as any);

      if (error) {
        console.error('Failed to log eligibility step:', error);
      }
    } catch (err) {
      console.error('Error in logEligibilityStep:', err);
    }
  }

  /**
   * Log a verification attempt
   */
  async logVerificationAttempt(entry: VerificationAuditEntry): Promise<void> {
    const context = await this.getBaseContext();
    const attemptKey = `${entry.verificationType}_${entry.verificationTarget || 'unknown'}`;
    
    // Calculate duration if not pending
    const durationMs = entry.status !== 'pending' 
      ? this.getStepDuration(attemptKey) 
      : undefined;
    
    // Start timer if pending
    if (entry.status === 'pending') {
      this.startStep(attemptKey);
    }

    try {
      const insertData = {
        user_id: context.userId,
        session_id: context.sessionId,
        verification_type: entry.verificationType,
        verification_target: entry.verificationTarget || null,
        attempt_number: entry.attemptNumber,
        status: entry.status,
        started_at: entry.status === 'pending' ? new Date().toISOString() : undefined,
        completed_at: entry.status !== 'pending' ? new Date().toISOString() : undefined,
        duration_ms: durationMs,
        input_hash: entry.inputHash || null,
        result_code: entry.resultCode || null,
        result_message: entry.resultMessage || null,
        ip_address: context.ipAddress,
        device_fingerprint: context.deviceFingerprint,
        user_agent: context.userAgent,
        geo_country: context.geoCountry,
        geo_city: context.geoCity,
        is_suspicious: entry.isSuspicious || false,
        fraud_signals: entry.fraudSignals || null,
        metadata: entry.metadata || null
      };

      const { error } = await supabase
        .from('verification_audit_logs' as any)
        .insert(insertData as any);

      if (error) {
        console.error('Failed to log verification attempt:', error);
      }
    } catch (err) {
      console.error('Error in logVerificationAttempt:', err);
    }
  }

  /**
   * Log a general audit entry
   */
  async logAudit(entry: GeneralAuditEntry): Promise<void> {
    const context = await this.getBaseContext();
    const startTime = Date.now();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const insertData = {
        table_name: entry.tableName,
        record_id: entry.recordId || null,
        action: entry.action,
        old_value: entry.oldValue || null,
        new_value: entry.newValue || null,
        user_id: context.userId,
        user_email: user?.email || null,
        ip_address: context.ipAddress,
        session_id: context.sessionId,
        device_fingerprint: context.deviceFingerprint,
        user_agent: context.userAgent,
        geo_country: context.geoCountry,
        geo_city: context.geoCity,
        risk_level: entry.riskLevel || 'low',
        verification_step: entry.verificationStep || null,
        is_suspicious: entry.isSuspicious || false,
        processing_time_ms: Date.now() - startTime,
        metadata: entry.metadata || null
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(insertData as any);

      if (error) {
        console.error('Failed to log audit entry:', error);
      }
    } catch (err) {
      console.error('Error in logAudit:', err);
    }
  }

  /**
   * Log fraud detection event
   */
  async logFraudEvent(
    signalType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logAudit({
      tableName: 'fraud_detection',
      action: 'FRAUD_DETECTED',
      riskLevel: severity,
      isSuspicious: true,
      newValue: {
        signalType,
        severity,
        description
      },
      metadata
    });
  }

  /**
   * Log decision event (approve, decline, manual review)
   */
  async logDecision(
    applicationId: string,
    decision: 'APPROVED' | 'DECLINED' | 'MANUAL_REVIEW',
    reason: string,
    score?: number,
    factors?: Record<string, unknown>
  ): Promise<void> {
    await this.logAudit({
      tableName: 'financing_applications',
      recordId: applicationId,
      action: 'DECISION_MADE',
      riskLevel: decision === 'DECLINED' ? 'high' : decision === 'MANUAL_REVIEW' ? 'medium' : 'low',
      newValue: {
        decision,
        reason,
        score,
        factors
      }
    });
  }

  /**
   * Get current session context for external use
   */
  async getContext() {
    return this.getBaseContext();
  }

  /**
   * Update user ID (e.g., after login)
   */
  setUserId(userId: string | null) {
    this.userId = userId;
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Convenience functions
export const logEligibilityStep = (entry: EligibilityAuditEntry) => 
  auditLogger.logEligibilityStep(entry);

export const logVerificationAttempt = (entry: VerificationAuditEntry) => 
  auditLogger.logVerificationAttempt(entry);

export const logAudit = (entry: GeneralAuditEntry) => 
  auditLogger.logAudit(entry);

export const logFraudEvent = (
  signalType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  metadata?: Record<string, unknown>
) => auditLogger.logFraudEvent(signalType, severity, description, metadata);

export const logDecision = (
  applicationId: string,
  decision: 'APPROVED' | 'DECLINED' | 'MANUAL_REVIEW',
  reason: string,
  score?: number,
  factors?: Record<string, unknown>
) => auditLogger.logDecision(applicationId, decision, reason, score, factors);

export default auditLogger;
