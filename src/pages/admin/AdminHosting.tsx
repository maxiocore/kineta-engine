import { useState, useEffect } from "react";
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
  Eye,
  Settings,
  MapPin,
  Image,
  Save,
  Loader2,
  Power,
  RotateCcw,
  Terminal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  droplet: { icon: Server, label: 'سيرفرات VPS', color: 'from-blue-500 to-cyan-500' },
  database: { icon: Database, label: 'قواعد البيانات', color: 'from-emerald-500 to-green-500' },
  spaces: { icon: Cloud, label: 'التخزين السحابي', color: 'from-violet-500 to-purple-500' },
  app_platform: { icon: Box, label: 'استضافة التطبيقات', color: 'from-pink-500 to-rose-500' },
  load_balancer: { icon: Network, label: 'موازنة الأحمال', color: 'from-amber-500 to-orange-500' },
  kubernetes: { icon: Container, label: 'كوبرنيتس', color: 'from-indigo-500 to-blue-500' },
  firewall: { icon: Shield, label: 'جدران الحماية', color: 'from-red-500 to-rose-500' },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  provisioning: { label: 'قيد التجهيز', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: RefreshCw },
  active: { label: 'نشط', color: 'bg-success/10 text-success border-success/30', icon: CheckCircle2 },
  suspended: { label: 'معلق', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: XCircle },
  terminated: { label: 'منتهي', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle },
  failed: { label: 'فشل', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle },
};

interface DORegion {
  slug: string;
  name: string;
  available: boolean;
}

interface DOSize {
  slug: string;
  memory: number;
  vcpus: number;
  disk: number;
  price_monthly: number;
  description: string;
}

interface DOImage {
  id: number;
  slug: string;
  name: string;
  distribution: string;
}

