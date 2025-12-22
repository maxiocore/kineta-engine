import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Wallet,
  Clock,
  Activity,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ActivityLog {
  id: string;
  action_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const actionConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  deposit: { label: "إيداع", color: "text-emerald-500", icon: ArrowUpCircle },
  order: { label: "طلب", color: "text-orange-500", icon: ArrowDownCircle },
  refund: { label: "استرداد", color: "text-blue-500", icon: RefreshCw },
  commission: { label: "عمولة", color: "text-purple-500", icon: Wallet },
  credit: { label: "إضافة", color: "text-green-500", icon: ArrowUpCircle },
  debit: { label: "خصم", color: "text-red-500", icon: ArrowDownCircle },
};

export const RecentActivities = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());

  const fetchActivities = async () => {
    setLoading(true);
    const { data: logs, error } = await supabase
      .from("balance_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && logs) {
      // Fetch profiles
      const userIds = [...new Set(logs.map((l) => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      setActivities(
        logs.map((log) => ({
          ...log,
          profile: profileMap.get(log.user_id) || null,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();

    // Realtime subscription
    const channel = supabase
      .channel("balance_logs_admin")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "balance_logs",
        },
        async (payload) => {
          const newLog = payload.new as ActivityLog;
          
          // Fetch profile for new log
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", newLog.user_id)
            .single();

          const logWithProfile = { ...newLog, profile };
          
          setActivities((prev) => [logWithProfile, ...prev.slice(0, 19)]);
          setNewActivityIds((prev) => new Set(prev).add(newLog.id));

          // Remove highlight after 5 seconds
          setTimeout(() => {
            setNewActivityIds((prev) => {
              const next = new Set(prev);
              next.delete(newLog.id);
              return next;
            });
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getActionInfo = (actionType: string) => {
    return actionConfig[actionType] || {
      label: actionType,
      color: "text-muted-foreground",
      icon: Activity,
    };
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            آخر الأنشطة المالية
          </CardTitle>
          <div className="flex items-center gap-2">
            <motion.div
              className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-500">مباشر</span>
            </motion.div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={fetchActivities}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          <AnimatePresence>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Wallet className="h-12 w-12 mb-4 opacity-50" />
                <p>لا توجد أنشطة حديثة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity, index) => {
                  const actionInfo = getActionInfo(activity.action_type);
                  const ActionIcon = actionInfo.icon;
                  const isNew = newActivityIds.has(activity.id);
                  const isPositive = activity.amount > 0;

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className={`relative p-3 rounded-lg border transition-all ${
                        isNew 
                          ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/10' 
                          : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                      }`}
                    >
                      {isNew && (
                        <motion.div
                          className="absolute top-2 left-2 w-2 h-2 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isPositive ? 'bg-emerald-500/10' : 'bg-orange-500/10'
                        }`}>
                          <ActionIcon className={`h-5 w-5 ${actionInfo.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {activity.profile?.full_name || "مستخدم"}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {actionInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-left">
                          <p className={`font-bold ${isPositive ? 'text-emerald-500' : 'text-orange-500'}`}>
                            {isPositive ? '+' : ''}{activity.amount.toLocaleString('ar-SA', { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            → {activity.balance_after.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
