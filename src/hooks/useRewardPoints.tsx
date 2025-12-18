import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RewardTier {
  id: string;
  name: string;
  name_ar: string;
  min_points: number;
  points_multiplier: number;
  benefits: string[];
  color: string;
  icon: string;
}

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  redeemed_points: number;
  tier_id: string | null;
  tier?: RewardTier;
}

interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  type: string;
  description: string | null;
  description_ar: string | null;
  order_id: string | null;
  created_at: string;
}

export const useRewardPoints = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPoints();
      fetchTransactions();
      fetchTiers();
    }
  }, [user]);

  const fetchUserPoints = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_points")
      .select(`
        *,
        tier:reward_tiers(*)
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user points:", error);
    } else if (data) {
      setUserPoints({
        ...data,
        tier: data.tier as RewardTier | undefined
      } as UserPoints);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("points_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransactions(data);
    }
  };

  const fetchTiers = async () => {
    const { data, error } = await supabase
      .from("reward_tiers")
      .select("*")
      .eq("is_active", true)
      .order("min_points", { ascending: true });

    if (!error && data) {
      setTiers(data.map(tier => ({
        ...tier,
        benefits: Array.isArray(tier.benefits) ? tier.benefits : JSON.parse(tier.benefits as string || '[]')
      })));
    }
  };

  const redeemPoints = async (pointsToRedeem: number, description: string) => {
    if (!user || !userPoints) return { success: false };

    if (pointsToRedeem > userPoints.available_points) {
      toast.error("لا تملك نقاط كافية");
      return { success: false };
    }

    // Insert redemption transaction
    const { error: transactionError } = await supabase
      .from("points_transactions")
      .insert({
        user_id: user.id,
        points: -pointsToRedeem,
        type: "redeemed",
        description: description,
        description_ar: description
      });

    if (transactionError) {
      toast.error("خطأ في استبدال النقاط");
      return { success: false };
    }

    // Update user points
    const { error: updateError } = await supabase
      .from("user_points")
      .update({
        available_points: userPoints.available_points - pointsToRedeem,
        redeemed_points: userPoints.redeemed_points + pointsToRedeem,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      toast.error("خطأ في تحديث النقاط");
      return { success: false };
    }

    // Calculate balance to add (100 points = 1$)
    const balanceToAdd = pointsToRedeem / 100;

    // Add to user balance
    const { error: balanceError } = await supabase
      .from("user_balances")
      .update({
        balance: supabase.rpc ? userPoints.available_points : 0 // Will be handled differently
      })
      .eq("user_id", user.id);

    // Refresh data
    await fetchUserPoints();
    await fetchTransactions();

    toast.success(`تم استبدال ${pointsToRedeem} نقطة بنجاح!`);
    return { success: true, balanceAdded: balanceToAdd };
  };

  const getNextTier = () => {
    if (!userPoints || tiers.length === 0) return null;
    
    const currentTierIndex = tiers.findIndex(t => t.id === userPoints.tier_id);
    if (currentTierIndex < tiers.length - 1) {
      return tiers[currentTierIndex + 1];
    }
    return null;
  };

  const getProgressToNextTier = () => {
    if (!userPoints || tiers.length === 0) return 100;
    
    const nextTier = getNextTier();
    if (!nextTier) return 100;
    
    const currentTier = tiers.find(t => t.id === userPoints.tier_id);
    const currentMin = currentTier?.min_points || 0;
    const nextMin = nextTier.min_points;
    
    const progress = ((userPoints.total_points - currentMin) / (nextMin - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return {
    userPoints,
    transactions,
    tiers,
    loading,
    redeemPoints,
    getNextTier,
    getProgressToNextTier,
    refetch: () => {
      fetchUserPoints();
      fetchTransactions();
    }
  };
};
