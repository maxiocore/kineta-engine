/**
 * KYC Document Verification API — Powered by Lovable AI (Gemini Vision)
 * Extracts & validates identity documents using AI instead of mock data
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type DocumentType = 'national_id' | 'iqama' | 'passport';

interface DocumentRequest {
  document_type: DocumentType;
  document_front: string;
  document_back?: string;
  user_id?: string;
  session_id?: string;
}

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
  issue_date?: string;
  ai_raw_analysis?: string;
}

const ERRORS = {
  INVALID_DOCUMENT_TYPE: { code: 'INVALID_DOCUMENT_TYPE', message: 'Unsupported document type', message_ar: 'نوع المستند غير مدعوم' },
  MISSING_DOCUMENT_IMAGE: { code: 'MISSING_DOCUMENT_IMAGE', message: 'Document image is required', message_ar: 'صورة المستند مطلوبة' },
  MISSING_BACK_IMAGE: { code: 'MISSING_BACK_IMAGE', message: 'Back side is required for national ID', message_ar: 'الجهة الخلفية من الهوية مطلوبة' },
  POOR_IMAGE_QUALITY: { code: 'POOR_IMAGE_QUALITY', message: 'Image quality is too low', message_ar: 'جودة الصورة منخفضة' },
  OCR_FAILED: { code: 'OCR_FAILED', message: 'Could not extract text from document', message_ar: 'تعذر استخراج النص من المستند' },
  DOCUMENT_EXPIRED: { code: 'DOCUMENT_EXPIRED', message: 'Document has expired', message_ar: 'المستند منتهي الصلاحية' },
  RATE_LIMITED: { code: 'RATE_LIMITED', message: 'Too many requests', message_ar: 'عدد الطلبات كثير جداً' },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Authentication required', message_ar: 'المصادقة مطلوبة' },
  AI_ERROR: { code: 'AI_ERROR', message: 'AI analysis failed', message_ar: 'فشل التحليل بالذكاء الاصطناعي' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: 'An internal error occurred', message_ar: 'حدث خطأ داخلي' },
};

function isValidBase64Image(str: string): boolean {
  if (!str) return false;
  return str.startsWith('data:image/') || str.length > 500;
}

async function analyzeDocumentWithAI(
  documentType: DocumentType,
  frontImage: string,
  backImage?: string
): Promise<DocumentData | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.error('[KYC] LOVABLE_API_KEY not configured');
    throw new Error('AI service not configured');
  }

  const documentTypeLabels: Record<DocumentType, string> = {
    national_id: 'Saudi National ID (بطاقة الهوية الوطنية)',
    iqama: 'Saudi Iqama / Residence Permit (إقامة)',
    passport: 'Passport (جواز سفر)',
  };

  const systemPrompt = `You are an expert KYC document analyzer for ASH HOLDING FinTech platform.
You MUST analyze the provided identity document image(s) and extract ALL data accurately.

Document Type: ${documentTypeLabels[documentType]}

IMPORTANT RULES:
- Extract EXACTLY what is written on the document
- For Saudi IDs: The number starts with 1 (citizens) or 2 (residents/iqama), is 10 digits
- Dates should be in YYYY-MM-DD format (convert from Hijri if needed)
- If a field is not readable, set it to empty string
- Confidence score: 0-100 based on image clarity and data completeness
- Check expiry date against today's date

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) with these exact keys:
{
  "document_number": "string",
  "full_name_ar": "string (Arabic name)",
  "full_name_en": "string (English name)",
  "date_of_birth": "YYYY-MM-DD",
  "expiry_date": "YYYY-MM-DD",
  "issue_date": "YYYY-MM-DD",
  "gender": "male or female",
  "nationality": "string",
  "confidence_score": number (0-100),
  "is_expired": boolean,
  "notes": "any concerns about document authenticity"
}`;

  const content: any[] = [
    { type: 'text', text: `Analyze this ${documentTypeLabels[documentType]} and extract all identity information. Return ONLY JSON.` },
    { type: 'image_url', image_url: { url: frontImage.startsWith('data:') ? frontImage : `data:image/jpeg;base64,${frontImage}` } },
  ];

  if (backImage) {
    content.push(
      { type: 'text', text: 'This is the back side of the same document:' },
      { type: 'image_url', image_url: { url: backImage.startsWith('data:') ? backImage : `data:image/jpeg;base64,${backImage}` } }
    );
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[KYC-AI] Gateway error:', response.status, errText);
    if (response.status === 429) throw new Error('RATE_LIMITED');
    if (response.status === 402) throw new Error('PAYMENT_REQUIRED');
    throw new Error('AI_ERROR');
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from AI response (may be wrapped in markdown code blocks)
  let jsonStr = rawContent;
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      document_number: parsed.document_number || '',
      full_name_ar: parsed.full_name_ar || '',
      full_name_en: parsed.full_name_en || '',
      date_of_birth: parsed.date_of_birth || '',
      expiry_date: parsed.expiry_date || '',
      issue_date: parsed.issue_date || '',
      gender: parsed.gender === 'female' ? 'female' : 'male',
      nationality: parsed.nationality || '',
      document_type: documentType,
      is_expired: parsed.is_expired === true,
      confidence_score: Math.min(100, Math.max(0, parsed.confidence_score || 0)),
      ai_raw_analysis: rawContent,
    };
  } catch (e) {
    console.error('[KYC-AI] Failed to parse AI response:', rawContent);
    return null;
  }
}

async function checkRateLimit(supabase: any, userId: string, ipAddress: string): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('verification_audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('verification_type', 'DOCUMENT_OCR')
    .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`)
    .gte('created_at', fiveMinutesAgo);
  return (count || 0) < 5;
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only', message_ar: 'POST فقط' } }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    const body: DocumentRequest = await req.json();

    // Validations
    const validTypes: DocumentType[] = ['national_id', 'iqama', 'passport'];
    if (!validTypes.includes(body.document_type)) {
      return new Response(JSON.stringify({ success: false, error: ERRORS.INVALID_DOCUMENT_TYPE }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!body.document_front || !isValidBase64Image(body.document_front)) {
      return new Response(JSON.stringify({ success: false, error: ERRORS.MISSING_DOCUMENT_IMAGE }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.document_type === 'national_id' && (!body.document_back || !isValidBase64Image(body.document_back))) {
      return new Response(JSON.stringify({ success: false, error: ERRORS.MISSING_BACK_IMAGE }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Rate limit
    const withinLimit = await checkRateLimit(supabase, userId || 'anonymous', ipAddress);
    if (!withinLimit) {
      return new Response(JSON.stringify({ success: false, error: ERRORS.RATE_LIMITED }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // AI-powered document analysis
    const documentData = await analyzeDocumentWithAI(body.document_type, body.document_front, body.document_back);

    if (!documentData || !documentData.document_number) {
      return new Response(JSON.stringify({ success: false, error: ERRORS.OCR_FAILED }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check expiry
    if (documentData.expiry_date) {
      const expiry = new Date(documentData.expiry_date);
      if (expiry < new Date()) documentData.is_expired = true;
    }

    const verificationId = crypto.randomUUID();
    const sessionId = body.session_id || verificationId;

    // Log audit
    await supabase.from('verification_audit_logs').insert({
      user_id: userId || body.user_id,
      session_id: sessionId,
      verification_type: 'DOCUMENT_OCR',
      verification_target: body.document_type,
      attempt_number: 1,
      status: 'success',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      result_code: 'SUCCESS',
      result_message: 'Document analyzed by AI',
      ip_address: ipAddress,
      device_fingerprint: req.headers.get('x-device-fingerprint'),
      user_agent: req.headers.get('user-agent'),
      metadata: {
        document_type: body.document_type,
        confidence_score: documentData.confidence_score,
        is_expired: documentData.is_expired,
        ai_powered: true,
      },
    } as any);

    // Update KYC verification record if session exists
    if (userId) {
      await supabase.from('kyc_verifications').upsert({
        user_id: userId,
        session_id: sessionId,
        national_id: documentData.document_number,
        status: 'PENDING',
        document_type: body.document_type,
        ocr_confidence: documentData.confidence_score / 100,
        ai_analysis: {
          full_name_ar: documentData.full_name_ar,
          full_name_en: documentData.full_name_en,
          date_of_birth: documentData.date_of_birth,
          expiry_date: documentData.expiry_date,
          nationality: documentData.nationality,
          gender: documentData.gender,
          is_expired: documentData.is_expired,
        },
        extracted_data: {
          document_number: documentData.document_number,
          full_name_ar: documentData.full_name_ar,
          full_name_en: documentData.full_name_en,
          date_of_birth: documentData.date_of_birth,
          expiry_date: documentData.expiry_date,
          issue_date: documentData.issue_date,
          nationality: documentData.nationality,
          gender: documentData.gender,
        },
      } as any, { onConflict: 'session_id' });
    }

    console.log(`[KYC-DOCUMENT] AI analysis success for ${body.document_type}, confidence: ${documentData.confidence_score}%`);

    return new Response(JSON.stringify({
      success: true,
      data: documentData,
      verification_id: verificationId,
      session_id: sessionId,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('[KYC-DOCUMENT] Error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    
    let errorResponse = ERRORS.INTERNAL_ERROR;
    let statusCode = 500;
    if (errMsg === 'RATE_LIMITED') { errorResponse = ERRORS.RATE_LIMITED; statusCode = 429; }
    if (errMsg === 'AI_ERROR') { errorResponse = ERRORS.AI_ERROR; statusCode = 502; }

    return new Response(JSON.stringify({ success: false, error: { ...errorResponse, details: { message: errMsg } } }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
