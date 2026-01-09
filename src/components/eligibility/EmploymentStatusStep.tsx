import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Building2, 
  GraduationCap, 
  UserCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  FileText,
  Shield,
  DollarSign,
  Users,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  EmploymentStatus,
  EmploymentTypeConfig,
  getAllEmploymentTypes,
  getEmploymentConfig,
  requiresGuarantor,
  getMaxFinancingAmount,
} from '@/lib/eligibility/employmentTypes';
import {
  validateEmploymentSelection,
  checkDocumentCompleteness,
  EmploymentVerificationState,
} from '@/lib/eligibility/employmentVerification';

interface EmploymentStatusStepProps {
  onComplete: (status: EmploymentStatus, additionalInfo: Record<string, any>) => void;
  onStatusChange?: (status: EmploymentStatus | null) => void;
  initialStatus?: EmploymentStatus;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Building2,
  GraduationCap,
  UserCircle,
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  blue: { 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500', 
    text: 'text-blue-500',
    glow: 'shadow-blue-500/20'
  },
  emerald: { 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500', 
    text: 'text-emerald-500',
    glow: 'shadow-emerald-500/20'
  },
  purple: { 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500', 
    text: 'text-purple-500',
    glow: 'shadow-purple-500/20'
  },
  amber: { 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500', 
    text: 'text-amber-500',
    glow: 'shadow-amber-500/20'
  },
};

