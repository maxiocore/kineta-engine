import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('BULKFOLLOWS_API_KEY');
    
    if (!apiKey) {
      console.error('BULKFOLLOWS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching services from BulkFollows API...');

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('action', 'services');

    const response = await fetch('https://bulkfollows.com/api/v2', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BulkFollows API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch services from BulkFollows', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const services = await response.json();
    console.log(`Fetched ${Array.isArray(services) ? services.length : 0} services`);

    return new Response(
      JSON.stringify({ services }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in bulkfollows-services:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
