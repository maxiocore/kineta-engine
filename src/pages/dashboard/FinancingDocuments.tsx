import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  File,
  Image as ImageIcon,
  AlertCircle,
  Paperclip
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export default function FinancingDocuments() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState("");

  // Fetch application details
  const { data: application, isLoading } = useQuery({
    queryKey: ["financing-application", applicationId],
    queryFn: async () => {
      if (!applicationId || !user?.id) return null;
      const { data, error } = await supabase
        .from("financing_applications")
        .select(`
          id, application_number, plan_id, full_name, national_id, phone, email,
          requested_amount, status, submitted_at, admin_notes,
          financing_plans (name_ar, installments_count)
        `)
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!applicationId && !!user?.id,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`الملف ${file.name} أكبر من 10 ميجابايت`);
          continue;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`نوع الملف ${file.name} غير مدعوم`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${applicationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('financing-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`فشل رفع الملف ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('financing-documents')
          .getPublicUrl(fileName);

        newFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          size: file.size,
        });
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        toast.success(`تم رفع ${newFiles.length} ملف بنجاح`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("حدث خطأ أثناء رفع الملفات");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitDocumentsMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId || uploadedFiles.length === 0) {
        throw new Error("يرجى رفع الملفات المطلوبة");
      }

      // Update application status to under_review and save documents
      const { error } = await supabase
        .from("financing_applications")
        .update({
          status: "under_review",
          admin_notes: `مستندات مرفقة (${uploadedFiles.length} ملف): ${uploadedFiles.map(f => f.url).join(', ')}${notes ? ` - ملاحظات العميل: ${notes}` : ''}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال المستندات بنجاح");
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      navigate("/dashboard/financing");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إرسال المستندات");
    },
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-400" />;
    }
    return <File className="h-5 w-5 text-primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!application || application.status !== 'documents_required') {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center" dir="rtl">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">الطلب غير متاح</h2>
          <p className="text-muted-foreground mb-4">هذا الطلب غير موجود أو لا يحتاج إلى مستندات حالياً</p>
          <Button onClick={() => navigate("/dashboard/financing")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard/financing")}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">رفع المستندات</h1>
            <p className="text-muted-foreground text-sm">
              طلب التمويل #{application.application_number}
            </p>
          </div>
        </div>

        {/* Application Info */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold">مستندات مطلوبة</h3>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    في انتظار المستندات
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  يرجى رفع المستندات المطلوبة لاستكمال مراجعة طلب التمويل الخاص بك.
                </p>
                {application.admin_notes && (
                  <div className="p-3 rounded-lg bg-background/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">ملاحظات الإدارة:</p>
                    <p className="text-sm">{application.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">المبلغ المطلوب</p>
                <p className="font-bold text-primary">{application.requested_amount.toLocaleString()} ر.س</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">خطة التمويل</p>
                <p className="font-medium">{application.financing_plans?.name_ar || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عدد الأقساط</p>
                <p className="font-medium">{application.financing_plans?.installments_count || "-"} قسط</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تاريخ التقديم</p>
                <p className="font-medium">{format(new Date(application.submitted_at), "dd/MM/yyyy", { locale: ar })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع المستندات
            </CardTitle>
            <CardDescription>
              يمكنك رفع صور أو ملفات PDF (الحد الأقصى 10 ميجابايت لكل ملف)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">جاري رفع الملفات...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Paperclip className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium mb-1">اضغط لاختيار الملفات</p>
                  <p className="text-sm text-muted-foreground">أو اسحب وأفلت الملفات هنا</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    الصيغ المدعومة: JPG, PNG, WEBP, PDF
                  </p>
                </>
              )}
            </div>

            {/* Uploaded Files */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label>الملفات المرفوعة ({uploadedFiles.length})</Label>
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أضف أي ملاحظات أو توضيحات..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/financing")}
            className="w-full sm:w-auto"
          >
            إلغاء
          </Button>
          <Button
            onClick={() => submitDocumentsMutation.mutate()}
            disabled={uploadedFiles.length === 0 || submitDocumentsMutation.isPending}
            className="w-full sm:flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
          >
            {submitDocumentsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 ml-2" />
                إرسال المستندات ({uploadedFiles.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