function EmploymentCard({ 
  config, 
  isSelected, 
  onClick,
  disabled 
}: { 
  config: EmploymentTypeConfig; 
  isSelected: boolean; 
  onClick: () => void;
  disabled?: boolean;
}) {
  const Icon = ICON_MAP[config.icon] || UserCircle;
  const colors = COLOR_MAP[config.color] || COLOR_MAP.blue;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        "relative w-full p-5 rounded-xl border-2 transition-all text-right",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        isSelected 
          ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}` 
          : "bg-card border-border hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 left-3"
        >
          <CheckCircle2 className={cn("h-5 w-5", colors.text)} />
        </motion.div>
      )}

      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          isSelected ? colors.bg : "bg-muted"
        )}>
          <Icon className={cn("h-6 w-6", isSelected ? colors.text : "text-muted-foreground")} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-lg mb-1",
            isSelected ? colors.text : "text-foreground"
          )}>
            {config.nameAr}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {config.description}
          </p>
        </div>
      </div>

      {/* Quick info badges */}
      <div className="flex flex-wrap gap-2 mt-4">
        <span className={cn(
          "text-xs px-2 py-1 rounded-full",
          isSelected ? colors.bg : "bg-muted",
          isSelected ? colors.text : "text-muted-foreground"
        )}>
          {config.requiredDocuments.length} مستندات
        </span>
        {requiresGuarantor(config.status) && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
            يتطلب كفيل
          </span>
        )}
        <span className={cn(
          "text-xs px-2 py-1 rounded-full",
          config.eligibilityScore >= 80 ? "bg-emerald-500/10 text-emerald-500" :
          config.eligibilityScore >= 60 ? "bg-blue-500/10 text-blue-500" :
          "bg-amber-500/10 text-amber-500"
        )}>
          أهلية: {config.eligibilityScore}%
        </span>
      </div>
    </motion.button>
  );
}

function RequirementsPanel({ status }: { status: EmploymentStatus }) {
  const config = getEmploymentConfig(status);
  const colors = COLOR_MAP[config.color] || COLOR_MAP.blue;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className={cn("rounded-xl border p-5 space-y-6", colors.bg, colors.border)}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className={cn("h-5 w-5", colors.text)} />
          <h4 className="font-semibold">متطلبات {config.nameAr}</h4>
        </div>

        {/* Required Documents */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            <span>المستندات المطلوبة:</span>
          </div>
          <ul className="space-y-2 pr-6">
            {config.requiredDocuments.map((doc) => (
              <li key={doc.type} className="flex items-start gap-2 text-sm">
                <span className="text-emerald-500 mt-0.5">●</span>
                <div>
                  <span className="font-medium">{doc.nameAr}</span>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Income Requirements */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            <span>متطلبات الدخل:</span>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-sm">
            {config.incomeRequirement.minMonthlyIncome > 0 ? (
              <p>الحد الأدنى للدخل الشهري: <span className="font-semibold text-primary">{config.incomeRequirement.minMonthlyIncome.toLocaleString()} ر.س</span></p>
            ) : (
              <p className="text-muted-foreground">يعتمد على دخل الكفيل</p>
            )}
            {config.incomeRequirement.consecutiveMonths > 0 && (
              <p className="text-muted-foreground mt-1">
                يجب إثبات الدخل لآخر {config.incomeRequirement.consecutiveMonths} أشهر
              </p>
            )}
          </div>
        </div>

        {/* Guarantor */}
        {requiresGuarantor(status) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>الكفيل:</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-200">
              <p>يجب توفير كفيل (موظف أو صاحب عمل) لاستكمال الطلب</p>
            </div>
          </div>
        )}

        {/* Special Conditions */}
        {config.specialConditions && config.specialConditions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <span>شروط خاصة:</span>
            </div>
            <ul className="space-y-1 text-sm text-amber-200/80">
              {config.specialConditions.map((condition, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span>•</span>
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Max Financing */}
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">الحد الأقصى للتمويل</p>
          <p className="text-2xl font-bold text-primary">
            {config.restrictions.maxFinancingAmount 
              ? `${config.restrictions.maxFinancingAmount.toLocaleString()} ر.س`
              : `${config.restrictions.maxFinancingPercentage}% من الدخل السنوي`
            }
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function AdditionalInfoForm({ 
  status, 
  onSubmit,
  isLoading 
}: { 
  status: EmploymentStatus;
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const config = getEmploymentConfig(status);

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    // Validate based on employment type
    switch (status) {
      case 'employed':
        if (!formData.employmentMonths || formData.employmentMonths < 6) {
          newErrors.employmentMonths = 'يجب أن تكون مدة العمل 6 أشهر على الأقل';
        }
        if (!formData.salary || formData.salary < config.incomeRequirement.minMonthlyIncome) {
          newErrors.salary = `الحد الأدنى للراتب ${config.incomeRequirement.minMonthlyIncome} ر.س`;
        }
        break;

      case 'business_owner':
        if (!formData.businessAge || formData.businessAge < 12) {
          newErrors.businessAge = 'يجب أن يكون عمر المنشأة سنة على الأقل';
        }
        if (!formData.monthlyRevenue || formData.monthlyRevenue < config.incomeRequirement.minMonthlyIncome) {
          newErrors.monthlyRevenue = `الحد الأدنى للإيرادات ${config.incomeRequirement.minMonthlyIncome} ر.س`;
        }
        break;

      case 'student':
        if (!formData.university) {
          newErrors.university = 'يجب تحديد الجامعة أو المعهد';
        }
        break;

      case 'other':
        if (!formData.incomeSource) {
          newErrors.incomeSource = 'يجب تحديد مصدر الدخل';
        }
        if (!formData.monthlyIncome || formData.monthlyIncome < config.incomeRequirement.minMonthlyIncome) {
          newErrors.monthlyIncome = `الحد الأدنى للدخل ${config.incomeRequirement.minMonthlyIncome} ر.س`;
        }
        break;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const renderFields = () => {
    switch (status) {
      case 'employed':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="employer">جهة العمل</Label>
              <Input
                id="employer"
                value={formData.employer || ''}
                onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                placeholder="اسم الشركة أو الجهة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentMonths">مدة العمل (بالأشهر)</Label>
              <Input
                id="employmentMonths"
                type="number"
                min="0"
                value={formData.employmentMonths || ''}
                onChange={(e) => setFormData({ ...formData, employmentMonths: parseInt(e.target.value) || 0 })}
                placeholder="12"
                className={errors.employmentMonths ? 'border-destructive' : ''}
              />
              {errors.employmentMonths && (
                <p className="text-sm text-destructive">{errors.employmentMonths}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">الراتب الشهري (ر.س)</Label>
              <Input
                id="salary"
                type="number"
                min="0"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                placeholder="5000"
                className={errors.salary ? 'border-destructive' : ''}
              />
              {errors.salary && (
                <p className="text-sm text-destructive">{errors.salary}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>القطاع</Label>
              <RadioGroup
                value={formData.sector || ''}
                onValueChange={(value) => setFormData({ ...formData, sector: value })}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="government" id="gov" />
                  <Label htmlFor="gov">حكومي</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">خاص</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="semi_government" id="semi" />
                  <Label htmlFor="semi">شبه حكومي</Label>
                </div>
              </RadioGroup>
            </div>
          </>
        );

      case 'business_owner':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="businessName">اسم المنشأة</Label>
              <Input
                id="businessName"
                value={formData.businessName || ''}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="اسم الشركة أو المؤسسة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercialRegister">رقم السجل التجاري</Label>
              <Input
                id="commercialRegister"
                value={formData.commercialRegister || ''}
                onChange={(e) => setFormData({ ...formData, commercialRegister: e.target.value })}
                placeholder="1010xxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessAge">عمر المنشأة (بالأشهر)</Label>
              <Input
                id="businessAge"
                type="number"
                min="0"
                value={formData.businessAge || ''}
                onChange={(e) => setFormData({ ...formData, businessAge: parseInt(e.target.value) || 0 })}
                placeholder="24"
                className={errors.businessAge ? 'border-destructive' : ''}
              />
              {errors.businessAge && (
                <p className="text-sm text-destructive">{errors.businessAge}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyRevenue">متوسط الإيرادات الشهرية (ر.س)</Label>
              <Input
                id="monthlyRevenue"
                type="number"
                min="0"
                value={formData.monthlyRevenue || ''}
                onChange={(e) => setFormData({ ...formData, monthlyRevenue: parseInt(e.target.value) || 0 })}
                placeholder="50000"
                className={errors.monthlyRevenue ? 'border-destructive' : ''}
              />
              {errors.monthlyRevenue && (
                <p className="text-sm text-destructive">{errors.monthlyRevenue}</p>
              )}
            </div>
          </>
        );

      case 'student':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="university">الجامعة / المعهد</Label>
              <Input
                id="university"
                value={formData.university || ''}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="اسم الجامعة أو المعهد"
                className={errors.university ? 'border-destructive' : ''}
              />
              {errors.university && (
                <p className="text-sm text-destructive">{errors.university}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">التخصص</Label>
              <Input
                id="major"
                value={formData.major || ''}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="علوم الحاسب"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graduationYear">سنة التخرج المتوقعة</Label>
              <Input
                id="graduationYear"
                type="number"
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 10}
                value={formData.graduationYear || ''}
                onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) || 0 })}
                placeholder="2026"
              />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-200">
              <Info className="h-4 w-4 inline ml-2" />
              <span>سيُطلب منك إضافة بيانات الكفيل في الخطوة التالية</span>
            </div>
          </>
        );

      case 'other':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="incomeSource">مصدر الدخل</Label>
              <Input
                id="incomeSource"
                value={formData.incomeSource || ''}
                onChange={(e) => setFormData({ ...formData, incomeSource: e.target.value })}
                placeholder="عمل حر، استثمارات، إيجارات..."
                className={errors.incomeSource ? 'border-destructive' : ''}
              />
              {errors.incomeSource && (
                <p className="text-sm text-destructive">{errors.incomeSource}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">متوسط الدخل الشهري (ر.س)</Label>
              <Input
                id="monthlyIncome"
                type="number"
                min="0"
                value={formData.monthlyIncome || ''}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: parseInt(e.target.value) || 0 })}
                placeholder="8000"
                className={errors.monthlyIncome ? 'border-destructive' : ''}
              />
              {errors.monthlyIncome && (
                <p className="text-sm text-destructive">{errors.monthlyIncome}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeDetails">تفاصيل إضافية</Label>
              <Input
                id="incomeDetails"
                value={formData.incomeDetails || ''}
                onChange={(e) => setFormData({ ...formData, incomeDetails: e.target.value })}
                placeholder="وصف مختصر لطبيعة العمل أو مصدر الدخل"
              />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-200">
              <Info className="h-4 w-4 inline ml-2" />
              <span>هذه الفئة تتطلب مراجعة يدوية إضافية وكفيل مؤهل</span>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 mt-6 bg-card border rounded-xl p-5"
    >
      <h4 className="font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        معلومات إضافية
      </h4>

      <div className="grid gap-4">
        {renderFields()}
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full" 
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
            جارِ التحقق...
          </>
        ) : (
          <>
            متابعة
            <ChevronLeft className="h-4 w-4 mr-2" />
          </>
        )}
      </Button>
    </motion.div>
  );
}

export function EmploymentStatusStep({
  onComplete,
  onStatusChange,
  initialStatus,
}: EmploymentStatusStepProps) {
  const [selectedStatus, setSelectedStatus] = useState<EmploymentStatus | null>(initialStatus || null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    warnings: string[];
    blockers: string[];
  } | null>(null);

  const employmentTypes = getAllEmploymentTypes();

  const handleStatusSelect = (status: EmploymentStatus) => {
    setSelectedStatus(status);
    onStatusChange?.(status);
    
    // Validate selection
    const result = validateEmploymentSelection(status);
    setValidationResult(result);
    setShowDetails(true);
  };

  const handleFormSubmit = async (additionalInfo: Record<string, any>) => {
    if (!selectedStatus) return;

    setIsLoading(true);
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Re-validate with additional info
    const result = validateEmploymentSelection(selectedStatus, additionalInfo);
    setValidationResult(result);

    if (result.isValid) {
      onComplete(selectedStatus, additionalInfo);
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">الحالة الوظيفية</h3>
          <p className="text-sm text-muted-foreground">اختر حالتك الوظيفية لتحديد المتطلبات</p>
        </div>
      </div>

      {/* Employment Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {employmentTypes.map((config) => (
          <EmploymentCard
            key={config.status}
            config={config}
            isSelected={selectedStatus === config.status}
            onClick={() => handleStatusSelect(config.status)}
            disabled={isLoading}
          />
        ))}
      </div>

      {/* Validation Warnings/Blockers */}
      <AnimatePresence>
        {validationResult && (validationResult.warnings.length > 0 || validationResult.blockers.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {validationResult.blockers.map((blocker, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{blocker}</span>
              </div>
            ))}
            {validationResult.warnings.map((warning, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{warning}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requirements Panel */}
      <AnimatePresence>
        {selectedStatus && showDetails && (
          <RequirementsPanel status={selectedStatus} />
        )}
      </AnimatePresence>

      {/* Additional Info Form */}
      <AnimatePresence>
        {selectedStatus && showDetails && validationResult?.isValid && (
          <AdditionalInfoForm
            status={selectedStatus}
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
