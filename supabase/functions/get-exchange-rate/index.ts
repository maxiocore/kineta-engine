import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching exchange rate USD to SAR...');

    // Try to get cached rate from system_settings first
    const { data: cachedRate } = await supabase
      .from('system_settings')
      .select('value, updated_at')
      .eq('key', 'exchange_rate_usd_sar')
      .single();

    const now = new Date();
    const cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

    // Check if we have a valid cached rate (less than 6 hours old)
    if (cachedRate?.value && cachedRate.updated_at) {
      const lastUpdate = new Date(cachedRate.updated_at);
      const timeDiff = now.getTime() - lastUpdate.getTime();
      
      if (timeDiff < cacheExpiry) {
        console.log('Using cached exchange rate:', cachedRate.value);
        return new Response(
          JSON.stringify({ 
            success: true,
            rate: cachedRate.value.rate,
            source: 'cache',
            updated_at: cachedRate.updated_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch fresh rate from API (using exchangerate-api.com free tier)
    console.log('Fetching fresh exchange rate from API...');
    
    // Using a free exchange rate API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    const data = await response.json();
    const sarRate = data.rates?.SAR;

    if (!sarRate) {
      // Fallback to a reasonable default rate if API fails
      console.log('SAR rate not found, using fallback rate');
      const fallbackRate = 3.75; // Approximate USD to SAR rate
      
      return new Response(
        JSON.stringify({ 
          success: true,
          rate: fallbackRate,
          source: 'fallback',
          updated_at: now.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fresh SAR rate:', sarRate);

    // Cache the rate in system_settings
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({
        key: 'exchange_rate_usd_sar',
        value: { rate: sarRate, fetched_at: now.toISOString() },
        category: 'currency',
        updated_at: now.toISOString()
      }, {
        onConflict: 'key'
      });

    if (upsertError) {
      console.error('Error caching exchange rate:', upsertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        rate: sarRate,
        source: 'api',
        updated_at: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error in get-exchange-rate:', err);
    
    // Return fallback rate on error
    return new Response(
      JSON.stringify({ 
        success: true,
        rate: 3.75, // Fallback rate
        source: 'fallback',
        error: err instanceof Error ? err.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});