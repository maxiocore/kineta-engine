/**
 * KYC Liveness Detection API
 * 
 * Endpoint: /kyc/liveness
 * Method: POST
 * 
 * Purpose: Verifies that the user is a real person through liveness detection
 * 
 * Input:
 *   - video_frames: string[] (array of base64 encoded frames from video)
 *   - challenge_type: 'blink' | 'turn_head' | 'smile' | 'random'
 *   - session_id: string
 *   - user_id?: string
 * 
 * Output (Success):
 *   - success: true
 *   - data: {
 *       is_live: boolean
 *       confidence_score: number (0-100)
 *       challenge_passed: boolean
 *       detected_actions: string[]
 *       best_frame: string (base64)
 *       face_quality: { brightness: number, sharpness: number, pose: string }
 *     }
 *   - verification_id: string
 * 
 * Error Codes:
 *   - MISSING_VIDEO_FRAMES: Video frames not provided
 *   - INSUFFICIENT_FRAMES: Not enough frames for analysis
 *   - NO_FACE_DETECTED: No face found in frames
 *   - MULTIPLE_FACES: More than one face detected
 *   - LIVENESS_FAILED: Failed liveness check (possible spoof)
 *   - CHALLENGE_FAILED: User did not complete the challenge
 *   - POOR_LIGHTING: Lighting conditions too poor
 *   - RATE_LIMITED: Too many requests
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ChallengeType = 'blink' | 'turn_head' | 'smile' | 'random';

interface LivenessRequest {
  video_frames: string[];
  challenge_type: ChallengeType;
  session_id: string;
  user_id?: string;
}

interface FaceQuality {
  brightness: number;
  sharpness: number;
  pose: 'frontal' | 'left' | 'right' | 'up' | 'down';
}

interface LivenessData {
  is_live: boolean;
  confidence_score: number;
  challenge_passed: boolean;
  detected_actions: string[];
  best_frame?: string;
  face_quality: FaceQuality;
}

const ERRORS = {
  MISSING_VIDEO_FRAMES: {
    code: 'MISSING_VIDEO_FRAMES',
    message: 'Video frames are required',
    message_ar: 'إطارات الفيديو مطلوبة'
  },
  INSUFFICIENT_FRAMES: {
    code: 'INSUFFICIENT_FRAMES',
    message: 'At least 10 video frames are required',
    message_ar: 'يجب توفير 10 إطارات فيديو على الأقل'
  },
  NO_FACE_DETECTED: {
    code: 'NO_FACE_DETECTED',
    message: 'No face detected in video',
    message_ar: 'لم يتم اكتشاف وجه في الفيديو'
  },
  MULTIPLE_FACES: {
    code: 'MULTIPLE_FACES',
    message: 'Multiple faces detected. Only one face should be visible',
    message_ar: 'تم اكتشاف عدة وجوه. يجب أن يكون وجه واحد فقط مرئياً'
  },
  LIVENESS_FAILED: {
    code: 'LIVENESS_FAILED',
    message: 'Liveness check failed. Please try again with a live video',
    message_ar: 'فشل فحص الحيوية. يرجى المحاولة مرة أخرى بفيديو حي'
  },
  CHALLENGE_FAILED: {
    code: 'CHALLENGE_FAILED',
    message: 'Challenge not completed. Please follow the instructions',
    message_ar: 'لم يتم إكمال التحدي. يرجى اتباع التعليمات'
  },
  POOR_LIGHTING: {
    code: 'POOR_LIGHTING',
    message: 'Lighting is too poor. Please ensure good lighting',
    message_ar: 'الإضاءة ضعيفة جداً. يرجى التأكد من الإضاءة الجيدة'
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later',
    message_ar: 'عدد الطلبات كثير جداً. يرجى المحاولة لاحقاً'
  },
  INVALID_CHALLENGE: {
    code: 'INVALID_CHALLENGE',
    message: 'Invalid challenge type',
    message_ar: 'نوع التحدي غير صالح'
  },
  MISSING_SESSION: {
    code: 'MISSING_SESSION',
    message: 'Session ID is required',
    message_ar: 'معرف الجلسة مطلوب'
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    message_ar: 'حدث خطأ داخلي'
  }
};

// Analyze liveness (mock implementation)
async function analyzeLiveness(
  frames: string[],
  challengeType: ChallengeType
): Promise<LivenessData> {
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In production, this would use ML models to detect:
  // - Face presence and count
  // - Eye blinks, head movements
  // - Screen reflection detection
  // - Texture analysis for photo/video attacks
  
  const isLive = Math.random() > 0.1; // 90% success rate for mock
  const challengePassed = isLive && Math.random() > 0.15;
  
  const detectedActions: string[] = [];
  if (challengeType === 'blink' || challengeType === 'random') {
    detectedActions.push('eye_blink_detected');
  }
  if (challengeType === 'turn_head' || challengeType === 'random') {
    detectedActions.push('head_movement_detected');
  }
  if (challengeType === 'smile' || challengeType === 'random') {
    detectedActions.push('smile_detected');
  }
  
  return {
    is_live: isLive,
    confidence_score: isLive ? 85 + Math.random() * 15 : 20 + Math.random() * 30,
    challenge_passed: challengePassed,
    detected_actions: detectedActions,
    best_frame: frames[Math.floor(frames.length / 2)],
    face_quality: {
      brightness: 75 + Math.random() * 20,
      sharpness: 80 + Math.random() * 15,
      pose: 'frontal'
    }
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed', message_ar: 'POST فقط مسموح' } }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const body: LivenessRequest = await req.json();

    // Validations
    if (!body.session_id) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_SESSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.video_frames || !Array.isArray(body.video_frames)) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_VIDEO_FRAMES }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.video_frames.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.INSUFFICIENT_FRAMES }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validChallenges: ChallengeType[] = ['blink', 'turn_head', 'smile', 'random'];
    if (!validChallenges.includes(body.challenge_type)) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.INVALID_CHALLENGE }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze liveness
    const livenessData = await analyzeLiveness(body.video_frames, body.challenge_type);
    const verificationId = crypto.randomUUID();

    // Determine final status
    let status: 'success' | 'failed' = 'success';
    let errorResponse = null;

    if (!livenessData.is_live) {
      status = 'failed';
      errorResponse = ERRORS.LIVENESS_FAILED;
    } else if (!livenessData.challenge_passed) {
      status = 'failed';
      errorResponse = ERRORS.CHALLENGE_FAILED;
    }

    // Log verification attempt
    await supabase
      .from('verification_audit_logs' as any)
      .insert({
        user_id: userId || body.user_id,
        session_id: body.session_id,
        verification_type: 'LIVENESS',
        verification_target: body.challenge_type,
        attempt_number: 1,
        status: status,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        result_code: status === 'success' ? 'LIVENESS_PASSED' : 'LIVENESS_FAILED',
        result_message: status === 'success' ? 'Liveness verified' : 'Liveness check failed',
        ip_address: ipAddress,
        device_fingerprint: req.headers.get('x-device-fingerprint'),
        user_agent: req.headers.get('user-agent'),
        is_suspicious: !livenessData.is_live,
        metadata: {
          confidence_score: livenessData.confidence_score,
          challenge_type: body.challenge_type,
          detected_actions: livenessData.detected_actions,
          face_quality: livenessData.face_quality
        }
      } as any);

    if (status === 'failed') {
      return new Response(
        JSON.stringify({ success: false, error: errorResponse }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[KYC-LIVENESS] Success, verification_id: ${verificationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: livenessData,
        verification_id: verificationId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[KYC-LIVENESS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: { ...ERRORS.INTERNAL_ERROR, details: { message: errorMessage } } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
