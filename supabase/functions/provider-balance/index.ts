import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider_id } = await req.json();

    if (!provider_id) {
      console.error('Provider ID is required');
      return new Response(
        JSON.stringify({ error: 'Provider ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch provider details
    console.log('Fetching provider for balance:', provider_id);
    const { data: provider, error: providerError } = await supabase
      .from('api_providers')
      .select('*')
      .eq('id', provider_id)
      .single();

    if (providerError || !provider) {
      console.error('Provider not found:', providerError);
      return new Response(
        JSON.stringify({ error: 'Provider not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!provider.is_active) {
      return new Response(
        JSON.stringify({ error: 'Provider is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching balance from provider: ${provider.name} (${provider.api_url})`);

    // Make request to provider API for balance
    const formData = new FormData();
    formData.append('key', provider.api_key);
    formData.append('action', 'balance');

    const response = await fetch(provider.api_url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Provider API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch balance from provider', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const balanceData = await response.json();
    console.log(`Balance response from ${provider.name}:`, balanceData);

    // Most SMM APIs return balance in format { balance: "123.45", currency: "USD" }
    // or just { balance: "123.45" }
    const balance = balanceData.balance !== undefined 
      ? parseFloat(balanceData.balance) 
      : (balanceData.funds !== undefined ? parseFloat(balanceData.funds) : null);
    
    const currency = balanceData.currency || 'USD';

    return new Response(
      JSON.stringify({ 
        balance,
        currency,
        raw: balanceData,
        provider: {
          id: provider.id,
          name: provider.name,
          name_ar: provider.name_ar,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in provider-balance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
