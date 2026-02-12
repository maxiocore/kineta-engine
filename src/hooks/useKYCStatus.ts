import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getKYCDisplayStatus, getKYCStatusFlags, type KYCStatus } from '@/lib/kyc/kycUtils';

/**
 * Hook to fetch and track user's KYC status
 */
export function useKYCStatus() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Fetch latest KYC verification
    const fetchKYCStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('kyc_verifications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching KYC status:', error);
          setKycStatus(getKYCStatusFlags('not_started'));
          return;
        }

        const displayStatus = getKYCDisplayStatus(data?.status);
        setKycStatus(getKYCStatusFlags(displayStatus));
      } catch (err) {
        console.error('KYC status fetch error:', err);
        setKycStatus(getKYCStatusFlags('not_started'));
      } finally {
        setLoading(false);
      }
    };

    fetchKYCStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('kyc-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kyc_verifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newStatus = payload.new?.status || payload.old?.status;
          const displayStatus = getKYCDisplayStatus(newStatus);
          setKycStatus(getKYCStatusFlags(displayStatus));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { kycStatus, loading };
}
