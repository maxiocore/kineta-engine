import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowRight,
  RefreshCw,
  Calendar,
  Hash,
  Link as LinkIcon,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

interface OrderData {
  orderNumber: string;
  status: string;
  externalStatus: string | null;
  quantity: number;
  totalPrice: number;
  link: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    name: string;
    category: string;
    features: any;
  } | null;
  progress: number;
  history: Array<{
    old_status: string | null;
    new_status: string;
    created_at: string;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد الانتظار", color: "bg-warning text-warning-foreground", icon: Clock },
  confirmed: { label: "مؤكد", color: "bg-info text-info-foreground", icon: CheckCircle },
  in_progress: { label: "قيد التنفيذ", color: "bg-accent text-accent-foreground", icon: RefreshCw },
  completed: { label: "مكتمل", color: "bg-success text-success-foreground", icon: CheckCircle },
  cancelled: { label: "ملغي", color: "bg-destructive text-destructive-foreground", icon: XCircle },
  refunded: { label: "مسترد", color: "bg-muted text-muted-foreground", icon: RefreshCw },
};

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      toast.error("يرجى إدخال رقم الطلب");
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setOrderData(null);

    try {
      const { data, error } = await supabase.functions.invoke('track-order', {
        body: { orderNumber: orderNumber.trim() }
      });

      if (error) throw error;

      if (!data.found) {
        setNotFound(true);
        toast.error("لم يتم العثور على الطلب");
      } else {
        setOrderData(data.order);
        toast.success("تم العثور على الطلب");
      }
    } catch (error: any) {
      console.error('Error tracking order:', error);
      toast.error("حدث خطأ أثناء البحث عن الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">تتبع طلبك</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              أدخل رقم الطلب لمعرفة حالة طلبك ومتابعة تقدم التنفيذ
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8">
              <CardContent className="pt-6">
                <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="أدخل رقم الطلب (مثال: ORD-20241201-0001)"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                      className="pr-10 text-center font-mono"
                      dir="ltr"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري البحث...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        تتبع الطلب
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Not Found */}
          <AnimatePresence>
            {notFound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">لم يتم العثور على الطلب</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      تأكد من صحة رقم الطلب وحاول مرة أخرى
                    </p>
                    <Button variant="outline" onClick={() => setOrderNumber("")}>
                      حاول مرة أخرى
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Details */}
          <AnimatePresence>
            {orderData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Status Card */}
                <Card className="overflow-hidden">
                  <div className={`h-2 ${getStatusInfo(orderData.status).color}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="w-5 h-5" />
                        {orderData.orderNumber}
                      </CardTitle>
                      <Badge className={getStatusInfo(orderData.status).color}>
                        {getStatusInfo(orderData.status).label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">تقدم الطلب</span>
                        <span className="font-bold">{orderData.progress}%</span>
                      </div>
                      <Progress value={orderData.progress} className="h-3" />
                    </div>

                    {/* Status Steps */}
                    <div className="flex justify-between items-center mb-6 px-4">
                      {['pending', 'confirmed', 'in_progress', 'completed'].map((status, index) => {
                        const StatusIcon = getStatusInfo(status).icon;
                        const isActive = ['pending', 'confirmed', 'in_progress', 'completed']
                          .indexOf(orderData.status) >= index;
                        const isCurrent = orderData.status === status;
                        
                        return (
                          <div key={status} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                              ${isCurrent ? 'bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20' : 
                                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                            >
                              <StatusIcon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs ${isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                              {getStatusInfo(status).label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <Separator className="my-4" />

                    {/* Order Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-secondary/50 text-center">
                        <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">الخدمة</p>
                        <p className="font-medium text-sm truncate">{orderData.service?.name || '-'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50 text-center">
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-accent" />
                        <p className="text-xs text-muted-foreground">الكمية</p>
                        <p className="font-medium text-sm">{orderData.quantity?.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50 text-center">
                        <DollarSign className="w-5 h-5 mx-auto mb-1 text-success" />
                        <p className="text-xs text-muted-foreground">الإجمالي</p>
                        <p className="font-medium text-sm">${orderData.totalPrice?.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50 text-center">
                        <Calendar className="w-5 h-5 mx-auto mb-1 text-warning" />
                        <p className="text-xs text-muted-foreground">التاريخ</p>
                        <p className="font-medium text-sm" dir="ltr">
                          {new Date(orderData.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* External Status */}
                    {orderData.externalStatus && (
                      <div className="mt-4 p-3 rounded-lg bg-info/10 border border-info/20">
                        <p className="text-sm">
                          <span className="text-muted-foreground">حالة المزود: </span>
                          <span className="font-medium">{orderData.externalStatus}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Service Details */}
                {orderData.service && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">تفاصيل الخدمة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">{orderData.service.category}</Badge>
                          <h4 className="font-bold">{orderData.service.name}</h4>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Status History */}
                {orderData.history && orderData.history.length > 0 && (
                  <Card>
                    <CardHeader 
                      className="pb-2 cursor-pointer"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          سجل التحديثات
                        </span>
                        {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </CardTitle>
                    </CardHeader>
                    <AnimatePresence>
                      {showHistory && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <CardContent>
                            <div className="space-y-3">
                              {orderData.history.map((entry, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusInfo(entry.new_status).color}`}>
                                    {(() => {
                                      const Icon = getStatusInfo(entry.new_status).icon;
                                      return <Icon className="w-4 h-4" />;
                                    })()}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {entry.old_status && (
                                        <>
                                          <span className="text-muted-foreground">{getStatusInfo(entry.old_status).label}</span>
                                          <ArrowRight className="w-3 h-3 inline mx-1" />
                                        </>
                                      )}
                                      <span>{getStatusInfo(entry.new_status).label}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(entry.created_at)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )}

                {/* Track Another */}
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setOrderData(null);
                      setOrderNumber("");
                    }}
                    className="gap-2"
                  >
                    <Search className="w-4 h-4" />
                    تتبع طلب آخر
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrder;
