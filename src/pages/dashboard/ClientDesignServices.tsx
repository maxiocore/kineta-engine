import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Palette,
  Search,
  Grid3X3,
  List,
  ShoppingCart,
  Shield,
  Activity,
  Check,
  Star,
  Clock,
  ArrowLeft,
  Eye,
  FileCheck,
  Sparkles,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  category_id: string | null;
  status: string;
  features: any;
  refill_enabled: boolean | null;
  external_service_id: string | null;
}

const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-emerald-500"
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-xs font-medium text-emerald-500">مباشر</span>
  </motion.div>
);

const ClientDesignServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderLink, setOrderLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);

  // Keywords for design services
  const designKeywords = ["design", "graphic", "logo", "brand", "تصميم", "شعار", "هوية", "جرافيك", "بوستر", "فوتوشوب", "illustrator"];

  // Fetch design services
  const { data: initialServices, isLoading } = useQuery({
    queryKey: ["design-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (error) throw error;
      
      // Filter for design-related services
      return (data as Service[]).filter(service => {
        const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
        return designKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    },
  });

  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
    }
  }, [initialServices]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (data) setBalance(data.balance);
  };

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('design_services_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const service = payload.new as Service;
            const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
            const isDesignService = designKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
            
            if (service.status === 'active' && isDesignService) {
              setServices(prev => {
                const exists = prev.find(s => s.id === service.id);
                if (exists) {
                  return prev.map(s => s.id === service.id ? service : s);
                }
                return [...prev, service].sort((a, b) => a.price - b.price);
              });
              if (payload.eventType === 'INSERT') {
                toast.success(`خدمة جديدة: ${service.name}`);
              }
            } else {
              setServices(prev => prev.filter(s => s.id !== service.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setServices(prev => prev.filter(s => s.id !== (payload.old as Service).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter by search
  const filteredServices = services.filter(service => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query)
    );
  });

  const handleOrder = async () => {
    if (!user || !selectedService) return;
    
    if (balance < selectedService.price) {
      toast.error("رصيدك غير كافي", {
        description: "يرجى شحن رصيدك أولاً"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          service_id: selectedService.id,
          total_price: selectedService.price,
          quantity: 1,
          link: orderLink || null,
          notes: orderNotes || null,
          status: 'pending' as const,
          order_number: orderNumber
        }]);

      if (orderError) throw orderError;

      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({ 
          balance: balance - selectedService.price,
          total_spent: balance + selectedService.price
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      toast.success("تم إرسال الطلب بنجاح!", {
        description: "سيتم التواصل معك قريباً"
      });
      
      setOrderDialogOpen(false);
      setOrderNotes("");
      setOrderLink("");
      setSelectedService(null);
      fetchBalance();
    } catch (error) {
      toast.error("حدث خطأ", {
        description: "يرجى المحاولة مرة أخرى"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFeatures = (service: Service): string[] => {
    if (Array.isArray(service.features)) return service.features;
    return [];
  };

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard/our-services">
                <motion.div 
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </Link>
              <motion.div 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <Palette className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold">خدمات التصميم</h1>
                  <LiveIndicator />
                </div>
                <p className="text-sm text-muted-foreground">تصميم احترافي وهوية بصرية متكاملة</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="gap-2">
                <Activity className="w-3 h-3" />
                {services.length} خدمة
              </Badge>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                <span className="text-xs text-muted-foreground">رصيدك:</span>
                <span className="font-bold text-primary">${balance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Search & View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن خدمة تصميم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-11 text-base rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-11 w-11 rounded-xl"
              >
                <Grid3X3 className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-11 w-11 rounded-xl"
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Palette className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">لا توجد خدمات تصميم حالياً</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "لم يتم العثور على خدمات تطابق البحث" : "سيتم إضافة خدمات التصميم قريباً"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
            >
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="h-full relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Popular Badge */}
                    {index === 0 && (
                      <div className="absolute top-4 left-4 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg gap-1">
                          <Star className="w-3 h-3" />
                          الأكثر طلباً
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="relative z-10 pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                          >
                            <Palette className="w-5 h-5 text-white" />
                          </motion.div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
                              {service.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">تسليم سريع</span>
                              {service.refill_enabled && (
                                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                                  <Shield className="w-2.5 h-2.5" />
                                  ضمان
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                            ${service.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10 pt-4 space-y-4">
                      {service.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      {/* Features */}
                      {getFeatures(service).length > 0 && (
                        <div className="space-y-2">
                          {getFeatures(service).slice(0, 3).map((feature, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + idx * 0.05 }}
                              className="flex items-center gap-2"
                            >
                              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-green-500" />
                              </div>
                              <span className="text-sm text-foreground/80">{feature}</span>
                            </motion.div>
                          ))}
                          {getFeatures(service).length > 3 && (
                            <p className="text-xs text-muted-foreground mr-7">
                              +{getFeatures(service).length - 3} مميزات أخرى
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t border-border/50">
                        <Button
                          onClick={() => {
                            setSelectedService(service);
                            setDetailsDialogOpen(true);
                          }}
                          variant="outline"
                          className="flex-1 gap-2 h-10"
                        >
                          <Eye className="w-4 h-4" />
                          التفاصيل
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedService(service);
                            setOrderDialogOpen(true);
                          }}
                          className="flex-1 gap-2 h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          اطلب الآن
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedService?.name}</DialogTitle>
                  <p className="text-2xl font-bold text-primary">${selectedService?.price.toFixed(2)}</p>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedService?.description && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">وصف الخدمة</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedService.description}
                  </p>
                </div>
              )}

              {selectedService && getFeatures(selectedService).length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">مميزات الخدمة</h4>
                  <div className="grid gap-2">
                    {getFeatures(selectedService).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                إغلاق
              </Button>
              <Button
                onClick={() => {
                  setDetailsDialogOpen(false);
                  setOrderDialogOpen(true);
                }}
                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <ShoppingCart className="w-4 h-4" />
                اطلب الآن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                تأكيد الطلب
              </DialogTitle>
              <DialogDescription>
                أكمل بيانات طلبك لخدمة "{selectedService?.name}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">الخدمة</span>
                  <span className="font-medium text-sm">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">السعر</span>
                  <span className="text-xl font-bold text-primary">${selectedService?.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground">رصيدك الحالي</span>
                  <span className={`font-semibold ${balance >= (selectedService?.price || 0) ? 'text-green-500' : 'text-red-500'}`}>
                    ${balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {balance < (selectedService?.price || 0) && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  رصيدك غير كافي. يرجى شحن رصيدك أولاً.
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label htmlFor="link">رابط أو معلومات إضافية (اختياري)</Label>
                  <Input
                    id="link"
                    value={orderLink}
                    onChange={(e) => setOrderLink(e.target.value)}
                    placeholder="مثال: رابط موقعك أو حسابك"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">ملاحظات للمصمم (اختياري)</Label>
                  <Textarea
                    id="notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظات أو متطلبات خاصة..."
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOrderDialogOpen(false)} disabled={submitting}>
                إلغاء
              </Button>
              <Button
                onClick={handleOrder}
                disabled={submitting || balance < (selectedService?.price || 0)}
                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الطلب...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    تأكيد الطلب
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDesignServices;
