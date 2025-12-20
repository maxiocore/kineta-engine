import { useState, useEffect, useCallback } from 'react';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Key, Plus, Copy, Trash2, Loader2, Eye, EyeOff, Code, Book, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

interface APIUsageLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
}

const ClientAPI = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [usageLogs, setUsageLogs] = useState<APIUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    const [keysRes, logsRes] = await Promise.all([
      supabase
        .from('api_keys')
        .select('id, name, prefix, is_active, last_used_at, created_at, expires_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    if (keysRes.data) setApiKeys(keysRes.data);
    if (logsRes.data) setUsageLogs(logsRes.data);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateAPIKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const hashKey = async (key: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateKey = async () => {
    if (!user || !newKeyName.trim()) {
      toast.error('يرجى إدخال اسم للمفتاح');
      return;
    }

    setCreating(true);
    try {
      const apiKey = generateAPIKey();
      const prefix = apiKey.substring(0, 8);
      const keyHash = await hashKey(apiKey);

      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name: newKeyName.trim(),
        prefix,
        key_hash: keyHash,
        is_active: true,
      });

      if (error) throw error;

      setNewKeyValue(apiKey);
      toast.success('تم إنشاء مفتاح API بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'فشل في إنشاء المفتاح');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleKey = async (key: APIKey) => {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: !key.is_active })
      .eq('id', key.id);

    if (error) {
      toast.error('فشل في تحديث حالة المفتاح');
    } else {
      toast.success(key.is_active ? 'تم تعطيل المفتاح' : 'تم تفعيل المفتاح');
      fetchData();
    }
  };

  const handleDeleteKey = async () => {
    if (!selectedKey) return;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', selectedKey.id);

    if (error) {
      toast.error('فشل في حذف المفتاح');
    } else {
      toast.success('تم حذف المفتاح');
      setIsDeleteDialogOpen(false);
      fetchData();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  };

  const apiEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-api`;

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 md:space-y-6 px-1" dir="rtl">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col gap-3 md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
              <Key className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              واجهة البرمجة (API)
            </h1>
            <p className="text-xs md:text-base text-muted-foreground mt-1">
              إدارة مفاتيح API والوصول البرمجي
            </p>
          </div>
          <Button onClick={() => {
            setNewKeyName('');
            setNewKeyValue(null);
            setIsCreateDialogOpen(true);
          }} className="gap-2 w-full md:w-auto h-9 md:h-10 text-sm">
            <Plus className="w-4 h-4" />
            إنشاء مفتاح جديد
          </Button>
        </div>

        <Tabs defaultValue="keys" className="space-y-4">
          <TabsList>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="w-4 h-4" />
              المفاتيح
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <Book className="w-4 h-4" />
              التوثيق
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="w-4 h-4" />
              سجل الاستخدام
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-4">
            {/* API Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">رابط API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-secondary rounded-lg text-sm font-mono overflow-x-auto">
                    {apiEndpoint}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiEndpoint)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Keys List */}
            <Card>
              <CardHeader>
                <CardTitle>مفاتيح API</CardTitle>
                <CardDescription>قائمة جميع مفاتيح API الخاصة بك</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>لا توجد مفاتيح API</p>
                    <p className="text-sm">قم بإنشاء مفتاح جديد للبدء</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البادئة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>آخر استخدام</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <code className="px-2 py-1 bg-secondary rounded text-sm">
                              {key.prefix}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={key.is_active ? 'default' : 'secondary'}>
                              {key.is_active ? 'مفعّل' : 'معطّل'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {key.last_used_at 
                              ? format(new Date(key.last_used_at), 'dd MMM yyyy HH:mm', { locale: ar })
                              : 'لم يُستخدم بعد'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(key.created_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={key.is_active}
                                onCheckedChange={() => handleToggleKey(key)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedKey(key);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
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
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>توثيق API</CardTitle>
                <CardDescription>دليل استخدام واجهة البرمجة</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {/* Authentication */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">المصادقة</h3>
                      <p className="text-muted-foreground mb-2">
                        أضف مفتاح API في header الطلب:
                      </p>
                      <code className="block p-3 bg-secondary rounded-lg text-sm">
                        X-API-Key: YOUR_API_KEY
                      </code>
                    </div>

                    {/* Endpoints */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">النقاط النهائية</h3>

                      {/* Services */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>GET</Badge>
                          <code>/services</code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">الحصول على قائمة الخدمات المتاحة</p>
                        <pre className="p-3 bg-secondary rounded-lg text-xs overflow-x-auto">
{`// Response
[
  {
    "id": "...",
    "name": "Service Name",
    "category": "Category",
    "price": 0.5,
    "refill_enabled": true
  }
]`}
                        </pre>
                      </div>

                      {/* Balance */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>GET</Badge>
                          <code>/balance</code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">الحصول على رصيد الحساب</p>
                        <pre className="p-3 bg-secondary rounded-lg text-xs overflow-x-auto">
{`// Response
{
  "balance": 100.50,
  "total_deposited": 500.00,
  "total_spent": 399.50
}`}
                        </pre>
                      </div>

                      {/* Create Order */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">POST</Badge>
                          <code>/order</code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">إنشاء طلب جديد</p>
                        <pre className="p-3 bg-secondary rounded-lg text-xs overflow-x-auto">
{`// Request
{
  "service": "service_id",
  "link": "https://...",
  "quantity": 1000
}

// Response
{
  "order": "order_id",
  "order_number": "ORD-..."
}`}
                        </pre>
                      </div>

                      {/* Order Status */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">POST</Badge>
                          <code>/status</code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">الحصول على حالة طلب</p>
                        <pre className="p-3 bg-secondary rounded-lg text-xs overflow-x-auto">
{`// Request
{ "order": "order_id" }

// Response
{
  "id": "...",
  "status": "completed",
  "quantity": 1000
}`}
                        </pre>
                      </div>

                      {/* Orders List */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>GET</Badge>
                          <code>/orders?limit=100&offset=0</code>
                        </div>
                        <p className="text-sm text-muted-foreground">الحصول على قائمة الطلبات</p>
                      </div>

                      {/* Refill */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">POST</Badge>
                          <code>/refill</code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">طلب إعادة تعبئة</p>
                        <pre className="p-3 bg-secondary rounded-lg text-xs overflow-x-auto">
{`// Request
{ "order": "order_id" }

// Response
{ "refill": "refill_id" }`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>سجل الاستخدام</CardTitle>
                <CardDescription>آخر 100 طلب API</CardDescription>
              </CardHeader>
              <CardContent>
                {usageLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>لا توجد سجلات استخدام</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>النقطة النهائية</TableHead>
                        <TableHead>الطريقة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>وقت الاستجابة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <code className="text-sm">/{log.endpoint}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.method === 'GET' ? 'default' : 'secondary'}>
                              {log.method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.status_code === 200 ? 'default' : 'destructive'}>
                              {log.status_code}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.response_time_ms}ms
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), 'dd MMM HH:mm:ss', { locale: ar })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Key Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مفتاح API جديد</DialogTitle>
              <DialogDescription>
                {newKeyValue 
                  ? 'احفظ هذا المفتاح الآن - لن تتمكن من رؤيته مرة أخرى!'
                  : 'أدخل اسمًا للمفتاح الجديد'}
              </DialogDescription>
            </DialogHeader>

            {newKeyValue ? (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning font-medium mb-2">⚠️ هام</p>
                  <p className="text-sm text-muted-foreground">
                    هذا المفتاح لن يظهر مرة أخرى. احفظه في مكان آمن الآن.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={newKeyValue}
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(newKeyValue)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>اسم المفتاح</Label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="مثال: مفتاح التطبيق الرئيسي"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              {newKeyValue ? (
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  تم الحفظ
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreateKey} disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    إنشاء المفتاح
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف مفتاح API "{selectedKey?.name}" نهائياً. لن تتمكن من استخدامه بعد الحذف.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteKey}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientAPI;
