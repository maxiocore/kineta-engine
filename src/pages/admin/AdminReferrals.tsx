import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Gift,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  Coins,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart,
  Crown,
  Star,
  Medal,
  Award,
  Gem,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ReferralWithDetails {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  commission_rate: number;
  total_commission: number;
  status: string;
  created_at: string;
  converted_at: string | null;
  referrer_email?: string;
  referred_email?: string;
}

interface Commission {
  id: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  referral_code?: string;
}

interface VipLevel {
  id: string;
  name: string;
  name_ar: string;
  min_referrals: number;
  min_earnings: number;
  commission_rate: number;
  color: string;
  icon: string;
  benefits: string[];
  is_active: boolean;
  display_order: number;
}

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  custom_commission_rate: number | null;
  vip_level_id: string | null;
  total_referrals: number;
  total_earnings: number;
  is_active: boolean;
  user_email?: string;
  vip_level?: VipLevel;
}

interface Stats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  conversionRate: number;
  averageCommission: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))'];

const ICON_OPTIONS = [
  { value: 'Star', label: 'نجمة', icon: Star },
  { value: 'Medal', label: 'ميدالية', icon: Medal },
  { value: 'Award', label: 'جائزة', icon: Award },
  { value: 'Crown', label: 'تاج', icon: Crown },
  { value: 'Gem', label: 'جوهرة', icon: Gem },
];

