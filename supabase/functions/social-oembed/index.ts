import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OEmbedResponse {
  platform: string;
  username: string;
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  provider_name?: string;
  success: boolean;
  error?: string;
}

// oEmbed endpoints for supported platforms
const oembedEndpoints: Record<string, string> = {
  youtube: 'https://www.youtube.com/oembed',
  tiktok: 'https://www.tiktok.com/oembed',
  twitter: 'https://publish.twitter.com/oembed',
};

// Platform detection patterns
const platformPatterns: Record<string, RegExp[]> = {
  youtube: [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
  ],
  tiktok: [
    /tiktok\.com\/@([a-zA-Z0-9_.]+)/,
    /tiktok\.com\/@([a-zA-Z0-9_.]+)\/video\/(\d+)/,
  ],
  twitter: [
    /(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/,
  ],
};

function detectPlatform(url: string): { platform: string; username: string } | null {
  for (const [platform, patterns] of Object.entries(platformPatterns)) {
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform, username: match[1] };
      }
    }
  }
  return null;
}

async function fetchOEmbed(platform: string, url: string): Promise<any> {
  const endpoint = oembedEndpoints[platform];
  if (!endpoint) return null;

  try {
    const oembedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;
    console.log(`Fetching oEmbed from: ${oembedUrl}`);
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MaxioCore/1.0)',
      },
    });
    
    if (!response.ok) {
      console.log(`oEmbed failed with status: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching oEmbed for ${platform}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing URL: ${url}`);
    
    // Detect platform
    const detected = detectPlatform(url);
    if (!detected) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unsupported platform' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { platform, username } = detected;
    console.log(`Detected platform: ${platform}, username: ${username}`);

    // Try to fetch oEmbed data
    const oembedData = await fetchOEmbed(platform, url);
    
    const response: OEmbedResponse = {
      platform,
      username,
      success: true,
    };

    if (oembedData) {
      response.title = oembedData.title;
      response.author_name = oembedData.author_name;
      response.author_url = oembedData.author_url;
      response.thumbnail_url = oembedData.thumbnail_url;
      response.provider_name = oembedData.provider_name;
    }

    console.log(`Response:`, response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
