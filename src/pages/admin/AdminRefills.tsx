import { useState, useEffect } from 'react';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Clock, CheckCircle, XCircle, Loader2, Search, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface RefillRequest {
  id: string;
  order_id: string;
  user_id: string;
  original_quantity: number;
  current_quantity: number | null;
  refill_quantity: number | null;
  status: string;
  auto_created: boolean;
  external_refill_id: string | null;
  created_at: string;
  processed_at: string | null;
  notes: string | null;
  order?: {
    order_number: string;
    link: string;
    external_order_id: string;
    service?: {
      name: string;
    };
  };
  user?: {
    email: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
  processing: { label: 'قيد المعالجة', color: 'bg-blue-500/10 text-blue-500', icon: Loader2 },
  completed: { label: 'مكتمل', color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
  failed: { label: 'فشل', color: 'bg-red-500/10 text-red-500', icon: XCircle },
  cancelled: { label: 'ملغي', color: 'bg-gray-500/10 text-gray-500', icon: XCircle },
};

const AdminRefills = () => {
  const [refills, setRefills] = useState<RefillRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [runningCheck, setRunningCheck] = useState(false);

  useEffect(() => {
    fetchRefills();
  }, [statusFilter]);

  const fetchRefills = async () => {
    setLoading(true);
    
    let query = supabase
      .from('refill_requests')
      .select(`
        *,
        order:orders(
          order_number,
          link,
          external_order_id,
          service:services(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('فشل في تحميل طلبات إعادة التعبئة');
      console.error(error);
    } else {
      setRefills(data || []);
      
      // Calculate stats
      const allRefills = data || [];
      setStats({
        total: allRefills.length,
        pending: allRefills.filter(r => r.status === 'pending').length,
        processing: allRefills.filter(r => r.status === 'processing').length,
        completed: allRefills.filter(r => r.status === 'completed').length,
        failed: allRefills.filter(r => r.status === 'failed').length,
      });
    }

    setLoading(false);
  };

  const handleStatusChange = async (refillId: string, newStatus: string) => {
    const { error } = await supabase
      .from('refill_requests')
      .update({ 
        status: newStatus,
        processed_at: newStatus === 'completed' || newStatus === 'failed' ? new Date().toISOString() : null
      })
      .eq('id', refillId);

    if (error) {
      toast.error('فشل في تحديث الحالة');
    } else {
      toast.success('تم تحديث الحالة');
      fetchRefills();
    }
  };

  const runAutoCheck = async () => {
    setRunningCheck(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-refills');
      
      if (error) throw error;
      
      toast.success(`تم الفحص: ${data.checked} طلب، ${data.refillsCreated} إعادة تعبئة جديدة`);
      fetchRefills();
    } catch (error: any) {
      toast.error('فشل في تشغيل الفحص التلقائي');
      console.error(error);
    } finally {
      setRunningCheck(false);
    }
  };

  const filteredRefills = refills.filter(refill => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      refill.order?.order_number?.toLowerCase().includes(search) ||
      refill.order?.service?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-primary" />
              إعادة التعبئة (Refill)
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة طلبات إعادة التعبئة والفحص التلقائي
            </p>
          </div>
          <Button onClick={runAutoCheck} disabled={runningCheck} className="gap-2">
            {runningCheck ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            تشغيل الفحص التلقائي
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">الإجمالي</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
                <p className="text-sm text-muted-foreground">قيد المعالجة</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">مكتمل</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">فشل</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الطلب أو الخدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="processing">قيد المعالجة</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="failed">فشل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Refills Table */}
        <Card>
          <CardHeader>
            <CardTitle>طلبات إعادة التعبئة</CardTitle>
            <CardDescription>جميع طلبات إعادة التعبئة وحالتها</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredRefills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>لا توجد طلبات إعادة تعبئة</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>الخدمة</TableHead>
                    <TableHead>الكمية الأصلية</TableHead>
                    <TableHead>كمية إعادة التعبئة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefills.map((refill) => {
                    const config = statusConfig[refill.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={refill.id}>
                        <TableCell className="font-mono text-sm">
                          {refill.order?.order_number || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="truncate max-w-[200px] block">
                            {refill.order?.service?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell>{refill.original_quantity?.toLocaleString()}</TableCell>
                        <TableCell>
                          {refill.refill_quantity ? refill.refill_quantity.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={refill.auto_created ? 'secondary' : 'outline'}>
                            {refill.auto_created ? 'تلقائي' : 'يدوي'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(refill.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          {refill.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(refill.id, 'processing')}
                              >
                                معالجة
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                onClick={() => handleStatusChange(refill.id, 'cancelled')}
                              >
                                إلغاء
                              </Button>
                            </div>
                          )}
                          {refill.status === 'processing' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-500"
                                onClick={() => handleStatusChange(refill.id, 'completed')}
                              >
                                مكتمل
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                onClick={() => handleStatusChange(refill.id, 'failed')}
                              >
                                فشل
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminRefills;
