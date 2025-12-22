import React, { useState, useEffect, useMemo } from 'react';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Search, 
  Save,
  CheckCircle2, 
  Package,
  Filter,
  Loader2,
  ArrowLeft,
  Percent,
  DollarSign,
  TrendingUp,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  external_service_id: string | null;
}

const AdminPriceUpdate = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Price update settings
  const [updateType, setUpdateType] = useState<'percentage' | 'fixed' | 'set'>('percentage');
  const [percentageChange, setPercentageChange] = useState<number>(10);
  const [fixedChange, setFixedChange] = useState<number>(0.5);
  const [setPrice, setSetPrice] = useState<number>(1);
  const [isIncrease, setIsIncrease] = useState(true);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('id, name, category, price, status, external_service_id')
      .order('category', { ascending: true });
    
    if (error) {
      toast.error('خطأ في جلب الخدمات');
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category));
    return Array.from(cats).sort();
  }, [services]);

  const calculateNewPrice = (originalPrice: number): number => {
    if (updateType === 'set') {
      return setPrice;
    }
    if (updateType === 'percentage') {
      const change = originalPrice * (percentageChange / 100);
      return isIncrease ? originalPrice + change : Math.max(0, originalPrice - change);
    }
    // fixed
    return isIncrease ? originalPrice + fixedChange : Math.max(0, originalPrice - fixedChange);
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.id)));
    }
  };

  const updatePrices = async () => {
    if (selectedServices.size === 0) {
      toast.error('اختر خدمة واحدة على الأقل');
      return;
    }

    setUpdating(true);
    let successCount = 0;
    
    try {
      for (const serviceId of selectedServices) {
        const service = services.find(s => s.id === serviceId);
        if (!service) continue;

        const newPrice = calculateNewPrice(service.price);
        const { error } = await supabase
          .from('services')
          .update({ price: parseFloat(newPrice.toFixed(4)) })
          .eq('id', serviceId);

        if (!error) {
          successCount++;
        }
      }

      toast.success(`تم تحديث أسعار ${successCount} خدمة بنجاح`);
      setSelectedServices(new Set());
      fetchServices();
    } catch (error) {
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setUpdating(false);
      setShowConfirmDialog(false);
    }
  };

  // Calculate summary
  const summary = useMemo(() => {
    const selected = services.filter(s => selectedServices.has(s.id));
    let totalOld = 0;
    let totalNew = 0;
    selected.forEach(s => {
      totalOld += s.price;
      totalNew += calculateNewPrice(s.price);
    });
    return {
      count: selected.length,
      totalOld,
      totalNew,
      difference: totalNew - totalOld,
    };
  }, [selectedServices, services, updateType, percentageChange, fixedChange, setPrice, isIncrease]);

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/services">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">تحديث الأسعار</h1>
              <p className="text-muted-foreground">تعديل أسعار الخدمات بشكل جماعي</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchServices} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button 
              onClick={() => setShowConfirmDialog(true)} 
              disabled={updating || selectedServices.size === 0}
              className="bg-primary"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              تطبيق ({selectedServices.size})
            </Button>
          </div>
        </div>

        {/* Price Update Settings */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              إعدادات تحديث الأسعار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>نوع التحديث</Label>
                <Select value={updateType} onValueChange={(v: 'percentage' | 'fixed' | 'set') => setUpdateType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت ($)</SelectItem>
                    <SelectItem value="set">تعيين سعر محدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {updateType !== 'set' && (
                <div className="space-y-2">
                  <Label>العملية</Label>
                  <Select value={isIncrease ? 'increase' : 'decrease'} onValueChange={(v) => setIsIncrease(v === 'increase')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">زيادة ↑</SelectItem>
                      <SelectItem value="decrease">تخفيض ↓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {updateType === 'percentage' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    النسبة
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={500}
                      value={percentageChange}
                      onChange={(e) => setPercentageChange(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              )}

              {updateType === 'fixed' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    المبلغ
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={fixedChange}
                      onChange={(e) => setFixedChange(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span className="text-muted-foreground">$</span>
                  </div>
                </div>
              )}

              {updateType === 'set' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    السعر الجديد
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={setPrice}
                      onChange={(e) => setSetPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span className="text-muted-foreground">$</span>
                  </div>
                </div>
              )}

              {selectedServices.size > 0 && (
                <div className="space-y-2">
                  <Label>ملخص التغييرات</Label>
                  <div className={`p-3 rounded-lg border ${summary.difference >= 0 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الإجمالي القديم:</span>
                      <span>{summary.totalOld.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الإجمالي الجديد:</span>
                      <span>{summary.totalNew.toFixed(2)} ر.س</span>
                    </div>
                    <div className={`flex justify-between font-bold border-t pt-2 mt-2 ${summary.difference >= 0 ? 'text-success border-success/20' : 'text-destructive border-destructive/20'}`}>
                      <span>الفرق:</span>
                      <span>{summary.difference >= 0 ? '+' : ''}{summary.difference.toFixed(2)} ر.س</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الخدمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={selectAll}>
                {selectedServices.size === filteredServices.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{services.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الخدمات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Filter className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{filteredServices.length}</p>
              <p className="text-sm text-muted-foreground">معروض</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{selectedServices.size}</p>
              <p className="text-sm text-muted-foreground">محدد</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold">
                {updateType === 'percentage' ? `${isIncrease ? '+' : '-'}${percentageChange}%` : 
                 updateType === 'fixed' ? `${isIncrease ? '+' : '-'}${fixedChange} ر.س` : 
                 `${setPrice} ر.س`}
              </p>
              <p className="text-sm text-muted-foreground">التغيير</p>
            </CardContent>
          </Card>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-3">جاري جلب الخدمات...</span>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b text-sm font-medium text-muted-foreground">
                <div className="col-span-1">
                  <Checkbox
                    checked={selectedServices.size === filteredServices.length && filteredServices.length > 0}
                    onCheckedChange={selectAll}
                  />
                </div>
                <div className="col-span-5">الخدمة</div>
                <div className="col-span-2 text-center">السعر الحالي</div>
                <div className="col-span-2 text-center">السعر الجديد</div>
                <div className="col-span-2 text-center">الفرق</div>
              </div>

              <div className="divide-y max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {filteredServices.map((service) => {
                    const newPrice = calculateNewPrice(service.price);
                    const difference = newPrice - service.price;
                    const isSelected = selectedServices.has(service.id);

                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`px-6 py-4 hover:bg-muted/30 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleService(service.id)}
                      >
                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleService(service.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="col-span-5">
                            <p className="font-medium text-sm truncate">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.category}</p>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-muted-foreground">{service.price.toFixed(2)} ر.س</span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="font-bold text-primary">{newPrice.toFixed(2)} ر.س</span>
                          </div>
                          <div className="col-span-2 text-center">
                            <Badge className={`${difference >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                              {difference >= 0 ? '+' : ''}{difference.toFixed(2)} ر.س
                            </Badge>
                          </div>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleService(service.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground mb-2">{service.category}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground line-through">{service.price.toFixed(2)} ر.س</span>
                              <span className="text-primary font-bold">{newPrice.toFixed(2)} ر.س</span>
                              <Badge className={`text-xs ${difference >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                {difference >= 0 ? '+' : ''}{difference.toFixed(2)} ر.س
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                تأكيد تحديث الأسعار
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>سيتم تحديث أسعار <strong>{summary.count}</strong> خدمة.</p>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex justify-between">
                    <span>الإجمالي القديم:</span>
                    <span>${summary.totalOld.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الإجمالي الجديد:</span>
                    <span>${summary.totalNew.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between font-bold border-t pt-2 mt-2 ${summary.difference >= 0 ? 'text-success' : 'text-destructive'}`}>
                    <span>الفرق:</span>
                    <span>{summary.difference >= 0 ? '+' : ''}{summary.difference.toFixed(2)}$</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">هذا الإجراء لا يمكن التراجع عنه.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={updatePrices} disabled={updating}>
                {updating ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                تأكيد التحديث
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminPriceUpdate;
