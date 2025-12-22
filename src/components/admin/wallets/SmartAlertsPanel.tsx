import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bell,
  BellRing,
  Settings2,
  Wallet,
  DollarSign,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Volume2,
  VolumeX,
  Zap,
  Shield,
  ArrowUpCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface Alert {
  id: string;
  type: "low_balance" | "large_deposit" | "suspicious" | "inactive";
  severity: "warning" | "critical" | "info";
  title: string;
  message: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount?: number;
  threshold?: number;
  createdAt: Date;
  isRead: boolean;
}

interface AlertSettings {
  lowBalanceEnabled: boolean;
  lowBalanceThreshold: number;
  largeDepositEnabled: boolean;
  largeDepositThreshold: number;
  suspiciousActivityEnabled: boolean;
  inactiveAccountEnabled: boolean;
  inactiveAccountDays: number;
  soundEnabled: boolean;
}

const defaultSettings: AlertSettings = {
  lowBalanceEnabled: true,
  lowBalanceThreshold: 50,
  largeDepositEnabled: true,
  largeDepositThreshold: 1000,
  suspiciousActivityEnabled: true,
  inactiveAccountEnabled: true,
  inactiveAccountDays: 30,
  soundEnabled: true,
};

export const SmartAlertsPanel = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("walletAlertSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: AlertSettings) => {
    setSettings(newSettings);
    localStorage.setItem("walletAlertSettings", JSON.stringify(newSettings));
    toast.success("تم حفظ إعدادات التنبيهات");
  };

  // Fetch and generate alerts
  const fetchAlerts = async () => {
    setLoading(true);
    const generatedAlerts: Alert[] = [];

    try {
      // 1. Low Balance Alerts
      if (settings.lowBalanceEnabled) {
        const { data: lowBalances } = await supabase
          .from("user_balances")
          .select("*")
          .lt("balance", settings.lowBalanceThreshold)
          .gt("balance", 0);

        if (lowBalances) {
          const userIds = lowBalances.map((b) => b.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

          const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

          lowBalances.forEach((balance) => {
            const profile = profileMap.get(balance.user_id);
            generatedAlerts.push({
              id: `low_balance_${balance.user_id}`,
              type: "low_balance",
              severity: balance.balance < settings.lowBalanceThreshold / 2 ? "critical" : "warning",
              title: "رصيد منخفض",
              message: `رصيد المستخدم أقل من ${settings.lowBalanceThreshold}$`,
              userId: balance.user_id,
              userName: profile?.full_name || "مستخدم",
              userEmail: profile?.email || "",
              amount: balance.balance,
              threshold: settings.lowBalanceThreshold,
              createdAt: new Date(balance.updated_at),
              isRead: false,
            });
          });
        }
      }

      // 2. Large Deposit Alerts
      if (settings.largeDepositEnabled) {
        const { data: largeDeposits } = await supabase
          .from("deposits")
          .select("*")
          .gte("amount", settings.largeDepositThreshold)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(20);

        if (largeDeposits) {
          const userIds = largeDeposits.map((d) => d.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

          const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

          largeDeposits.forEach((deposit) => {
            const profile = profileMap.get(deposit.user_id);
            generatedAlerts.push({
              id: `large_deposit_${deposit.id}`,
              type: "large_deposit",
              severity: deposit.amount >= settings.largeDepositThreshold * 2 ? "critical" : "info",
              title: "إيداع كبير",
              message: `طلب إيداع بمبلغ ${deposit.amount.toLocaleString("ar-SA")}$ يتطلب المراجعة`,
              userId: deposit.user_id,
              userName: profile?.full_name || "مستخدم",
              userEmail: profile?.email || "",
              amount: deposit.amount,
              threshold: settings.largeDepositThreshold,
              createdAt: new Date(deposit.created_at),
              isRead: false,
            });
          });
        }
      }

      // 3. Completed large deposits today (info)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: completedLargeDeposits } = await supabase
        .from("deposits")
        .select("*")
        .gte("amount", settings.largeDepositThreshold)
        .eq("status", "completed")
        .gte("completed_at", today.toISOString())
        .order("completed_at", { ascending: false })
        .limit(5);

      if (completedLargeDeposits) {
        const userIds = completedLargeDeposits.map((d) => d.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        completedLargeDeposits.forEach((deposit) => {
          const profile = profileMap.get(deposit.user_id);
          generatedAlerts.push({
            id: `completed_large_${deposit.id}`,
            type: "large_deposit",
            severity: "info",
            title: "إيداع كبير مكتمل",
            message: `تم إكمال إيداع بمبلغ ${deposit.amount.toLocaleString("ar-SA")}$`,
            userId: deposit.user_id,
            userName: profile?.full_name || "مستخدم",
            userEmail: profile?.email || "",
            amount: deposit.amount,
            createdAt: new Date(deposit.completed_at || deposit.created_at),
            isRead: true,
          });
        });
      }

      // Sort by date (newest first) and severity
      generatedAlerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      setAlerts(generatedAlerts);
      setUnreadCount(generatedAlerts.filter((a) => !a.isRead).length);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();

    // Realtime subscription for new deposits and balance changes
    const channel = supabase
      .channel("smart-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposits" },
        (payload) => {
          if (payload.new && settings.largeDepositEnabled) {
            const deposit = payload.new as any;
            if (deposit.amount >= settings.largeDepositThreshold && deposit.status === "pending") {
              if (settings.soundEnabled) {
                playAlertSound();
              }
              toast.warning(`إيداع كبير جديد: $${deposit.amount.toLocaleString("ar-SA")}`, {
                duration: 10000,
              });
              fetchAlerts();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_balances" },
        (payload) => {
          if (payload.new && settings.lowBalanceEnabled) {
            const balance = payload.new as any;
            if (balance.balance < settings.lowBalanceThreshold && balance.balance > 0) {
              fetchAlerts();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings]);

  const playAlertSound = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const markAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setUnreadCount(0);
  };

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case "low_balance":
        return <TrendingDown className="h-5 w-5" />;
      case "large_deposit":
        return <ArrowUpCircle className="h-5 w-5" />;
      case "suspicious":
        return <Shield className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-500/10 border-red-500/30",
          icon: "bg-red-500/20 text-red-500",
          badge: "bg-red-500 text-white",
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 border-amber-500/30",
          icon: "bg-amber-500/20 text-amber-500",
          badge: "bg-amber-500 text-white",
        };
      default:
        return {
          bg: "bg-blue-500/10 border-blue-500/30",
          icon: "bg-blue-500/20 text-blue-500",
          badge: "bg-blue-500 text-white",
        };
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.isRead).length;
  const warningCount = alerts.filter((a) => a.severity === "warning" && !a.isRead).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <motion.div
              className="relative"
              animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
            >
              <BellRing className="h-5 w-5 text-primary" />
              {unreadCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.div>
            التنبيهات الذكية
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalCount} حرج
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} تحذير
              </Badge>
            )}
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[400px]" dir="rtl">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    إعدادات التنبيهات
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Sound Settings */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      {settings.soundEnabled ? (
                        <Volume2 className="h-5 w-5 text-primary" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">الإشعارات الصوتية</p>
                        <p className="text-xs text-muted-foreground">تشغيل صوت عند التنبيهات الجديدة</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) =>
                        saveSettings({ ...settings, soundEnabled: checked })
                      }
                    />
                  </div>

                  <Separator />

                  {/* Low Balance Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">تنبيه الرصيد المنخفض</p>
                          <p className="text-xs text-muted-foreground">
                            تنبيه عند انخفاض رصيد المستخدم
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.lowBalanceEnabled}
                        onCheckedChange={(checked) =>
                          saveSettings({ ...settings, lowBalanceEnabled: checked })
                        }
                      />
                    </div>
                    {settings.lowBalanceEnabled && (
                      <div className="mr-10">
                        <Label className="text-xs text-muted-foreground">الحد الأدنى ($)</Label>
                        <Input
                          type="number"
                          value={settings.lowBalanceThreshold}
                          onChange={(e) =>
                            saveSettings({
                              ...settings,
                              lowBalanceThreshold: Number(e.target.value),
                            })
                          }
                          className="mt-1 h-9"
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Large Deposit Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">تنبيه الإيداع الكبير</p>
                          <p className="text-xs text-muted-foreground">
                            تنبيه عند الإيداعات الكبيرة
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.largeDepositEnabled}
                        onCheckedChange={(checked) =>
                          saveSettings({ ...settings, largeDepositEnabled: checked })
                        }
                      />
                    </div>
                    {settings.largeDepositEnabled && (
                      <div className="mr-10">
                        <Label className="text-xs text-muted-foreground">
                          الحد الأدنى للإيداع ($)
                        </Label>
                        <Input
                          type="number"
                          value={settings.largeDepositThreshold}
                          onChange={(e) =>
                            saveSettings({
                              ...settings,
                              largeDepositThreshold: Number(e.target.value),
                            })
                          }
                          className="mt-1 h-9"
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Suspicious Activity Settings */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">تنبيه النشاط المشبوه</p>
                        <p className="text-xs text-muted-foreground">
                          تنبيه عند اكتشاف نشاط غير عادي
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.suspiciousActivityEnabled}
                      onCheckedChange={(checked) =>
                        saveSettings({ ...settings, suspiciousActivityEnabled: checked })
                      }
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={fetchAlerts}
              disabled={loading}
            >
              <Zap className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px] px-4 pb-4">
          <AnimatePresence>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-500 opacity-50" />
                <p className="font-medium">لا توجد تنبيهات</p>
                <p className="text-xs">كل شيء على ما يرام!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unreadCount > 0 && (
                  <div className="flex justify-end mb-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={markAllAsRead}
                    >
                      <Eye className="h-3 w-3 ml-1" />
                      تعليم الكل كمقروء
                    </Button>
                  </div>
                )}
                {alerts.map((alert, index) => {
                  const styles = getSeverityStyles(alert.severity);
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative p-3 rounded-lg border transition-all cursor-pointer ${
                        styles.bg
                      } ${alert.isRead ? "opacity-60" : ""}`}
                      onClick={() => markAsRead(alert.id)}
                    >
                      {!alert.isRead && (
                        <motion.div
                          className="absolute top-2 left-2 w-2 h-2 rounded-full bg-primary"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.icon}`}
                        >
                          {getAlertIcon(alert.type, alert.severity)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{alert.title}</span>
                            <Badge className={`text-[10px] h-4 ${styles.badge}`}>
                              {alert.severity === "critical"
                                ? "حرج"
                                : alert.severity === "warning"
                                ? "تحذير"
                                : "معلومات"}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{alert.userName}</span>
                            </div>
                            {alert.amount !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                ${alert.amount.toLocaleString("ar-SA")}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(alert.createdAt, {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </div>
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

export default SmartAlertsPanel;
