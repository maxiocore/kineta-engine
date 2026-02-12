/**
 * KYC Document Quality Check — AI-powered blur/readability detection
 * Validates uploaded documents are clear, readable, and belong to the user
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface QualityIssue {
  file: string;
  reason: string;
  reason_ar: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Auth check
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { file_paths, user_id, session_id } = await req.json();

    if (!file_paths || !Array.isArray(file_paths) || file_paths.length === 0) {
      return new Response(JSON.stringify({ passed: false, issues: [{ file: 'عام', reason: 'No files', reason_ar: 'لم يتم تحديد ملفات' }] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify files belong to the requesting user
    const requestingUser = userId || user_id;
    const issues: QualityIssue[] = [];

    for (const filePath of file_paths) {
      if (!filePath) continue;

      // Security: ensure file path starts with user's ID folder
      if (!filePath.startsWith(`${requestingUser}/`)) {
        issues.push({
          file: filePath.split('/').pop() || filePath,
          reason: 'File does not belong to user',
          reason_ar: 'هذا الملف لا ينتمي إلى حسابك. يرجى رفع ملفاتك الخاصة فقط.',
        });
        continue;
      }

      // Download file from private storage to check
      const { data: fileData, error: downloadErr } = await supabase.storage
        .from('kyc-documents')
        .download(filePath);

      if (downloadErr || !fileData) {
        issues.push({
          file: filePath.split('/').pop() || filePath,
          reason: 'File not found',
          reason_ar: 'لم يتم العثور على الملف. يرجى إعادة الرفع.',
        });
        continue;
      }

      // Check file size
      if (fileData.size > MAX_SIZE) {
        issues.push({
          file: filePath.split('/').pop() || filePath,
          reason: 'File too large',
          reason_ar: `حجم الملف ${(fileData.size / (1024 * 1024)).toFixed(1)} ميجابايت — الحد الأقصى 5 ميجابايت.`,
        });
        continue;
      }

      // Check content type
      if (!ALLOWED_TYPES.includes(fileData.type)) {
        issues.push({
          file: filePath.split('/').pop() || filePath,
          reason: 'Invalid file type',
          reason_ar: 'نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, PDF',
        });
        continue;
      }

      // For images, check quality with AI
      if (fileData.type.startsWith('image/') && LOVABLE_API_KEY) {
        try {
          const arrayBuffer = await fileData.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const dataUrl = `data:${fileData.type};base64,${base64}`;

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                {
                  role: 'system',
                  content: `You are a document quality inspector. Analyze the uploaded image and determine:
1. Is the image blurry or out of focus?
2. Is the text readable?
3. Is the document clearly visible and not obstructed?
4. Does the image appear to be a valid identity document?

Respond ONLY with a JSON object:
{
  "is_clear": boolean,
  "is_readable": boolean,
  "is_valid_document": boolean,
  "quality_score": number (0-100),
  "issue_ar": "Arabic description of the problem if any, empty string if no issues"
}`,
                },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Check the quality of this identity document image. Is it clear, readable, and valid?' },
                    { type: 'image_url', image_url: { url: dataUrl } },
                  ],
                },
              ],
            }),
          });

          if (response.ok) {
            const aiData = await response.json();
            const rawContent = aiData.choices?.[0]?.message?.content || '';
            let jsonStr = rawContent;
            const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonStr = jsonMatch[1].trim();

            try {
              const quality = JSON.parse(jsonStr);

              if (!quality.is_clear || !quality.is_readable || quality.quality_score < 40) {
                const fileName = filePath.split('/').pop() || '';
                const fileLabel = fileName.includes('front') ? 'الوجه الأمامي' : fileName.includes('back') ? 'الوجه الخلفي' : 'الصورة الشخصية';
                issues.push({
                  file: fileLabel,
                  reason: `Quality score: ${quality.quality_score}`,
                  reason_ar: quality.issue_ar || 'الصورة غير واضحة أو غير قابلة للقراءة. يرجى التقاط صورة جديدة بإضاءة جيدة وبدون اهتزاز.',
                });
              }
            } catch {
              // If AI response isn't parseable, skip quality check (don't block user)
              console.warn('[KYC-QUALITY] Could not parse AI response:', rawContent);
            }
          } else if (response.status === 429) {
            // Rate limited — skip quality check, don't block user
            console.warn('[KYC-QUALITY] AI rate limited, skipping quality check');
          }
        } catch (aiErr) {
          console.error('[KYC-QUALITY] AI check error:', aiErr);
          // Don't block upload on AI failure
        }
      }
    }

    // Audit log
    await supabase.from('verification_audit_logs').insert({
      user_id: requestingUser,
      session_id: session_id || 'quality-check',
      verification_type: 'DOCUMENT_QUALITY_CHECK',
      attempt_number: 1,
      status: issues.length === 0 ? 'success' : 'failed',
      result_code: issues.length === 0 ? 'QUALITY_PASSED' : 'QUALITY_FAILED',
      result_message: issues.length === 0 ? 'All documents passed quality check' : `${issues.length} issue(s) found`,
      metadata: { issues, file_count: file_paths.length },
    } as any);

    return new Response(JSON.stringify({
      passed: issues.length === 0,
      issues,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[KYC-QUALITY] Error:', error);
    return new Response(JSON.stringify({
      passed: true, // Don't block on error
      issues: [],
      error: 'Quality check encountered an error but upload was not blocked',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