const getIconComponent = (iconName: string) => {
  const found = ICON_OPTIONS.find(i => i.value === iconName);
  return found?.icon || Star;
};

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [vipLevels, setVipLevels] = useState<VipLevel[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    conversionRate: 0,
    averageCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [chartData, setChartData] = useState<any[]>([]);

  // VIP Level Dialog
  const [vipDialogOpen, setVipDialogOpen] = useState(false);
  const [editingVipLevel, setEditingVipLevel] = useState<VipLevel | null>(null);
  const [vipForm, setVipForm] = useState({
    name: '',
    name_ar: '',
    min_referrals: 0,
    min_earnings: 0,
    commission_rate: 5,
    color: '#6366f1',
    icon: 'Star',
    is_active: true,
    display_order: 0,
    benefits: [''],
  });

  // Custom Commission Dialog
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [editingReferralCode, setEditingReferralCode] = useState<ReferralCode | null>(null);
  const [customCommission, setCustomCommission] = useState<number | null>(null);
  const [selectedVipLevel, setSelectedVipLevel] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    // Realtime subscriptions
    const channel = supabase
      .channel('admin-referrals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referral_codes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referral_commissions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_levels' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch referrals with profile info
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Fetch profiles for emails
      const referrerIds = [...new Set(referralsData?.map(r => r.referrer_id) || [])];
      const referredIds = [...new Set(referralsData?.map(r => r.referred_id) || [])];
      const allUserIds = [...new Set([...referrerIds, ...referredIds])];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', allUserIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.email]) || []);

      const enrichedReferrals = referralsData?.map(r => ({
        ...r,
        referrer_email: profilesMap.get(r.referrer_id) || 'غير معروف',
        referred_email: profilesMap.get(r.referred_id) || 'غير معروف',
      })) || [];

      setReferrals(enrichedReferrals);

      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('referral_commissions')
        .select(`
          id,
          order_amount,
          commission_rate,
          commission_amount,
          status,
          created_at,
          paid_at,
          referral:referrals(referral_code)
        `)
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      const enrichedCommissions = commissionsData?.map(c => ({
        ...c,
        referral_code: (c.referral as any)?.referral_code || '',
      })) || [];

      setCommissions(enrichedCommissions);

      // Fetch VIP levels
      const { data: vipData, error: vipError } = await supabase
        .from('vip_levels')
        .select('*')
        .order('display_order', { ascending: true });

      if (vipError) throw vipError;
      
      const formattedVipLevels = vipData?.map(v => ({
        ...v,
        benefits: Array.isArray(v.benefits) ? v.benefits : JSON.parse(v.benefits as string || '[]'),
      })) || [];
      
      setVipLevels(formattedVipLevels);

      // Fetch referral codes with VIP info
      const { data: codesData, error: codesError } = await supabase
        .from('referral_codes')
        .select('*')
        .order('total_earnings', { ascending: false });

      if (codesError) throw codesError;

      // Get user emails for codes
      const codeUserIds = [...new Set(codesData?.map(c => c.user_id) || [])];
      const { data: codeProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', codeUserIds);

      const codeProfilesMap = new Map(codeProfiles?.map(p => [p.id, p.email]) || []);
      const vipLevelsMap = new Map(formattedVipLevels.map(v => [v.id, v]));

      const enrichedCodes = codesData?.map(c => ({
        ...c,
        user_email: codeProfilesMap.get(c.user_id) || 'غير معروف',
        vip_level: c.vip_level_id ? vipLevelsMap.get(c.vip_level_id) : undefined,
      })) || [];

      setReferralCodes(enrichedCodes);

      // Calculate stats
      const totalReferrals = enrichedReferrals.length;
      const activeReferrals = enrichedReferrals.filter(r => r.status === 'converted').length;
      const pendingReferrals = enrichedReferrals.filter(r => r.status === 'pending').length;
      const totalCommissions = enrichedCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const paidCommissions = enrichedCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const pendingCommissions = enrichedCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;
      const averageCommission = enrichedCommissions.length > 0 ? totalCommissions / enrichedCommissions.length : 0;

      setStats({
        totalReferrals,
        activeReferrals,
        pendingReferrals,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        conversionRate,
        averageCommission,
      });

      // Generate chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayReferrals = enrichedReferrals.filter(r => 
          format(new Date(r.created_at), 'yyyy-MM-dd') === dateStr
        ).length;
        const dayCommissions = enrichedCommissions
          .filter(c => format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr)
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);

        return {
          date: format(date, 'EEE', { locale: ar }),
          referrals: dayReferrals,
          commissions: dayCommissions,
        };
      });

      setChartData(last7Days);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const updateCommissionStatus = async (commissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('referral_commissions')
        .update({ 
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', commissionId);

      if (error) throw error;

      toast.success('تم تحديث حالة العمولة');
      fetchData();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('خطأ في تحديث العمولة');
    }
  };

  // VIP Level Functions
  const openVipDialog = (level?: VipLevel) => {
    if (level) {
      setEditingVipLevel(level);
      setVipForm({
        name: level.name,
        name_ar: level.name_ar,
        min_referrals: level.min_referrals,
        min_earnings: level.min_earnings,
        commission_rate: level.commission_rate,
        color: level.color,
        icon: level.icon,
        is_active: level.is_active,
        display_order: level.display_order,
        benefits: level.benefits.length > 0 ? level.benefits : [''],
      });
    } else {
      setEditingVipLevel(null);
      setVipForm({
        name: '',
        name_ar: '',
        min_referrals: 0,
        min_earnings: 0,
        commission_rate: 5,
        color: '#6366f1',
        icon: 'Star',
        is_active: true,
        display_order: vipLevels.length + 1,
        benefits: [''],
      });
    }
    setVipDialogOpen(true);
  };

  const saveVipLevel = async () => {
    try {
      const filteredBenefits = vipForm.benefits.filter(b => b.trim() !== '');
      const data = {
        ...vipForm,
        benefits: filteredBenefits,
      };

      if (editingVipLevel) {
        const { error } = await supabase
          .from('vip_levels')
          .update(data)
          .eq('id', editingVipLevel.id);
        if (error) throw error;
        toast.success('تم تحديث مستوى VIP');
      } else {
        const { error } = await supabase
          .from('vip_levels')
          .insert(data);
        if (error) throw error;
        toast.success('تم إنشاء مستوى VIP جديد');
      }

      setVipDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving VIP level:', error);
      toast.error('خطأ في حفظ مستوى VIP');
    }
  };

  const deleteVipLevel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vip_levels')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('تم حذف مستوى VIP');
      fetchData();
    } catch (error) {
      console.error('Error deleting VIP level:', error);
      toast.error('خطأ في حذف مستوى VIP');
    }
  };

  // Custom Commission Functions
  const openCommissionDialog = (code: ReferralCode) => {
    setEditingReferralCode(code);
    setCustomCommission(code.custom_commission_rate);
    setSelectedVipLevel(code.vip_level_id);
    setCommissionDialogOpen(true);
  };

  const saveCustomCommission = async () => {
    if (!editingReferralCode) return;

    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({
          custom_commission_rate: customCommission,
          vip_level_id: selectedVipLevel,
        })
        .eq('id', editingReferralCode.id);

      if (error) throw error;
      toast.success('تم تحديث إعدادات العمولة');
      setCommissionDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving custom commission:', error);
      toast.error('خطأ في حفظ إعدادات العمولة');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد الانتظار', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock };
      case 'converted':
        return { label: 'مفعّل', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle };
      case 'paid':
        return { label: 'مدفوع', color: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle };
      case 'expired':
        return { label: 'منتهي', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle };
      default:
        return { label: status, color: 'bg-muted text-muted-foreground', icon: Clock };
    }
  };

  const getEffectiveRate = (code: ReferralCode) => {
    if (code.custom_commission_rate !== null) {
      return { rate: code.custom_commission_rate, source: 'مخصص' };
    }
    if (code.vip_level) {
      return { rate: code.vip_level.commission_rate, source: code.vip_level.name_ar };
    }
    return { rate: 5, source: 'افتراضي' };
  };

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      referral.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referrer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referred_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.referral_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCodes = referralCodes.filter(code => {
    const matchesSearch = 
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const pieData = [
    { name: 'إحالات مفعّلة', value: stats.activeReferrals },
    { name: 'إحالات معلقة', value: stats.pendingReferrals },
  ];

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-2xl lg:text-3xl font-bold mb-2"
            >
              إدارة الإحالات
            </motion.h1>
            <p className="text-muted-foreground">متابعة وإدارة نظام الإحالات والعمولات</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            <Button className="gap-2 bg-gradient-to-l from-destructive to-orange-500">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الإحالات", value: stats.totalReferrals, icon: Users, gradient: "from-primary to-cyan-400", change: `${stats.conversionRate.toFixed(0)}% معدل التحويل` },
            { label: "إحالات مفعّلة", value: stats.activeReferrals, icon: UserPlus, gradient: "from-success to-emerald-400", change: `+${stats.activeReferrals} هذا الشهر` },
            { label: "عمولات معلقة", value: `${stats.pendingCommissions.toFixed(2)} ر.س`, icon: Clock, gradient: "from-warning to-orange-400", change: `${commissions.filter(c => c.status === 'pending').length} عمولة` },
            { label: "إجمالي العمولات", value: `${stats.totalCommissions.toFixed(2)} ر.س`, icon: DollarSign, gradient: "from-accent to-pink-400", change: `${stats.averageCommission.toFixed(2)} ر.س متوسط` },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/30 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg shrink-0`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                إحصائيات آخر 7 أيام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="referrals" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="الإحالات"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="commissions" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="العمولات ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                توزيع الإحالات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالكود أو البريد الإلكتروني..."
                  className="pr-10 bg-secondary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="converted">مفعّل</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="referrals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="referrals" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">الإحالات</span>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">العمولات</span>
            </TabsTrigger>
            <TabsTrigger value="vip-levels" className="gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">مستويات VIP</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Percent className="w-4 h-4" />
              <span className="hidden sm:inline">تخصيص العمولات</span>
            </TabsTrigger>
          </TabsList>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  قائمة الإحالات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد إحالات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الكود</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">المُحيل</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">المُحال</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">العمولة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">إجمالي العمولات</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">التاريخ</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReferrals.map((referral, index) => {
                          const statusConfig = getStatusConfig(referral.status);
                          return (
                            <motion.tr
                              key={referral.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-b border-border/50 hover:bg-secondary/30"
                            >
                              <td className="py-3 px-4">
                                <code className="px-2 py-1 bg-secondary rounded text-sm font-mono">
                                  {referral.referral_code}
                                </code>
                              </td>
                              <td className="py-3 px-4 text-sm">{referral.referrer_email}</td>
                              <td className="py-3 px-4 text-sm">{referral.referred_email}</td>
                              <td className="py-3 px-4 text-sm">{referral.commission_rate}%</td>
                              <td className="py-3 px-4 text-sm font-bold text-success">
                                {referral.total_commission.toFixed(2)} ر.س
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {format(new Date(referral.created_at), "d MMM yyyy", { locale: ar })}
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={`${statusConfig.color} border`}>
                                  <statusConfig.icon className="w-3 h-3 ml-1" />
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

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  سجل العمولات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCommissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد عمولات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الكود</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">قيمة الطلب</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">النسبة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">العمولة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">التاريخ</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الحالة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCommissions.map((commission, index) => {
                          const statusConfig = getStatusConfig(commission.status);
                          return (
                            <motion.tr
                              key={commission.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-b border-border/50 hover:bg-secondary/30"
                            >
                              <td className="py-3 px-4">
                                <code className="px-2 py-1 bg-secondary rounded text-sm font-mono">
                                  {commission.referral_code || '-'}
                                </code>
                              </td>
                              <td className="py-3 px-4 text-sm font-medium">
                                {commission.order_amount.toFixed(2)} ر.س
                              </td>
                              <td className="py-3 px-4 text-sm">{commission.commission_rate}%</td>
                              <td className="py-3 px-4 text-sm font-bold text-success">
                                +{commission.commission_amount.toFixed(2)} ر.س
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {format(new Date(commission.created_at), "d MMM yyyy", { locale: ar })}
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={`${statusConfig.color} border`}>
                                  {statusConfig.label}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                {commission.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateCommissionStatus(commission.id, 'paid')}
                                    className="gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    دفع
                                  </Button>
                                )}
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

          {/* VIP Levels Tab */}
          <TabsContent value="vip-levels">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  مستويات VIP
                </CardTitle>
                <Button onClick={() => openVipDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة مستوى
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {vipLevels.map((level, index) => {
                    const IconComponent = getIconComponent(level.icon);
                    return (
                      <motion.div
                        key={level.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-2 relative overflow-hidden" style={{ borderColor: level.color }}>
                          <div 
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{ backgroundColor: level.color }}
                          />
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${level.color}20`, color: level.color }}
                              >
                                <IconComponent className="w-6 h-6" />
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8"
                                  onClick={() => openVipDialog(level)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => deleteVipLevel(level.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <h3 className="font-bold text-lg">{level.name_ar}</h3>
                            <p className="text-sm text-muted-foreground">{level.name}</p>
                            
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">العمولة:</span>
                                <span className="font-bold" style={{ color: level.color }}>{level.commission_rate}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">الحد الأدنى للإحالات:</span>
                                <span>{level.min_referrals}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">الحد الأدنى للأرباح:</span>
                                <span>${level.min_earnings}</span>
                              </div>
                            </div>

                            {level.benefits.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-2">المميزات:</p>
                                <ul className="space-y-1">
                                  {level.benefits.slice(0, 3).map((benefit, i) => (
                                    <li key={i} className="text-xs flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-success" />
                                      {benefit}
                                    </li>
                                  ))}
                                  {level.benefits.length > 3 && (
                                    <li className="text-xs text-muted-foreground">+{level.benefits.length - 3} مميزات أخرى</li>
                                  )}
                                </ul>
                              </div>
                            )}

                            <Badge 
                              className={`mt-4 ${level.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
                            >
                              {level.is_active ? 'مفعّل' : 'معطّل'}
                            </Badge>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab - Custom Commissions */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" />
                  تخصيص نسب العمولات للمستخدمين
                </CardTitle>
                <CardDescription>
                  يمكنك تعيين نسبة عمولة مخصصة لكل مستخدم أو ترقيته لمستوى VIP معين
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCodes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أكواد إحالة</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">المستخدم</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الكود</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">مستوى VIP</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">نسبة العمولة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الإحالات</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الأرباح</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCodes.map((code, index) => {
                          const effectiveRate = getEffectiveRate(code);
                          return (
                            <motion.tr
                              key={code.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-b border-border/50 hover:bg-secondary/30"
                            >
                              <td className="py-3 px-4 text-sm">{code.user_email}</td>
                              <td className="py-3 px-4">
                                <code className="px-2 py-1 bg-secondary rounded text-sm font-mono">
                                  {code.code}
                                </code>
                              </td>
                              <td className="py-3 px-4">
                                {code.vip_level ? (
                                  <Badge 
                                    style={{ 
                                      backgroundColor: `${code.vip_level.color}20`, 
                                      color: code.vip_level.color,
                                      borderColor: code.vip_level.color 
                                    }}
                                    className="border"
                                  >
                                    {(() => {
                                      const Icon = getIconComponent(code.vip_level.icon);
                                      return <Icon className="w-3 h-3 ml-1" />;
                                    })()}
                                    {code.vip_level.name_ar}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-primary">{effectiveRate.rate}%</span>
                                  <Badge variant="outline" className="text-xs">
                                    {effectiveRate.source}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">{code.total_referrals}</td>
                              <td className="py-3 px-4 text-sm font-bold text-success">
                                ${code.total_earnings.toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openCommissionDialog(code)}
                                  className="gap-1"
                                >
                                  <Edit className="w-3 h-3" />
                                  تعديل
                                </Button>
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

      {/* VIP Level Dialog */}
      <Dialog open={vipDialogOpen} onOpenChange={setVipDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVipLevel ? 'تعديل مستوى VIP' : 'إضافة مستوى VIP جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (EN)</Label>
                <Input
                  value={vipForm.name}
                  onChange={(e) => setVipForm({ ...vipForm, name: e.target.value })}
                  placeholder="Gold"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (AR)</Label>
                <Input
                  value={vipForm.name_ar}
                  onChange={(e) => setVipForm({ ...vipForm, name_ar: e.target.value })}
                  placeholder="ذهبي"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نسبة العمولة (%)</Label>
                <Input
                  type="number"
                  value={vipForm.commission_rate}
                  onChange={(e) => setVipForm({ ...vipForm, commission_rate: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label>ترتيب العرض</Label>
                <Input
                  type="number"
                  value={vipForm.display_order}
                  onChange={(e) => setVipForm({ ...vipForm, display_order: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأدنى للإحالات</Label>
                <Input
                  type="number"
                  value={vipForm.min_referrals}
                  onChange={(e) => setVipForm({ ...vipForm, min_referrals: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأدنى للأرباح ($)</Label>
                <Input
                  type="number"
                  value={vipForm.min_earnings}
                  onChange={(e) => setVipForm({ ...vipForm, min_earnings: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اللون</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={vipForm.color}
                    onChange={(e) => setVipForm({ ...vipForm, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={vipForm.color}
                    onChange={(e) => setVipForm({ ...vipForm, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <Select value={vipForm.icon} onValueChange={(v) => setVipForm({ ...vipForm, icon: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>المميزات</Label>
              {vipForm.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(e) => {
                      const newBenefits = [...vipForm.benefits];
                      newBenefits[index] = e.target.value;
                      setVipForm({ ...vipForm, benefits: newBenefits });
                    }}
                    placeholder="ميزة..."
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const newBenefits = vipForm.benefits.filter((_, i) => i !== index);
                      setVipForm({ ...vipForm, benefits: newBenefits.length > 0 ? newBenefits : [''] });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVipForm({ ...vipForm, benefits: [...vipForm.benefits, ''] })}
                className="w-full"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة ميزة
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={vipForm.is_active}
                onCheckedChange={(v) => setVipForm({ ...vipForm, is_active: v })}
              />
              <Label>مفعّل</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVipDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveVipLevel} className="gap-2">
              <Save className="w-4 h-4" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Commission Dialog */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تخصيص العمولة</DialogTitle>
          </DialogHeader>
          
          {editingReferralCode && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">المستخدم</p>
                <p className="font-medium">{editingReferralCode.user_email}</p>
                <p className="text-sm text-muted-foreground mt-2">كود الإحالة</p>
                <code className="px-2 py-1 bg-background rounded text-sm font-mono">
                  {editingReferralCode.code}
                </code>
              </div>

              <div className="space-y-2">
                <Label>مستوى VIP</Label>
                <Select 
                  value={selectedVipLevel || 'none'} 
                  onValueChange={(v) => setSelectedVipLevel(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستوى VIP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مستوى VIP</SelectItem>
                    {vipLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = getIconComponent(level.icon);
                            return <Icon className="w-4 h-4" style={{ color: level.color }} />;
                          })()}
                          {level.name_ar} ({level.commission_rate}%)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نسبة عمولة مخصصة (%)</Label>
                <Input
                  type="number"
                  value={customCommission ?? ''}
                  onChange={(e) => setCustomCommission(e.target.value ? Number(e.target.value) : null)}
                  placeholder="اتركه فارغاً لاستخدام نسبة VIP"
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">
                  النسبة المخصصة تتجاوز نسبة مستوى VIP
                </p>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">النسبة الفعالة:</p>
                <p className="text-2xl font-bold text-primary">
                  {customCommission ?? (selectedVipLevel ? vipLevels.find(v => v.id === selectedVipLevel)?.commission_rate : 5) ?? 5}%
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveCustomCommission} className="gap-2">
              <Save className="w-4 h-4" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
};

export default AdminReferrals;
