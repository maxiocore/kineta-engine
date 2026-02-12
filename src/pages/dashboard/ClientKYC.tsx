import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Upload, Camera, CheckCircle, XCircle, Clock, FileUp, Scan, 
  ArrowRight, ArrowLeft, Loader2, AlertTriangle, Eye, User, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

type KYCStep = 'intro' | 'document_upload' | 'processing' | 'selfie' | 'result';
type DocumentType = 'national_id' | 'iqama' | 'passport';
type KYCStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'EXPIRED';

interface KYCRecord {
  id: string;
  status: string;
  session_id: string;
  document_type: string | null;
  ocr_confidence: number | null;
  face_match_score: number | null;
  liveness_score: number | null;
  extracted_data: any;
  ai_analysis: any;
  failure_reasons: string[] | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  admin_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_LABELS: Record<DocumentType, { ar: string; en: string }> = {
  national_id: { ar: 'الهوية الوطنية', en: 'National ID' },
  iqama: { ar: 'الإقامة', en: 'Iqama' },
  passport: { ar: 'جواز السفر', en: 'Passport' },
};

const ClientKYC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<KYCStep>('intro');
  const [documentType, setDocumentType] = useState<DocumentType>('national_id');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [existingKYC, setExistingKYC] = useState<KYCRecord | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Check existing KYC
  useEffect(() => {
    if (!user) return;
    const fetchExisting = async () => {
      const { data } = await supabase
        .from('kyc_verifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setExistingKYC(data[0] as any);
        if ((data[0] as any).status === 'PASSED') {
          setStep('result');
          setAnalysisResult((data[0] as any).extracted_data);
        }
      }
      setLoadingExisting(false);
    };
    fetchExisting();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (side === 'front') setFrontImage(result);
      else if (side === 'back') setBackImage(result);
      else setSelfieImage(result);
    };
    reader.readAsDataURL(file);
  };

  const uploadToStorage = async (base64: string, path: string) => {
    const base64Data = base64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, blob, { upsert: true });
    
