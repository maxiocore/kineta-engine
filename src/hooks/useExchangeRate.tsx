import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRateData {
  rate: number;
  source: 'cache' | 'api' | 'fallback';
  updated_at: string;
}

// Default USD to SAR rate (approximate)
const DEFAULT_RATE = 3.75;

export const useExchangeRate = () => {
  const [rate, setRate] = useState<number>(DEFAULT_RATE);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('default');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-exchange-rate');
      
      if (error) {
        console.error('Error fetching exchange rate:', error);
        return;
      }

      if (data?.success && data.rate) {
        setRate(data.rate);
        setSource(data.source);
        setLastUpdated(data.updated_at);
      }
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  // Convert USD to SAR
  const convertToSAR = useCallback((usdAmount: number): number => {
    return usdAmount * rate;
  }, [rate]);

  // Convert SAR to USD
  const convertToUSD = useCallback((sarAmount: number): number => {
    return sarAmount / rate;
  }, [rate]);

  // Format price in SAR
  const formatSAR = useCallback((usdAmount: number, decimals: number = 2): string => {
    const sarAmount = convertToSAR(usdAmount);
    return `${sarAmount.toFixed(decimals)} ر.س`;
  }, [convertToSAR]);

  return {
    rate,
    loading,
    source,
    lastUpdated,
    convertToSAR,
    convertToUSD,
    formatSAR,
    refetch: fetchRate
  };
};

// Standalone function for one-time conversion (uses default rate)
export const convertUsdToSar = (usdAmount: number, rate: number = DEFAULT_RATE): number => {
  return usdAmount * rate;
};

// Format price for display
export const formatPriceSAR = (price: number, decimals: number = 2): string => {
  return `${price.toFixed(decimals)} ر.س`;
};