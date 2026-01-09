/**
 * KYC Document Verification API
 * 
 * Endpoint: /kyc/document
 * Method: POST
 * 
 * Purpose: Validates and extracts data from identity documents (National ID, Iqama, Passport)
 * 
 * Input:
 *   - document_type: 'national_id' | 'iqama' | 'passport'
 *   - document_front: string (base64 encoded image)
 *   - document_back?: string (base64 encoded image, required for national_id)
 *   - user_id?: string (optional, for linking to existing user)
 * 
 * Output (Success):
 *   - success: true
 *   - data: {
 *       document_number: string
 *       full_name_ar: string
 *       full_name_en: string
 *       date_of_birth: string (YYYY-MM-DD)
 *       expiry_date: string (YYYY-MM-DD)
 *       gender: 'male' | 'female'
 *       nationality: string
 *       document_type: string
 *       is_expired: boolean
 *       confidence_score: number (0-100)
 *       extracted_face: string (base64)
 *     }
 *   - verification_id: string
 * 
 * Output (Failure):
 *   - success: false
 *   - error: {
 *       code: string
 *       message: string
 *       details?: object
 *     }
 * 
 * Error Codes:
 *   - INVALID_DOCUMENT_TYPE: Unsupported document type
 *   - MISSING_DOCUMENT_IMAGE: Required image not provided
 *   - POOR_IMAGE_QUALITY: Image too blurry or dark
 *   - DOCUMENT_EXPIRED: Document has expired
 *   - OCR_FAILED: Could not extract text from document
 *   - FACE_NOT_DETECTED: No face found in document
 *   - DOCUMENT_TAMPERED: Signs of document manipulation detected
 *   - RATE_LIMITED: Too many requests
 *   - INTERNAL_ERROR: Server error
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Document types
type DocumentType = 'national_id' | 'iqama' | 'passport';

// Request interface
interface DocumentRequest {
  document_type: DocumentType;
  document_front: string;
  document_back?: string;
  user_id?: string;
}

// Response interfaces
interface DocumentData {
  document_number: string;
  full_name_ar: string;
  full_name_en: string;
  date_of_birth: string;
  expiry_date: string;
  gender: 'male' | 'female';
  nationality: string;
  document_type: DocumentType;
  is_expired: boolean;
  confidence_score: number;
  extracted_face?: string;
}

interface SuccessResponse {
  success: true;
  data: DocumentData;
  verification_id: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    message_ar: string;
    details?: Record<string, unknown>;
  };
}

// Error codes and messages
const ERRORS = {
  INVALID_DOCUMENT_TYPE: {
    code: 'INVALID_DOCUMENT_TYPE',
    message: 'Unsupported document type. Valid types: national_id, iqama, passport',
    message_ar: 'نوع المستند غير مدعوم. الأنواع الصالحة: هوية وطنية، إقامة، جواز سفر'
  },
  MISSING_DOCUMENT_IMAGE: {
    code: 'MISSING_DOCUMENT_IMAGE',
    message: 'Document image is required',
    message_ar: 'صورة المستند مطلوبة'
  },
  MISSING_BACK_IMAGE: {
    code: 'MISSING_BACK_IMAGE',
    message: 'Back side of document is required for national ID',
    message_ar: 'الجهة الخلفية من الهوية مطلوبة'
  },
  POOR_IMAGE_QUALITY: {
    code: 'POOR_IMAGE_QUALITY',
    message: 'Image quality is too low. Please provide a clearer image',
    message_ar: 'جودة الصورة منخفضة. يرجى تقديم صورة أوضح'
  },
  DOCUMENT_EXPIRED: {
    code: 'DOCUMENT_EXPIRED',
    message: 'Document has expired',
    message_ar: 'المستند منتهي الصلاحية'
  },
  OCR_FAILED: {
    code: 'OCR_FAILED',
    message: 'Could not extract text from document',
    message_ar: 'تعذر استخراج النص من المستند'
  },
  FACE_NOT_DETECTED: {
    code: 'FACE_NOT_DETECTED',
    message: 'No face detected in document image',
    message_ar: 'لم يتم اكتشاف وجه في صورة المستند'
  },
  DOCUMENT_TAMPERED: {
    code: 'DOCUMENT_TAMPERED',
    message: 'Document appears to be modified or tampered',
    message_ar: 'يبدو أن المستند تم تعديله أو التلاعب به'
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later',
    message_ar: 'عدد الطلبات كثير جداً. يرجى المحاولة لاحقاً'
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    message_ar: 'المصادقة مطلوبة'
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    message_ar: 'حدث خطأ داخلي'
  }
};

// Validate base64 image
function isValidBase64Image(str: string): boolean {
  if (!str) return false;
  const base64Regex = /^data:image\/(png|jpeg|jpg|webp);base64,/;
  return base64Regex.test(str) || str.length > 100;
}

// Check image quality (mock implementation)
function checkImageQuality(base64: string): { valid: boolean; score: number } {
  // In production, this would analyze the image
  const minSize = 10000; // Minimum base64 length
  const isLargeEnough = base64.length >= minSize;
  return {
    valid: isLargeEnough,
    score: isLargeEnough ? 85 : 40
  };
}

// Mock OCR extraction (in production, use actual OCR service)
async function extractDocumentData(
  documentType: DocumentType,
  frontImage: string,
  backImage?: string
): Promise<DocumentData | null> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock extracted data - in production, this would call an OCR API
  const mockData: DocumentData = {
    document_number: '1' + Math.random().toString().substring(2, 11),
    full_name_ar: 'محمد أحمد العبدالله',
    full_name_en: 'MOHAMMED AHMED ALABDULLAH',
    date_of_birth: '1990-05-15',
    expiry_date: '2028-06-20',
    gender: 'male',
    nationality: 'SA',
    document_type: documentType,
    is_expired: false,
    confidence_score: 92,
    extracted_face: 'mock_face_base64'
  };
  
  return mockData;
}

// Rate limiting check
async function checkRateLimit(
  supabase: any,
  userId: string,
  ipAddress: string
): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('verification_audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('verification_type', 'DOCUMENT_OCR')
    .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`)
    .gte('created_at', fiveMinutesAgo);
  
  return (count || 0) < 5; // Max 5 attempts per 5 minutes
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed', message_ar: 'طريقة POST فقط مسموحة' }
        }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Get IP address
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Parse request body
    const body: DocumentRequest = await req.json();

    // Validate document type
    const validTypes: DocumentType[] = ['national_id', 'iqama', 'passport'];
    if (!validTypes.includes(body.document_type)) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.INVALID_DOCUMENT_TYPE } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate front image
    if (!body.document_front || !isValidBase64Image(body.document_front)) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_DOCUMENT_IMAGE } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate back image for national ID
    if (body.document_type === 'national_id' && (!body.document_back || !isValidBase64Image(body.document_back))) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_BACK_IMAGE } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(supabase, userId || 'anonymous', ipAddress);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.RATE_LIMITED } as ErrorResponse),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check image quality
    const qualityCheck = checkImageQuality(body.document_front);
    if (!qualityCheck.valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { 
            ...ERRORS.POOR_IMAGE_QUALITY, 
            details: { quality_score: qualityCheck.score } 
          } 
        } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract document data
    const documentData = await extractDocumentData(
      body.document_type,
      body.document_front,
      body.document_back
    );

    if (!documentData) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.OCR_FAILED } as ErrorResponse),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if document is expired
    const expiryDate = new Date(documentData.expiry_date);
    if (expiryDate < new Date()) {
      documentData.is_expired = true;
    }

    // Generate verification ID
    const verificationId = crypto.randomUUID();

    // Log the verification attempt
    await supabase
      .from('verification_audit_logs' as any)
      .insert({
        user_id: userId || body.user_id,
        session_id: req.headers.get('x-session-id') || 'unknown',
        verification_type: 'DOCUMENT_OCR',
        verification_target: body.document_type,
        attempt_number: 1,
        status: 'success',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        result_code: 'SUCCESS',
        result_message: 'Document verified successfully',
        ip_address: ipAddress,
        device_fingerprint: req.headers.get('x-device-fingerprint'),
        user_agent: req.headers.get('user-agent'),
        metadata: {
          document_type: body.document_type,
          confidence_score: documentData.confidence_score,
          is_expired: documentData.is_expired
        }
      } as any);

    // Store identity verification record
    await supabase
      .from('identity_verification_records' as any)
      .insert({
        user_id: userId || body.user_id,
        verification_type: 'document',
        document_type: body.document_type,
        document_number_hash: await hashString(documentData.document_number),
        verification_status: 'verified',
        confidence_score: documentData.confidence_score,
        extracted_data: {
          full_name_ar: documentData.full_name_ar,
          full_name_en: documentData.full_name_en,
          date_of_birth: documentData.date_of_birth,
          nationality: documentData.nationality,
          gender: documentData.gender
        },
        expiry_date: documentData.expiry_date,
        ip_address: ipAddress,
        device_fingerprint: req.headers.get('x-device-fingerprint'),
        user_agent: req.headers.get('user-agent')
      } as any);

    console.log(`[KYC-DOCUMENT] Success for ${body.document_type}, verification_id: ${verificationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: documentData,
        verification_id: verificationId
      } as SuccessResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('[KYC-DOCUMENT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { 
          ...ERRORS.INTERNAL_ERROR, 
          details: { message: errorMessage } 
        } 
      } as ErrorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Hash helper
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
