import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReferralCode {
  id: string;
  code: string;
  total_referrals: number;
  total_earnings: number;
  is_active: boolean;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  commission_rate: number;
  total_commission: number;
  status: string;
  created_at: string;
  converted_at: string | null;
}

interface Commission {
  id: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export function useReferral() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    convertedReferrals: 0,
    pendingEarnings: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch user's referral code
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (codeData) {
        setReferralCode(codeData);
      } else {
        // Created on the server
        const { data: newCodeData } = await (supabase as any).rpc('ensure_my_referral_code');
        if (newCodeData) {
          setReferralCode(newCodeData);
        }
      }

      // Fetch referrals where user is the referrer
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsData) {
        setReferrals(referralsData);
      }

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from('referral_commissions')
        .select(`
          id,
          order_amount,
          commission_rate,
          commission_amount,
          status,
          created_at,
          paid_at,
          referral:referrals!inner(referrer_id)
        `)
        .eq('referral.referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (commissionsData) {
        setCommissions(commissionsData as unknown as Commission[]);
      }

      // Calculate stats
      if (referralsData) {
        const converted = referralsData.filter(r => r.status === 'converted').length;
        const totalEarnings = referralsData.reduce((sum, r) => sum + Number(r.total_commission), 0);
        const pendingEarnings = commissionsData?.filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

        setStats({
          totalReferrals: referralsData.length,
          convertedReferrals: converted,
          pendingEarnings,
          totalEarnings,
        });
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const getReferralLink = () => {
    if (!referralCode) return '';
    return `https://ash-holding.sa/auth?ref=${referralCode.code}`;
  };

  const applyReferralCode = async (code: string) => {
    if (!user) return { success: false, error: 'يجب تسجيل الدخول أولاً' };

    try {
      // Validated and applied on the server (no direct writes from the browser)
      const { data, error } = await (supabase as any).rpc('apply_referral_code', { p_code: code });
      if (error) throw error;
      if (!data?.ok) {
        const map: Record<string, string> = {
          invalid_code: 'كود الإحالة غير صالح',
          own_code: 'لا يمكنك استخدام كود الإحالة الخاص بك',
          already_referred: 'لقد استخدمت كود إحالة سابقاً',
        };
        return { success: false, error: map[data?.error] || 'كود الإحالة غير صالح' };
      }
      return { success: true };
    } catch (error) {
      console.error('Error applying referral code:', error);
      return { success: false, error: 'حدث خطأ أثناء تطبيق كود الإحالة' };
    }
  };

  return {
    referralCode,
    referrals,
    commissions,
    stats,
    loading,
    getReferralLink,
    applyReferralCode,
    refresh: fetchData,
  };
}