const AdminHosting = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [activeProductType, setActiveProductType] = useState<HostingProductType>("droplet");
  
  // Edit Product States
  const [editingProduct, setEditingProduct] = useState<HostingProduct | null>(null);
  const [editForm, setEditForm] = useState({
    name_ar: "",
    description_ar: "",
    our_price: "",
    is_active: true
  });
  
  // Configuration Panel States
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [regions, setRegions] = useState<DORegion[]>([]);
  const [sizes, setSizes] = useState<DOSize[]>([]);
  const [images, setImages] = useState<DOImage[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);

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

  const handleOpenEdit = (product: HostingProduct) => {
    setEditingProduct(product);
    setEditForm({
      name_ar: product.name_ar,
      description_ar: product.description_ar || "",
      our_price: product.our_price.toString(),
      is_active: product.is_active
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    
    await updateProduct.mutateAsync({
      id: editingProduct.id,
      name_ar: editForm.name_ar,
      description_ar: editForm.description_ar,
      our_price: parseFloat(editForm.our_price),
      is_active: editForm.is_active
    });
    
    setEditingProduct(null);
  };

  const handleOpenConfigPanel = async () => {
    setConfigPanelOpen(true);
    setLoadingConfig(true);
    
    try {
      const [accountRes, regionsRes, sizesRes, imagesRes] = await Promise.all([
        doAPI.mutateAsync({ action: 'get_account' }),
        doAPI.mutateAsync({ action: 'get_regions' }),
        doAPI.mutateAsync({ action: 'get_sizes' }),
        doAPI.mutateAsync({ action: 'get_images', data: { type: 'distribution' } })
      ]);
      
      setAccountInfo(accountRes.account);
      setRegions(regionsRes.regions?.filter((r: DORegion) => r.available) || []);
      setSizes(sizesRes.sizes?.slice(0, 20) || []);
      setImages(imagesRes.images?.slice(0, 30) || []);
    } catch (error: any) {
      toast.error(`فشل تحميل التكوين: ${error.message}`);
    } finally {
      setLoadingConfig(false);
    }
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
    (p.product_type === activeProductType) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name_ar.includes(searchQuery))
  );

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

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleOpenConfigPanel}
            >
              <Settings className="w-4 h-4" />
              خيارات التكوين
            </Button>
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

        {/* Main Tabs - RTL Fixed */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-background rounded-lg px-6">
              <Package className="w-4 h-4" />
              <span>المنتجات</span>
              <Badge variant="secondary" className="mr-1">{products?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-background rounded-lg px-6">
              <Server className="w-4 h-4" />
              <span>الطلبات</span>
              <Badge variant="secondary" className="mr-1">{orders?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            {/* Product Type Tabs - RTL Fixed */}
            <Tabs value={activeProductType} onValueChange={(v) => setActiveProductType(v as HostingProductType)} dir="rtl">
              <ScrollArea className="w-full pb-2">
                <TabsList className="inline-flex gap-2 bg-transparent p-0 h-auto">
                  {Object.entries(productTypeConfig).map(([type, config]) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className={cn(
                        "gap-2 px-4 py-2.5 rounded-xl border data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10",
                        "transition-all whitespace-nowrap"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center", config.color)}>
                        <config.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span>{config.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>

              {Object.keys(productTypeConfig).map((type) => (
                <TabsContent key={type} value={type} className="mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {productTypeConfig[type as HostingProductType].label}
                        </CardTitle>
                        <CardDescription>
                          إدارة منتجات {productTypeConfig[type as HostingProductType].label}
                        </CardDescription>
                      </div>
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
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : filteredProducts && filteredProducts.length > 0 ? (
                        <div className="grid gap-4">
                          {filteredProducts.map((product) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                                    productTypeConfig[type as HostingProductType].color
                                  )}>
                                    {(() => {
                                      const Icon = productTypeConfig[type as HostingProductType].icon;
                                      return <Icon className="w-6 h-6 text-white" />;
                                    })()}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold">{product.name_ar}</h3>
                                      <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                                        {product.is_active ? "نشط" : "معطل"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono">{product.name}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {product.description_ar || product.description}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                  {/* Pricing */}
                                  <div className="text-left">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl font-bold text-primary">${product.our_price}</span>
                                      <span className="text-xs text-muted-foreground">/شهرياً</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-muted-foreground">سعر DO: ${product.do_price}</span>
                                      <Badge className="bg-success/10 text-success border-0 text-xs">
                                        +${(product.our_price - product.do_price).toFixed(0)}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={product.is_active}
                                      onCheckedChange={() => handleToggleActive(product)}
                                    />
                                    <Button 
                                      size="icon" 
                                      variant="outline"
                                      onClick={() => handleOpenEdit(product)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">لا توجد منتجات في هذه الفئة</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">طلبات الاستضافة</CardTitle>
                <CardDescription>جميع طلبات خدمات الاستضافة السحابية</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم الطلب</TableHead>
                          <TableHead className="text-right">نوع الخدمة</TableHead>
                          <TableHead className="text-right">المنتج</TableHead>
                          <TableHead className="text-right">السعر الشهري</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => {
                          const typeConfig = productTypeConfig[order.product_type as HostingProductType];
                          const status = statusConfig[order.status];
                          return (
                            <TableRow key={order.id}>
                              <TableCell>
                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{order.order_number}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {typeConfig && (
                                    <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center", typeConfig.color)}>
                                      <typeConfig.icon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  )}
                                  <span className="text-sm font-medium">{typeConfig?.label || order.product_type}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{order.product?.name_ar || order.do_resource_name || '-'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-primary">${order.our_price}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("gap-1", status.color)}>
                                  <status.icon className="w-3 h-3" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString('ar-SA')}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Terminal className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
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

        {/* Edit Product Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                تعديل المنتج
              </DialogTitle>
              <DialogDescription>
                تعديل معلومات وسعر المنتج
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-muted/50 border">
                <p className="font-mono text-sm text-muted-foreground">{editingProduct?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">سعر DigitalOcean: ${editingProduct?.do_price}/شهرياً</p>
              </div>
              
              <div className="space-y-2">
                <Label>الاسم بالعربي</Label>
                <Input
                  value={editForm.name_ar}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name_ar: e.target.value }))}
                  placeholder="أدخل الاسم بالعربي"
                />
              </div>
              
              <div className="space-y-2">
                <Label>الوصف بالعربي</Label>
                <Textarea
                  value={editForm.description_ar}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description_ar: e.target.value }))}
                  placeholder="أدخل وصف المنتج بالعربي"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>السعر ($)</Label>
                <Input
                  type="number"
                  value={editForm.our_price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, our_price: e.target.value }))}
                  placeholder="أدخل السعر"
                />
                {editingProduct && (
                  <p className="text-xs text-muted-foreground">
                    هامش الربح: ${(parseFloat(editForm.our_price || "0") - editingProduct.do_price).toFixed(2)}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <Label>حالة المنتج</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{editForm.is_active ? "نشط" : "معطل"}</span>
                  <Switch
                    checked={editForm.is_active}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveProduct} disabled={updateProduct.isPending} className="gap-2">
                {updateProduct.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Configuration Panel */}
        <Sheet open={configPanelOpen} onOpenChange={setConfigPanelOpen}>
          <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto" dir="rtl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                خيارات تكوين DigitalOcean
              </SheetTitle>
              <SheetDescription>
                عرض المناطق والأحجام وأنظمة التشغيل المتاحة
              </SheetDescription>
            </SheetHeader>
            
            {loadingConfig ? (
              <div className="space-y-4 mt-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <div className="space-y-6 mt-6">
                {/* Account Info */}
                {accountInfo && (
                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">متصل بـ DigitalOcean</p>
                          <p className="text-sm text-muted-foreground">{accountInfo.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Regions */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    المناطق المتاحة ({regions.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {regions.map((region) => (
                      <div key={region.slug} className="p-3 rounded-lg border bg-card/50 text-sm">
                        <p className="font-medium">{region.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{region.slug}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* Sizes */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    أحجام السيرفرات ({sizes.length})
                  </h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-2 pl-4">
                      {sizes.map((size) => (
                        <div key={size.slug} className="p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{size.slug}</span>
                            <Badge variant="outline">${size.price_monthly}/شهر</Badge>
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{size.vcpus} vCPU</span>
                            <span>{size.memory / 1024} GB RAM</span>
                            <span>{size.disk} GB SSD</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <Separator />
                
                {/* Images */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    أنظمة التشغيل ({images.length})
                  </h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-2 pl-4">
                      {images.map((image) => (
                        <div key={image.id} className="p-3 rounded-lg border bg-card/50">
                          <p className="font-medium text-sm">{image.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{image.distribution}</Badge>
                            {image.slug && <span className="text-xs text-muted-foreground font-mono">{image.slug}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => setConfigPanelOpen(false)} className="w-full">
                إغلاق
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminHosting;
