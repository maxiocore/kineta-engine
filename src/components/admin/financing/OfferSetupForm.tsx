/**
 * مكون ضبط العرض الإداري
 * Admin Offer Setup Component
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  User, 
  CreditCard, 
  Calendar, 
  Save, 
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateOfferSetup } from '@/lib/financing/stateMachine/v2/validator';

interface OfferSetupFormProps {
  applicationId: string;
  applicationData: {
    full_name: string;
    national_id: string;
    requested_amount: number;
    phone: string;
    email: string;
  };
  existingSetup?: {
    id: string;
    approved_amount: number;
    installments_count: number;
    installment_amount: number;
    first_installment_date: string;
    full_name_from_id: string;
    national_id_verified: boolean;
    admin_notes?: string;
  };
  onComplete: () => void;
  onCancel: () => void;
}

export function OfferSetupForm({
  applicationId,
  applicationData,
  existingSetup,
  onComplete,
  onCancel
}: OfferSetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [approvedAmount, setApprovedAmount] = useState<number>(
    existingSetup?.approved_amount || applicationData.requested_amount
  );
  const [installmentsCount, setInstallmentsCount] = useState<number>(
    existingSetup?.installments_count || 3
  );
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<string>(
    existingSetup?.first_installment_date || getDefaultFirstInstallmentDate()
  );
  const [fullNameFromId, setFullNameFromId] = useState<string>(
    existingSetup?.full_name_from_id || applicationData.full_name
  );
  const [nationalIdVerified, setNationalIdVerified] = useState<boolean>(
    existingSetup?.national_id_verified || false
  );
  const [adminNotes, setAdminNotes] = useState<string>(
    existingSetup?.admin_notes || ''
  );

  // Calculated values
  const installmentAmount = approvedAmount / installmentsCount;
  
  // الحد الأدنى والأقصى للتمويل
  const MIN_AMOUNT = 1000;
  const MAX_AMOUNT = 100000;
  
  // خيارات عدد الأقساط
  const installmentOptions = [3, 6, 9, 12, 18, 24, 36];

  function getDefaultFirstInstallmentDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  }

  // Generate installments schedule preview
  function generateInstallmentsPreview() {
    const schedule = [];
    const startDate = new Date(firstInstallmentDate);
    
    for (let i = 0; i < Math.min(installmentsCount, 6); i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      schedule.push({
        number: i + 1,
        amount: installmentAmount,
        dueDate: dueDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      });
    }
    
    return schedule;
  }

  async function handleSave(proceedToOffer: boolean = false) {
    setErrors({});
    
    // Validate
    const validation = validateOfferSetup({
      approvedAmount,
      installmentsCount,
      fullNameFromId,
      firstInstallmentDate
    });
    
    if (!validation.valid) {
      toast.error(validation.errorAr || validation.error);
      return;
    }
    
    if (!nationalIdVerified) {
      toast.error('يجب التحقق من الهوية الوطنية قبل المتابعة');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const setupData = {
        application_id: applicationId,
        approved_amount: approvedAmount,
        installments_count: installmentsCount,
        installment_amount: installmentAmount,
        first_installment_date: firstInstallmentDate,
        full_name_from_id: fullNameFromId,
        national_id_verified: nationalIdVerified,
        admin_notes: adminNotes || null,
        setup_by: user?.id,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      };
      
      if (existingSetup) {
        // Update existing
        const { error } = await supabase
          .from('financing_offer_setup')
          .update(setupData)
          .eq('id', existingSetup.id);
          
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('financing_offer_setup')
          .insert(setupData);
          
        if (error) throw error;
      }
      
      // Update application with override values
      const { error: appError } = await supabase
        .from('financing_applications')
        .update({
          approved_amount: approvedAmount,
          contract_override_name: fullNameFromId,
          contract_override_installments: installmentsCount,
          workflow_status: proceedToOffer ? 'OFFER_READY' : 'ADMIN_SETUP',
          phase_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);
        
      if (appError) throw appError;
      
      // Log audit
      await supabase.from('financing_workflow_audit').insert({
        application_id: applicationId,
        entity_type: 'offer_setup',
        event_type: existingSetup ? 'UPDATE' : 'INSERT',
        to_status: proceedToOffer ? 'OFFER_READY' : 'ADMIN_SETUP',
        actor_id: user?.id,
        actor_role: 'admin',
        new_data: setupData,
        is_customer_visible: proceedToOffer
      });
      
      toast.success(proceedToOffer ? 'تم حفظ العرض والانتقال للمرحلة التالية' : 'تم حفظ التعديلات');
      onComplete();
      
    } catch (error) {
      console.error('Error saving offer setup:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  }

  const previewSchedule = generateInstallmentsPreview();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ضبط عرض التمويل</h2>
          <p className="text-sm text-muted-foreground">
            حدد تفاصيل العرض للعميل
          </p>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
          مرحلة الضبط الإداري
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">الاسم المقدم:</span>
                  <p className="font-medium">{applicationData.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">رقم الهوية:</span>
                  <p className="font-medium font-mono">{applicationData.national_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">المبلغ المطلوب:</span>
                  <p className="font-medium">{applicationData.requested_amount.toLocaleString()} ر.س</p>
                </div>
                <div>
                  <span className="text-muted-foreground">الهاتف:</span>
                  <p className="font-medium font-mono">{applicationData.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financing Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                تفاصيل التمويل
              </CardTitle>
              <CardDescription>
                حدد قيمة التمويل المعتمدة وعدد الأقساط
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Approved Amount */}
              <div className="space-y-2">
                <Label htmlFor="approvedAmount">قيمة التمويل المعتمدة (ر.س)</Label>
                <Input
                  id="approvedAmount"
                  type="number"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  className="font-mono text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  الحد الأدنى: {MIN_AMOUNT.toLocaleString()} ر.س | الحد الأقصى: {MAX_AMOUNT.toLocaleString()} ر.س
                </p>
              </div>

              {/* Installments Count */}
              <div className="space-y-2">
                <Label htmlFor="installmentsCount">عدد الأقساط</Label>
                <Select
                  value={installmentsCount.toString()}
                  onValueChange={(v) => setInstallmentsCount(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر عدد الأقساط" />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map(count => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} {count <= 10 ? 'أقساط' : 'قسط'}
                        <span className="text-muted-foreground mr-2">
                          ({(approvedAmount / count).toLocaleString()} ر.س/شهر)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* First Installment Date */}
              <div className="space-y-2">
                <Label htmlFor="firstInstallmentDate">تاريخ أول قسط</Label>
                <Input
                  id="firstInstallmentDate"
                  type="date"
                  value={firstInstallmentDate}
                  onChange={(e) => setFirstInstallmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Calculated Installment Amount */}
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">قيمة القسط الشهري</span>
                  <span className="text-2xl font-bold text-primary">
                    {installmentAmount.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Name from ID */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                الاسم كما في الهوية الوطنية
              </CardTitle>
              <CardDescription>
                أدخل الاسم الكامل كما يظهر في الهوية الوطنية للعميل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullNameFromId">الاسم الرباعي</Label>
                <Input
                  id="fullNameFromId"
                  value={fullNameFromId}
                  onChange={(e) => setFullNameFromId(e.target.value)}
                  placeholder="الاسم الأول - الأب - الجد - العائلة"
                  className="text-lg"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="nationalIdVerified"
                  checked={nationalIdVerified}
                  onCheckedChange={(checked) => setNationalIdVerified(checked === true)}
                />
                <Label
                  htmlFor="nationalIdVerified"
                  className="text-sm font-normal cursor-pointer"
                >
                  أؤكد أنني تحققت من صورة الهوية الوطنية وأن الاسم مطابق
                </Label>
              </div>

              {!nationalIdVerified && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    يجب التحقق من الهوية الوطنية قبل المتابعة
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ملاحظات إدارية</CardTitle>
              <CardDescription>
                ملاحظات داخلية (لن تظهر للعميل)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="أضف ملاحظات..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Preview */}
        <div className="space-y-6">
          {/* Schedule Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                معاينة جدول الأقساط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {previewSchedule.map((item) => (
                  <div
                    key={item.number}
                    className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                  >
                    <span className="text-muted-foreground">القسط {item.number}</span>
                    <div className="text-left">
                      <p className="font-medium">{item.amount.toLocaleString()} ر.س</p>
                      <p className="text-xs text-muted-foreground">{item.dueDate}</p>
                    </div>
                  </div>
                ))}
                {installmentsCount > 6 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    و {installmentsCount - 6} أقساط أخرى...
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي التمويل</span>
                  <span className="font-bold">{approvedAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الأقساط</span>
                  <span className="font-medium">{installmentsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">القسط الشهري</span>
                  <span className="font-medium">{installmentAmount.toLocaleString()} ر.س</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Calculator className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  سيتم إنشاء عقد تمويل بقيمة
                </p>
                <p className="text-2xl font-bold text-primary">
                  {approvedAmount.toLocaleString()} ر.س
                </p>
                <p className="text-sm text-muted-foreground">
                  على {installmentsCount} {installmentsCount <= 10 ? 'أقساط' : 'قسط'} شهرية
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleSave(true)}
              disabled={loading || !nationalIdVerified}
            >
              <CheckCircle className="h-4 w-4 ml-2" />
              حفظ والانتقال للعرض
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSave(false)}
              disabled={loading}
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ كمسودة
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onCancel}
              disabled={loading}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
