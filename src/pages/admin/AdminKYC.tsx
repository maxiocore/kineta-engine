import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Shield, CheckCircle, XCircle, Clock, Eye, Search, Filter, 
  Loader2, User, FileText, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface KYCVerification {
  id: string;
  user_id: string;
  session_id: string;
  national_id: string;
  status: string;
  document_type: string | null;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  ocr_confidence: number | null;
  liveness_score: number | null;
  face_match_score: number | null;
  ai_analysis: any;
  extracted_data: any;
  failure_reasons: string[] | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  admin_reviewed_at: string | null;
  admin_reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

const AdminKYC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedKYC, setSelectedKYC] = useState<KYCVerification | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [stats, setStats] = useState({ total: 0, pending: 0, passed: 0, failed: 0 });

  useEffect(() => {
    fetchVerifications();

    // Realtime subscription
    const channel = supabase
      .channel('kyc-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kyc_verifications' }, () => {
        fetchVerifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const fetchVerifications = async () => {
    setLoading(true);
    let query = supabase
      .from('kyc_verifications' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query as { data: any[] | null; error: any };
    if (error) {
      console.error('Error fetching KYC:', error);
      toast.error('خطأ في جلب البيانات');
    } else {
      const records = (data || []) as KYCVerification[];
      setVerifications(records);
      
      // Calculate stats
      setStats({
        total: records.length,
        pending: records.filter(r => r.status === 'PENDING').length,
        passed: records.filter(r => r.status === 'PASSED').length,
        failed: records.filter(r => r.status === 'FAILED').length,
      });

      // Fetch user profiles
      const userIds = [...new Set(records.map(r => r.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url')
          .in('id', userIds);
        
        if (profiles) {
          const map: Record<string, UserProfile> = {};
          profiles.forEach((p: any) => { map[p.id] = p; });
          setUserProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  const getDocumentUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('kyc-documents').getPublicUrl(path);
    return data?.publicUrl;
  };

  const handleApprove = async () => {
    if (!selectedKYC || !user) return;
    setActionLoading(true);
    try {
      await supabase.from('kyc_verifications' as any).update({
        status: 'PASSED',
        admin_reviewed_at: new Date().toISOString(),
        admin_reviewed_by: user.id,
        admin_notes: adminNotes || null,
        verified_at: new Date().toISOString(),
        verified_data: selectedKYC.extracted_data,
      } as any).eq('id', selectedKYC.id);

      // Audit log
      await supabase.from('verification_audit_logs').insert({
        user_id: selectedKYC.user_id,
        session_id: selectedKYC.session_id,
        verification_type: 'ADMIN_REVIEW',
        attempt_number: 1,
        status: 'success',
        result_code: 'APPROVED',
        result_message: 'Approved by admin',
        metadata: { admin_id: user.id, admin_notes: adminNotes },
      } as any);

      toast.success('تمت الموافقة على التحقق');
      setReviewDialogOpen(false);
      setSelectedKYC(null);
      setAdminNotes('');
      fetchVerifications();
    } catch (err) {
      toast.error('حدث خطأ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKYC || !user || !rejectionReason) return;
    setActionLoading(true);
    try {
      await supabase.from('kyc_verifications' as any).update({
        status: 'FAILED',
        admin_reviewed_at: new Date().toISOString(),
        admin_reviewed_by: user.id,
        admin_notes: adminNotes || null,
        rejection_reason: rejectionReason,
        failure_reasons: [rejectionReason],
      } as any).eq('id', selectedKYC.id);

      await supabase.from('verification_audit_logs').insert({
        user_id: selectedKYC.user_id,
        session_id: selectedKYC.session_id,
        verification_type: 'ADMIN_REVIEW',
        attempt_number: 1,
        status: 'failed',
        result_code: 'REJECTED',
        result_message: rejectionReason,
        metadata: { admin_id: user.id, rejection_reason: rejectionReason, admin_notes: adminNotes },
      } as any);

      toast.success('تم رفض التحقق');
      setReviewDialogOpen(false);
      setSelectedKYC(null);
      setRejectionReason('');
      setAdminNotes('');
      fetchVerifications();
    } catch (err) {
      toast.error('حدث خطأ');
    } finally {
      setActionLoading(false);
    }
  };

  const openReview = (kyc: KYCVerification) => {
    setSelectedKYC(kyc);
    setAdminNotes(kyc.admin_notes || '');
    setRejectionReason(kyc.rejection_reason || '');
    setReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">مقبول</Badge>;
      case 'FAILED': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">مرفوض</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">قيد المراجعة</Badge>;
      case 'EXPIRED': return <Badge className="bg-muted text-muted-foreground">منتهي</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const docTypeLabel = (type: string | null) => {
    if (type === 'national_id') return 'هوية وطنية';
    if (type === 'iqama') return 'إقامة';
    if (type === 'passport') return 'جواز سفر';
    return type || '-';
  };

  const filteredVerifications = verifications.filter(v => {
    if (!search) return true;
    const profile = userProfiles[v.user_id];
    const searchLower = search.toLowerCase();
    return (
      v.national_id?.includes(search) ||
      v.session_id?.includes(search) ||
      profile?.full_name?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> إدارة التحقق من الهوية (KYC)
            </h1>
            <p className="text-muted-foreground text-sm mt-1">مراجعة طلبات التحقق والموافقة أو الرفض</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الطلبات', value: stats.total, icon: FileText, color: 'text-primary' },
            { label: 'قيد المراجعة', value: stats.pending, icon: Clock, color: 'text-amber-400' },
            { label: 'مقبول', value: stats.passed, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'مرفوض', value: stats.failed, icon: XCircle, color: 'text-red-400' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو رقم الهوية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="تصفية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="PENDING">قيد المراجعة</SelectItem>
              <SelectItem value="PASSED">مقبول</SelectItem>
              <SelectItem value="FAILED">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredVerifications.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">لا توجد طلبات تحقق</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredVerifications.map((kyc) => {
              const profile = userProfiles[kyc.user_id];
              return (
                <Card key={kyc.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openReview(kyc)}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{profile?.full_name || 'مستخدم'}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email || kyc.user_id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-xs text-muted-foreground">{docTypeLabel(kyc.document_type)}</span>
                        <span className="text-xs font-mono text-muted-foreground">{kyc.national_id?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}</span>
                        {kyc.ocr_confidence != null && (
                          <Badge variant="outline" className="text-xs">ثقة: {Math.round(kyc.ocr_confidence * 100)}%</Badge>
                        )}
                        {getStatusBadge(kyc.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(kyc.created_at), 'yyyy/MM/dd HH:mm', { locale: ar })}
                        </span>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" /> مراجعة طلب التحقق
              </DialogTitle>
            </DialogHeader>

            {selectedKYC && (
              <div className="space-y-4">
                {/* User Info */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">{userProfiles[selectedKYC.user_id]?.full_name || 'مستخدم'}</p>
                  <p className="text-sm text-muted-foreground">{userProfiles[selectedKYC.user_id]?.email}</p>
                </div>

                {/* Extracted Data */}
                {selectedKYC.extracted_data && (
                  <div>
                    <h4 className="font-medium mb-2">البيانات المستخرجة (AI)</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedKYC.extracted_data).map(([key, value]) => (
                        <div key={key} className="p-2 bg-muted/20 rounded-lg">
                          <p className="text-xs text-muted-foreground">{key}</p>
                          <p className="font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <h4 className="font-medium mb-2">صور الوثائق</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedKYC.document_front_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">الجهة الأمامية</p>
                        <img 
                          src={getDocumentUrl(selectedKYC.document_front_url) || ''} 
                          alt="Front" 
                          className="w-full h-40 object-cover rounded-lg border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    {selectedKYC.document_back_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">الجهة الخلفية</p>
                        <img 
                          src={getDocumentUrl(selectedKYC.document_back_url) || ''} 
                          alt="Back" 
                          className="w-full h-40 object-cover rounded-lg border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    {selectedKYC.selfie_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">الصورة الشخصية</p>
                        <img 
                          src={getDocumentUrl(selectedKYC.selfie_url) || ''} 
                          alt="Selfie" 
                          className="w-full h-40 object-cover rounded-lg border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/20 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">OCR</p>
                    <p className="text-lg font-bold">{selectedKYC.ocr_confidence ? `${Math.round(selectedKYC.ocr_confidence * 100)}%` : '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">حيوية</p>
                    <p className="text-lg font-bold">{selectedKYC.liveness_score ? `${Math.round(selectedKYC.liveness_score * 100)}%` : '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">مطابقة وجه</p>
                    <p className="text-lg font-bold">{selectedKYC.face_match_score ? `${Math.round(selectedKYC.face_match_score * 100)}%` : '-'}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="text-sm font-medium mb-1 block">ملاحظات المشرف</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظاتك هنا..."
                    rows={3}
                  />
                </div>

                {selectedKYC.status === 'PENDING' && (
                  <>
                    {/* Rejection Reason */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">سبب الرفض (مطلوب في حال الرفض)</label>
                      <Select value={rejectionReason} onValueChange={setRejectionReason}>
                        <SelectTrigger><SelectValue placeholder="اختر سبب الرفض..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="صورة الوثيقة غير واضحة">صورة الوثيقة غير واضحة</SelectItem>
                          <SelectItem value="الوثيقة منتهية الصلاحية">الوثيقة منتهية الصلاحية</SelectItem>
                          <SelectItem value="البيانات غير مطابقة">البيانات غير مطابقة</SelectItem>
                          <SelectItem value="الوثيقة مشبوهة أو معدّلة">الوثيقة مشبوهة أو معدّلة</SelectItem>
                          <SelectItem value="الصورة الشخصية غير واضحة">الصورة الشخصية غير واضحة</SelectItem>
                          <SelectItem value="نوع الوثيقة غير مقبول">نوع الوثيقة غير مقبول</SelectItem>
                          <SelectItem value="other">سبب آخر (حدد في الملاحظات)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>إلغاء</Button>
                      <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || actionLoading}>
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <XCircle className="w-4 h-4 ml-2" />}
                        رفض
                      </Button>
                      <Button onClick={handleApprove} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                        موافقة
                      </Button>
                    </DialogFooter>
                  </>
                )}

                {selectedKYC.status !== 'PENDING' && (
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">
                    <p>الحالة: {getStatusBadge(selectedKYC.status)}</p>
                    {selectedKYC.admin_reviewed_at && (
                      <p className="text-muted-foreground mt-1">
                        تمت المراجعة: {format(new Date(selectedKYC.admin_reviewed_at), 'yyyy/MM/dd HH:mm')}
                      </p>
                    )}
                    {selectedKYC.rejection_reason && (
                      <p className="text-red-400 mt-1">سبب الرفض: {selectedKYC.rejection_reason}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminKYC;
