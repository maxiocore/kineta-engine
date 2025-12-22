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
            content: `أنت مترجم محترف متخصص في خدمات السوشيال ميديا. ترجم من الإنجليزية إلى العربية بدقة.

قواعد الترجمة المهمة:
1. ترجم أسماء المنصات بشكل صحيح:
   - Instagram = انستقرام
   - Facebook = فيسبوك  
   - Twitter/X = تويتر
   - YouTube = يوتيوب
   - TikTok = تيك توك
   - Telegram = تيليجرام
   - Snapchat = سناب شات
   - LinkedIn = لينكد إن
   - Spotify = سبوتيفاي
   - WhatsApp = واتساب
   - Discord = ديسكورد
   - Threads = ثريدز
   - Pinterest = بنترست
   - Twitch = تويتش
   - SoundCloud = ساوند كلاود

2. ترجم أنواع الخدمات:
   - Followers = متابعين
   - Likes = لايكات / إعجابات
   - Views = مشاهدات
   - Comments = تعليقات
   - Shares = مشاركات
   - Subscribers = مشتركين
   - Retweets = ريتويت / إعادة تغريد
   - Story Views = مشاهدات الستوري
   - Reel Views = مشاهدات الريلز
   - Watch Hours = ساعات المشاهدة
   - Live Views = مشاهدات البث المباشر
   - Saves = حفظ
   - Impressions = انطباعات
   - Reach = وصول
   - Plays = تشغيلات
   - Streams = استماعات
   - Members = أعضاء
   - Reactions = تفاعلات

3. ترجم الصفات:
   - Real = حقيقي
   - Active = نشط
   - High Quality = جودة عالية
   - Premium = مميز
   - Fast = سريع
   - Slow = بطيء
   - Instant = فوري
   - Organic = طبيعي
   - Targeted = مستهدف
   - Worldwide = عالمي
   - Arab = عربي
   - USA = أمريكي
   - Guaranteed = مضمون
   - Lifetime = مدى الحياة
   - Non-Drop = بدون نقصان
   - Refill = إعادة تعبئة

4. ترجم الفئة بشكل وصفي. مثال:
   - "Instagram - Followers" = "انستقرام - متابعين"
   - "YouTube - Views" = "يوتيوب - مشاهدات"
   - "TikTok - Likes" = "تيك توك - لايكات"
   - "Facebook - Page Likes" = "فيسبوك - لايكات الصفحة"
   - "Telegram - Channel Members" = "تيليجرام - أعضاء القناة"

5. اجعل الترجمة طبيعية ومفهومة للمستخدم العربي
6. أرجع النتيجة بصيغة JSON فقط بدون أي نص إضافي`
          },
          {
            role: 'user',
            content: `ترجم الخدمة التالية:

الاسم: ${name}
الوصف: ${description || 'غير متوفر'}
الفئة: ${category}

أرجع JSON بهذا الشكل فقط:
{"name": "الاسم بالعربية", "description": "الوصف بالعربية", "category": "الفئة بالعربية"}`
          }
        ],
        temperature: 0.2,
        max_tokens: 800,
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
