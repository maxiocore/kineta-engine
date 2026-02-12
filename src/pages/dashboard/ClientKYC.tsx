import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Upload, Camera, CheckCircle, XCircle, Clock, FileUp,
  Loader2, AlertTriangle, User, CreditCard, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

type KYCStep = 'status' | 'form' | 'submitting';
type DocumentType = 'national_id' | 'iqama' | 'cr';
type KYCDisplayStatus = 'not_started' | 'pending_review' | 'approved' | 'rejected';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS = '.jpg, .jpeg, .png, .pdf';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface KYCRecord {
  id: string;
  status: string;
  session_id: string;
  document_type: string | null;
  extracted_data: any;
  rejection_reason: string | null;
  admin_notes: string | null;
  admin_reviewed_at: string | null;
  created_at: string;
}

interface FormData {
  fullName: string;
  documentType: DocumentType;
  documentNumber: string;
  dateOfBirth: string;
  nationality: string;
}

interface FileState {
  file: File | null;
  preview: string | null;
}

const NATIONALITIES = [
  'سعودي', 'مصري', 'يمني', 'سوداني', 'أردني', 'سوري', 'فلسطيني',
  'عراقي', 'لبناني', 'تونسي', 'مغربي', 'جزائري', 'ليبي', 'إماراتي',
  'كويتي', 'بحريني', 'عماني', 'قطري', 'باكستاني', 'هندي', 'بنغلاديشي',
  'فلبيني', 'إندونيسي', 'أخرى',
];

function getDisplayStatus(record: KYCRecord | null): KYCDisplayStatus {
  if (!record) return 'not_started';
  switch (record.status) {
    case 'PASSED': return 'approved';
    case 'FAILED': return 'rejected';
    case 'PENDING': return 'pending_review';
    default: return 'not_started';
  }
}

function validateFile(file: File): { error: string; detail: string } | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

  if (!ALLOWED_FILE_TYPES.includes(file.type) || !ext || !validExtensions.includes(ext)) {
    return {
      error: 'نوع الملف غير مدعوم',
      detail: `الملف "${file.name}" من نوع غير مقبول. الأنواع المسموحة فقط: JPG, PNG, PDF`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      error: 'حجم الملف كبير جداً',
      detail: `حجم الملف ${sizeMB} ميجابايت — الحد الأقصى المسموح هو 5 ميجابايت. يرجى ضغط الملف أو اختيار ملف أصغر.`,
    };
  }
  if (file.size < 10 * 1024) {
    return {
      error: 'الملف صغير جداً',
      detail: 'حجم الملف أقل من 10 كيلوبايت — قد يكون تالفاً أو فارغاً. يرجى رفع ملف صالح.',
    };
  }
  return null;
}

