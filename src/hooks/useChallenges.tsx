import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Challenge {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  type: string;
  challenge_type: string;
  target_value: number;
  reward_points: number;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_value: number;
  target_value: number;
  is_completed: boolean;
  completed_at: string | null;
  points_awarded: number;
  period_start: string;
  period_end: string;
  challenge?: Challenge;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  }, []);

  const fetchUserChallenges = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = getWeekStart().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:challenges(*)
        `)
        .eq('user_id', user.id)
        .or(`period_start.eq.${today},period_start.eq.${weekStart}`);

      if (error) throw error;
      setUserChallenges(data || []);
    } catch (error) {
      console.error('Error fetching user challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const initializeUserChallenges = useCallback(async () => {
    if (!user?.id || challenges.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart().toISOString().split('T')[0];
    const weekEnd = getWeekEnd().toISOString().split('T')[0];

    try {
      for (const challenge of challenges) {
        const periodStart = challenge.type === 'daily' ? today : weekStart;
        const periodEnd = challenge.type === 'daily' ? today : weekEnd;

        // Check if challenge already exists
        const existingChallenge = userChallenges.find(
          uc => uc.challenge_id === challenge.id && uc.period_start === periodStart
        );

        if (!existingChallenge) {
          await supabase
            .from('user_challenges')
            .upsert({
              user_id: user.id,
              challenge_id: challenge.id,
              target_value: challenge.target_value,
              period_start: periodStart,
              period_end: periodEnd,
              current_value: 0,
              is_completed: false
            }, {
              onConflict: 'user_id,challenge_id,period_start'
            });
        }
      }

      // Refresh user challenges
      await fetchUserChallenges();
    } catch (error) {
      console.error('Error initializing user challenges:', error);
    }
  }, [user?.id, challenges, userChallenges, fetchUserChallenges]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  useEffect(() => {
    if (user?.id) {
      fetchUserChallenges();
    }
  }, [user?.id, fetchUserChallenges]);

  useEffect(() => {
    if (challenges.length > 0 && user?.id) {
      initializeUserChallenges();
    }
  }, [challenges, user?.id, initializeUserChallenges]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-challenges-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_challenges',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUserChallenges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUserChallenges]);

  const getDailyChallenges = () => {
    const today = new Date().toISOString().split('T')[0];
    return challenges
      .filter(c => c.type === 'daily')
      .map(challenge => {
        const userChallenge = userChallenges.find(
          uc => uc.challenge_id === challenge.id && uc.period_start === today
        );
        return {
          ...challenge,
          userProgress: userChallenge || null
        };
      });
  };

  const getWeeklyChallenges = () => {
    const weekStart = getWeekStart().toISOString().split('T')[0];
    return challenges
      .filter(c => c.type === 'weekly')
      .map(challenge => {
        const userChallenge = userChallenges.find(
          uc => uc.challenge_id === challenge.id && uc.period_start === weekStart
        );
        return {
          ...challenge,
          userProgress: userChallenge || null
        };
      });
  };

  const getCompletedChallengesCount = () => {
    return userChallenges.filter(uc => uc.is_completed).length;
  };

  const getTotalPointsEarned = () => {
    return userChallenges
      .filter(uc => uc.is_completed)
      .reduce((sum, uc) => sum + (uc.points_awarded || 0), 0);
  };

  return {
    challenges,
    userChallenges,
    loading,
    getDailyChallenges,
    getWeeklyChallenges,
    getCompletedChallengesCount,
    getTotalPointsEarned,
    refetch: fetchUserChallenges
  };
};

// Helper functions
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is start of week
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekEnd(): Date {
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

export default useChallenges;
