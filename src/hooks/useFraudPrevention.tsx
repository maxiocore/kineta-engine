// ============================================
// Fraud Prevention Hook - ASH HOLDING
// Client-side fraud detection integration
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import {
  generateDeviceFingerprint,
  runFraudChecks,
  hashString,
  generateSessionId,
  FraudCheckResult,
  DeviceFingerprint,
  GeoInfo,
  FRAUD_CONFIG,
} from '@/lib/eligibility/fraudPrevention';

interface UseFraudPreventionReturn {
  isInitialized: boolean;
  isLoading: boolean;
  deviceFingerprint: DeviceFingerprint | null;
  geoInfo: GeoInfo | null;
  sessionId: string;
  lastCheckResult: FraudCheckResult | null;
  runCheck: (nationalIdHash?: string, faceEmbeddingHash?: string) => Promise<FraudCheckResult>;
  recordAttempt: (action: string) => Promise<void>;
  isBlocked: boolean;
  blockReason: string | null;
}

export function useFraudPrevention(): UseFraudPreventionReturn {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprint | null>(null);
  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const [lastCheckResult, setLastCheckResult] = useState<FraudCheckResult | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  
  const sessionIdRef = useRef<string>(generateSessionId());
  
  // Initialize device fingerprint
  useEffect(() => {
    const initializeFingerprint = async () => {
      try {
        // Generate device fingerprint
        const fingerprint = generateDeviceFingerprint();
        setDeviceFingerprint(fingerprint);
        
        // Get geo info (mock for now - in production use IP geolocation API)
        const geo = await fetchGeoInfo();
        setGeoInfo(geo);
        
        // Store fingerprint in database
        await storeFingerprint(fingerprint, geo);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize fraud prevention:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeFingerprint();
  }, [user?.id]);
  
  // Fetch geo information
  const fetchGeoInfo = async (): Promise<GeoInfo> => {
    try {
      // In production, use a geo IP service
      // For now, return mock data
      const response = await fetch('https://ipapi.co/json/', { 
        signal: AbortSignal.timeout(5000) 
      }).catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        return {
          ipAddress: data.ip || '',
          country: data.country_name || '',
          countryCode: data.country_code || '',
          city: data.city || '',
          region: data.region || '',
          latitude: data.latitude,
          longitude: data.longitude,
          isVPN: false, // Would need specialized service to detect
          isProxy: false,
          isTor: false,
          isMobile: /Mobile|Android|iPhone/.test(navigator.userAgent),
          asn: data.asn,
          org: data.org,
        };
      }
      
      // Fallback
      return {
        ipAddress: '',
        country: 'Unknown',
        countryCode: '',
        city: '',
        region: '',
        isVPN: false,
        isProxy: false,
        isTor: false,
        isMobile: /Mobile|Android|iPhone/.test(navigator.userAgent),
      };
    } catch {
      return {
        ipAddress: '',
        country: 'Unknown',
        countryCode: '',
        city: '',
        region: '',
        isVPN: false,
        isProxy: false,
        isTor: false,
        isMobile: /Mobile|Android|iPhone/.test(navigator.userAgent),
      };
    }
  };
  
  // Store fingerprint in database
  const storeFingerprint = async (fingerprint: DeviceFingerprint, geo: GeoInfo) => {
    try {
      const { error } = await supabase
        .from('device_fingerprints')
        .upsert({
          user_id: user?.id || null,
          fingerprint_hash: fingerprint.fingerprintHash,
          device_info: {
            userAgent: fingerprint.userAgent,
            platform: fingerprint.platform,
            language: fingerprint.language,
            screenResolution: fingerprint.screenResolution,
            timezone: fingerprint.timezone,
            hardwareConcurrency: fingerprint.hardwareConcurrency,
          },
          ip_address: geo.ipAddress,
          geo_country: geo.countryCode,
          geo_city: geo.city,
          is_vpn: geo.isVPN,
          is_proxy: geo.isProxy,
          is_tor: geo.isTor,
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'fingerprint_hash',
          ignoreDuplicates: false,
        });
      
      if (error) {
        console.error('Failed to store fingerprint:', error);
      }
    } catch (error) {
      console.error('Error storing fingerprint:', error);
    }
  };
  
  // Run fraud check
  const runCheck = useCallback(async (
    nationalIdHash?: string,
    faceEmbeddingHash?: string
  ): Promise<FraudCheckResult> => {
    if (!deviceFingerprint || !geoInfo) {
      throw new Error('Fraud prevention not initialized');
    }
    
    setIsLoading(true);
    
    try {
      // Fetch existing data for comparison
      const [
        fingerprintsResponse,
        identityRecordsResponse,
        rateLimitResponse,
        blacklistResponse,
      ] = await Promise.all([
        supabase
          .from('device_fingerprints')
          .select('user_id, fingerprint_hash, is_blocked, applications_count'),
        supabase
          .from('identity_verification_records')
          .select('user_id, national_id_hash, face_embedding_hash, verification_status'),
        supabase
          .from('rate_limit_records')
          .select('request_count, window_start, is_blocked, blocked_until')
          .eq('identifier', user?.id || sessionIdRef.current)
          .eq('action_type', 'application_attempt'),
        supabase
          .from('fraud_blacklists')
          .select('list_type, value_hash, reason, reason_ar')
          .eq('is_active', true),
      ]);
      
      const result = runFraudChecks(
        {
          userId: user?.id,
          sessionId: sessionIdRef.current,
          nationalIdHash,
          faceEmbeddingHash,
          deviceFingerprint,
          geoInfo,
          timestamp: new Date(),
        },
        {
          existingFingerprints: (fingerprintsResponse.data || []).map(f => ({
            userId: f.user_id || '',
            fingerprintHash: f.fingerprint_hash,
            isBlocked: f.is_blocked || false,
            applicationsCount: f.applications_count || 0,
          })),
          existingIdentityRecords: (identityRecordsResponse.data || []).map(r => ({
            userId: r.user_id,
            nationalIdHash: r.national_id_hash,
            faceEmbeddingHash: r.face_embedding_hash || '',
            verificationStatus: r.verification_status,
          })),
          rateLimitRecords: (rateLimitResponse.data || []).map(r => ({
            requestCount: r.request_count,
            windowStart: new Date(r.window_start),
            isBlocked: r.is_blocked || false,
            blockedUntil: r.blocked_until ? new Date(r.blocked_until) : null,
          })),
          blacklists: (blacklistResponse.data || []).map(b => ({
            listType: b.list_type,
            valueHash: b.value_hash,
            reason: b.reason || '',
            reasonAr: b.reason_ar || '',
          })),
        }
      );
      
      setLastCheckResult(result);
      
      // Update blocked status
      if (result.recommendedAction === 'HARD_DECLINE') {
        setIsBlocked(true);
        setBlockReason(result.blockedReasons[0] || 'تم حظر الطلب');
      }
      
      // Log fraud signals
      if (result.signals.length > 0) {
        await logFraudSignals(result.signals);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [deviceFingerprint, geoInfo, user?.id]);
  
  // Record attempt for rate limiting
  const recordAttempt = useCallback(async (action: string) => {
    const identifier = user?.id || sessionIdRef.current;
    
    try {
      // Check existing record
      const { data: existing } = await supabase
        .from('rate_limit_records')
        .select('*')
        .eq('identifier', identifier)
        .eq('identifier_type', user?.id ? 'user_id' : 'session')
        .eq('action_type', action)
        .gte('window_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();
      
      if (existing) {
        // Update existing record
        const config = Object.values(FRAUD_CONFIG.rateLimits).find(r => r.action === action);
        const newCount = (existing.request_count || 0) + 1;
        const shouldBlock = config && newCount >= config.maxRequests;
        
        await supabase
          .from('rate_limit_records')
          .update({
            request_count: newCount,
            is_blocked: shouldBlock,
            blocked_until: shouldBlock && config 
              ? new Date(Date.now() + config.blockDurationMs).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Insert new record
        await supabase
          .from('rate_limit_records')
          .insert({
            identifier,
            identifier_type: user?.id ? 'user_id' : 'session',
            action_type: action,
            request_count: 1,
          });
      }
    } catch (error) {
      console.error('Failed to record attempt:', error);
    }
  }, [user?.id]);
  
  // Log fraud signals to database
  const logFraudSignals = async (signals: FraudCheckResult['signals']) => {
    try {
      const signalsToInsert = signals.map(signal => ({
        user_id: user?.id || null,
        session_id: sessionIdRef.current,
        signal_type: signal.type,
        signal_category: signal.category,
        severity: signal.severity,
        description: signal.description,
        description_ar: signal.descriptionAr,
        metadata: signal.metadata as unknown as Record<string, string | number | boolean | null>,
      }));
      
      await supabase
        .from('fraud_signals')
        .insert(signalsToInsert);
    } catch (error) {
      console.error('Failed to log fraud signals:', error);
    }
  };
  
  return {
    isInitialized,
    isLoading,
    deviceFingerprint,
    geoInfo,
    sessionId: sessionIdRef.current,
    lastCheckResult,
    runCheck,
    recordAttempt,
    isBlocked,
    blockReason,
  };
}
