import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, description, category } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Translating service:', name);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `أنت مترجم محترف. قم بترجمة النصوص التالية من الإنجليزية إلى العربية بشكل احترافي ومناسب لخدمات السوشيال ميديا.
            
قواعد الترجمة:
- اجعل الترجمة طبيعية ومفهومة
- حافظ على المصطلحات التقنية الشائعة (مثل Instagram, Facebook, TikTok, YouTube)
- اجعل الوصف مختصراً ومفيداً
- أرجع النتيجة بصيغة JSON فقط بدون أي نص إضافي`
          },
          {
            role: 'user',
            content: `قم بترجمة الخدمة التالية:
            
الاسم: ${name}
الوصف: ${description || 'غير متوفر'}
الفئة: ${category}

أرجع JSON بالشكل التالي فقط:
{"name": "الاسم بالعربية", "description": "الوصف بالعربية", "category": "الفئة بالعربية"}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content);

    // Parse JSON from response
    let translated;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        translated = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Return original if parsing fails
      translated = { name, description, category };
    }

    return new Response(JSON.stringify(translated), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
