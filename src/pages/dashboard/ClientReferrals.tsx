import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Gift,
  DollarSign,
  Copy,
  Check,
  Share2,
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Link as LinkIcon,
  Coins,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useReferral } from "@/hooks/useReferral";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const ClientReferrals = () => {
  const { referralCode, referrals, commissions, stats, loading, getReferralLink } = useReferral();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      toast.success("تم نسخ كود الإحالة");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success("تم نسخ رابط الإحالة");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const shareReferral = async () => {
    const link = getReferralLink();
    if (navigator.share && link) {
      try {
        await navigator.share({
          title: 'انضم إلى ماركت برو',
          text: `انضم إلى ماركت برو واحصل على خدمات التواصل الاجتماعي بأفضل الأسعار! استخدم كود الإحالة: ${referralCode?.code}`,
          url: link,
        });
      } catch (error) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد الانتظار', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock };
      case 'converted':
        return { label: 'مفعّل', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle };
      case 'expired':
        return { label: 'منتهي', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle };
      default:
        return { label: status, color: 'bg-muted text-muted-foreground', icon: Clock };
    }
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-2xl lg:text-3xl font-bold mb-2"
            >
              نظام الإحالة
            </motion.h1>
            <p className="text-muted-foreground">ادعُ أصدقاءك واكسب عمولة على كل طلب يقومون به</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الإحالات", value: stats.totalReferrals, icon: Users, gradient: "from-primary to-cyan-400" },
            { label: "إحالات مفعّلة", value: stats.convertedReferrals, icon: UserPlus, gradient: "from-success to-emerald-400" },
            { label: "أرباح معلقة", value: `$${stats.pendingEarnings.toFixed(2)}`, icon: Clock, gradient: "from-warning to-orange-400" },
            { label: "إجمالي الأرباح", value: `$${stats.totalEarnings.toFixed(2)}`, icon: DollarSign, gradient: "from-accent to-pink-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg shrink-0`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Referral Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    كود الإحالة الخاص بك
                    <Sparkles className="w-5 h-5 text-warning animate-pulse" />
                  </CardTitle>
                  <CardDescription>شارك هذا الكود مع أصدقائك واكسب 5% عمولة</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Referral Code Display */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={referralCode?.code || ''}
                    readOnly
                    className="text-center text-2xl font-bold font-mono tracking-[0.3em] bg-background/50 h-14"
                    dir="ltr"
                  />
                </div>
                <Button onClick={copyCode} className="gap-2 h-14 px-6" variant="outline">
                  {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                  {copied ? "تم النسخ" : "نسخ الكود"}
                </Button>
              </div>

              {/* Referral Link */}
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-2">رابط الإحالة</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={getReferralLink()}
                      readOnly
                      className="pr-10 text-sm font-mono bg-secondary/50"
                      dir="ltr"
                    />
                    <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={copyLink} variant="secondary" className="gap-2">
                      {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      نسخ
                    </Button>
                    <Button onClick={shareReferral} className="gap-2 bg-gradient-primary">
                      <Share2 className="w-4 h-4" />
                      مشاركة
                    </Button>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {[
                  { step: 1, title: "شارك الكود", desc: "أرسل كود الإحالة لأصدقائك" },
                  { step: 2, title: "يسجلون حساب", desc: "صديقك يستخدم الكود عند التسجيل" },
                  { step: 3, title: "اكسب عمولة", desc: "احصل على 5% من كل طلب" },
                ].map((item) => (
                  <div key={item.step} className="text-center p-4 rounded-xl bg-background/30">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">{item.step}</span>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs for Referrals and Commissions */}
        <Tabs defaultValue="referrals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="referrals" className="gap-2">
              <Users className="w-4 h-4" />
              الإحالات
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <Coins className="w-4 h-4" />
              العمولات
            </TabsTrigger>
          </TabsList>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  قائمة الإحالات
                  <Badge variant="secondary">{referrals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد إحالات حتى الآن</p>
                    <p className="text-sm mt-2">شارك كود الإحالة الخاص بك لبدء الكسب</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((referral, index) => {
                      const statusConfig = getStatusConfig(referral.status);
                      return (
                        <motion.div
                          key={referral.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <UserPlus className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">إحالة #{referral.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(referral.created_at), "d MMM yyyy", { locale: ar })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-left">
                              <p className="font-bold text-success">${referral.total_commission.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">عمولة مكتسبة</p>
                            </div>
                            <Badge className={`${statusConfig.color} border`}>
                              <statusConfig.icon className="w-3 h-3 ml-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  سجل العمولات
                  <Badge variant="secondary">{commissions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد عمولات حتى الآن</p>
                    <p className="text-sm mt-2">ستظهر العمولات هنا عندما يقوم المُحالون بإتمام طلباتهم</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">التاريخ</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">قيمة الطلب</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">نسبة العمولة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">العمولة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((commission, index) => {
                          const statusConfig = getStatusConfig(commission.status);
                          return (
                            <motion.tr
                              key={commission.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-border/50 hover:bg-secondary/30"
                            >
                              <td className="py-3 px-4 text-sm">
                                {format(new Date(commission.created_at), "d MMM yyyy", { locale: ar })}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium">
                                ${commission.order_amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {commission.commission_rate}%
                              </td>
                              <td className="py-3 px-4 text-sm font-bold text-success">
                                +${commission.commission_amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={`${statusConfig.color} border`}>
                                  {statusConfig.label}
                                </Badge>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientReferrals;
