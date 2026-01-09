/**
 * KYC Face Match API
 * 
 * Endpoint: /kyc/facematch
 * Method: POST
 * 
 * Purpose: Compares face from ID document with live selfie to verify identity
 * 
 * Input:
 *   - document_face: string (base64, face extracted from ID document)
 *   - selfie_face: string (base64, live selfie image)
 *   - document_verification_id: string (from previous document verification)
 *   - liveness_verification_id: string (from liveness check)
 *   - session_id: string
 *   - user_id?: string
 * 
 * Output (Success):
 *   - success: true
 *   - data: {
 *       is_match: boolean
 *       similarity_score: number (0-100)
 *       confidence_level: 'low' | 'medium' | 'high' | 'very_high'
 *       face_details: {
 *         document: { quality: number, landmarks_detected: boolean }
 *         selfie: { quality: number, landmarks_detected: boolean }
 *       }
 *     }
 *   - verification_id: string
 * 
 * Error Codes:
 *   - MISSING_DOCUMENT_FACE: Document face image not provided
 *   - MISSING_SELFIE: Selfie image not provided
 *   - FACE_NOT_DETECTED: Could not detect face in one or both images
 *   - FACE_QUALITY_LOW: Face quality too low for comparison
 *   - NO_MATCH: Faces do not match
 *   - POSSIBLE_FRAUD: Multiple identities detected
 *   - RATE_LIMITED: Too many requests
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FaceMatchRequest {
  document_face: string;
  selfie_face: string;
  document_verification_id: string;
  liveness_verification_id: string;
  session_id: string;
  user_id?: string;
}

interface FaceDetails {
  quality: number;
  landmarks_detected: boolean;
}

interface FaceMatchData {
  is_match: boolean;
  similarity_score: number;
  confidence_level: 'low' | 'medium' | 'high' | 'very_high';
  face_details: {
    document: FaceDetails;
    selfie: FaceDetails;
  };
}

const ERRORS = {
  MISSING_DOCUMENT_FACE: {
    code: 'MISSING_DOCUMENT_FACE',
    message: 'Document face image is required',
    message_ar: 'صورة الوجه من المستند مطلوبة'
  },
  MISSING_SELFIE: {
    code: 'MISSING_SELFIE',
    message: 'Selfie image is required',
    message_ar: 'صورة السيلفي مطلوبة'
  },
  MISSING_VERIFICATION_IDS: {
    code: 'MISSING_VERIFICATION_IDS',
    message: 'Document and liveness verification IDs are required',
    message_ar: 'معرفات التحقق من المستند والحيوية مطلوبة'
  },
  FACE_NOT_DETECTED: {
    code: 'FACE_NOT_DETECTED',
    message: 'Could not detect face in one or both images',
    message_ar: 'تعذر اكتشاف الوجه في إحدى الصور أو كليهما'
  },
  FACE_QUALITY_LOW: {
    code: 'FACE_QUALITY_LOW',
    message: 'Face quality too low for accurate comparison',
    message_ar: 'جودة الوجه منخفضة جداً للمقارنة الدقيقة'
  },
  NO_MATCH: {
    code: 'NO_MATCH',
    message: 'Faces do not match',
    message_ar: 'الوجوه غير متطابقة'
  },
  POSSIBLE_FRAUD: {
    code: 'POSSIBLE_FRAUD',
    message: 'Possible identity fraud detected',
    message_ar: 'تم اكتشاف احتيال محتمل في الهوية'
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later',
    message_ar: 'عدد الطلبات كثير جداً. يرجى المحاولة لاحقاً'
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

// Face matching (mock implementation)
async function compareFaces(
  documentFace: string,
  selfieFace: string
): Promise<FaceMatchData> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // In production, use face recognition API (e.g., AWS Rekognition, Azure Face)
  const similarityScore = 70 + Math.random() * 30; // Mock 70-100% similarity
  const isMatch = similarityScore >= 75;
  
  let confidenceLevel: 'low' | 'medium' | 'high' | 'very_high' = 'low';
  if (similarityScore >= 95) confidenceLevel = 'very_high';
  else if (similarityScore >= 85) confidenceLevel = 'high';
  else if (similarityScore >= 75) confidenceLevel = 'medium';
  
  return {
    is_match: isMatch,
    similarity_score: Math.round(similarityScore * 100) / 100,
    confidence_level: confidenceLevel,
    face_details: {
      document: {
        quality: 85 + Math.random() * 10,
        landmarks_detected: true
      },
      selfie: {
        quality: 90 + Math.random() * 10,
        landmarks_detected: true
      }
    }
  };
}

// Check for duplicate faces in database
async function checkFaceDuplication(
  supabase: ReturnType<typeof createClient>,
  faceHash: string,
  userId?: string
): Promise<boolean> {
  const { count } = await supabase
    .from('identity_verification_records' as any)
    .select('*', { count: 'exact', head: true })
    .eq('face_hash', faceHash)
    .neq('user_id', userId || '');
  
  return (count || 0) > 0;
}

// Generate face hash (mock)
async function generateFaceHash(faceBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(faceBase64.substring(0, 1000)); // Use portion for hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    const body: FaceMatchRequest = await req.json();

    // Validations
    if (!body.session_id) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_SESSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.document_face) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_DOCUMENT_FACE }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.selfie_face) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_SELFIE }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.document_verification_id || !body.liveness_verification_id) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_VERIFICATION_IDS }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for face duplication (fraud check)
    const selfieFaceHash = await generateFaceHash(body.selfie_face);
    const isDuplicate = await checkFaceDuplication(supabase, selfieFaceHash, userId || body.user_id);
    
    if (isDuplicate) {
      // Log fraud signal
      await supabase
        .from('fraud_signals' as any)
        .insert({
          user_id: userId || body.user_id,
          session_id: body.session_id,
          signal_type: 'face_duplication',
          signal_category: 'identity',
          severity: 'high',
          description: 'Face already registered with another account',
          description_ar: 'الوجه مسجل بالفعل مع حساب آخر',
          metadata: { face_hash: selfieFaceHash }
        } as any);
      
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.POSSIBLE_FRAUD }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compare faces
    const matchData = await compareFaces(body.document_face, body.selfie_face);
    const verificationId = crypto.randomUUID();

    // Log verification
    await supabase
      .from('verification_audit_logs' as any)
      .insert({
        user_id: userId || body.user_id,
        session_id: body.session_id,
        verification_type: 'FACE_MATCH',
        attempt_number: 1,
        status: matchData.is_match ? 'success' : 'failed',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        result_code: matchData.is_match ? 'MATCH_SUCCESS' : 'MATCH_FAILED',
        result_message: matchData.is_match ? 'Faces match' : 'Faces do not match',
        ip_address: ipAddress,
        device_fingerprint: req.headers.get('x-device-fingerprint'),
        user_agent: req.headers.get('user-agent'),
        is_suspicious: !matchData.is_match,
        metadata: {
          similarity_score: matchData.similarity_score,
          confidence_level: matchData.confidence_level,
          document_verification_id: body.document_verification_id,
          liveness_verification_id: body.liveness_verification_id
        }
      } as any);

    // Store face hash for future fraud detection
    if (matchData.is_match) {
      await supabase
        .from('identity_verification_records' as any)
        .insert({
          user_id: userId || body.user_id,
          verification_type: 'face_match',
          face_hash: selfieFaceHash,
          verification_status: 'verified',
          confidence_score: matchData.similarity_score,
          ip_address: ipAddress,
          device_fingerprint: req.headers.get('x-device-fingerprint'),
          user_agent: req.headers.get('user-agent')
        } as any);
    }

    if (!matchData.is_match) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { 
            ...ERRORS.NO_MATCH, 
            details: { similarity_score: matchData.similarity_score } 
          } 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[KYC-FACEMATCH] Success, similarity: ${matchData.similarity_score}%, verification_id: ${verificationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: matchData,
        verification_id: verificationId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[KYC-FACEMATCH] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: { ...ERRORS.INTERNAL_ERROR, details: { message: error.message } } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
