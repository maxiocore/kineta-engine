import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Landmark, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  AlertCircle,
  CreditCard,
  Calendar,
  Plus,
  ArrowLeft,
  Shield,
  Sparkles,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Calculator,
  BookOpen,
  UserCheck,
  Eye,
  Receipt,
  ScrollText,
  Percent,
  Check,
  Upload,
  FileUp,
  Wallet,
  Star,
  Zap,
  Gift,
  Lock,
  Award,
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Coins,
  Target,
  Timer
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import EnhancedFinancingCard from "@/components/financing/EnhancedFinancingCard";
import FinancingContract from "@/components/financing/FinancingContract";
import InstallmentsTable from "@/components/financing/InstallmentsTable";
import FinancingStatusCard from "@/components/financing/FinancingStatusCard";

interface FinancingPlan {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  installments_count: number;
  duration_months: number;
  min_amount: number;
  max_amount: number | null;
  is_active: boolean;
  display_order: number;
}

interface FinancingApplication {
  id: string;
  application_number: string;
  plan_id: string;
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  address?: string | null;
  requested_amount: number;
  approved_amount: number | null;
  status: string;
  submitted_at: string;
  approved_at?: string | null;
  rejection_reason: string | null;
  contract_number: string | null;
  promissory_note_url: string | null;
  financing_plans?: {
    name_ar: string;
    installments_count: number;
  };
}

interface FinancingInstallment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

