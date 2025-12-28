import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  CreditCard,
  FileText,
  Sparkles,
  Clock,
} from "lucide-react";

interface FormData {
  nationality: string;
  age: string;
  hasValidId: boolean;
  hasRegisteredPhone: boolean;
  hasActiveEmail: boolean;
  hasPreviousDefaults: boolean;
  requestedAmount: string;
  employmentStatus: string;
}

const initialFormData: FormData = {
  nationality: "",
  age: "",
  hasValidId: false,
  hasRegisteredPhone: false,
  hasActiveEmail: false,
  hasPreviousDefaults: false,
  requestedAmount: "",
  employmentStatus: "",
};

export default function FinancingEligibility() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showResult, setShowResult] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    score: number;
    reasons: string[];
    recommendations: string[];
  } | null>(null);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      calculateEligibility();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const calculateEligibility = () => {
    let score = 0;
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Nationality check
    if (formData.nationality === "saudi" || formData.nationality === "resident") {
      score += 25;
    } else {
      reasons.push("غير مؤهل: يجب أن تكون سعودي الجنسية أو مقيم بإقامة سارية");
    }

    // Age check
    const age = parseInt(formData.age);
    if (age >= 21 && age <= 65) {
      score += 20;
    } else if (age < 21) {
      reasons.push("العمر أقل من 21 سنة (الحد الأدنى المطلوب)");
    } else {
      reasons.push("العمر أكبر من 65 سنة");
    }

    // Documents check
    if (formData.hasValidId) {
      score += 15;
    } else {
      reasons.push("يجب توفر هوية وطنية أو إقامة سارية");
      recommendations.push("تأكد من تجديد هويتك قبل التقديم");
    }

    if (formData.hasRegisteredPhone) {
      score += 10;
    } else {
      reasons.push("يجب توفر رقم جوال مسجل باسمك");
      recommendations.push("سجل رقم جوالك باسمك من خلال مزود الخدمة");
    }

    if (formData.hasActiveEmail) {
      score += 10;
    } else {
      reasons.push("يجب توفر بريد إلكتروني فعّال");
    }

    // Previous defaults
    if (!formData.hasPreviousDefaults) {
      score += 15;
    } else {
      reasons.push("وجود تعثرات سابقة يقلل من فرص الموافقة");
      recommendations.push("حاول تسوية التعثرات السابقة قبل التقديم");
    }

    // Employment status
    if (formData.employmentStatus === "employed" || formData.employmentStatus === "business") {
      score += 5;
    }

    const eligible = score >= 70 && reasons.length === 0;

    if (eligible) {
      recommendations.push("أنت مؤهل للتقديم! يمكنك البدء الآن.");
    }

    setEligibilityResult({ eligible, score, reasons, recommendations });
    setShowResult(true);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
    setShowResult(false);
    setEligibilityResult(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <ClientDashboardLayout>
      <motion.div
        className="space-y-6 max-w-3xl mx-auto"
        dir="rtl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <motion.div 
                className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Shield className="h-6 w-6 text-white" />
              </motion.div>
              التحقق من الأهلية
            </h1>
            <p className="text-muted-foreground mt-1">
              تحقق من أهليتك للتمويل خلال دقيقتين
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button asChild variant="outline">
              <Link to="/dashboard/financing">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة للتمويل
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="mb-6 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        الخطوة {step} من {totalSteps}
                      </span>
                      <motion.span 
                        className="text-sm font-medium"
                        key={progress}
                        initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                        animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                        transition={{ duration: 0.3 }}
                      >
                        {Math.round(progress)}%
                      </motion.span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Form Steps */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <motion.div
                        key={step}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {step === 1 && <User className="h-5 w-5" />}
                        {step === 2 && <FileText className="h-5 w-5" />}
                        {step === 3 && <CreditCard className="h-5 w-5" />}
                      </motion.div>
                      <motion.span
                        key={`title-${step}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {step === 1 && "المعلومات الشخصية"}
                        {step === 2 && "المستندات والتوثيق"}
                        {step === 3 && "معلومات إضافية"}
                      </motion.span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="space-y-3">
                          <Label>الجنسية / الإقامة</Label>
                          <RadioGroup
                            value={formData.nationality}
                            onValueChange={(value) =>
                              setFormData({ ...formData, nationality: value })
                            }
                          >
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="saudi" id="saudi" />
                              <Label htmlFor="saudi" className="cursor-pointer">
                                سعودي الجنسية
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="resident" id="resident" />
                              <Label htmlFor="resident" className="cursor-pointer">
                                مقيم بإقامة سارية
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="visitor" id="visitor" />
                              <Label htmlFor="visitor" className="cursor-pointer">
                                زائر
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="age">العمر</Label>
                          <Input
                            id="age"
                            type="number"
                            placeholder="أدخل عمرك"
                            value={formData.age}
                            onChange={(e) =>
                              setFormData({ ...formData, age: e.target.value })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            الحد الأدنى للعمر: 21 سنة
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-2 space-x-reverse p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <Checkbox
                            id="validId"
                            checked={formData.hasValidId}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, hasValidId: !!checked })
                            }
                          />
                          <Label htmlFor="validId" className="cursor-pointer flex-1">
                            <span className="font-medium">لدي هوية وطنية / إقامة سارية</span>
                            <p className="text-sm text-muted-foreground">
                              يجب أن تكون الهوية سارية المفعول
                            </p>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <Checkbox
                            id="registeredPhone"
                            checked={formData.hasRegisteredPhone}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, hasRegisteredPhone: !!checked })
                            }
                          />
                          <Label htmlFor="registeredPhone" className="cursor-pointer flex-1">
                            <span className="font-medium">رقم جوالي مسجل باسمي</span>
                            <p className="text-sm text-muted-foreground">
                              يجب أن يكون الرقم مسجلاً باسمك لدى مزود الخدمة
                            </p>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <Checkbox
                            id="activeEmail"
                            checked={formData.hasActiveEmail}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, hasActiveEmail: !!checked })
                            }
                          />
                          <Label htmlFor="activeEmail" className="cursor-pointer flex-1">
                            <span className="font-medium">لدي بريد إلكتروني فعّال</span>
                            <p className="text-sm text-muted-foreground">
                              سيتم التواصل معك عبر البريد الإلكتروني
                            </p>
                          </Label>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="space-y-3">
                          <Label>الحالة الوظيفية</Label>
                          <RadioGroup
                            value={formData.employmentStatus}
                            onValueChange={(value) =>
                              setFormData({ ...formData, employmentStatus: value })
                            }
                          >
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="employed" id="employed" />
                              <Label htmlFor="employed" className="cursor-pointer">
                                موظف
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="business" id="business" />
                              <Label htmlFor="business" className="cursor-pointer">
                                صاحب عمل حر / تجاري
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="student" id="student" />
                              <Label htmlFor="student" className="cursor-pointer">
                                طالب
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="other" id="other" />
                              <Label htmlFor="other" className="cursor-pointer">
                                أخرى
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                          <Checkbox
                            id="previousDefaults"
                            checked={formData.hasPreviousDefaults}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, hasPreviousDefaults: !!checked })
                            }
                          />
                          <Label htmlFor="previousDefaults" className="cursor-pointer flex-1">
                            <span className="font-medium text-yellow-400">
                              لدي تعثرات سابقة في السداد
                            </span>
                            <p className="text-sm text-muted-foreground">
                              التعثرات السابقة قد تؤثر على قرار الموافقة
                            </p>
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="requestedAmount">المبلغ المطلوب (تقريبي)</Label>
                          <Input
                            id="requestedAmount"
                            type="number"
                            placeholder="مثال: 5000"
                            value={formData.requestedAmount}
                            onChange={(e) =>
                              setFormData({ ...formData, requestedAmount: e.target.value })
                            }
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation */}
                  <div className="flex justify-between pt-4 border-t border-border">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1}
                      >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        السابق
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleNext}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        {step === totalSteps ? "تحقق الآن" : "التالي"}
                        {step !== totalSteps && <ArrowLeft className="h-4 w-4 mr-2" />}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border-2 ${
                eligibilityResult?.eligible 
                  ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" 
                  : "border-red-500/50 bg-gradient-to-br from-red-500/10 to-orange-500/10"
              }`}>
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                      eligibilityResult?.eligible 
                        ? "bg-emerald-500" 
                        : "bg-red-500"
                    }`}
                  >
                    {eligibilityResult?.eligible ? (
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    ) : (
                      <XCircle className="h-10 w-10 text-white" />
                    )}
                  </motion.div>

                  <h2 className="text-2xl font-bold mb-2">
                    {eligibilityResult?.eligible 
                      ? "مبروك! أنت مؤهل للتمويل" 
                      : "للأسف، لست مؤهلاً حالياً"}
                  </h2>

                  <div className="mb-6">
                    <Badge className={`text-lg px-4 py-1 ${
                      eligibilityResult?.eligible 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      نسبة الأهلية: {eligibilityResult?.score}%
                    </Badge>
                  </div>

                  {eligibilityResult && eligibilityResult.reasons.length > 0 && (
                    <div className="text-right mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        الملاحظات:
                      </h3>
                      <ul className="space-y-2">
                        {eligibilityResult.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {eligibilityResult && eligibilityResult.recommendations.length > 0 && (
                    <div className="text-right mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        التوصيات:
                      </h3>
                      <ul className="space-y-2">
                        {eligibilityResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-3 mt-6">
                    {eligibilityResult?.eligible ? (
                      <>
                        <Button
                          asChild
                          size="lg"
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                        >
                          <Link to="/dashboard/financing/apply">
                            تقديم طلب التمويل الآن
                            <ArrowLeft className="h-4 w-4 mr-2" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="lg"
                          variant="outline"
                        >
                          <Link to="/dashboard/financing/calculator">
                            حاسبة التمويل
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={resetForm}
                          size="lg"
                          variant="outline"
                        >
                          <Clock className="h-4 w-4 ml-2" />
                          إعادة التحقق
                        </Button>
                        <Button
                          asChild
                          size="lg"
                          variant="outline"
                        >
                          <Link to="/dashboard/financing/guide">
                            تعليمات التمويل
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ClientDashboardLayout>
  );
}
