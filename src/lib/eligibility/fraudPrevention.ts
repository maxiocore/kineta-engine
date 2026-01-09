// ============================================
// Fraud Prevention Engine - MaxioCore
// Device Fingerprinting, Rate Limiting, IP/Geo Checks
// ============================================

import { DecisionOutcome } from './advancedDecisionEngine';

// ============================================
// Types
// ============================================

export type FraudSignalSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FraudSignalCategory = 
  | 'device'
  | 'identity' 
  | 'velocity'
  | 'geo'
  | 'biometric'
  | 'behavioral'
  | 'network';

export interface DeviceFingerprint {
  id?: string;
  fingerprintHash: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  cookiesEnabled: boolean;
  plugins: string[];
  canvas: string;
  webgl: string;
  fonts: string[];
  hardwareConcurrency: number;
  deviceMemory?: number;
  touchSupport: boolean;
  colorDepth: number;
}

export interface GeoInfo {
  ipAddress: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isMobile: boolean;
  asn?: string;
  org?: string;
}

export interface FraudSignal {
  id: string;
  type: string;
  category: FraudSignalCategory;
  severity: FraudSignalSeverity;
  description: string;
  descriptionAr: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface RateLimitConfig {
  action: string;
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface FraudCheckContext {
  userId?: string;
  sessionId: string;
  nationalIdHash?: string;
  faceEmbeddingHash?: string;
  deviceFingerprint: DeviceFingerprint;
  geoInfo: GeoInfo;
  timestamp: Date;
}

export interface FraudCheckResult {
  isPassed: boolean;
  riskScore: number;
  maxRiskScore: number;
  recommendedAction: DecisionOutcome | 'CONTINUE';
  signals: FraudSignal[];
  blockedReasons: string[];
  warnings: string[];
  metadata: {
    deviceRisk: number;
    velocityRisk: number;
    geoRisk: number;
    identityRisk: number;
    biometricRisk: number;
  };
}

// ============================================
// Configuration - Easily Modifiable
// ============================================

export const FRAUD_CONFIG = {
  // Risk thresholds
  thresholds: {
    maxRiskScore: 100,
    autoApprove: 20,      // Below this: auto approve
    manualReview: 50,     // Between autoApprove and this: manual review
    softDecline: 75,      // Between manualReview and this: soft decline
    hardDecline: 100,     // Above softDecline: hard decline
  },
  
  // Rate limiting configs
  rateLimits: {
    applicationAttempts: {
      action: 'application_attempt',
      maxRequests: 3,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      blockDurationMs: 72 * 60 * 60 * 1000, // 72 hours block
    },
    identityVerification: {
      action: 'identity_verification',
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours block
    },
    faceVerification: {
      action: 'face_verification',
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 6 * 60 * 60 * 1000, // 6 hours block
    },
    otpAttempts: {
      action: 'otp_attempt',
      maxRequests: 5,
      windowMs: 10 * 60 * 1000, // 10 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    },
  },
  
  // Allowed countries (ISO codes)
  allowedCountries: ['SA', 'AE', 'KW', 'BH', 'OM', 'QA'],
  
  // High risk countries
  highRiskCountries: [],
  
  // Blocked countries
  blockedCountries: [],
  
  // Device rules
  deviceRules: {
    maxAccountsPerDevice: 2,
    maxApplicationsPerDevice24h: 3,
    suspiciousUserAgents: [
      'HeadlessChrome',
      'PhantomJS',
      'Selenium',
      'WebDriver',
    ],
  },
  
  // Signal weights (how much each signal contributes to risk score)
  signalWeights: {
    // Critical signals (immediate action)
    blacklisted_identity: 50,
    blacklisted_device: 40,
    blacklisted_face: 50,
    tor_network: 35,
    
    // High risk signals
    vpn_detected: 20,
    proxy_detected: 20,
    blocked_country: 100,
    high_risk_country: 15,
    duplicate_identity: 40,
    duplicate_face: 40,
    rate_limit_exceeded: 30,
    
    // Medium risk signals
    multiple_accounts_device: 20,
    new_device: 10,
    device_fingerprint_mismatch: 15,
    timezone_country_mismatch: 10,
    
    // Low risk signals
    suspicious_user_agent: 8,
    incognito_mode: 5,
    missing_geo_data: 5,
  },
};

// ============================================
// Fraud Signal Generators
// ============================================

function createSignal(
  id: string,
  type: string,
  category: FraudSignalCategory,
  severity: FraudSignalSeverity,
  description: string,
  descriptionAr: string,
  metadata: Record<string, unknown> = {}
): FraudSignal {
  return {
    id,
    type,
    category,
    severity,
    description,
    descriptionAr,
    metadata,
    timestamp: new Date(),
  };
}

// ============================================
// Device Fingerprinting
// ============================================

export function generateDeviceFingerprint(): DeviceFingerprint {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const win = typeof window !== 'undefined' ? window : null;
  const screen = typeof window !== 'undefined' ? window.screen : null;

  const fingerprint: DeviceFingerprint = {
    fingerprintHash: '',
    userAgent: nav?.userAgent || '',
    platform: nav?.platform || '',
    language: nav?.language || '',
    screenResolution: screen ? `${screen.width}x${screen.height}` : '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    cookiesEnabled: nav?.cookieEnabled || false,
    plugins: [],
    canvas: '',
    webgl: '',
    fonts: [],
    hardwareConcurrency: nav?.hardwareConcurrency || 0,
    deviceMemory: (nav as Navigator & { deviceMemory?: number })?.deviceMemory,
    touchSupport: nav?.maxTouchPoints > 0 || false,
    colorDepth: screen?.colorDepth || 0,
  };

  // Generate hash from collected data
  fingerprint.fingerprintHash = hashFingerprint(fingerprint);
  
  return fingerprint;
}

function hashFingerprint(fp: DeviceFingerprint): string {
  const data = [
    fp.userAgent,
    fp.platform,
    fp.language,
    fp.screenResolution,
    fp.timezone,
    fp.hardwareConcurrency,
    fp.colorDepth,
    fp.deviceMemory,
  ].join('|');
  
  // Simple hash for client-side (should be SHA-256 on server)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// ============================================
// Fraud Checks
// ============================================

export function checkDeviceFraud(
  fingerprint: DeviceFingerprint,
  existingFingerprints: Array<{ userId: string; fingerprintHash: string; isBlocked: boolean; applicationsCount: number }>
): FraudSignal[] {
  const signals: FraudSignal[] = [];
  
  // Check if device is blocked
  const blockedDevice = existingFingerprints.find(
    f => f.fingerprintHash === fingerprint.fingerprintHash && f.isBlocked
  );
  
  if (blockedDevice) {
    signals.push(createSignal(
      'device_blocked',
      'blacklisted_device',
      'device',
      'critical',
      'Device is blocked due to previous fraudulent activity',
      'الجهاز محظور بسبب نشاط احتيالي سابق'
    ));
  }
  
  // Check multiple accounts on same device
  const deviceAccounts = existingFingerprints.filter(
    f => f.fingerprintHash === fingerprint.fingerprintHash
  );
  
  if (deviceAccounts.length >= FRAUD_CONFIG.deviceRules.maxAccountsPerDevice) {
    signals.push(createSignal(
      'multiple_accounts',
      'multiple_accounts_device',
      'device',
      'high',
      `Device has ${deviceAccounts.length} accounts (max: ${FRAUD_CONFIG.deviceRules.maxAccountsPerDevice})`,
      `الجهاز لديه ${deviceAccounts.length} حسابات (الحد الأقصى: ${FRAUD_CONFIG.deviceRules.maxAccountsPerDevice})`,
      { accountCount: deviceAccounts.length }
    ));
  }
  
  // Check suspicious user agents
  const isSuspiciousUA = FRAUD_CONFIG.deviceRules.suspiciousUserAgents.some(
    ua => fingerprint.userAgent.toLowerCase().includes(ua.toLowerCase())
  );
  
  if (isSuspiciousUA) {
    signals.push(createSignal(
      'suspicious_ua',
      'suspicious_user_agent',
      'device',
      'medium',
      'Suspicious user agent detected (possible automation)',
      'تم اكتشاف متصفح مشبوه (احتمال أتمتة)',
      { userAgent: fingerprint.userAgent }
    ));
  }
  
  // Check for incognito/private mode indicators
  if (!fingerprint.cookiesEnabled) {
    signals.push(createSignal(
      'no_cookies',
      'incognito_mode',
      'device',
      'low',
      'Cookies disabled - possible incognito mode',
      'الكوكيز معطلة - احتمال وضع التصفح الخاص',
    ));
  }
  
  return signals;
}

export function checkGeoFraud(geoInfo: GeoInfo): FraudSignal[] {
  const signals: FraudSignal[] = [];
  
  // Check blocked countries
  if (FRAUD_CONFIG.blockedCountries.includes(geoInfo.countryCode)) {
    signals.push(createSignal(
      'blocked_country',
      'blocked_country',
      'geo',
      'critical',
      `Country ${geoInfo.country} is blocked`,
      `الدولة ${geoInfo.country} محظورة`,
      { country: geoInfo.country, countryCode: geoInfo.countryCode }
    ));
  }
  
  // Check if country is allowed
  if (!FRAUD_CONFIG.allowedCountries.includes(geoInfo.countryCode)) {
    signals.push(createSignal(
      'not_allowed_country',
      'high_risk_country',
      'geo',
      'high',
      `Country ${geoInfo.country} is not in allowed list`,
      `الدولة ${geoInfo.country} غير مسموح بها`,
      { country: geoInfo.country, countryCode: geoInfo.countryCode }
    ));
  }
  
  // Check for VPN
  if (geoInfo.isVPN) {
    signals.push(createSignal(
      'vpn_detected',
      'vpn_detected',
      'network',
      'high',
      'VPN connection detected',
      'تم اكتشاف اتصال VPN',
      { ip: geoInfo.ipAddress }
    ));
  }
  
  // Check for Proxy
  if (geoInfo.isProxy) {
    signals.push(createSignal(
      'proxy_detected',
      'proxy_detected',
      'network',
      'high',
      'Proxy connection detected',
      'تم اكتشاف اتصال بروكسي',
      { ip: geoInfo.ipAddress }
    ));
  }
  
  // Check for Tor
  if (geoInfo.isTor) {
    signals.push(createSignal(
      'tor_detected',
      'tor_network',
      'network',
      'critical',
      'Tor network detected',
      'تم اكتشاف شبكة Tor',
      { ip: geoInfo.ipAddress }
    ));
  }
  
  // Check for missing geo data
  if (!geoInfo.country || !geoInfo.city) {
    signals.push(createSignal(
      'missing_geo',
      'missing_geo_data',
      'geo',
      'low',
      'Incomplete geolocation data',
      'بيانات الموقع الجغرافي غير مكتملة',
    ));
  }
  
  return signals;
}

export function checkIdentityDuplication(
  nationalIdHash: string,
  existingRecords: Array<{ userId: string; nationalIdHash: string; verificationStatus: string }>
): FraudSignal[] {
  const signals: FraudSignal[] = [];
  
  // Check if national ID already used by another user
  const duplicateIdentity = existingRecords.find(
    r => r.nationalIdHash === nationalIdHash && r.verificationStatus === 'verified'
  );
  
  if (duplicateIdentity) {
    signals.push(createSignal(
      'duplicate_national_id',
      'duplicate_identity',
      'identity',
      'critical',
      'National ID already used in another verified application',
      'رقم الهوية مستخدم بالفعل في طلب آخر تم التحقق منه',
      { existingUserId: duplicateIdentity.userId }
    ));
  }
  
  return signals;
}

export function checkFaceDuplication(
  faceEmbeddingHash: string,
  existingRecords: Array<{ userId: string; faceEmbeddingHash: string; verificationStatus: string }>,
  similarityThreshold: number = 0.95
): FraudSignal[] {
  const signals: FraudSignal[] = [];
  
  // Check if face embedding matches another user
  // In production, this would use actual face comparison
  const duplicateFace = existingRecords.find(
    r => r.faceEmbeddingHash === faceEmbeddingHash && r.verificationStatus === 'verified'
  );
  
  if (duplicateFace) {
    signals.push(createSignal(
      'duplicate_face',
      'duplicate_face',
      'biometric',
      'critical',
      'Face matches another verified application',
      'الوجه يطابق طلباً آخر تم التحقق منه',
      { existingUserId: duplicateFace.userId }
    ));
  }
  
  return signals;
}

export function checkRateLimits(
  identifier: string,
  identifierType: 'user_id' | 'device' | 'ip',
  action: string,
  existingRecords: Array<{ 
    requestCount: number; 
    windowStart: Date; 
    isBlocked: boolean; 
    blockedUntil: Date | null 
  }>
): { isLimited: boolean; signal: FraudSignal | null } {
  const config = Object.values(FRAUD_CONFIG.rateLimits).find(r => r.action === action);
  
  if (!config) {
    return { isLimited: false, signal: null };
  }
  
  const now = new Date();
  
  // Check if currently blocked
  const blockedRecord = existingRecords.find(r => 
    r.isBlocked && r.blockedUntil && new Date(r.blockedUntil) > now
  );
  
  if (blockedRecord) {
    return {
      isLimited: true,
      signal: createSignal(
        `rate_limit_blocked_${action}`,
        'rate_limit_exceeded',
        'velocity',
        'high',
        `Rate limit exceeded for ${action}. Blocked until ${blockedRecord.blockedUntil}`,
        `تم تجاوز حد المحاولات لـ ${action}. محظور حتى ${blockedRecord.blockedUntil}`,
        { action, blockedUntil: blockedRecord.blockedUntil }
      ),
    };
  }
  
  // Check current window
  const windowStart = new Date(now.getTime() - config.windowMs);
  const recentRecords = existingRecords.filter(r => 
    new Date(r.windowStart) >= windowStart
  );
  
  const totalRequests = recentRecords.reduce((sum, r) => sum + r.requestCount, 0);
  
  if (totalRequests >= config.maxRequests) {
    return {
      isLimited: true,
      signal: createSignal(
        `rate_limit_${action}`,
        'rate_limit_exceeded',
        'velocity',
        'high',
        `Rate limit exceeded: ${totalRequests}/${config.maxRequests} attempts for ${action}`,
        `تجاوز حد المحاولات: ${totalRequests}/${config.maxRequests} لـ ${action}`,
        { action, attempts: totalRequests, maxAttempts: config.maxRequests }
      ),
    };
  }
  
  return { isLimited: false, signal: null };
}

export function checkBlacklists(
  context: {
    nationalIdHash?: string;
    deviceFingerprintHash?: string;
    faceEmbeddingHash?: string;
    ipAddress?: string;
  },
  blacklists: Array<{ listType: string; valueHash: string; reason: string; reasonAr: string }>
): FraudSignal[] {
  const signals: FraudSignal[] = [];
  
  const checkAgainstList = (
    value: string | undefined,
    listType: string,
    signalType: string,
    category: FraudSignalCategory
  ) => {
    if (!value) return;
    
    const match = blacklists.find(b => b.listType === listType && b.valueHash === value);
    if (match) {
      signals.push(createSignal(
        `blacklist_${listType}`,
        signalType,
        category,
        'critical',
        match.reason || `Blacklisted ${listType}`,
        match.reasonAr || `${listType} في القائمة السوداء`,
        { listType, reason: match.reason }
      ));
    }
  };
  
  checkAgainstList(context.nationalIdHash, 'national_id', 'blacklisted_identity', 'identity');
  checkAgainstList(context.deviceFingerprintHash, 'device', 'blacklisted_device', 'device');
  checkAgainstList(context.faceEmbeddingHash, 'face', 'blacklisted_face', 'biometric');
  checkAgainstList(context.ipAddress, 'ip', 'blacklisted_device', 'network');
  
  return signals;
}

// ============================================
// Main Fraud Check Engine
// ============================================

export function calculateRiskScore(signals: FraudSignal[]): number {
  let score = 0;
  
  for (const signal of signals) {
    const weight = FRAUD_CONFIG.signalWeights[signal.type as keyof typeof FRAUD_CONFIG.signalWeights] || 0;
    score += weight;
  }
  
  return Math.min(score, FRAUD_CONFIG.thresholds.maxRiskScore);
}

export function determineAction(riskScore: number): DecisionOutcome | 'CONTINUE' {
  const { thresholds } = FRAUD_CONFIG;
  
  if (riskScore <= thresholds.autoApprove) {
    return 'CONTINUE'; // Continue with normal flow
  }
  
  if (riskScore <= thresholds.manualReview) {
    return 'MANUAL_REVIEW';
  }
  
  if (riskScore <= thresholds.softDecline) {
    return 'SOFT_DECLINE';
  }
  
  return 'HARD_DECLINE';
}

export function runFraudChecks(
  context: FraudCheckContext,
  data: {
    existingFingerprints: Array<{ userId: string; fingerprintHash: string; isBlocked: boolean; applicationsCount: number }>;
    existingIdentityRecords: Array<{ userId: string; nationalIdHash: string; faceEmbeddingHash: string; verificationStatus: string }>;
    rateLimitRecords: Array<{ requestCount: number; windowStart: Date; isBlocked: boolean; blockedUntil: Date | null }>;
    blacklists: Array<{ listType: string; valueHash: string; reason: string; reasonAr: string }>;
  }
): FraudCheckResult {
  const signals: FraudSignal[] = [];
  const blockedReasons: string[] = [];
  const warnings: string[] = [];
  
  // 1. Device Fraud Checks
  const deviceSignals = checkDeviceFraud(context.deviceFingerprint, data.existingFingerprints);
  signals.push(...deviceSignals);
  
  // 2. Geo/IP Checks
  const geoSignals = checkGeoFraud(context.geoInfo);
  signals.push(...geoSignals);
  
  // 3. Identity Duplication Check
  if (context.nationalIdHash) {
    const identitySignals = checkIdentityDuplication(
      context.nationalIdHash,
      data.existingIdentityRecords
    );
    signals.push(...identitySignals);
  }
  
  // 4. Face Duplication Check
  if (context.faceEmbeddingHash) {
    const faceSignals = checkFaceDuplication(
      context.faceEmbeddingHash,
      data.existingIdentityRecords
    );
    signals.push(...faceSignals);
  }
  
  // 5. Rate Limiting Check
  const rateLimitCheck = checkRateLimits(
    context.userId || context.sessionId,
    context.userId ? 'user_id' : 'device',
    'application_attempt',
    data.rateLimitRecords
  );
  
  if (rateLimitCheck.signal) {
    signals.push(rateLimitCheck.signal);
  }
  
  // 6. Blacklist Check
  const blacklistSignals = checkBlacklists(
    {
      nationalIdHash: context.nationalIdHash,
      deviceFingerprintHash: context.deviceFingerprint.fingerprintHash,
      faceEmbeddingHash: context.faceEmbeddingHash,
      ipAddress: context.geoInfo.ipAddress,
    },
    data.blacklists
  );
  signals.push(...blacklistSignals);
  
  // Calculate risk score
  const riskScore = calculateRiskScore(signals);
  const recommendedAction = determineAction(riskScore);
  
  // Categorize signals
  const criticalSignals = signals.filter(s => s.severity === 'critical');
  const highSignals = signals.filter(s => s.severity === 'high');
  
  // Build blocked reasons
  criticalSignals.forEach(s => blockedReasons.push(s.descriptionAr));
  
  // Build warnings
  highSignals.forEach(s => warnings.push(s.descriptionAr));
  
  // Calculate category-specific risk
  const deviceRisk = signals.filter(s => s.category === 'device').reduce(
    (sum, s) => sum + (FRAUD_CONFIG.signalWeights[s.type as keyof typeof FRAUD_CONFIG.signalWeights] || 0), 0
  );
  const velocityRisk = signals.filter(s => s.category === 'velocity').reduce(
    (sum, s) => sum + (FRAUD_CONFIG.signalWeights[s.type as keyof typeof FRAUD_CONFIG.signalWeights] || 0), 0
  );
  const geoRisk = signals.filter(s => s.category === 'geo' || s.category === 'network').reduce(
    (sum, s) => sum + (FRAUD_CONFIG.signalWeights[s.type as keyof typeof FRAUD_CONFIG.signalWeights] || 0), 0
  );
  const identityRisk = signals.filter(s => s.category === 'identity').reduce(
    (sum, s) => sum + (FRAUD_CONFIG.signalWeights[s.type as keyof typeof FRAUD_CONFIG.signalWeights] || 0), 0
  );
  const biometricRisk = signals.filter(s => s.category === 'biometric').reduce(
    (sum, s) => sum + (FRAUD_CONFIG.signalWeights[s.type as keyof typeof FRAUD_CONFIG.signalWeights] || 0), 0
  );
  
  return {
    isPassed: recommendedAction === 'CONTINUE',
    riskScore,
    maxRiskScore: FRAUD_CONFIG.thresholds.maxRiskScore,
    recommendedAction,
    signals,
    blockedReasons,
    warnings,
    metadata: {
      deviceRisk,
      velocityRisk,
      geoRisk,
      identityRisk,
      biometricRisk,
    },
  };
}

// ============================================
// Utility Functions
// ============================================

export function hashString(input: string): string {
  // Simple hash for client-side (use crypto on server)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
