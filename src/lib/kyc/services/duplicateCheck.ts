// ============================================
// Duplicate Check Service - MaxioCore KYC
// Prevents same ID from being used multiple times
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { DuplicateCheckResult } from '../types';

/**
 * Check if national ID has already been used in the system
 * Prevents same document from being registered multiple times
 */
export async function checkForDuplicates(
  nationalId: string,
  currentUserId: string
): Promise<DuplicateCheckResult> {
  try {
    // Check kyc_verifications table for existing ID
    const { data: existingKyc, error: kycError } = await supabase
      .from('kyc_verifications')
      .select('user_id, verified_at, status')
      .eq('national_id', nationalId)
      .eq('status', 'PASSED')
      .neq('user_id', currentUserId)
      .limit(1);
    
    if (kycError) {
      console.error('Error checking KYC duplicates:', kycError);
      // Continue with other checks
    }
    
    if (existingKyc && existingKyc.length > 0) {
      return {
        isDuplicate: true,
        existingUserId: existingKyc[0].user_id,
        existingApplicationDate: existingKyc[0].verified_at,
        reason: 'رقم الهوية مسجل مسبقاً في النظام',
      };
    }
    
    // Check financing applications
    const { data: existingFinancing } = await supabase
      .from('financing_applications')
      .select('user_id, created_at, status')
      .eq('national_id', nationalId)
      .neq('user_id', currentUserId)
      .in('status', ['pending', 'approved', 'active'])
      .limit(1);
    
    if (existingFinancing && existingFinancing.length > 0) {
      return {
        isDuplicate: true,
        existingUserId: existingFinancing[0].user_id,
        existingApplicationDate: existingFinancing[0].created_at,
        reason: 'يوجد طلب تمويل نشط بهذا الرقم',
      };
    }
    
    // Check if same user has recent rejected verification (fraud prevention)
    const { data: recentRejections } = await supabase
      .from('kyc_verifications')
      .select('created_at, failure_reasons')
      .eq('user_id', currentUserId)
      .eq('status', 'FAILED')
      .gte('created_at', getDateDaysAgo(7).toISOString())
      .order('created_at', { ascending: false });
    
    if (recentRejections && recentRejections.length >= 3) {
      return {
        isDuplicate: true,
        reason: 'تم رفض محاولات التحقق المتعددة - يرجى الانتظار قبل المحاولة مجدداً',
      };
    }
    
    // No duplicates found
    return {
      isDuplicate: false,
    };
    
  } catch (error) {
    console.error('Error in duplicate check:', error);
    // In case of error, allow proceeding but log for review
    return {
      isDuplicate: false,
    };
  }
}

/**
 * Check if user has pending KYC verification
 */
export async function hasPendingVerification(userId: string): Promise<{
  hasPending: boolean;
  pendingSessionId?: string;
  startedAt?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('kyc_verifications')
      .select('session_id, created_at, status')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return { hasPending: false };
    }
    
    // Check if session is still valid (within 30 minutes)
    const sessionStart = new Date(data[0].created_at);
    const now = new Date();
    const minutesElapsed = (now.getTime() - sessionStart.getTime()) / (1000 * 60);
    
    if (minutesElapsed > 30) {
      // Session expired, mark as failed
      await supabase
        .from('kyc_verifications')
        .update({ status: 'EXPIRED' })
        .eq('session_id', data[0].session_id);
      
      return { hasPending: false };
    }
    
    return {
      hasPending: true,
      pendingSessionId: data[0].session_id,
      startedAt: data[0].created_at,
    };
  } catch {
    return { hasPending: false };
  }
}

/**
 * Get recent verification history for user
 */
export async function getVerificationHistory(userId: string): Promise<{
  totalAttempts: number;
  successfulAttempts: number;
  lastAttempt?: {
    date: string;
    status: string;
    reason?: string;
  };
}> {
  try {
    const { data } = await supabase
      .from('kyc_verifications')
      .select('status, created_at, failure_reasons')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!data || data.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
      };
    }
    
    const successfulAttempts = data.filter(v => v.status === 'PASSED').length;
    const lastAttempt = data[0];
    
    return {
      totalAttempts: data.length,
      successfulAttempts,
      lastAttempt: {
        date: lastAttempt.created_at,
        status: lastAttempt.status,
        reason: lastAttempt.failure_reasons?.[0],
      },
    };
  } catch {
    return {
      totalAttempts: 0,
      successfulAttempts: 0,
    };
  }
}

/**
 * Record new KYC verification attempt
 */
export async function recordVerificationAttempt(
  userId: string,
  nationalId: string,
  sessionId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('kyc_verifications')
      .insert({
        user_id: userId,
        national_id: nationalId,
        session_id: sessionId,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error recording verification attempt:', error);
      return null;
    }
    
    return data.id;
  } catch {
    return null;
  }
}

/**
 * Update verification result
 */
export async function updateVerificationResult(
  sessionId: string,
  result: {
    status: 'PASSED' | 'FAILED' | 'EXPIRED';
    verifiedData?: Record<string, unknown>;
    failureReasons?: string[];
    ocrConfidence?: number;
    livenessScore?: number;
    faceMatchScore?: number;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('kyc_verifications')
      .update({
        status: result.status,
        verified_at: result.status === 'PASSED' ? new Date().toISOString() : null,
        verified_data: result.verifiedData,
        failure_reasons: result.failureReasons,
        ocr_confidence: result.ocrConfidence,
        liveness_score: result.livenessScore,
        face_match_score: result.faceMatchScore,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);
    
    return !error;
  } catch {
    return false;
  }
}

// Helper function
function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}