const ClientKYC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<KYCStep>('status');
  const [existingKYC, setExistingKYC] = useState<KYCRecord | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    documentType: 'national_id',
    documentNumber: '',
    dateOfBirth: '',
    nationality: '',
  });

  // File state
  const [idFront, setIdFront] = useState<FileState>({ file: null, preview: null });
  const [idBack, setIdBack] = useState<FileState>({ file: null, preview: null });
  const [selfie, setSelfie] = useState<FileState>({ file: null, preview: null });

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // Fetch existing KYC on mount
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('kyc_verifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setExistingKYC(data[0] as any);
      }
      setLoadingExisting(false);
    };
    fetch();
  }, [user]);

  const displayStatus = getDisplayStatus(existingKYC);
  const isLocked = displayStatus === 'pending_review' || displayStatus === 'approved';

  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (s: FileState) => void,
    fieldKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateFile(file);
    if (validation) {
      toast.error(validation.error, { description: validation.detail, duration: 6000 });
      setFileErrors(prev => ({ ...prev, [fieldKey]: validation.detail }));
      e.target.value = '';
      return;
    }
    setFileErrors(prev => { const n = { ...prev }; delete n[fieldKey]; return n; });
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setter({ file, preview });
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    // Re-validate server-side before upload
    const validation = validateFile(file);
    if (validation) throw new Error(validation.detail);

    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return data.path;
  };

  // Validation: all fields + all files
  const formErrors = (): string[] => {
    const errors: string[] = [];
    if (!formData.fullName.trim()) errors.push('الاسم الكامل مطلوب');
    if (!formData.documentNumber.trim()) errors.push('رقم الوثيقة مطلوب');
    if (!formData.dateOfBirth) errors.push('تاريخ الميلاد مطلوب');
    if (!formData.nationality) errors.push('الجنسية مطلوبة');
    if (!idFront.file) errors.push('صورة الوجه الأمامي مطلوبة');
    if (!idBack.file) errors.push('صورة الوجه الخلفي مطلوبة');
    if (!selfie.file) errors.push('الصورة الشخصية مع الهوية مطلوبة');
    return errors;
  };

  const isFormValid = formErrors().length === 0;

  const handleSubmit = async () => {
    if (!user) return;
    const errors = formErrors();
    if (errors.length > 0) {
      errors.forEach(e => toast.error(e));
      return;
    }

    setSubmitting(true);
    setStep('submitting');

    try {
      const sessionId = `kyc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Upload all 3 files (stored privately, never exposed publicly)
      const [frontPath, backPath, selfiePath] = await Promise.all([
        uploadFile(idFront.file!, `${user.id}/${sessionId}/front.${idFront.file!.name.split('.').pop()}`),
        uploadFile(idBack.file!, `${user.id}/${sessionId}/back.${idBack.file!.name.split('.').pop()}`),
        uploadFile(selfie.file!, `${user.id}/${sessionId}/selfie.${selfie.file!.name.split('.').pop()}`),
      ]);

      // AI quality check on uploaded images (for image files only)
      if (idFront.file!.type.startsWith('image/')) {
        const qualityResult = await supabase.functions.invoke('kyc-quality-check', {
          body: { file_paths: [frontPath, backPath, selfiePath], user_id: user.id, session_id: sessionId },
        });

        if (qualityResult.data && !qualityResult.data.passed) {
          // Delete uploaded files on quality failure
          await supabase.storage.from('kyc-documents').remove([frontPath, backPath, selfiePath]);
          const issues = (qualityResult.data.issues || []) as Array<{ file: string; reason_ar: string }>;
          issues.forEach((issue: { file: string; reason_ar: string }) => {
            toast.error(`⚠️ ${issue.file}`, { description: issue.reason_ar, duration: 8000 });
          });
          setStep('form');
          setSubmitting(false);
          return;
        }
      }

      // Create KYC record with PENDING status
      const { error: insertErr } = await supabase.from('kyc_verifications' as any).insert({
        user_id: user.id,
        session_id: sessionId,
        national_id: formData.documentNumber,
        status: 'PENDING',
        document_type: formData.documentType,
        document_front_url: frontPath,
        document_back_url: backPath,
        selfie_url: selfiePath,
        extracted_data: {
          full_name: formData.fullName,
          document_number: formData.documentNumber,
          date_of_birth: formData.dateOfBirth,
          nationality: formData.nationality,
          document_type: formData.documentType,
        },
      } as any);

      if (insertErr) throw insertErr;

      // Audit log
      await supabase.from('verification_audit_logs').insert({
        user_id: user.id,
        session_id: sessionId,
        verification_type: 'KYC_SUBMISSION',
        attempt_number: 1,
        status: 'success',
        result_code: 'SUBMITTED_FOR_REVIEW',
        result_message: 'KYC submitted for admin review - no auto-approval',
        metadata: {
          document_type: formData.documentType,
          has_front: true,
          has_back: true,
          has_selfie: true,
        },
      } as any);

      // Notify admin
      await supabase.from('admin_notifications').insert({
        title: 'طلب تحقق هوية جديد',
        message: `تم استلام طلب تحقق جديد من ${formData.fullName} - رقم الوثيقة: ${formData.documentNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}`,
        type: 'kyc_review',
        related_user_id: user.id,
        metadata: { session_id: sessionId, document_type: formData.documentType },
      });

      // Refresh record
      const { data } = await supabase
        .from('kyc_verifications' as any)
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (data) setExistingKYC(data as any);
      toast.success('تم إرسال طلب التحقق للمراجعة بنجاح');
      setStep('status');
    } catch (err: any) {
      console.error('KYC submit error:', err);
      toast.error('حدث خطأ أثناء إرسال الطلب');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNew = () => {
    setExistingKYC(null);
    setFormData({ fullName: '', documentType: 'national_id', documentNumber: '', dateOfBirth: '', nationality: '' });
    setIdFront({ file: null, preview: null });
    setIdBack({ file: null, preview: null });
    setSelfie({ file: null, preview: null });
    setStep('form');
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: KYCDisplayStatus }) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" /> لم يبدأ</Badge>;
      case 'pending_review':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><Clock className="w-3 h-3" /> قيد المراجعة</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1"><CheckCircle className="w-3 h-3" /> تم التحقق</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="w-3 h-3" /> مرفوض</Badge>;
    }
  };

  const FileUploadBox = ({
    label,
    required,
    fileState,
    inputRef,
    onSelect,
    onClear,
    errorMessage,
  }: {
    label: string;
    required: boolean;
    fileState: FileState;
    inputRef: React.RefObject<HTMLInputElement>;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    errorMessage?: string;
  }) => (
    <div>
      <Label className="mb-2 block">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS}
        className="hidden"
        onChange={onSelect}
      />
      {fileState.file ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          {fileState.preview ? (
            <img src={fileState.preview} alt={label} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 flex items-center justify-center bg-muted/30">
              <FileUp className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm mr-2">{fileState.file.name}</span>
            </div>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 left-2"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
          >
            <XCircle className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-2 right-2">
            <Badge variant="outline" className="text-xs bg-background/80">
              {(fileState.file.size / 1024).toFixed(0)} KB
            </Badge>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all ${errorMessage ? 'border-red-500/50 bg-red-500/5' : 'border-border'}`}
        >
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">اضغط لرفع الملف</span>
          <span className="text-xs text-muted-foreground">JPG, PNG, PDF — الحد الأقصى 5 ميجابايت</span>
        </button>
      )}
      {errorMessage && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" /> {errorMessage}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">التحقق من الهوية (KYC)</h1>
          <p className="text-muted-foreground">تحقق من هويتك لتفعيل حسابك بالكامل</p>
          <StatusBadge status={displayStatus} />
        </div>

        <AnimatePresence mode="wait">
          {/* ====== STATUS VIEW ====== */}
          {step === 'status' && (
            <motion.div key="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Not Started */}
              {displayStatus === 'not_started' && (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center p-6">
                      <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold text-lg mb-1">لم يتم التحقق بعد</h3>
                      <p className="text-sm text-muted-foreground">يرجى إكمال عملية التحقق لتفعيل حسابك</p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">ما ستحتاج إليه:</h4>
                      {[
                        { icon: User, text: 'الاسم الكامل وتاريخ الميلاد والجنسية' },
                        { icon: CreditCard, text: 'رقم الهوية / الإقامة / السجل التجاري' },
                        { icon: FileUp, text: 'صورة الوجه الأمامي والخلفي للوثيقة' },
                        { icon: Camera, text: 'صورة شخصية مع الهوية (سيلفي)' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <item.icon className="w-5 h-5 text-primary shrink-0" />
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        الملفات المقبولة: JPG, PNG, PDF — الحد الأقصى: 10 ميجابايت
                      </p>
                    </div>
                    <Button onClick={() => setStep('form')} className="w-full" size="lg">
                      ابدأ التحقق
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Pending Review */}
              {displayStatus === 'pending_review' && (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <Lock className="w-12 h-12 text-amber-400 mx-auto" />
                    <h3 className="text-xl font-bold">طلبك قيد المراجعة ⏳</h3>
                    <p className="text-muted-foreground">تم إرسال بياناتك بنجاح وهي الآن تحت مراجعة الفريق المختص</p>
                    <p className="text-sm text-muted-foreground">لا يمكن تعديل البيانات بعد الإرسال</p>
                    <div className="p-4 bg-muted/30 rounded-lg text-right space-y-1 text-sm">
                      <p><span className="text-muted-foreground">تاريخ الإرسال:</span> {existingKYC?.created_at ? new Date(existingKYC.created_at).toLocaleDateString('ar-SA') : '-'}</p>
                      <p><span className="text-muted-foreground">نوع الوثيقة:</span> {existingKYC?.document_type === 'national_id' ? 'هوية وطنية' : existingKYC?.document_type === 'iqama' ? 'إقامة' : 'سجل تجاري'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Approved */}
              {displayStatus === 'approved' && (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                    <h3 className="text-xl font-bold text-emerald-400">تم التحقق بنجاح ✅</h3>
                    <p className="text-muted-foreground">حسابك مفعّل بالكامل</p>
                    {existingKYC?.extracted_data && (
                      <div className="grid grid-cols-2 gap-3 text-sm text-right">
                        {existingKYC.extracted_data.full_name && (
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground text-xs">الاسم</p>
                            <p className="font-medium">{existingKYC.extracted_data.full_name}</p>
                          </div>
                        )}
                        {existingKYC.extracted_data.document_number && (
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground text-xs">رقم الوثيقة</p>
                            <p className="font-medium">{existingKYC.extracted_data.document_number.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}</p>
                          </div>
                        )}
                        {existingKYC.extracted_data.nationality && (
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground text-xs">الجنسية</p>
                            <p className="font-medium">{existingKYC.extracted_data.nationality}</p>
                          </div>
                        )}
                        {existingKYC.extracted_data.date_of_birth && (
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground text-xs">تاريخ الميلاد</p>
                            <p className="font-medium">{existingKYC.extracted_data.date_of_birth}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Rejected */}
              {displayStatus === 'rejected' && (
                <Card>
                  <CardContent className="p-8 space-y-4">
                    <div className="text-center">
                      <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-red-400">تم رفض التحقق</h3>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 space-y-2">
                      <p className="font-medium text-red-400">سبب الرفض:</p>
                      <p className="text-sm">{existingKYC?.rejection_reason || 'لم يتم تحديد السبب'}</p>
                      {existingKYC?.admin_notes && (
                        <p className="text-xs text-muted-foreground">ملاحظات الإدارة: {existingKYC.admin_notes}</p>
                      )}
                    </div>
                    <Button onClick={handleStartNew} className="w-full" size="lg">
                      إعادة المحاولة
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* ====== FORM VIEW ====== */}
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <Progress value={isFormValid ? 100 : 50} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {isFormValid ? 'جاهز للإرسال ✅' : 'أكمل جميع الحقول المطلوبة'}
                </p>
              </div>

              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-5 h-5" /> البيانات الشخصية
                  </CardTitle>
                  <CardDescription>جميع الحقول مطلوبة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">الاسم الكامل <span className="text-red-400">*</span></Label>
                    <Input
                      id="fullName"
                      placeholder="الاسم الرباعي كما في الوثيقة"
                      value={formData.fullName}
                      onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <Label>نوع الوثيقة <span className="text-red-400">*</span></Label>
                    <Select value={formData.documentType} onValueChange={(v) => setFormData(p => ({ ...p, documentType: v as DocumentType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">🪪 الهوية الوطنية</SelectItem>
                        <SelectItem value="iqama">📋 الإقامة</SelectItem>
                        <SelectItem value="cr">🏢 السجل التجاري (CR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="docNum">رقم الوثيقة <span className="text-red-400">*</span></Label>
                    <Input
                      id="docNum"
                      placeholder={formData.documentType === 'cr' ? 'رقم السجل التجاري' : 'رقم الهوية أو الإقامة'}
                      value={formData.documentNumber}
                      onChange={(e) => setFormData(p => ({ ...p, documentNumber: e.target.value }))}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dob">تاريخ الميلاد <span className="text-red-400">*</span></Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div>
                    <Label>الجنسية <span className="text-red-400">*</span></Label>
                    <Select value={formData.nationality} onValueChange={(v) => setFormData(p => ({ ...p, nationality: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر الجنسية" /></SelectTrigger>
                      <SelectContent>
                        {NATIONALITIES.map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Document Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileUp className="w-5 h-5" /> رفع المستندات
                  </CardTitle>
                  <CardDescription>ارفع جميع المستندات المطلوبة — JPG, PNG, أو PDF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUploadBox
                    label="الوجه الأمامي للوثيقة"
                    required
                    fileState={idFront}
                    inputRef={frontRef as any}
                    onSelect={(e) => handleFileSelect(e, setIdFront, 'front')}
                    onClear={() => { setIdFront({ file: null, preview: null }); setFileErrors(p => { const n = {...p}; delete n.front; return n; }); if (frontRef.current) frontRef.current.value = ''; }}
                    errorMessage={fileErrors['front']}
                  />
                  <FileUploadBox
                    label="الوجه الخلفي للوثيقة"
                    required
                    fileState={idBack}
                    inputRef={backRef as any}
                    onSelect={(e) => handleFileSelect(e, setIdBack, 'back')}
                    onClear={() => { setIdBack({ file: null, preview: null }); setFileErrors(p => { const n = {...p}; delete n.back; return n; }); if (backRef.current) backRef.current.value = ''; }}
                    errorMessage={fileErrors['back']}
                  />
                  <FileUploadBox
                    label="صورة شخصية مع الهوية (سيلفي)"
                    required
                    fileState={selfie}
                    inputRef={selfieRef as any}
                    onSelect={(e) => handleFileSelect(e, setSelfie, 'selfie')}
                    onClear={() => { setSelfie({ file: null, preview: null }); setFileErrors(p => { const n = {...p}; delete n.selfie; return n; }); if (selfieRef.current) selfieRef.current.value = ''; }}
                    errorMessage={fileErrors['selfie']}
                  />
                </CardContent>
              </Card>

              {/* Validation Summary */}
              {formErrors().length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1">
                  <p className="text-sm font-medium text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> يرجى إكمال التالي:
                  </p>
                  {formErrors().map((e, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {e}</p>
                  ))}
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                className="w-full"
                size="lg"
                disabled={!isFormValid || submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                إرسال للمراجعة
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                ⚠️ بعد الإرسال لن تتمكن من تعديل البيانات — تأكد من صحة جميع المعلومات
              </p>
            </motion.div>
          )}

          {/* ====== SUBMITTING ====== */}
          {step === 'submitting' && (
            <motion.div key="submitting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-8 text-center space-y-4">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Upload className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">جاري رفع المستندات وإرسال الطلب...</h3>
                  <p className="text-sm text-muted-foreground">يرجى الانتظار وعدم إغلاق الصفحة</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClientKYC;
