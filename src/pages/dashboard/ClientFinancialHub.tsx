import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Landmark, History, Coins, CreditCard, Fingerprint, Wallet, TrendingDown,
  ShieldCheck, Mail, MessageSquare, PlusCircle, BellRing,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import ClientDepositsContent from "@/components/financial/ClientDepositsContent";
import ClientBalanceLogsContent from "@/components/financial/ClientBalanceLogsContent";
import ClientCashbackContent from "@/components/financial/ClientCashbackContent";
import DigitalWalletCard from "@/components/dashboard/DigitalWalletCard";

const validTabs = ["digital-id", "deposits", "balance-logs", "cashback"];

const fmt = (n: number) =>
  n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ClientFinancialHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    urlTab && validTabs.includes(urlTab) ? urlTab : "digital-id"
  );
  const [stats, setStats] = useState({ balance: 0, spent: 0, cashback: 0 });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleTabChange = (t: string) => {
    setActiveTab(t);
    setSearchParams({ tab: t });
  };

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && validTabs.includes(t) && t !== activeTab) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [b, c, p, s] = await Promise.all([
        supabase.from("user_balances").select("balance,total_spent").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_cashback").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("phone_verified").eq("id", user.id).maybeSingle(),
        supabase.from("user_settings").select("notification_email").eq("user_id", user.id).maybeSingle(),
      ]);
      const cb = (c.data as Record<string, unknown> | null) ?? {};
      setStats({
        balance: Number(b.data?.balance ?? 0),
        spent: Number(b.data?.total_spent ?? 0),
        cashback: Number((cb.available_balance ?? cb.balance ?? 0) as number),
      });
      setPhoneVerified(!!p.data?.phone_verified);
      if (s.data) setEmailAlerts(s.data.notification_email ?? true);
    })();
  }, [user?.id]);

  const toggleEmail = async (v: boolean) => {
    if (!user?.id) return;
    setEmailAlerts(v);
    const { error } = await supabase
      .from("user_settings")
      .update({ notification_email: v, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (error) {
      setEmailAlerts(!v);
      toast.error("تعذر حفظ الإعداد");
    } else toast.success(v ? "تم تفعيل تنبيهات البريد" : "تم إيقاف تنبيهات البريد");
  };

  const tabs = [
    { id: "digital-id", label: "الهوية الرقمية", icon: Fingerprint },
    { id: "deposits", label: "الإيداعات", icon: CreditCard },
    { id: "balance-logs", label: "السجل", icon: History },
    { id: "cashback", label: "كاش باك", icon: Coins },
  ];

  const kpis = [
    { label: "الرصيد المتاح", value: stats.balance, icon: Wallet },
    { label: "إجمالي المصروف", value: stats.spent, icon: TrendingDown },
    { label: "رصيد الكاش باك", value: stats.cashback, icon: Coins },
  ];

  return (
    <ClientDashboardLayout>
      <div dir="rtl" className="space-y-5 md:space-y-6 text-right">
        {/* Banking header */}
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary via-primary/90 to-accent p-5 md:p-7 text-primary-foreground shadow-xl"
        >
          <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur">
                <Landmark className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">المركز المالي</h1>
                <p className="mt-1 flex items-center gap-1.5 text-xs md:text-sm opacity-80">
                  <ShieldCheck className="h-4 w-4" />
                  حساب محمي بتشفير بنكي وتنبيهات فورية
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleTabChange("deposits")}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 self-start md:self-auto"
            >
              <PlusCircle className="h-4 w-4" />
              شحن الرصيد
            </Button>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {kpis.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="rounded-xl bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/15 backdrop-blur"
              >
                <div className="flex items-center justify-between text-xs opacity-80">
                  <span>{k.label}</span>
                  <k.icon className="h-4 w-4" />
                </div>
                <p className="mt-2 text-xl md:text-2xl font-bold tabular-nums">
                  {fmt(k.value)} <span className="text-xs font-medium opacity-70">ر.س</span>
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Alerts channels */}
        <section className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[auto_1fr_1fr] md:items-center md:gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">التنبيهات المالية</p>
              <p className="text-xs text-muted-foreground">إشعار عند كل إيداع وخصم واسترداد</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-primary" /> البريد الإلكتروني
            </span>
            <Switch checked={emailAlerts} onCheckedChange={toggleEmail} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-primary" /> رسائل SMS
            </span>
            {phoneVerified ? (
              <span className="text-xs font-semibold text-primary">مفعّلة للجوال الموثّق</span>
            ) : (
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/settings")}>
                وثّق جوالك
              </Button>
            )}
          </div>
        </section>

        {/* Tabs (RTL) */}
        <Tabs dir="rtl" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1.5 rounded-2xl border border-border bg-secondary p-1.5">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-transparent py-3 text-xs md:text-sm font-semibold text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-card data-[state=inactive]:hover:text-foreground"
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-5">
            <TabsContent value="digital-id" className="m-0"><DigitalWalletCard /></TabsContent>
            <TabsContent value="deposits" className="m-0"><ClientDepositsContent /></TabsContent>
            <TabsContent value="balance-logs" className="m-0"><ClientBalanceLogsContent /></TabsContent>
            <TabsContent value="cashback" className="m-0"><ClientCashbackContent /></TabsContent>
          </div>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientFinancialHub;