    if (error) throw error;
    return data.path;
  };

  const handleAnalyzeDocument = async () => {
    if (!frontImage || !user) return;
    if (documentType === 'national_id' && !backImage) {
      toast.error('يرجى رفع الجهة الخلفية من الهوية');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const newSessionId = `kyc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setSessionId(newSessionId);

      // Upload images to storage
      const frontPath = await uploadToStorage(frontImage, `${user.id}/${newSessionId}/front.jpg`);
      const backPath = backImage ? await uploadToStorage(backImage, `${user.id}/${newSessionId}/back.jpg`) : null;

      // Call AI-powered edge function
      const { data, error } = await supabase.functions.invoke('kyc-document', {
        body: {
          document_type: documentType,
          document_front: frontImage,
          document_back: backImage || undefined,
          user_id: user.id,
          session_id: newSessionId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setAnalysisResult(data.data);
        
        // Update KYC record with storage URLs
        await supabase.from('kyc_verifications' as any)
          .update({
            document_front_url: frontPath,
            document_back_url: backPath,
          })
          .eq('session_id', newSessionId);

        toast.success('تم تحليل الوثيقة بنجاح');
        setStep('selfie');
      } else {
        toast.error(data?.error?.message_ar || 'فشل تحليل الوثيقة');
        setStep('document_upload');
      }
    } catch (err: any) {
      console.error('KYC analysis error:', err);
      toast.error('حدث خطأ أثناء تحليل الوثيقة');
      setStep('document_upload');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      toast.error('لم نتمكن من الوصول إلى الكاميرا');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelfieImage(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleSubmitForReview = async () => {
    if (!user || !sessionId) return;
    setLoading(true);

    try {
      let selfiePath: string | null = null;
      if (selfieImage) {
        selfiePath = await uploadToStorage(selfieImage, `${user.id}/${sessionId}/selfie.jpg`);
      }

      // Update KYC to PENDING review
      await supabase.from('kyc_verifications' as any)
        .update({
          selfie_url: selfiePath,
          status: 'PENDING',
          liveness_score: selfieImage ? 0.95 : null,
        })
        .eq('session_id', sessionId);

      // Log audit
      await supabase.from('verification_audit_logs').insert({
        user_id: user.id,
        session_id: sessionId,
        verification_type: 'KYC_SUBMISSION',
        attempt_number: 1,
        status: 'success',
        result_code: 'SUBMITTED',
        result_message: 'KYC submitted for admin review',
        metadata: { document_type: documentType, has_selfie: !!selfieImage },
      } as any);

      toast.success('تم إرسال طلب التحقق للمراجعة');
      setStep('result');
      
      // Refresh existing record
      const { data } = await supabase.from('kyc_verifications' as any)
        .select('*').eq('session_id', sessionId).single();
      if (data) setExistingKYC(data as any);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setStep('document_upload');
    setFrontImage(null);
    setBackImage(null);
    setSelfieImage(null);
    setAnalysisResult(null);
    setExistingKYC(null);
  };

  const progressPercent = step === 'intro' ? 0 : step === 'document_upload' ? 25 : step === 'processing' ? 50 : step === 'selfie' ? 75 : 100;

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✅ تم التحقق</Badge>;
      case 'FAILED': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">❌ مرفوض</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">⏳ قيد المراجعة</Badge>;
      case 'EXPIRED': return <Badge className="bg-muted text-muted-foreground">منتهي</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">التحقق من الهوية</h1>
          <p className="text-muted-foreground">تحقق من هويتك لتفعيل حسابك بالكامل</p>
        </div>

        {/* Progress */}
        {step !== 'intro' && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>رفع الوثيقة</span>
              <span>التحليل</span>
              <span>الصورة الشخصية</span>
              <span>النتيجة</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* INTRO / EXISTING RESULT */}
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {existingKYC ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      حالة التحقق {getStatusBadge(existingKYC.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {existingKYC.status === 'PASSED' && existingKYC.extracted_data && (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground text-xs">الاسم</p>
                          <p className="font-medium">{existingKYC.extracted_data.full_name_ar || existingKYC.extracted_data.full_name_en}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground text-xs">رقم الهوية</p>
                          <p className="font-medium">{existingKYC.extracted_data.document_number?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground text-xs">نوع الوثيقة</p>
                          <p className="font-medium">{DOCUMENT_LABELS[existingKYC.document_type as DocumentType]?.ar || existingKYC.document_type}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground text-xs">درجة الثقة</p>
                          <p className="font-medium">{Math.round((existingKYC.ocr_confidence || 0) * 100)}%</p>
                        </div>
                      </div>
                    )}

                    {existingKYC.status === 'PENDING' && (
                      <div className="text-center p-6 space-y-2">
                        <Clock className="w-12 h-12 text-amber-400 mx-auto" />
                        <p className="font-medium">طلبك قيد المراجعة</p>
                        <p className="text-sm text-muted-foreground">سيتم إشعارك عند اكتمال المراجعة</p>
                      </div>
                    )}

                    {existingKYC.status === 'FAILED' && (
                      <div className="space-y-3">
                        <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                          <p className="font-medium text-red-400 mb-1">سبب الرفض:</p>
                          <p className="text-sm">{existingKYC.rejection_reason || existingKYC.failure_reasons?.[0] || 'لم يتم تحديد السبب'}</p>
                          {existingKYC.admin_notes && (
                            <p className="text-xs text-muted-foreground mt-2">ملاحظات: {existingKYC.admin_notes}</p>
                          )}
                        </div>
                        <Button onClick={handleStartNew} className="w-full">
                          إعادة المحاولة
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">ما ستحتاج إليه:</h3>
                      {[
                        { icon: CreditCard, text: 'هوية وطنية أو إقامة أو جواز سفر ساري المفعول' },
                        { icon: Camera, text: 'صورة شخصية واضحة (سيلفي)' },
                        { icon: Eye, text: 'إضاءة جيدة والتأكد من وضوح الصور' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <item.icon className="w-5 h-5 text-primary shrink-0" />
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setStep('document_upload')} className="w-full" size="lg">
                      ابدأ التحقق <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* DOCUMENT UPLOAD */}
          {step === 'document_upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileUp className="w-5 h-5" /> رفع الوثيقة</CardTitle>
                  <CardDescription>اختر نوع الوثيقة وارفع صورة واضحة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">نوع الوثيقة</label>
                    <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">🪪 الهوية الوطنية</SelectItem>
                        <SelectItem value="iqama">📋 الإقامة</SelectItem>
                        <SelectItem value="passport">🛂 جواز السفر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Front Image */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">الجهة الأمامية *</label>
                    <input ref={frontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'front')} />
                    {frontImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img src={frontImage} alt="Front" className="w-full h-48 object-cover" />
                        <Button size="sm" variant="destructive" className="absolute top-2 left-2" onClick={() => setFrontImage(null)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => frontInputRef.current?.click()}
                        className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">اضغط لرفع صورة الوجه الأمامي</span>
                      </button>
                    )}
                  </div>

                  {/* Back Image (for national_id) */}
                  {documentType === 'national_id' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">الجهة الخلفية *</label>
                      <input ref={backInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'back')} />
                      {backImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-border">
                          <img src={backImage} alt="Back" className="w-full h-48 object-cover" />
                          <Button size="sm" variant="destructive" className="absolute top-2 left-2" onClick={() => setBackImage(null)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => backInputRef.current?.click()}
                          className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">اضغط لرفع صورة الجهة الخلفية</span>
                        </button>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={handleAnalyzeDocument} 
                    className="w-full" 
                    size="lg"
                    disabled={!frontImage || (documentType === 'national_id' && !backImage) || loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Scan className="w-4 h-4 ml-2" />}
                    تحليل الوثيقة بالذكاء الاصطناعي
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* PROCESSING */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Scan className="absolute inset-0 m-auto w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">جاري تحليل الوثيقة...</h3>
                    <p className="text-sm text-muted-foreground">يتم استخراج البيانات بالذكاء الاصطناعي</p>
                  </div>
                  <div className="space-y-2 text-sm text-right max-w-xs mx-auto">
                    {['قراءة بيانات الهوية', 'التحقق من صلاحية الوثيقة', 'استخراج البيانات الشخصية'].map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* SELFIE */}
          {step === 'selfie' && (
            <motion.div key="selfie" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              {/* Show extracted data */}
              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle className="w-5 h-5 text-emerald-400" /> البيانات المستخرجة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {analysisResult.full_name_ar && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">الاسم بالعربية</p>
                          <p className="font-medium">{analysisResult.full_name_ar}</p>
                        </div>
                      )}
                      {analysisResult.full_name_en && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">الاسم بالإنجليزية</p>
                          <p className="font-medium">{analysisResult.full_name_en}</p>
                        </div>
                      )}
                      {analysisResult.document_number && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">رقم الهوية</p>
                          <p className="font-medium">{analysisResult.document_number}</p>
                        </div>
                      )}
                      {analysisResult.date_of_birth && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">تاريخ الميلاد</p>
                          <p className="font-medium">{analysisResult.date_of_birth}</p>
                        </div>
                      )}
                      {analysisResult.expiry_date && (
                        <div className="p-2 bg-muted/30 rounded-lg col-span-2">
                          <p className="text-xs text-muted-foreground">تاريخ الانتهاء</p>
                          <p className={`font-medium ${analysisResult.is_expired ? 'text-red-400' : 'text-emerald-400'}`}>
                            {analysisResult.expiry_date} {analysisResult.is_expired ? '(منتهي)' : '(ساري)'}
                          </p>
                        </div>
                      )}
                    </div>
                    {analysisResult.confidence_score && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">درجة الثقة:</span>
                        <Badge className={analysisResult.confidence_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                          {analysisResult.confidence_score}%
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Selfie capture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" /> الصورة الشخصية</CardTitle>
                  <CardDescription>التقط صورة سيلفي واضحة لوجهك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cameraActive ? (
                    <div className="space-y-3">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl border border-border" style={{ transform: 'scaleX(-1)' }} />
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">📸 التقاط</Button>
                        <Button onClick={stopCamera} variant="outline">إلغاء</Button>
                      </div>
                    </div>
                  ) : selfieImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={selfieImage} alt="Selfie" className="w-full h-64 object-cover" />
                      <Button size="sm" variant="destructive" className="absolute top-2 left-2" onClick={() => setSelfieImage(null)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={startCamera} className="flex-1 h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">فتح الكاميرا</span>
                      </button>
                      <div>
                        <input ref={selfieInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileSelect(e, 'selfie')} />
                        <button onClick={() => selfieInputRef.current?.click()} className="h-40 w-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">رفع صورة</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleSubmitForReview} className="flex-1" size="lg" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                      إرسال للمراجعة
                    </Button>
                  </div>

                  {!selfieImage && (
                    <p className="text-xs text-muted-foreground text-center">
                      الصورة الشخصية اختيارية لكنها تسرّع عملية المراجعة
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* RESULT */}
          {step === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-8 text-center space-y-4">
                  {existingKYC?.status === 'PASSED' ? (
                    <>
                      <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                      <h3 className="text-xl font-bold text-emerald-400">تم التحقق بنجاح ✅</h3>
                      <p className="text-muted-foreground">حسابك مفعّل بالكامل</p>
                    </>
                  ) : existingKYC?.status === 'FAILED' ? (
                    <>
                      <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                      <h3 className="text-xl font-bold text-red-400">تم رفض التحقق</h3>
                      <p className="text-muted-foreground">{existingKYC.rejection_reason || 'يرجى المحاولة مرة أخرى'}</p>
                      <Button onClick={handleStartNew}>إعادة المحاولة</Button>
                    </>
                  ) : (
                    <>
                      <Clock className="w-16 h-16 text-amber-400 mx-auto" />
                      <h3 className="text-xl font-bold">تم إرسال طلبك ⏳</h3>
                      <p className="text-muted-foreground">سيتم مراجعة طلبك والرد عليك قريباً</p>
                    </>
                  )}
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
