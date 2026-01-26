import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Badge {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  icon: string;
  color: string;
  tier: number;
  min_spending: number;
  min_orders: number;
  is_active: boolean;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}

export const useUserBadges = (userId?: string) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  }, []);

  const fetchUserBadges = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setUserBadges(data || []);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const checkAndAwardBadges = useCallback(async (totalSpending: number, totalOrders: number) => {
    if (!userId) return;

    try {
      // Get all badges
      const { data: allBadges } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true);

      // Get user's current badges
      const { data: currentBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      const currentBadgeIds = new Set(currentBadges?.map(b => b.badge_id) || []);

      // Check which badges the user qualifies for
      const eligibleBadges = (allBadges || []).filter(badge => {
        // Skip if user already has this badge
        if (currentBadgeIds.has(badge.id)) return false;

        // Check if user meets requirements
        const meetsSpending = totalSpending >= badge.min_spending;
        const meetsOrders = totalOrders >= badge.min_orders;

        // User needs to meet both requirements (if both are set)
        if (badge.min_spending > 0 && badge.min_orders > 0) {
          return meetsSpending && meetsOrders;
        }
        // If only spending is required
        if (badge.min_spending > 0) return meetsSpending;
        // If only orders are required
        if (badge.min_orders > 0) return meetsOrders;
        // Default badge (both are 0 but requires at least 1 order)
        return totalOrders >= 1;
      });

      // Award new badges
      for (const badge of eligibleBadges) {
        const { error } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id
          });

        if (!error) {
          // Create notification in database
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              title: '🏆 تهانينا! حصلت على شارة جديدة',
              message: `لقد حصلت على شارة "${badge.name_ar}"! ${badge.description_ar || badge.description || 'استمر في التقدم للحصول على المزيد من الشارات.'}`,
              type: 'success'
            });

          // Show toast notification
          toast.success(`🏆 تهانينا! حصلت على شارة "${badge.name_ar}"`, {
            duration: 5000,
            description: badge.description_ar || badge.description || 'استمر في التقدم!'
          });
        }
      }

      // Refresh user badges
      if (eligibleBadges.length > 0) {
        fetchUserBadges();
      }

      return eligibleBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }, [userId, fetchUserBadges]);

  const awardBadge = useCallback(async (badgeId: string, badgeName?: string, userEmail?: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId
        });

      if (error) throw error;
      
      // Log to audit_logs
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'user_badges',
          action: 'INSERT',
          record_id: badgeId,
          new_value: {
            badge_id: badgeId,
            user_id: userId,
            badge_name: badgeName || '',
            user_email: userEmail || ''
          }
        });

      fetchUserBadges();
      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  }, [userId, fetchUserBadges]);

  const revokeBadge = useCallback(async (userBadgeId: string, badgeName?: string, userEmail?: string) => {
    try {
      const { error } = await supabase
        .from('user_badges')
        .delete()
        .eq('id', userBadgeId);

      if (error) throw error;
      
      // Log to audit_logs
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'user_badges',
          action: 'DELETE',
          record_id: userBadgeId,
          old_value: {
            badge_name: badgeName || '',
            user_email: userEmail || ''
          }
        });

      fetchUserBadges();
      return true;
    } catch (error) {
      console.error('Error revoking badge:', error);
      return false;
    }
  }, [fetchUserBadges]);

  useEffect(() => {
    fetchBadges();
    if (userId) {
      fetchUserBadges();
    }
  }, [fetchBadges, fetchUserBadges, userId]);

  // Real-time subscription for user badges
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-badges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchUserBadges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUserBadges]);

  return {
    badges,
    userBadges,
    loading,
    checkAndAwardBadges,
    awardBadge,
    revokeBadge,
    refetch: fetchUserBadges
  };
};
