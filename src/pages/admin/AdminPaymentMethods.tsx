import { useState, useEffect } from 'react';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Plus, Edit, Trash2, Loader2, DollarSign, Percent, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentMethod {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  provider: string | null;
  instructions: string | null;
  instructions_ar: string | null;
  extra_fee_type: string;
  extra_fee_value: number;
  min_amount: number;
  max_amount: number | null;
  is_active: boolean;
  display_order: number;
}

interface PaymentBonus {
  id: string;
  payment_method_id: string | null;
  min_amount: number;
  max_amount: number | null;
  bonus_type: string;
  bonus_value: number;
  is_active: boolean;
}

const AdminPaymentMethods = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [bonuses, setBonuses] = useState<PaymentBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
  const [isBonusDialogOpen, setIsBonusDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedBonus, setSelectedBonus] = useState<PaymentBonus | null>(null);
  const [saving, setSaving] = useState(false);

  const [methodForm, setMethodForm] = useState({
    name: '',
    name_ar: '',
    type: 'manual',
    provider: '',
    instructions: '',
    instructions_ar: '',
    extra_fee_type: 'percentage',
    extra_fee_value: 0,
    min_amount: 0,
    max_amount: '',
    is_active: true,
    display_order: 0,
  });

  const [bonusForm, setBonusForm] = useState({
    payment_method_id: '',
    min_amount: 0,
    max_amount: '',
    bonus_type: 'percentage',
    bonus_value: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [methodsRes, bonusesRes] = await Promise.all([
      supabase.from('payment_methods').select('*').order('display_order'),
      supabase.from('payment_bonuses').select('*').order('min_amount'),
    ]);

    if (methodsRes.data) setMethods(methodsRes.data);
    if (bonusesRes.data) setBonuses(bonusesRes.data);
    
    setLoading(false);
  };

  const handleSaveMethod = async () => {
    if (!methodForm.name || !methodForm.name_ar) {
      toast.error('يرجى إدخال اسم طريقة الدفع');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...methodForm,
        max_amount: methodForm.max_amount ? parseFloat(methodForm.max_amount) : null,
        provider: methodForm.provider || null,
      };

      if (selectedMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(data)
          .eq('id', selectedMethod.id);
        if (error) throw error;
        toast.success('تم تحديث طريقة الدفع');
      } else {
        const { error } = await supabase.from('payment_methods').insert(data);
        if (error) throw error;
        toast.success('تم إضافة طريقة الدفع');
      }

      setIsMethodDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBonus = async () => {
    if (bonusForm.bonus_value <= 0) {
      toast.error('يرجى إدخال قيمة البونص');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...bonusForm,
        payment_method_id: bonusForm.payment_method_id || null,
        max_amount: bonusForm.max_amount ? parseFloat(bonusForm.max_amount) : null,
      };

      if (selectedBonus) {
        const { error } = await supabase
          .from('payment_bonuses')
          .update(data)
          .eq('id', selectedBonus.id);
        if (error) throw error;
        toast.success('تم تحديث البونص');
      } else {
        const { error } = await supabase.from('payment_bonuses').insert(data);
        if (error) throw error;
        toast.success('تم إضافة البونص');
      }

      setIsBonusDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع؟')) return;
    
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) {
      toast.error('فشل في حذف طريقة الدفع');
    } else {
      toast.success('تم حذف طريقة الدفع');
      fetchData();
    }
  };

  const handleDeleteBonus = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف البونص؟')) return;
    
    const { error } = await supabase.from('payment_bonuses').delete().eq('id', id);
    if (error) {
      toast.error('فشل في حذف البونص');
    } else {
      toast.success('تم حذف البونص');
      fetchData();
    }
  };

  const openMethodDialog = (method?: PaymentMethod) => {
    if (method) {
      setSelectedMethod(method);
      setMethodForm({
        name: method.name,
        name_ar: method.name_ar,
        type: method.type,
        provider: method.provider || '',
        instructions: method.instructions || '',
        instructions_ar: method.instructions_ar || '',
        extra_fee_type: method.extra_fee_type,
        extra_fee_value: method.extra_fee_value,
        min_amount: method.min_amount,
        max_amount: method.max_amount?.toString() || '',
        is_active: method.is_active,
        display_order: method.display_order,
      });
    } else {
      setSelectedMethod(null);
      setMethodForm({
        name: '',
        name_ar: '',
        type: 'manual',
        provider: '',
        instructions: '',
        instructions_ar: '',
        extra_fee_type: 'percentage',
        extra_fee_value: 0,
        min_amount: 0,
        max_amount: '',
        is_active: true,
        display_order: methods.length,
      });
    }
    setIsMethodDialogOpen(true);
  };

  const openBonusDialog = (bonus?: PaymentBonus) => {
    if (bonus) {
      setSelectedBonus(bonus);
      setBonusForm({
        payment_method_id: bonus.payment_method_id || '',
        min_amount: bonus.min_amount,
        max_amount: bonus.max_amount?.toString() || '',
        bonus_type: bonus.bonus_type,
        bonus_value: bonus.bonus_value,
        is_active: bonus.is_active,
      });
    } else {
      setSelectedBonus(null);
      setBonusForm({
        payment_method_id: '',
        min_amount: 0,
        max_amount: '',
        bonus_type: 'percentage',
        bonus_value: 0,
        is_active: true,
      });
    }
    setIsBonusDialogOpen(true);
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-4 md:space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              طرق الدفع
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              إدارة طرق الدفع والبونصات
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openBonusDialog()} variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm">
              <Gift className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إضافة بونص</span>
            </Button>
            <Button onClick={() => openMethodDialog()} size="sm" className="gap-1.5 text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إضافة طريقة</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{methods.length}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">طرق الدفع</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{methods.filter(m => m.is_active).length}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">مفعّلة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{bonuses.length}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">البونصات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{bonuses.filter(b => b.is_active).length}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">بونصات مفعّلة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>طرق الدفع</CardTitle>
            <CardDescription>قائمة جميع طرق الدفع المتاحة</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>لا توجد طرق دفع</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الرسوم</TableHead>
                    <TableHead>الحدود</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{method.name_ar}</p>
                          <p className="text-sm text-muted-foreground">{method.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={method.type === 'automatic' ? 'default' : 'secondary'}>
                          {method.type === 'automatic' ? 'تلقائي' : 'يدوي'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {method.extra_fee_value > 0 ? (
                          <span>
                            {method.extra_fee_value}
                            {method.extra_fee_type === 'percentage' ? '%' : ' ر.س'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">بدون رسوم</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {method.min_amount} ر.س - {method.max_amount ? `${method.max_amount} ر.س` : '∞'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={method.is_active ? 'default' : 'secondary'}>
                          {method.is_active ? 'مفعّل' : 'معطّل'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openMethodDialog(method)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteMethod(method.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Bonuses */}
        <Card>
          <CardHeader>
            <CardTitle>بونصات الإيداع</CardTitle>
            <CardDescription>مكافآت على عمليات الإيداع</CardDescription>
          </CardHeader>
          <CardContent>
            {bonuses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>لا توجد بونصات</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>نطاق المبلغ</TableHead>
                    <TableHead>البونص</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonuses.map((bonus) => {
                    const method = methods.find(m => m.id === bonus.payment_method_id);
                    return (
                      <TableRow key={bonus.id}>
                        <TableCell>
                          {method ? method.name_ar : 'جميع الطرق'}
                        </TableCell>
                        <TableCell>
                          {bonus.min_amount} ر.س - {bonus.max_amount ? `${bonus.max_amount} ر.س` : '∞'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-success/10 text-success">
                            +{bonus.bonus_value}{bonus.bonus_type === 'percentage' ? '%' : ' ر.س'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={bonus.is_active ? 'default' : 'secondary'}>
                            {bonus.is_active ? 'مفعّل' : 'معطّل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openBonusDialog(bonus)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBonus(bonus.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Method Dialog */}
        <Dialog open={isMethodDialogOpen} onOpenChange={setIsMethodDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع'}</DialogTitle>
              <DialogDescription>أدخل تفاصيل طريقة الدفع</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم (إنجليزي)</Label>
                  <Input
                    value={methodForm.name}
                    onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                    placeholder="Payment Method"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input
                    value={methodForm.name_ar}
                    onChange={(e) => setMethodForm({ ...methodForm, name_ar: e.target.value })}
                    placeholder="طريقة الدفع"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={methodForm.type} onValueChange={(v) => setMethodForm({ ...methodForm, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">يدوي</SelectItem>
                      <SelectItem value="automatic">تلقائي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المزود (اختياري)</Label>
                  <Input
                    value={methodForm.provider}
                    onChange={(e) => setMethodForm({ ...methodForm, provider: e.target.value })}
                    placeholder="stripe, paypal..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>التعليمات (عربي)</Label>
                <Textarea
                  value={methodForm.instructions_ar}
                  onChange={(e) => setMethodForm({ ...methodForm, instructions_ar: e.target.value })}
                  placeholder="تعليمات الدفع..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>نوع الرسوم</Label>
                  <Select value={methodForm.extra_fee_type} onValueChange={(v) => setMethodForm({ ...methodForm, extra_fee_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة %</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>قيمة الرسوم</Label>
                  <Input
                    type="number"
                    min={0}
                    value={methodForm.extra_fee_value}
                    onChange={(e) => setMethodForm({ ...methodForm, extra_fee_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الترتيب</Label>
                  <Input
                    type="number"
                    min={0}
                    value={methodForm.display_order}
                    onChange={(e) => setMethodForm({ ...methodForm, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأدنى ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={methodForm.min_amount}
                    onChange={(e) => setMethodForm({ ...methodForm, min_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={methodForm.max_amount}
                    onChange={(e) => setMethodForm({ ...methodForm, max_amount: e.target.value })}
                    placeholder="بدون حد"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={methodForm.is_active}
                  onCheckedChange={(checked) => setMethodForm({ ...methodForm, is_active: checked })}
                />
                <Label>طريقة الدفع مفعّلة</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMethodDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSaveMethod} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                {selectedMethod ? 'حفظ التغييرات' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bonus Dialog */}
        <Dialog open={isBonusDialogOpen} onOpenChange={setIsBonusDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedBonus ? 'تعديل البونص' : 'إضافة بونص'}</DialogTitle>
              <DialogDescription>أدخل تفاصيل البونص</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>طريقة الدفع (اختياري)</Label>
                <Select value={bonusForm.payment_method_id} onValueChange={(v) => setBonusForm({ ...bonusForm, payment_method_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الطرق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الطرق</SelectItem>
                    {methods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>{method.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأدنى ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={bonusForm.min_amount}
                    onChange={(e) => setBonusForm({ ...bonusForm, min_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={bonusForm.max_amount}
                    onChange={(e) => setBonusForm({ ...bonusForm, max_amount: e.target.value })}
                    placeholder="بدون حد"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع البونص</Label>
                  <Select value={bonusForm.bonus_type} onValueChange={(v) => setBonusForm({ ...bonusForm, bonus_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة %</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>قيمة البونص</Label>
                  <Input
                    type="number"
                    min={0}
                    value={bonusForm.bonus_value}
                    onChange={(e) => setBonusForm({ ...bonusForm, bonus_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={bonusForm.is_active}
                  onCheckedChange={(checked) => setBonusForm({ ...bonusForm, is_active: checked })}
                />
                <Label>البونص مفعّل</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBonusDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSaveBonus} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                {selectedBonus ? 'حفظ التغييرات' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminPaymentMethods;
