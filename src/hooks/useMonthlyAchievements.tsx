import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, format } from "date-fns";

interface MonthlyAchievement {
  id: string;
  user_id: string;
  month: string;
  monthly_goal: number;
  completed_orders: number;
  goal_achieved: boolean;
  achieved_at: string | null;
  bonus_points_awarded: number;
  exceeded_by: number;
  created_at: string;
  updated_at: string;
}

interface UseMonthlyAchievementsReturn {
  currentAchievement: MonthlyAchievement | null;
  achievements: MonthlyAchievement[];
  loading: boolean;
  updateAchievement: (completedOrders: number, monthlyGoal: number) => Promise<void>;
  updateMonthlyGoal: (newGoal: number) => Promise<void>;
  markGoalAchieved: (bonusPoints: number, exceededBy: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMonthlyAchievements = (userId: string | undefined): UseMonthlyAchievementsReturn => {
  const [currentAchievement, setCurrentAchievement] = useState<MonthlyAchievement | null>(null);
  const [achievements, setAchievements] = useState<MonthlyAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const getCurrentMonth = () => {
    return format(startOfMonth(new Date()), "yyyy-MM-dd");
  };

  const fetchAchievements = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const currentMonth = getCurrentMonth();

      // Fetch all achievements
      const { data: allAchievements, error: allError } = await supabase
        .from("monthly_achievements")
        .select("*")
        .eq("user_id", userId)
        .order("month", { ascending: false });

      if (allError) throw allError;

      setAchievements((allAchievements as MonthlyAchievement[]) || []);

      // Find current month achievement
      const current = allAchievements?.find(
        (a: MonthlyAchievement) => a.month === currentMonth
      );
      setCurrentAchievement(current || null);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const updateAchievement = useCallback(
    async (completedOrders: number, monthlyGoal: number) => {
      if (!userId) return;

      const currentMonth = getCurrentMonth();

      try {
        const { data, error } = await supabase
          .from("monthly_achievements")
          .upsert(
            {
              user_id: userId,
              month: currentMonth,
              monthly_goal: monthlyGoal,
              completed_orders: completedOrders,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,month",
            }
          )
          .select()
          .single();

        if (error) throw error;

        setCurrentAchievement(data as MonthlyAchievement);
        
        // Update achievements list
        setAchievements((prev) => {
          const index = prev.findIndex((a) => a.month === currentMonth);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data as MonthlyAchievement;
            return updated;
          }
          return [data as MonthlyAchievement, ...prev];
        });
      } catch (error) {
        console.error("Error updating achievement:", error);
      }
    },
    [userId]
  );

  const updateMonthlyGoal = useCallback(
    async (newGoal: number) => {
      if (!userId) return;

      const currentMonth = getCurrentMonth();

      try {
        const { data, error } = await supabase
          .from("monthly_achievements")
          .upsert(
            {
              user_id: userId,
              month: currentMonth,
              monthly_goal: newGoal,
              completed_orders: currentAchievement?.completed_orders || 0,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,month",
            }
          )
          .select()
          .single();

        if (error) throw error;

        setCurrentAchievement(data as MonthlyAchievement);
        
        // Update achievements list
        setAchievements((prev) => {
          const index = prev.findIndex((a) => a.month === currentMonth);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data as MonthlyAchievement;
            return updated;
          }
          return [data as MonthlyAchievement, ...prev];
        });
      } catch (error) {
        console.error("Error updating monthly goal:", error);
        throw error;
      }
    },
    [userId, currentAchievement]
  );

  const markGoalAchieved = useCallback(
    async (bonusPoints: number, exceededBy: number) => {
      if (!userId || !currentAchievement) return;

      try {
        const { data, error } = await supabase
          .from("monthly_achievements")
          .update({
            goal_achieved: true,
            achieved_at: new Date().toISOString(),
            bonus_points_awarded: bonusPoints,
            exceeded_by: exceededBy,
          })
          .eq("id", currentAchievement.id)
          .select()
          .single();

        if (error) throw error;

        setCurrentAchievement(data as MonthlyAchievement);
        
        // Update achievements list
        setAchievements((prev) =>
          prev.map((a) =>
            a.id === currentAchievement.id ? (data as MonthlyAchievement) : a
          )
        );
      } catch (error) {
        console.error("Error marking goal achieved:", error);
      }
    },
    [userId, currentAchievement]
  );

  return {
    currentAchievement,
    achievements,
    loading,
    updateAchievement,
    updateMonthlyGoal,
    markGoalAchieved,
    refetch: fetchAchievements,
  };
};
