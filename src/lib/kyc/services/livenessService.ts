// ============================================
// Liveness Detection Service - ASH HOLDING KYC
// Verifies user is a real person
// ============================================

import { LivenessResult, LivenessChallenge, KYC_CONFIG } from '../types';

/**
 * Generate random liveness challenges
 */
export function generateLivenessChallenges(count: number = KYC_CONFIG.requiredChallenges): LivenessChallenge[] {
  const allChallenges: LivenessChallenge['type'][] = [
    'blink',
    'smile',
    'turn_left',
    'turn_right',
    'nod',
  ];
  
  // Shuffle and pick random challenges
  const shuffled = [...allChallenges].sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, count).map(type => ({
    type,
    completed: false,
    confidence: 0,
  }));
}

/**
 * Get challenge instruction text
 */
export function getChallengeInstruction(type: LivenessChallenge['type']): {
  title: string;
  titleAr: string;
  instruction: string;
  instructionAr: string;
  icon: string;
} {
  const instructions: Record<LivenessChallenge['type'], ReturnType<typeof getChallengeInstruction>> = {
    blink: {
      title: 'Blink',
      titleAr: 'رمش العين',
      instruction: 'Please blink your eyes',
      instructionAr: 'أغلق وافتح عينيك',
      icon: 'Eye',
    },
    smile: {
      title: 'Smile',
      titleAr: 'ابتسم',
      instruction: 'Please smile naturally',
      instructionAr: 'ابتسم بشكل طبيعي',
      icon: 'Smile',
    },
    turn_left: {
      title: 'Turn Left',
      titleAr: 'استدر لليسار',
      instruction: 'Slowly turn your head to the left',
      instructionAr: 'أدر رأسك ببطء لليسار',
      icon: 'ArrowLeft',
    },
    turn_right: {
      title: 'Turn Right',
      titleAr: 'استدر لليمين',
      instruction: 'Slowly turn your head to the right',
      instructionAr: 'أدر رأسك ببطء لليمين',
      icon: 'ArrowRight',
    },
    nod: {
      title: 'Nod',
      titleAr: 'أومئ برأسك',
      instruction: 'Slowly nod your head up and down',
      instructionAr: 'أومئ برأسك للأعلى والأسفل',
      icon: 'MoveVertical',
    },
  };
  
  return instructions[type];
}

/**
 * Perform liveness detection session
 * In production, this would use a real liveness SDK like:
 * - AWS Rekognition Liveness
 * - FaceTec SDK
 * - iProov
 * - Regula Face SDK
 */
export async function performLivenessCheck(
  videoStream: MediaStream | null,
  challenges: LivenessChallenge[]
): Promise<LivenessResult> {
  const sessionId = generateSessionId();
  const startTime = Date.now();
  
  // Simulate liveness detection process
  await delay(3000);
  
  // In production, this would analyze the video stream
  // For now, simulate the results
  const completedChallenges = challenges.map(challenge => ({
    ...challenge,
    completed: Math.random() > 0.15, // 85% success rate simulation
    confidence: 0.85 + Math.random() * 0.15,
  }));
  
  const allPassed = completedChallenges.every(c => c.completed);
  const avgConfidence = completedChallenges.reduce((sum, c) => sum + c.confidence, 0) / completedChallenges.length;
  
  // Simulate spoof detection
  const spoofAttempt = Math.random() < 0.02; // 2% false positive rate
  
  return {
    passed: allPassed && !spoofAttempt && avgConfidence >= KYC_CONFIG.minLivenessConfidence,
    confidence: avgConfidence,
    challenges: completedChallenges,
    sessionId,
    processingTime: Date.now() - startTime,
    spoofAttempt,
  };
}

/**
 * Quick liveness check without challenges
 * Uses passive liveness detection
 */
export async function performPassiveLiveness(
  imageBase64: string
): Promise<{
  isLive: boolean;
  confidence: number;
  spoofType?: string;
}> {
  await delay(1500);
  
  // Simulate passive liveness analysis
  // In production, analyze image for:
  // - Screen reflection
  // - Paper/photo texture
  // - Depth estimation
  // - Moiré patterns
  
  const confidence = 0.8 + Math.random() * 0.2;
  const isLive = confidence >= 0.85;
  
  return {
    isLive,
    confidence,
    spoofType: isLive ? undefined : 'possible_photo',
  };
}

/**
 * Check camera and browser compatibility
 */
export async function checkCameraCapabilities(): Promise<{
  hasCamera: boolean;
  hasFrontCamera: boolean;
  permissions: 'granted' | 'denied' | 'prompt';
  resolution?: { width: number; height: number };
}> {
  try {
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        hasCamera: false,
        hasFrontCamera: false,
        permissions: 'denied',
      };
    }
    
    // Check permissions
    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
    
    if (permissionStatus.state === 'denied') {
      return {
        hasCamera: true,
        hasFrontCamera: false,
        permissions: 'denied',
      };
    }
    
    // Try to enumerate devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const hasFrontCamera = videoDevices.some(d => 
      d.label.toLowerCase().includes('front') || 
      d.label.toLowerCase().includes('facing')
    );
    
    return {
      hasCamera: videoDevices.length > 0,
      hasFrontCamera: hasFrontCamera || videoDevices.length > 0,
      permissions: permissionStatus.state as 'granted' | 'denied' | 'prompt',
    };
  } catch {
    return {
      hasCamera: false,
      hasFrontCamera: false,
      permissions: 'denied',
    };
  }
}

/**
 * Request camera access
 */
export async function requestCameraAccess(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    return stream;
  } catch {
    return null;
  }
}

/**
 * Stop camera stream
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

// Helper functions
function generateSessionId(): string {
  return `lv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