// Animated Counter Component
function AnimatedValue({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(springValue, (latest) => 
    prefix + Math.floor(latest).toLocaleString("ar-SA") + suffix
  );

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  return <motion.span>{display}</motion.span>;
}

// Floating Orbs Background
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle, hsl(${160 + i * 20}, 80%, 50%) 0%, transparent 70%)`,
            width: `${100 + i * 50}px`,
            height: `${100 + i * 50}px`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          initial={{
            left: `${10 + i * 20}%`,
            top: `${10 + i * 15}%`,
          }}
        />
      ))}
    </div>
  );
}

// Interactive Stat Card
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix = "ر.س",
  gradient,
  delay = 0
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number; 
  suffix?: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative group"
    >
      <div className={`absolute inset-0 ${gradient} rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
      <Card className="relative overflow-hidden border-0 bg-card/80 backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl sm:text-3xl font-bold">
                <AnimatedValue value={value} suffix={` ${suffix}`} />
              </p>
            </div>
            <motion.div 
              className={`p-3 rounded-xl ${gradient}`}
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  color,
  delay = 0
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="group"
    >
      <Card className="h-full border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-5">
          <motion.div 
            className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-lg`}
            whileHover={{ rotate: 5, scale: 1.1 }}
          >
            <Icon className="h-7 w-7 text-white" />
          </motion.div>
          <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Plan Card with Premium Design
function PlanCard({ 
  plan, 
  index, 
  isPopular = false 
}: { 
  plan: FinancingPlan; 
  index: number;
  isPopular?: boolean;
}) {
  const gradients = [
    "from-blue-500 to-cyan-500",
    "from-violet-500 to-purple-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-500",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring" }}
      whileHover={{ scale: 1.02, y: -8 }}
      className="relative group"
    >
      {isPopular && (
        <motion.div 
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 shadow-lg">
            <Star className="h-3 w-3 ml-1" />
            الأكثر شيوعاً
          </Badge>
        </motion.div>
      )}
      
      <Card className={`h-full overflow-hidden transition-all duration-500 ${
        isPopular 
          ? "border-2 border-amber-500/50 shadow-xl shadow-amber-500/10" 
          : "border border-border/50 hover:border-primary/30"
      }`}>
        <div className={`h-2 bg-gradient-to-r ${gradients[index % gradients.length]}`} />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <motion.div 
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center shadow-lg`}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-2xl font-black text-white">{plan.installments_count}</span>
            </motion.div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">المدة</p>
              <p className="font-bold text-lg">{plan.duration_months} شهر</p>
            </div>
          </div>

          <h3 className="font-bold text-xl mb-2">{plan.name_ar}</h3>
          <p className="text-sm text-muted-foreground mb-6">{plan.description_ar || "خطة تمويل مرنة بدون فوائد"}</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                الحد الأدنى
              </span>
              <span className="font-bold">{plan.min_amount.toLocaleString()} ر.س</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                الحد الأقصى
              </span>
              <span className="font-bold">{plan.max_amount ? `${plan.max_amount.toLocaleString()} ر.س` : "غير محدد"}</span>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {[
              { icon: CheckCircle2, text: "بدون فوائد" },
              { icon: Shield, text: "موافقة سريعة" },
              { icon: Timer, text: "القسط يوم 30" },
            ].map((item, i) => (
              <motion.div 
                key={i}
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + i * 0.1 }}
              >
                <item.icon className="h-4 w-4 text-emerald-500" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>

          <Button asChild className={`w-full bg-gradient-to-r ${gradients[index % gradients.length]} hover:opacity-90`}>
            <Link to="/dashboard/financing/apply">
              اختر هذه الخطة
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  under_review: { label: "قيد المراجعة", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Clock className="h-3 w-3" /> },
  documents_required: { label: "مستندات مطلوبة", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <FileUp className="h-3 w-3" /> },
  awaiting_contract: { label: "بانتظار العقد", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <ScrollText className="h-3 w-3" /> },
  awaiting_signature: { label: "بانتظار التوقيع", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: <FileText className="h-3 w-3" /> },
  approved: { label: "موافق عليه", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "مرفوض", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  active: { label: "نشط", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <TrendingUp className="h-3 w-3" /> },
  completed: { label: "مكتمل", color: "bg-primary/20 text-primary border-primary/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  defaulted: { label: "متعثر", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: "ملغي", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <XCircle className="h-3 w-3" /> },
};

const installmentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500/20 text-yellow-400" },
  paid: { label: "مدفوع", color: "bg-green-500/20 text-green-400" },
  overdue: { label: "متأخر", color: "bg-red-500/20 text-red-400" },
};

// Execution Fee constant
const ADMIN_FEE = 500; // رسوم إدارية ثابتة

export default function ClientFinancing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedApplication, setSelectedApplication] = useState<FinancingApplication | null>(null);

  // Fetch plans
  const { data: plans = [] } = useQuery({
    queryKey: ["financing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financing_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as FinancingPlan[];
    },
  });

  // Fetch user's applications
  const { data: applications = [] } = useQuery({
    queryKey: ["my-financing-applications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("financing_applications")
        .select(`
          id, application_number, plan_id, full_name, national_id, phone, email, address,
          requested_amount, approved_amount, status, submitted_at, approved_at,
          rejection_reason, contract_number, promissory_note_url,
          financing_plans (name_ar, installments_count)
        `)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as FinancingApplication[];
    },
    enabled: !!user?.id,
  });

  // Get first active application for installments query
  const activeApp = selectedApplication || applications.find(a => a.status === "active");

  // Fetch installments for selected/active application
  const { data: installments = [] } = useQuery({
    queryKey: ["my-financing-installments", activeApp?.id],
    queryFn: async () => {
      if (!activeApp?.id) return [];
      const { data, error } = await supabase
        .from("financing_installments")
        .select("*")
        .eq("application_id", activeApp.id)
        .order("installment_number");
      if (error) throw error;
      return data as FinancingInstallment[];
    },
    enabled: !!activeApp?.id,
  });

  const activeApplications = applications.filter(a => a.status === "active");
  const currentApplication = selectedApplication || activeApplications[0];
  
  const totalPaid = installments.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const totalRemaining = installments.filter(i => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0);
  const nextInstallment = installments.find(i => i.status === "pending");

  const paidInstallmentsCount = installments.filter(i => i.status === "paid").length;
  const hasActiveApplication = activeApplications.length > 0;
  const hasPendingApplication = applications.some(a => a.status === "pending" || a.status === "under_review" || a.status === "approved");
  const canApplyForNew = !hasPendingApplication && (!hasActiveApplication || paidInstallmentsCount >= 3);

  const features = [
    { icon: Sparkles, title: "بدون فوائد", description: "تمويل إسلامي متوافق مع الشريعة بدون أي فوائد أو رسوم خفية", color: "bg-gradient-to-br from-emerald-500 to-teal-600" },
    { icon: Zap, title: "موافقة سريعة", description: "الموافقة على طلبك خلال 24 ساعة عمل فقط", color: "bg-gradient-to-br from-amber-500 to-orange-600" },
    { icon: Shield, title: "تمويل داخلي", description: "التمويل لشراء خدماتنا فقط وليس نقدياً - يُضاف كرصيد لحسابك", color: "bg-gradient-to-br from-blue-500 to-indigo-600" },
    { icon: Gift, title: "مكافآت حصرية", description: "احصل على نقاط مكافآت مع كل دفعة في الموعد", color: "bg-gradient-to-br from-purple-500 to-violet-600" },
  ];

  const quickLinks = [
    { title: "تقديم طلب", description: "ابدأ الآن", icon: Plus, href: "/dashboard/financing/apply", gradient: "from-orange-500 to-red-600" },
    { title: "دليل التمويل", description: "اقرأ الشروط", icon: BookOpen, href: "/dashboard/financing/guide", gradient: "from-purple-500 to-violet-600" },
    { title: "تحقق من الأهلية", description: "تأكد من الشروط", icon: UserCheck, href: "/dashboard/financing/eligibility", gradient: "from-emerald-500 to-teal-600" },
    { title: "حاسبة التمويل", description: "احسب أقساطك", icon: Calculator, href: "/dashboard/financing/calculator", gradient: "from-blue-500 to-indigo-600" },
  ];

  return (
    <ClientDashboardLayout>
      <div className="space-y-8" dir="rtl">
        {/* Premium Hero Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 sm:p-10">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <motion.div 
                    className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Landmark className="h-8 w-8 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">التمويل المرن</h1>
                    <p className="text-white/70 text-sm sm:text-base">احصل على خدماتك الآن وادفع لاحقاً</p>
                  </div>
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/80 text-base sm:text-lg mb-6 max-w-2xl leading-relaxed"
                >
                  تمويل داخلي بدون فوائد لشراء خدمات البرمجة والتصميم ومواقع التواصل. 
                  مبالغ من <span className="font-bold text-white">100</span> حتى <span className="font-bold text-white">50,000</span> ريال 
                  بأقساط تصل إلى <span className="font-bold text-white">12 شهر</span>.
                  <span className="block text-sm text-amber-300 mt-2">⚠️ التمويل ليس نقدياً - فقط لشراء خدماتنا داخل المنصة</span>
                </motion.p>

                {/* Admin Fee Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
                >
                  <Coins className="h-5 w-5 text-amber-300" />
                  <span className="text-white text-sm">رسوم إدارية ثابتة: <span className="font-bold text-amber-300">{ADMIN_FEE} ر.س</span> (تُضاف لآخر قسط)</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-3"
                >
                  {canApplyForNew ? (
                    <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-white/90 shadow-xl shadow-black/20">
                      <Link to="/dashboard/financing/apply">
                        <Plus className="h-5 w-5 ml-2" />
                        تقديم طلب تمويل
                      </Link>
                    </Button>
                  ) : (
                    <div className="flex flex-col">
                      <Button disabled size="lg" className="bg-white/30 text-white cursor-not-allowed">
                        <Lock className="h-4 w-4 ml-2" />
                        غير متاح حالياً
                      </Button>
                      <p className="text-xs text-white/60 mt-2">
                        {hasPendingApplication ? "لديك طلب قيد المراجعة" : `يجب سداد ${3 - paidInstallmentsCount} أقساط إضافية`}
                      </p>
                    </div>
                  )}
                  <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Link to="/dashboard/financing/calculator">
                      <Calculator className="h-5 w-5 ml-2" />
                      حاسبة الأقساط
                    </Link>
                  </Button>
                </motion.div>
              </div>

              {/* Quick Stats */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="grid grid-cols-2 gap-3 w-full lg:w-auto"
              >
                {[
                  { label: "الحد الأقصى", value: "50,000", suffix: "ر.س", icon: CircleDollarSign },
                  { label: "أقصى مدة", value: "12", suffix: "شهر", icon: Calendar },
                  { label: "رسوم إدارية", value: "500", suffix: "ر.س", icon: Receipt },
                  { label: "نسبة الفائدة", value: "0", suffix: "%", icon: Percent },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
                  >
                    <stat.icon className="h-5 w-5 text-white/60 mb-2" />
                    <p className="text-2xl font-black text-white">{stat.value}<span className="text-sm font-normal text-white/60 mr-1">{stat.suffix}</span></p>
                    <p className="text-xs text-white/60">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={link.href}>
                <Card className="h-full hover:border-primary/50 transition-all group cursor-pointer hover:shadow-lg">
                  <CardContent className="p-4">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <link.icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{link.title}</h3>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Active Financing Display */}
        {activeApplications.length > 0 && currentApplication && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">التمويل النشط</h2>
                <p className="text-sm text-muted-foreground">متابعة تمويلك الحالي</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Bank Card */}
              <div className="lg:col-span-3">
                <EnhancedFinancingCard
                  userName={currentApplication.full_name}
                  totalBalance={currentApplication.approved_amount || currentApplication.requested_amount}
                  paidAmount={totalPaid}
                  remainingAmount={totalRemaining}
                  nextInstallmentAmount={nextInstallment?.amount}
                  nextInstallmentDate={nextInstallment ? new Date(nextInstallment.due_date) : undefined}
                  planName={currentApplication.financing_plans?.name_ar}
                  contractNumber={currentApplication.contract_number || undefined}
                  installmentsCount={currentApplication.financing_plans?.installments_count || 6}
                  paidInstallments={installments.filter(i => i.status === "paid").length}
                />
              </div>

              {/* Stats Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 gap-4">
                <StatCard
                  icon={CheckCircle2}
                  label="المبلغ المدفوع"
                  value={totalPaid}
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                  delay={0.1}
                />
                <StatCard
                  icon={Wallet}
                  label="المبلغ المتبقي"
                  value={totalRemaining}
                  gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                  delay={0.2}
                />
                {nextInstallment && (
                  <StatCard
                    icon={Calendar}
                    label={`القسط القادم - ${format(new Date(nextInstallment.due_date), "dd/MM")}`}
                    value={nextInstallment.amount}
                    gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    delay={0.3}
                  />
                )}
              </div>
            </div>

            {/* Status Card with Payment Methods */}
            <FinancingStatusCard 
              application={currentApplication}
              installments={installments}
              showClientInfo={false}
            />
          </motion.div>
        )}

        {/* Pending/Approved Application Status */}
        {activeApplications.length === 0 && applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <div className={`h-2 ${
                applications[0].status === "pending" || applications[0].status === "under_review" 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500" 
                  : applications[0].status === "documents_required"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500"
                    : applications[0].status === "awaiting_contract"
                      ? "bg-gradient-to-r from-purple-500 to-violet-500"
                      : applications[0].status === "awaiting_signature"
                        ? "bg-gradient-to-r from-indigo-500 to-blue-500"
                        : applications[0].status === "approved" 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gradient-to-r from-red-500 to-rose-500"
              }`} />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                    applications[0].status === "pending" || applications[0].status === "under_review"
                      ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
                      : applications[0].status === "documents_required"
                        ? "bg-gradient-to-br from-orange-500/20 to-amber-500/20"
                        : applications[0].status === "awaiting_contract"
                          ? "bg-gradient-to-br from-purple-500/20 to-violet-500/20"
                          : applications[0].status === "awaiting_signature"
                            ? "bg-gradient-to-br from-indigo-500/20 to-blue-500/20"
                            : applications[0].status === "approved"
                              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                              : "bg-gradient-to-br from-red-500/20 to-rose-500/20"
                  }`}>
                    {applications[0].status === "pending" || applications[0].status === "under_review" ? (
                      <Clock className="h-10 w-10 text-yellow-400" />
                    ) : applications[0].status === "documents_required" ? (
                      <FileUp className="h-10 w-10 text-orange-400" />
                    ) : applications[0].status === "awaiting_contract" ? (
                      <ScrollText className="h-10 w-10 text-purple-400" />
                    ) : applications[0].status === "awaiting_signature" ? (
                      <FileText className="h-10 w-10 text-indigo-400" />
                    ) : applications[0].status === "approved" ? (
                      <CheckCircle2 className="h-10 w-10 text-green-400" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">طلب التمويل #{applications[0].application_number}</h3>
                      <Badge className={`${statusConfig[applications[0].status]?.color}`}>
                        {statusConfig[applications[0].status]?.icon}
                        <span className="mr-1">{statusConfig[applications[0].status]?.label}</span>
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      {(applications[0].status === "pending" || applications[0].status === "under_review") && "طلبك قيد المراجعة، سنقوم بإعلامك فور اتخاذ القرار"}
                      {applications[0].status === "documents_required" && "مطلوب رفع بعض المستندات لإكمال مراجعة طلبك"}
                      {applications[0].status === "awaiting_contract" && "تمت الموافقة المبدئية! يرجى مراجعة العقد وتوقيعه"}
                      {applications[0].status === "awaiting_signature" && !applications[0].promissory_note_url && "تم توقيع العقد، يرجى توقيع الكمبيالة"}
                      {applications[0].status === "awaiting_signature" && applications[0].promissory_note_url && "تم توقيع الكمبيالة، بانتظار التفعيل"}
                      {applications[0].status === "approved" && "تمت الموافقة! سيتم إضافة الرصيد قريباً"}
                      {applications[0].status === "rejected" && `عذراً، تم رفض الطلب. ${applications[0].rejection_reason || ""}`}
                    </p>
                    
                    {/* Admin Fee Notice */}
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-300">
                          رسوم إدارية ثابتة: <span className="font-bold">{ADMIN_FEE} ر.س</span> (تُضاف لآخر قسط)
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {applications[0].status === "documents_required" && (
                      <Button asChild className="mb-4 bg-gradient-to-r from-orange-500 to-amber-500">
                        <Link to={`/dashboard/financing/documents/${applications[0].id}`}>
                          <Upload className="h-4 w-4 ml-2" />
                          رفع المستندات
                        </Link>
                      </Button>
                    )}

                    {applications[0].status === "awaiting_contract" && (
                      <Button asChild className="mb-4 bg-gradient-to-r from-purple-500 to-violet-600">
                        <Link to={`/dashboard/financing/sign-contract/${applications[0].id}`}>
                          <ScrollText className="h-4 w-4 ml-2" />
                          توقيع العقد
                        </Link>
                      </Button>
                    )}

                    {applications[0].status === "awaiting_signature" && !applications[0].promissory_note_url && (
                      <Button asChild className="mb-4 bg-gradient-to-r from-indigo-500 to-blue-600">
                        <Link to={`/dashboard/financing/sign-promissory/${applications[0].id}`}>
                          <FileText className="h-4 w-4 ml-2" />
                          توقيع الكمبيالة
                        </Link>
                      </Button>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 p-4 bg-muted/30 rounded-xl">
                      <div>
                        <p className="text-xs text-muted-foreground">المبلغ المطلوب</p>
                        <p className="text-lg font-bold text-primary">{applications[0].requested_amount.toLocaleString()} ر.س</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">خطة التمويل</p>
                        <p className="font-semibold">{applications[0].financing_plans?.name_ar || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">عدد الأقساط</p>
                        <p className="font-semibold">{applications[0].financing_plans?.installments_count || "-"} قسط</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">تاريخ التقديم</p>
                        <p className="font-semibold">{format(new Date(applications[0].submitted_at), "dd/MM/yyyy", { locale: ar })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted/50 inline-flex w-max sm:w-auto gap-1 p-1 h-auto flex-row-reverse" dir="rtl">
              <TabsTrigger value="plans" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                <CreditCard className="h-4 w-4 ml-1" />
                خطط التمويل
              </TabsTrigger>
              {activeApplications.length > 0 && (
                <>
                  <TabsTrigger value="contract" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                    <FileText className="h-4 w-4 ml-1" />
                    العقد
                  </TabsTrigger>
                  <TabsTrigger value="installments" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                    <Calendar className="h-4 w-4 ml-1" />
                    الأقساط
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="applications" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                <FileText className="h-4 w-4 ml-1" />
                طلباتي ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                <Sparkles className="h-4 w-4 ml-1" />
                نظرة عامة
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 mt-6">
            {/* Features Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">مميزات التمويل</h2>
                  <p className="text-sm text-muted-foreground">لماذا تختار تمويلنا المرن</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feature, index) => (
                  <FeatureCard key={index} {...feature} delay={index * 0.1} />
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-violet-500/20">
                  <BookOpen className="h-6 w-6 text-violet-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">كيف يعمل التمويل؟</h2>
                  <p className="text-sm text-muted-foreground">خطوات بسيطة للحصول على تمويلك</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: 1, title: "قدم طلبك", description: "املأ نموذج الطلب بمعلوماتك الأساسية", icon: FileText },
                  { step: 2, title: "انتظر الموافقة", description: "نراجع طلبك ونرد خلال 24 ساعة", icon: Clock },
                  { step: 3, title: "وقع العقد", description: "وقع العقد والكمبيالة رقمياً", icon: ScrollText },
                  { step: 4, title: "استلم الرصيد", description: "يُضاف الرصيد لحسابك فوراً", icon: Wallet },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="relative"
                  >
                    <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-5 text-center">
                        <motion.div 
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 relative"
                          whileHover={{ scale: 1.1 }}
                        >
                          <item.icon className="h-7 w-7 text-primary" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                            {item.step}
                          </div>
                        </motion.div>
                        <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                    {index < 3 && (
                      <div className="hidden md:block absolute top-1/2 -left-3 transform -translate-y-1/2">
                        <ChevronRight className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Fee Structure */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">هيكل الرسوم</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm">
                        <p className="text-2xl font-black text-amber-500">{ADMIN_FEE} ر.س</p>
                        <p className="text-sm text-muted-foreground">رسوم إدارية ثابتة</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">تُضاف لآخر قسط</p>
                      </div>
                      <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm">
                        <p className="text-2xl font-black text-emerald-500">0%</p>
                        <p className="text-sm text-muted-foreground">فوائد</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">بدون فوائد نهائياً</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4 mt-6">
            {applications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mx-auto mb-4 flex items-center justify-center"
                  >
                    <FileText className="h-10 w-10 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">لا توجد طلبات تمويل</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بتقديم طلب تمويل للحصول على خدماتك الآن</p>
                  <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    <Link to="/dashboard/financing/apply">
                      <Plus className="h-4 w-4 ml-2" />
                      تقديم طلب جديد
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">جميع الطلبات ({applications.length})</h3>
                  {canApplyForNew && (
                    <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      <Link to="/dashboard/financing/apply">
                        <Plus className="h-4 w-4 ml-1" />
                        طلب جديد
                      </Link>
                    </Button>
                  )}
                </div>

                {applications.map((app, index) => (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <Card className={`overflow-hidden hover:shadow-lg transition-all ${app.status === 'active' ? 'border-emerald-500/30' : ''}`}>
                      <div className={`h-1.5 ${
                        app.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                        app.status === 'approved' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                        app.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                        app.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                        'bg-muted'
                      }`} />
                      
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              app.status === 'active' ? 'bg-emerald-500/20' :
                              app.status === 'approved' ? 'bg-blue-500/20' :
                              app.status === 'pending' ? 'bg-amber-500/20' :
                              app.status === 'rejected' ? 'bg-red-500/20' :
                              'bg-muted'
                            }`}>
                              {statusConfig[app.status]?.icon || <FileText className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">#{app.application_number}</h4>
                              <p className="text-xs text-muted-foreground">{format(new Date(app.submitted_at), "dd MMMM yyyy", { locale: ar })}</p>
                            </div>
                          </div>
                          <Badge className={`${statusConfig[app.status]?.color} px-3 py-1`}>
                            {statusConfig[app.status]?.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">المبلغ المطلوب</p>
                            <p className="font-bold">{app.requested_amount.toLocaleString()} ر.س</p>
                          </div>
                          {app.approved_amount && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <p className="text-xs text-emerald-400">المبلغ المعتمد</p>
                              <p className="font-bold text-emerald-400">{app.approved_amount.toLocaleString()} ر.س</p>
                            </div>
                          )}
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">خطة التمويل</p>
                            <p className="font-medium text-sm">{app.financing_plans?.name_ar || "-"}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">عدد الأقساط</p>
                            <p className="font-bold">{app.financing_plans?.installments_count || "-"} قسط</p>
                          </div>
                        </div>

                        {app.rejection_reason && (
                          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-red-400">سبب الرفض:</p>
                                <p className="text-sm text-red-300/80">{app.rejection_reason}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {app.status === "active" && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setSelectedApplication(selectedApplication?.id === app.id ? null : app)}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            {selectedApplication?.id === app.id ? "إخفاء الأقساط" : "عرض جدول الأقساط"}
                            <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${selectedApplication?.id === app.id ? 'rotate-180' : ''}`} />
                          </Button>
                        )}

                        <AnimatePresence>
                          {selectedApplication?.id === app.id && installments.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-border overflow-hidden"
                            >
                              <div className="space-y-2">
                                {installments.map((inst, i) => (
                                  <motion.div 
                                    key={inst.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`flex items-center justify-between p-3 rounded-xl ${
                                      inst.status === 'paid' ? 'bg-emerald-500/10 border border-emerald-500/20' : 
                                      inst.status === 'pending' ? 'bg-amber-500/10 border border-amber-500/20' : 
                                      'bg-muted/50 border border-border'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                        inst.status === 'paid' ? 'bg-emerald-500 text-white' : 
                                        inst.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500' :
                                        'bg-muted text-muted-foreground'
                                      }`}>
                                        {inst.status === 'paid' ? <Check className="h-5 w-5" /> : inst.installment_number}
                                      </div>
                                      <div>
                                        <p className="font-bold">{inst.amount.toLocaleString()} ر.س</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(inst.due_date), "dd MMMM yyyy", { locale: ar })}</p>
                                      </div>
                                    </div>
                                    <Badge className={`${installmentStatusConfig[inst.status]?.color} text-xs`}>
                                      {installmentStatusConfig[inst.status]?.label}
                                    </Badge>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Installments Tab */}
          {activeApplications.length > 0 && currentApplication && (
            <TabsContent value="installments" className="space-y-4 mt-6">
              <InstallmentsTable
                installments={installments}
                totalAmount={currentApplication.approved_amount || currentApplication.requested_amount}
              />
            </TabsContent>
          )}

          {/* Contract Tab */}
          {activeApplications.length > 0 && currentApplication && (
            <TabsContent value="contract" className="space-y-4 mt-6">
              <FinancingContract
                application={{
                  ...currentApplication,
                  financing_plans: currentApplication.financing_plans ? {
                    ...currentApplication.financing_plans,
                    duration_months: currentApplication.financing_plans.installments_count
                  } : undefined
                }}
                installments={installments}
                onContractSigned={(signature) => {
                  console.log("Contract signed:", signature);
                }}
              />
            </TabsContent>
          )}

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/20">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">خطط التمويل المتاحة</h2>
                <p className="text-sm text-muted-foreground">اختر الخطة المناسبة لاحتياجاتك</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  index={index}
                  isPopular={plan.installments_count === 6}
                />
              ))}
            </div>

            {/* Limits Info */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3">حدود التمويل</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-blue-400" />
                          <span className="font-semibold">الحد الأدنى للتمويل</span>
                        </div>
                        <p className="text-2xl font-black text-primary">100 ر.س</p>
                      </div>
                      <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-blue-400" />
                          <span className="font-semibold">الحد الأقصى للتمويل</span>
                        </div>
                        <p className="text-2xl font-black text-primary">50,000 ر.س</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  );
}
