/**
 * React Hook for Audit Logging
 * Provides easy access to audit logging functionality in React components
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import auditLogger, {
  type EligibilityAuditEntry,
  type VerificationAuditEntry,
  type GeneralAuditEntry,
  type VerificationType,
  type RiskLevel,
  getSessionId
} from '@/lib/eligibility/auditService';

interface AuditContext {
  sessionId: string;
  userId: string | null;
  deviceFingerprint: string;
  ipAddress: string;
  geoCountry: string;
  geoCity: string;
}

export const useAuditLogger = () => {
  const { user } = useAuth();
  const [context, setContext] = useState<AuditContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize and update context
  useEffect(() => {
    const initContext = async () => {
      const ctx = await auditLogger.getContext();
      setContext({
        sessionId: ctx.sessionId,
        userId: ctx.userId,
        deviceFingerprint: ctx.deviceFingerprint,
        ipAddress: ctx.ipAddress,
        geoCountry: ctx.geoCountry,
        geoCity: ctx.geoCity
      });
      setIsReady(true);
    };

    initContext();
  }, []);

  // Update user ID when auth changes
  useEffect(() => {
    if (user?.id) {
      auditLogger.setUserId(user.id);
    }
  }, [user?.id]);

  /**
   * Log eligibility step
   */
  const logStep = useCallback(async (
    stepName: string,
    stepOrder: number,
    status: 'started' | 'completed' | 'failed' | 'skipped',
    options?: {
      applicationId?: string;
      inputData?: Record<string, unknown>;
      outputData?: Record<string, unknown>;
      errorMessage?: string;
      riskSignals?: Record<string, unknown>;
    }
  ) => {
    await auditLogger.logEligibilityStep({
      applicationId: options?.applicationId,
      stepName,
      stepOrder,
      status,
      inputData: options?.inputData,
      outputData: options?.outputData,
      errorMessage: options?.errorMessage,
      riskSignals: options?.riskSignals
    });
  }, []);

  /**
   * Log verification attempt
   */
  const logVerification = useCallback(async (
    verificationType: VerificationType,
    attemptNumber: number,
    status: 'pending' | 'success' | 'failed' | 'expired' | 'blocked',
    options?: {
      verificationTarget?: string;
      inputHash?: string;
      resultCode?: string;
      resultMessage?: string;
      isSuspicious?: boolean;
      fraudSignals?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }
  ) => {
    await auditLogger.logVerificationAttempt({
      verificationType,
      attemptNumber,
      status,
      verificationTarget: options?.verificationTarget,
      inputHash: options?.inputHash,
      resultCode: options?.resultCode,
      resultMessage: options?.resultMessage,
      isSuspicious: options?.isSuspicious,
      fraudSignals: options?.fraudSignals,
      metadata: options?.metadata
    });
  }, []);

  /**
   * Log general audit entry
   */
  const logAuditEntry = useCallback(async (
    tableName: string,
    action: string,
    options?: {
      recordId?: string;
      oldValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
      riskLevel?: RiskLevel;
      verificationStep?: string;
      isSuspicious?: boolean;
      metadata?: Record<string, unknown>;
    }
  ) => {
    await auditLogger.logAudit({
      tableName,
      action,
      recordId: options?.recordId,
      oldValue: options?.oldValue,
      newValue: options?.newValue,
      riskLevel: options?.riskLevel,
      verificationStep: options?.verificationStep,
      isSuspicious: options?.isSuspicious,
      metadata: options?.metadata
    });
  }, []);

  /**
   * Log fraud detection
   */
  const logFraud = useCallback(async (
    signalType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    metadata?: Record<string, unknown>
  ) => {
    await auditLogger.logFraudEvent(signalType, severity, description, metadata);
  }, []);

  /**
   * Log decision
   */
  const logDecision = useCallback(async (
    applicationId: string,
    decision: 'APPROVED' | 'DECLINED' | 'MANUAL_REVIEW',
    reason: string,
    score?: number,
    factors?: Record<string, unknown>
  ) => {
    await auditLogger.logDecision(applicationId, decision, reason, score, factors);
  }, []);

  /**
   * Start tracking a step (for duration calculation)
   */
  const startStepTimer = useCallback((stepKey: string) => {
    auditLogger.startStep(stepKey);
  }, []);

  /**
   * Get step duration
   */
  const getStepDuration = useCallback((stepKey: string): number => {
    return auditLogger.getStepDuration(stepKey);
  }, []);

  return {
    // State
    context,
    isReady,
    sessionId: getSessionId(),
    
    // Logging functions
    logStep,
    logVerification,
    logAuditEntry,
    logFraud,
    logDecision,
    
    // Timer functions
    startStepTimer,
    getStepDuration
  };
};

export default useAuditLogger;
