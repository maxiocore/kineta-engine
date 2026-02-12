import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Shield, CheckCircle, XCircle, Clock, Eye, Search, Filter, 
  Loader2, User, FileText, AlertTriangle, RefreshCw, Calendar,
  Phone, Mail, Download, ZoomIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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

const REJECTION_REASONS = [
  'صورة الوثيقة غير واضحة أو مقطوعة',
  'الوثيقة منتهية الصلاحية',
  'البيانات المدخلة لا تطابق الوثيقة',
  'الوثيقة مشبوهة أو يبدو أنها معدّلة',
  'الصورة الشخصية غير واضحة أو لا تطابق الوثيقة',
  'نوع الوثيقة غير مقبول',
  'معلومات ناقصة في الوثيقة',
  'الوثيقة ليست بالجودة المطلوبة',
];

const AdminKYC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedKYC, setSelectedKYC] = useState<KYCVerification | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [stats, setStats] = useState({ total: 0, pending: 0, passed: 0, failed: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  // Check admin role server-side
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setAdminCheckDone(true); return; }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
      setAdminCheckDone(true);
    };
    checkAdmin();
  }, [user]);

  const fetchVerifications = useCallback(async () => {
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
      toast.error('خطأ في جلب البيانات');
    } else {
      const records = (data || []) as KYCVerification[];
      setVerifications(records);
      
      // Fetch all stats regardless of filter
      const { data: allData } = await supabase
        .from('kyc_verifications' as any)
        .select('status') as { data: any[] | null };
      const all = allData || [];
      setStats({
        total: all.length,
        pending: all.filter((r: any) => r.status === 'PENDING').length,
        passed: all.filter((r: any) => r.status === 'PASSED').length,
        failed: all.filter((r: any) => r.status === 'FAILED').length,
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
  }, [filter]);

  useEffect(() => {
    if (!adminCheckDone || !isAdmin) return;
    fetchVerifications();

    const channel = supabase
      .channel('kyc-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kyc_verifications' }, () => {
        fetchVerifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter, adminCheckDone, isAdmin, fetchVerifications]);

  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    if (signedUrls[path]) return signedUrls[path];
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return null;
    setSignedUrls(prev => ({ ...prev, [path]: data.signedUrl }));
    return data.signedUrl;
  };

  useEffect(() => {
    if (!selectedKYC || !reviewDialogOpen) return;
    const paths = [selectedKYC.document_front_url, selectedKYC.document_back_url, selectedKYC.selfie_url].filter(Boolean) as string[];
    paths.forEach(p => getSignedUrl(p));
  }, [selectedKYC, reviewDialogOpen]);

  const handleApprove = async () => {
    if (!selectedKYC || !user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('kyc_verifications' as any).update({
        status: 'PASSED',
        admin_reviewed_at: new Date().toISOString(),
        admin_reviewed_by: user.id,
        admin_notes: adminNotes || null,
        verified_at: new Date().toISOString(),
        verified_data: selectedKYC.extracted_data,
      } as any).eq('id', selectedKYC.id);

      if (error) throw error;

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'KYC_APPROVED',
        table_name: 'kyc_verifications',
        record_id: selectedKYC.id,
        new_value: { status: 'PASSED', admin_notes: adminNotes },
        metadata: { kyc_user_id: selectedKYC.user_id },
      });

      // Admin notification
      await supabase.from('admin_notifications').insert({
        title: `تمت الموافقة على KYC - ${userProfiles[selectedKYC.user_id]?.full_name || 'مستخدم'}`,
        message: `تمت الموافقة على تحقق الهوية بواسطة المشرف`,
        type: 'kyc_approved',
      });

      toast.success('✅ تمت الموافقة على التحقق وإخطار المستخدم');
      setConfirmApproveOpen(false);
      setReviewDialogOpen(false);
      setSelectedKYC(null);
      setAdminNotes('');
    } catch (err) {
      toast.error('حدث خطأ أثناء الموافقة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKYC || !user) return;
    const finalReason = rejectionReason === 'other' ? customRejectionReason : rejectionReason;
    if (!finalReason?.trim()) {
      toast.error('يجب تحديد سبب الرفض');
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase.from('kyc_verifications' as any).update({
        status: 'FAILED',
        admin_reviewed_at: new Date().toISOString(),
        admin_reviewed_by: user.id,
        admin_notes: adminNotes || null,
        rejection_reason: finalReason,
        failure_reasons: [finalReason],
      } as any).eq('id', selectedKYC.id);

      if (error) throw error;

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'KYC_REJECTED',
        table_name: 'kyc_verifications',
        record_id: selectedKYC.id,
        new_value: { status: 'FAILED', rejection_reason: finalReason },
        metadata: { kyc_user_id: selectedKYC.user_id },
      });

      // Send SMS notification to user
      const profile = userProfiles[selectedKYC.user_id];
      if (profile?.phone) {
        const smsMessage = [
          '⚠️ إشعار التحقق من الهوية',
          '━━━━━━━━━━━━━',
          '',
          `عزيزي ${profile.full_name || 'العميل'}،`,
          '',
          'نأسف لإبلاغك أنه تم رفض طلب التحقق من هويتك.',
          '',
          `📋 سبب الرفض:`,
          finalReason,
          '',
          '✅ يمكنك إعادة تقديم الطلب مع تصحيح الملاحظات المذكورة.',
          '',
          '━━━━━━━━━━━━━',
          'فريق التحقق | ASH HOLDING',
        ].join('\n');

        try {
          await supabase.functions.invoke('sms-notify', {
            body: {
              phone: profile.phone,
              message: smsMessage,
              type: 'kyc',
              userId: selectedKYC.user_id,
              referenceId: selectedKYC.id,
            },
          });
        } catch (smsErr) {
          console.error('SMS notification failed (non-blocking):', smsErr);
        }
      }

      toast.success('تم رفض التحقق وإخطار المستخدم');
      setReviewDialogOpen(false);
      setSelectedKYC(null);
      setRejectionReason('');
      setCustomRejectionReason('');
      setAdminNotes('');
    } catch (err) {
      toast.error('حدث خطأ أثناء الرفض');
    } finally {
      setActionLoading(false);
    }
  };

  const openReview = (kyc: KYCVerification) => {
    setSelectedKYC(kyc);
    setAdminNotes(kyc.admin_notes || '');
    setRejectionReason(kyc.rejection_reason || '');
    setCustomRejectionReason('');
    setSignedUrls({});
    setReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✅ مقبول</Badge>;
      case 'FAILED': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">❌ مرفوض</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">⏳ قيد المراجعة</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const docTypeLabel = (type: string | null) => {
    if (type === 'national_id') return 'هوية وطنية';
    if (type === 'iqama') return 'إقامة';
    if (type === 'passport') return 'جواز سفر';
    if (type === 'commercial_register') return 'سجل تجاري';
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
      profile?.email?.toLowerCase().includes(searchLower) ||
      profile?.phone?.includes(search)
    );
  });

  // Access denied
  if (adminCheckDone && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground">ليس لديك صلاحية الوصول لهذه الصفحة.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!adminCheckDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button variant="outline" size="sm" onClick={fetchVerifications} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الطلبات', value: stats.total, icon: FileText, color: 'text-primary', filterVal: 'all' },
            { label: 'قيد المراجعة', value: stats.pending, icon: Clock, color: 'text-amber-400', filterVal: 'PENDING' },
            { label: 'مقبول', value: stats.passed, icon: CheckCircle, color: 'text-emerald-400', filterVal: 'PASSED' },
            { label: 'مرفوض', value: stats.failed, icon: XCircle, color: 'text-red-400', filterVal: 'FAILED' },
          ].map((s, i) => (
            <Card 
              key={i} 
              className={`cursor-pointer transition-all hover:border-primary/40 ${filter === s.filterVal ? 'border-primary ring-1 ring-primary/20' : ''}`}
              onClick={() => setFilter(s.filterVal)}
            >
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، البريد، رقم الهوية، أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredVerifications.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">لا توجد طلبات تحقق {filter !== 'all' ? 'بهذا الفلتر' : ''}</CardContent></Card>
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
                        <span className="text-xs font-mono text-muted-foreground">
                          {kyc.national_id ? kyc.national_id.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '-'}
                        </span>
                        {getStatusBadge(kyc.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(kyc.created_at), 'yyyy/MM/dd HH:mm', { locale: ar })}
                        </span>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    {kyc.status === 'FAILED' && kyc.rejection_reason && (
                      <p className="text-xs text-red-400 mt-2 pr-13">سبب الرفض: {kyc.rejection_reason}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" /> مراجعة طلب التحقق
              </DialogTitle>
              <DialogDescription>
                مراجعة بيانات المستخدم والوثائق المرفقة واتخاذ القرار
              </DialogDescription>
            </DialogHeader>

            {selectedKYC && (
              <div className="space-y-5">
                {/* User Profile */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <User className="w-4 h-4" /> بيانات المستخدم
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{userProfiles[selectedKYC.user_id]?.full_name || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{userProfiles[selectedKYC.user_id]?.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span dir="ltr">{userProfiles[selectedKYC.user_id]?.phone || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>نوع الوثيقة: <strong className="text-foreground">{docTypeLabel(selectedKYC.document_type)}</strong></span>
                    <span>تاريخ التقديم: <strong className="text-foreground">{format(new Date(selectedKYC.created_at), 'yyyy/MM/dd HH:mm')}</strong></span>
                    <span>الحالة: {getStatusBadge(selectedKYC.status)}</span>
                  </div>
                </div>

                {/* Extracted Data */}
                {selectedKYC.extracted_data && Object.keys(selectedKYC.extracted_data).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> البيانات المستخرجة (AI)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(selectedKYC.extracted_data).map(([key, value]) => (
                        <div key={key} className="p-2 bg-muted/20 rounded-lg border border-border/50">
                          <p className="text-xs text-muted-foreground">{key}</p>
                          <p className="font-medium text-sm">{String(value || '-')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Documents - Secure Preview */}
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> صور الوثائق (معاينة آمنة - تنتهي خلال 5 دقائق)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'الجهة الأمامية', url: selectedKYC.document_front_url },
                      { label: 'الجهة الخلفية', url: selectedKYC.document_back_url },
                      { label: 'الصورة الشخصية', url: selectedKYC.selfie_url },
                    ].map(({ label, url }) => (
                      <div key={label} className="space-y-1">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        {url && signedUrls[url] ? (
                          <div className="relative group">
                            <img 
                              src={signedUrls[url]} 
                              alt={label}
                              className="w-full h-44 object-cover rounded-lg border border-border cursor-pointer"
                              onClick={() => setZoomedImage(signedUrls[url])}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <button 
                              onClick={() => setZoomedImage(signedUrls[url])}
                              className="absolute top-2 left-2 bg-background/80 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                          </div>
                        ) : url ? (
                          <div className="h-44 bg-muted/30 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="h-44 bg-muted/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                            لم يتم الرفع
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Scores */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/20 rounded-lg text-center border border-border/50">
                    <p className="text-xs text-muted-foreground">دقة OCR</p>
                    <p className="text-lg font-bold">{selectedKYC.ocr_confidence ? `${Math.round(selectedKYC.ocr_confidence * 100)}%` : '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg text-center border border-border/50">
                    <p className="text-xs text-muted-foreground">التحقق الحيوي</p>
                    <p className="text-lg font-bold">{selectedKYC.liveness_score ? `${Math.round(selectedKYC.liveness_score * 100)}%` : '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg text-center border border-border/50">
                    <p className="text-xs text-muted-foreground">مطابقة الوجه</p>
                    <p className="text-lg font-bold">{selectedKYC.face_match_score ? `${Math.round(selectedKYC.face_match_score * 100)}%` : '-'}</p>
                  </div>
                </div>

                <Separator />

                {/* Admin Actions - Only for PENDING */}
                {selectedKYC.status === 'PENDING' && (
                  <>
                    {/* Admin Notes */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">ملاحظات المشرف (اختياري)</label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="أضف ملاحظاتك الداخلية هنا..."
                        rows={2}
                      />
                    </div>

                    {/* Rejection Reason */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium block">سبب الرفض <span className="text-muted-foreground font-normal">(مطلوب عند الرفض)</span></label>
                      <Select value={rejectionReason} onValueChange={setRejectionReason}>
                        <SelectTrigger><SelectValue placeholder="اختر سبب الرفض..." /></SelectTrigger>
                        <SelectContent>
                          {REJECTION_REASONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                          <SelectItem value="other">سبب آخر (حدد أدناه)</SelectItem>
                        </SelectContent>
                      </Select>
                      {rejectionReason === 'other' && (
                        <Textarea
                          value={customRejectionReason}
                          onChange={(e) => setCustomRejectionReason(e.target.value)}
                          placeholder="اكتب سبب الرفض بالتفصيل..."
                          rows={2}
                        />
                      )}
                    </div>

                    <DialogFooter className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>إلغاء</Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleReject} 
                        disabled={actionLoading || (!rejectionReason || (rejectionReason === 'other' && !customRejectionReason.trim()))}
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <XCircle className="w-4 h-4 ml-2" />}
                        رفض الطلب
                      </Button>
                      <Button 
                        onClick={() => setConfirmApproveOpen(true)} 
                        disabled={actionLoading} 
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                        موافقة
                      </Button>
                    </DialogFooter>
                  </>
                )}

                {/* Already reviewed status */}
                {selectedKYC.status !== 'PENDING' && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">الحالة:</span>
                      {getStatusBadge(selectedKYC.status)}
                    </div>
                    {selectedKYC.admin_reviewed_at && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        تمت المراجعة: {format(new Date(selectedKYC.admin_reviewed_at), 'yyyy/MM/dd HH:mm')}
                      </p>
                    )}
                    {selectedKYC.admin_notes && (
                      <p className="text-sm"><span className="font-medium">ملاحظات:</span> {selectedKYC.admin_notes}</p>
                    )}
                    {selectedKYC.rejection_reason && (
                      <p className="text-sm text-red-400">
                        <span className="font-medium">سبب الرفض:</span> {selectedKYC.rejection_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Approve Dialog */}
        <Dialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تأكيد الموافقة</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من الموافقة على تحقق هوية هذا المستخدم؟ سيتم فتح جميع ميزات المنصة له وإخطاره فوراً.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmApproveOpen(false)}>إلغاء</Button>
              <Button onClick={handleApprove} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                تأكيد الموافقة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Zoom Image Dialog */}
        <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="max-w-4xl p-2">
            {zoomedImage && (
              <img src={zoomedImage} alt="Document" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminKYC;
