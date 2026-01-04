import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Server, 
  Globe, 
  Shield, 
  Cpu, 
  HardDrive,
  Cloud,
  Zap,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Database,
  Container,
  Network,
  Box,
  RefreshCw,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  useAllHostingProducts, 
  useHostingOrders, 
  useUpdateHostingProduct,
  useDigitalOceanAPI,
  HostingProduct,
  HostingProductType
} from "@/hooks/useHostingProducts";

const productTypeConfig: Record<HostingProductType, { icon: any; label: string; color: string }> = {
  droplet: { icon: Server, label: 'VPS', color: 'from-blue-500 to-cyan-500' },
  database: { icon: Database, label: 'قواعد البيانات', color: 'from-emerald-500 to-green-500' },
  spaces: { icon: Cloud, label: 'التخزين', color: 'from-violet-500 to-purple-500' },
  app_platform: { icon: Box, label: 'التطبيقات', color: 'from-pink-500 to-rose-500' },
  load_balancer: { icon: Network, label: 'موازن الأحمال', color: 'from-amber-500 to-orange-500' },
  kubernetes: { icon: Container, label: 'K8s', color: 'from-indigo-500 to-blue-500' },
  firewall: { icon: Shield, label: 'الحماية', color: 'from-red-500 to-rose-500' },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
  provisioning: { label: 'قيد التجهيز', color: 'bg-blue-500/10 text-blue-500', icon: RefreshCw },
  active: { label: 'نشط', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  suspended: { label: 'معلق', color: 'bg-orange-500/10 text-orange-500', icon: XCircle },
  terminated: { label: 'منتهي', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  failed: { label: 'فشل', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const AdminHosting = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState<HostingProduct | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useAllHostingProducts();
  const { data: orders, isLoading: ordersLoading } = useHostingOrders();
  const updateProduct = useUpdateHostingProduct();
  const doAPI = useDigitalOceanAPI();

  const stats = [
    { 
      title: "إجمالي المنتجات", 
      value: products?.length || 0, 
      icon: Package, 
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      title: "الطلبات النشطة", 
      value: orders?.filter(o => o.status === 'active').length || 0, 
      icon: Activity, 
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10"
    },
    { 
      title: "إجمالي الطلبات", 
      value: orders?.length || 0, 
      icon: Server, 
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-500/10"
    },
    { 
      title: "الإيرادات الشهرية", 
      value: `$${orders?.filter(o => o.status === 'active').reduce((sum, o) => sum + o.our_price, 0) || 0}`, 
      icon: DollarSign, 
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-500/10"
    },
  ];

  const handleToggleActive = async (product: HostingProduct) => {
    await updateProduct.mutateAsync({
      id: product.id,
      is_active: !product.is_active
    });
  };

  const handleSavePrice = async () => {
    if (!editingProduct) return;
    
    await updateProduct.mutateAsync({
      id: editingProduct.id,
      our_price: parseFloat(editPrice)
    });
    
    setEditingProduct(null);
    setEditPrice("");
  };

  const handleSyncWithDO = async () => {
    toast.loading('جاري المزامنة مع DigitalOcean...', { id: 'sync' });
    try {
      const account = await doAPI.mutateAsync({ action: 'get_account' });
      toast.success(`تم الاتصال بنجاح! البريد: ${account.account?.email}`, { id: 'sync' });
    } catch (error: any) {
      toast.error(`فشل الاتصال: ${error.message}`, { id: 'sync' });
    }
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name_ar.includes(searchQuery)
  );

  const groupedProducts = filteredProducts?.reduce((acc, product) => {
    if (!acc[product.product_type]) {
      acc[product.product_type] = [];
    }
    acc[product.product_type].push(product);
    return acc;
  }, {} as Record<string, HostingProduct[]>);

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Server className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">إدارة الاستضافة السحابية</h1>
              <p className="text-muted-foreground">إدارة منتجات وطلبات DigitalOcean</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleSyncWithDO}
              disabled={doAPI.isPending}
            >
              <RefreshCw className={cn("w-4 h-4", doAPI.isPending && "animate-spin")} />
              مزامنة
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <Plus className="w-4 h-4" />
              إضافة منتج
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn("border-border/50", stat.bgColor)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", stat.color)}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              المنتجات ({products?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Server className="w-4 h-4" />
              الطلبات ({orders?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">منتجات الاستضافة</CardTitle>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    className="pr-9 w-48"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedProducts || {}).map(([type, typeProducts]) => {
                      const config = productTypeConfig[type as HostingProductType];
                      return (
                        <div key={type}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", config.color)}>
                              <config.icon className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold">{config.label}</h3>
                            <Badge variant="outline">{typeProducts.length}</Badge>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>المنتج</TableHead>
                                <TableHead>سعر DO</TableHead>
                                <TableHead>سعرنا</TableHead>
                                <TableHead>الربح</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الإجراءات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typeProducts.map((product) => (
                                <TableRow key={product.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{product.name_ar}</p>
                                      <p className="text-xs text-muted-foreground font-mono">{product.name}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-muted-foreground">${product.do_price}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-bold text-primary">${product.our_price}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-success/10 text-success">
                                      +${(product.our_price - product.do_price).toFixed(2)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={product.is_active}
                                      onCheckedChange={() => handleToggleActive(product)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        size="icon" 
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingProduct(product);
                                          setEditPrice(product.our_price.toString());
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">طلبات الاستضافة</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : orders && orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>نوع المنتج</TableHead>
                        <TableHead>المنتج</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const typeConfig = productTypeConfig[order.product_type as HostingProductType];
                        const status = statusConfig[order.status];
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <span className="font-mono text-sm">{order.order_number}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {typeConfig && (
                                  <div className={cn("w-6 h-6 rounded bg-gradient-to-br flex items-center justify-center", typeConfig.color)}>
                                    <typeConfig.icon className="w-3 h-3 text-white" />
                                  </div>
                                )}
                                <span className="text-sm">{typeConfig?.label || order.product_type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {order.product?.name_ar || order.do_resource_name || '-'}
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-primary">${order.our_price}</span>
                              <span className="text-xs text-muted-foreground">/شهرياً</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>
                                <status.icon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('ar-SA')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا توجد طلبات حتى الآن</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Price Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل سعر المنتج</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="font-medium">{editingProduct?.name_ar}</p>
                <p className="text-sm text-muted-foreground">سعر DigitalOcean: ${editingProduct?.do_price}</p>
              </div>
              <div className="space-y-2">
                <Label>السعر الجديد ($)</Label>
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="أدخل السعر"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                إلغاء
              </Button>
              <Button onClick={handleSavePrice} disabled={updateProduct.isPending}>
                {updateProduct.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminHosting;
