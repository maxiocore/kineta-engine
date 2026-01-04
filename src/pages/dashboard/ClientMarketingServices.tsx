import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Megaphone, Search, Grid3X3, LayoutList, Target, TrendingUp, BarChart3, Share2, Mail, MessageSquare, ChevronLeft, Shield, Star, Zap, Clock, Sparkles, PieChart, LineChart, MousePointer } from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ServicesPageSkeleton from "@/components/dashboard/ServicesPageSkeleton";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { cn } from "@/lib/utils";
import ProfessionalServiceCard from "@/components/services/ProfessionalServiceCard";
import ProfessionalOrderForm from "@/components/services/ProfessionalOrderForm";
import ServiceDetailsDrawer from "@/components/services/ServiceDetailsDrawer";

interface Service { id: string; name: string; description: string | null; price: number; category: string; category_id: string | null; status: string; features: any; refill_enabled: boolean | null; external_service_id: string | null; }

const mainCategories = [
  { id: "seo", name: "تحسين محركات البحث", icon: Search, color: "from-blue-500 to-cyan-600", keywords: ["seo", "محركات", "بحث"] },
  { id: "ads", name: "الإعلانات المدفوعة", icon: Target, color: "from-red-500 to-orange-600", keywords: ["ads", "إعلان", "حملة"] },
  { id: "social", name: "إدارة السوشيال", icon: Share2, color: "from-pink-500 to-rose-600", keywords: ["social", "سوشيال"] },
  { id: "email", name: "التسويق بالبريد", icon: Mail, color: "from-emerald-500 to-green-600", keywords: ["email", "بريد"] },
  { id: "analytics", name: "التحليلات", icon: BarChart3, color: "from-violet-500 to-purple-600", keywords: ["analytics", "تحليل"] }
];

const ClientMarketingServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ["marketing-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("status", "active").order("price", { ascending: true });
      if (error) throw error;
      return (data as Service[]).filter(service => service.category === 'marketing' || service.name.includes("تسويق") || service.name.includes("إعلان"));
    },
  });

  useEffect(() => {
    if (user) { supabase.from('user_balances').select('balance').eq('user_id', user.id).single().then(({ data }) => { if (data) setBalance(data.balance); }); }
  }, [user]);

  const handleRefresh = async () => { await refetch(); toast.success("تم التحديث"); };

  const filteredServices = services.filter(service => {
    const matchesSearch = !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!selectedCategory) return matchesSearch;
    const category = mainCategories.find(c => c.id === selectedCategory);
    if (!category) return matchesSearch;
    return matchesSearch && category.keywords.some(k => service.name.toLowerCase().includes(k));
  });

  const icons = [Megaphone, Target, BarChart3, Share2, Mail, TrendingUp, PieChart, LineChart, MousePointer];

  if (isLoading) return <ClientDashboardLayout><ServicesPageSkeleton /></ClientDashboardLayout>;

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="min-h-screen pb-8" dir="rtl">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500 p-6 mb-8">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/services')} className="bg-white/10 text-white rounded-xl"><ChevronLeft className="w-5 h-5" /></Button>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><Megaphone className="w-8 h-8 text-white" /></div>
                <div><p className="text-white/80 text-sm">Digital Marketing</p><h1 className="text-2xl font-bold text-white">التسويق الرقمي</h1></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ icon: TrendingUp, label: 'نتائج مضمونة' }, { icon: Target, label: 'استهداف دقيق' }, { icon: BarChart3, label: 'تحليلات' }].map((item, i) => (
                  <Badge key={i} className="bg-white/20 text-white border-0 gap-1.5 px-3 py-1.5"><item.icon className="w-3.5 h-3.5" />{item.label}</Badge>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[{ value: services.length, label: 'خدمة' }, { value: '24-48', label: 'ساعة' }, { value: '98%', label: 'رضا' }].map((stat, i) => (
                  <div key={i} className="text-center p-3 bg-white/10 rounded-xl"><p className="text-xl font-bold text-white">{stat.value}</p><p className="text-[10px] text-white/70">{stat.label}</p></div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2">
              <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)} className="rounded-full shrink-0">الكل</Button>
              {mainCategories.map((cat) => (<Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.id)} className={cn("rounded-full shrink-0 gap-1.5", selectedCategory === cat.id && `bg-gradient-to-r ${cat.color} border-0`)}><cat.icon className="w-3.5 h-3.5" />{cat.name}</Button>))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="ابحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-xl h-11" /></div>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("grid")} className="h-9 w-9 rounded-lg"><Grid3X3 className="w-4 h-4" /></Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("list")} className="h-9 w-9 rounded-lg"><LayoutList className="w-4 h-4" /></Button>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-12"><Megaphone className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" /><h3 className="font-bold text-lg mb-2">لا توجد خدمات</h3></div>
          ) : (
            <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
              {filteredServices.map((service, index) => (
                <ProfessionalServiceCard key={service.id} service={service} index={index} icon={icons[index % icons.length]} gradientFrom="from-orange-500" gradientVia="via-amber-500" gradientTo="to-yellow-500" hoverBorderColor="hover:border-orange-500/30" shadowColor="hover:shadow-orange-500/10" isFeatured={index < 3} onOrder={() => { setSelectedService(service); setOrderDialogOpen(true); }} onViewDetails={() => { setSelectedService(service); setDetailsDrawerOpen(true); }} />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <ProfessionalOrderForm service={selectedService} open={orderDialogOpen} onOpenChange={setOrderDialogOpen} balance={balance} gradientFrom="from-orange-500" gradientTo="to-amber-500" onSuccess={() => { refetch(); navigate("/dashboard/orders"); }} />
      <ServiceDetailsDrawer service={selectedService} open={detailsDrawerOpen} onOpenChange={setDetailsDrawerOpen} gradientFrom="from-orange-500" gradientVia="via-amber-500" gradientTo="to-yellow-500" onOrder={() => { setDetailsDrawerOpen(false); setOrderDialogOpen(true); }} />
    </ClientDashboardLayout>
  );
};

export default ClientMarketingServices;
