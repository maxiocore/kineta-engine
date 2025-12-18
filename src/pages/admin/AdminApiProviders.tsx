import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Globe, 
  Key, 
  RefreshCw,
  Server,
  Link2,
  CheckCircle,
  XCircle,
  Star,
  Percent,
  Package,
  Clock,
  Eye,
  EyeOff,
  Download,
  BarChart3,
  Scale
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ApiProvider {
  id: string;
  name: string;
  name_ar: string;
  api_url: string;
  api_key: string;
  is_active: boolean;
  is_default: boolean;
  profit_margin: number;
  last_sync_at: string | null;
  services_count: number;
  created_at: string;
  updated_at: string;
}

const AdminApiProviders = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    api_url: '',
    api_key: '',
    is_active: true,
    is_default: false,
    profit_margin: 30,
  });

  // Fetch providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['api-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_providers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ApiProvider[];
    },
  });

  // Create provider mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('api_providers')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('تم إضافة المزود بنجاح');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error('فشل في إضافة المزود: ' + error.message);
    },
  });

  // Update provider mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('api_providers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('تم تحديث المزود بنجاح');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error('فشل في تحديث المزود: ' + error.message);
    },
  });

  // Delete provider mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_providers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('تم حذف المزود بنجاح');
      setIsDeleteDialogOpen(false);
      setSelectedProvider(null);
    },
    onError: (error: Error) => {
      toast.error('فشل في حذف المزود: ' + error.message);
    },
  });

  // Set as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase
        .from('api_providers')
        .update({ is_default: false })
        .neq('id', id);
      
      // Then set the new default
      const { error } = await supabase
        .from('api_providers')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      toast.success('تم تعيين المزود الافتراضي');
    },
    onError: (error: Error) => {
      toast.error('فشل في تعيين المزود الافتراضي: ' + error.message);
    },
  });

  const handleOpenDialog = (provider?: ApiProvider) => {
    if (provider) {
      setSelectedProvider(provider);
      setFormData({
        name: provider.name,
        name_ar: provider.name_ar,
        api_url: provider.api_url,
        api_key: provider.api_key,
        is_active: provider.is_active,
        is_default: provider.is_default,
        profit_margin: provider.profit_margin,
      });
    } else {
      setSelectedProvider(null);
      setFormData({
        name: '',
        name_ar: '',
        api_url: '',
        api_key: '',
        is_active: true,
        is_default: false,
        profit_margin: 30,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProvider(null);
    setFormData({
      name: '',
      name_ar: '',
      api_url: '',
      api_key: '',
      is_active: true,
      is_default: false,
      profit_margin: 30,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name_ar || !formData.api_url || !formData.api_key) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (selectedProvider) {
      updateMutation.mutate({ id: selectedProvider.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleTestConnection = async (provider: ApiProvider) => {
    setIsTestingConnection(provider.id);
    
    try {
      const response = await fetch(provider.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: provider.api_key,
          action: 'services',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          toast.success('اتصال ناجح! تم العثور على ' + (Array.isArray(data) ? data.length : 0) + ' خدمة');
        } else {
          toast.error('فشل الاتصال: ' + (data.error || 'خطأ غير معروف'));
        }
      } else {
        toast.error('فشل الاتصال: ' + response.statusText);
      }
    } catch (error) {
      toast.error('فشل الاتصال: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      setIsTestingConnection(null);
    }
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const stats = {
    total: providers.length,
    active: providers.filter(p => p.is_active).length,
    totalServices: providers.reduce((sum, p) => sum + p.services_count, 0),
    defaultProvider: providers.find(p => p.is_default),
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">إعدادات المزودين</h1>
            <p className="text-muted-foreground mt-1">إدارة مواقع SMM الخارجية واستيراد الخدمات</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/providers/reports">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                تقارير المزودين
              </Button>
            </Link>
            <Link to="/admin/providers/compare">
              <Button variant="outline" className="gap-2">
                <Scale className="h-4 w-4" />
                مقارنة الأسعار
              </Button>
            </Link>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة مزود جديد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المزودين</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المزودين النشطين</p>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الخدمات</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalServices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المزود الافتراضي</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {stats.defaultProvider?.name_ar || 'غير محدد'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Providers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Server className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا يوجد مزودين</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة مزود SMM لاستيراد الخدمات</p>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة مزود جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card 
                key={provider.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  provider.is_default ? 'ring-2 ring-primary' : ''
                } ${!provider.is_active ? 'opacity-60' : ''}`}
              >
                {provider.is_default && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {provider.name_ar}
                        {provider.is_default && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                            افتراضي
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{provider.name}</p>
                    </div>
                    <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                      {provider.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* API URL */}
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-muted-foreground" title={provider.api_url}>
                      {provider.api_url}
                    </span>
                  </div>
                  
                  {/* API Key */}
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-muted-foreground">
                      {showApiKey[provider.id] 
                        ? provider.api_key 
                        : '••••••••••••••••'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleApiKeyVisibility(provider.id)}
                    >
                      {showApiKey[provider.id] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{provider.profit_margin}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{provider.services_count} خدمة</span>
                    </div>
                  </div>
                  
                  {/* Last Sync */}
                  {provider.last_sync_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      آخر مزامنة: {format(new Date(provider.last_sync_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleTestConnection(provider)}
                      disabled={isTestingConnection === provider.id}
                    >
                      {isTestingConnection === provider.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Link2 className="h-3 w-3" />
                      )}
                      اختبار
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setIsImportDialogOpen(true);
                      }}
                    >
                      <Download className="h-3 w-3" />
                      استيراد
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(provider)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    
                    {!provider.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(provider.id)}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedProvider ? 'تعديل المزود' : 'إضافة مزود جديد'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم (English)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="BulkFollows"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar">الاسم (عربي)</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="بلك فولورز"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_url">رابط API</Label>
                <Input
                  id="api_url"
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  placeholder="https://example.com/api/v2"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_key">مفتاح API</Label>
                <Input
                  id="api_key"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="your-api-key"
                  dir="ltr"
                  type="password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profit_margin">نسبة الربح (%)</Label>
                <Input
                  id="profit_margin"
                  type="number"
                  min="0"
                  max="500"
                  value={formData.profit_margin}
                  onChange={(e) => setFormData({ ...formData, profit_margin: Number(e.target.value) })}
                  dir="ltr"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">تفعيل المزود</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_default">تعيين كمزود افتراضي</Label>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : null}
                  {selectedProvider ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف المزود</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف المزود "{selectedProvider?.name_ar}"؟ 
                سيتم فصل جميع الخدمات المرتبطة به.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => selectedProvider && deleteMutation.mutate(selectedProvider.id)}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import Dialog - Redirect to import page */}
        <AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>استيراد الخدمات</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم توجيهك إلى صفحة استيراد الخدمات من المزود "{selectedProvider?.name_ar}"
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  window.location.href = `/admin/services/import?provider=${selectedProvider?.id}`;
                }}
              >
                متابعة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminApiProviders;
