/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                   عارض العقد الرسمي - Official Contract Viewer
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * متطلبات القراءة الإلزامية:
 * 1. فتح العقد كاملاً في صفحة PDF (Viewer)
 * 2. لا يظهر زر الموافقة إلا بعد:
 *    - فتح ملف PDF
 *    - الوصول إلى نهاية المستند (scroll to bottom)
 *    - مدة قراءة منطقية (≥ X ثانية)
 * 3. checkbox إلزامي: "قرأت وفهمت جميع الشروط والأحكام وأوافق عليها"
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  AlertTriangle,
  Download,
  Shield,
  Lock,
  FileSignature,
  Loader2,
  ScrollText,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import {
  LEGAL_CONTRACT_ARTICLES,
  CLIENT_LEGAL_ACKNOWLEDGMENTS,
  LEGAL_WARNINGS,
  FORMAL_UI_MESSAGES,
  LEGAL_COMPANY_INFO,
  CONTRACT_VERSION_INFO,
  type LegalContractData,
} from "@/lib/financing/legalContractContent";

// ============================================
// الثوابت
// ============================================

// الحد الأدنى لوقت القراءة (بالثواني)
const MINIMUM_READING_TIME_SECONDS = 60; // دقيقة واحدة على الأقل

// نسبة التمرير المطلوبة للوصول للنهاية
const REQUIRED_SCROLL_PERCENTAGE = 95;

// ============================================
// Props Interface
// ============================================

interface OfficialContractViewerProps {
  contractData: LegalContractData;
  applicationId: string;
  userId: string;
  onContractAccepted: (acceptanceRecord: ContractAcceptanceRecord) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export interface ContractAcceptanceRecord {
  contract_id: string;
  application_id: string;
  user_id: string;
  accepted_at: string;
  reading_time_seconds: number;
  scroll_completed: boolean;
  checkbox_accepted: boolean;
  button_clicked: boolean;
  contract_version: string;
  pdf_hash?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, unknown>;
}

// ============================================
// Main Component
// ============================================

export function OfficialContractViewer({
  contractData,
  applicationId,
  userId,
  onContractAccepted,
  onCancel,
  isSubmitting = false,
}: OfficialContractViewerProps) {
  // ════════════════ State ════════════════
  const [readingStartTime] = useState<number>(Date.now());
  const [readingTimeSeconds, setReadingTimeSeconds] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [hasMinimumReadingTime, setHasMinimumReadingTime] = useState<boolean>(false);
  const [acceptTermsChecked, setAcceptTermsChecked] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfHash, setPdfHash] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ════════════════ Timer Effect ════════════════
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - readingStartTime) / 1000);
      setReadingTimeSeconds(elapsed);
      
      if (elapsed >= MINIMUM_READING_TIME_SECONDS) {
        setHasMinimumReadingTime(true);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [readingStartTime]);

  // ════════════════ Scroll Tracking ════════════════
  const handleScroll = useCallback(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const maxScroll = scrollHeight - clientHeight;
    
    if (maxScroll <= 0) {
      setScrollProgress(100);
      setHasReachedEnd(true);
      return;
    }

    const progress = Math.min((scrollTop / maxScroll) * 100, 100);
    setScrollProgress(progress);

    if (progress >= REQUIRED_SCROLL_PERCENTAGE) {
      setHasReachedEnd(true);
    }
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", handleScroll);
    // Check initial state
    handleScroll();

    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // ════════════════ Validation ════════════════
  const canAcceptContract = hasReachedEnd && hasMinimumReadingTime && acceptTermsChecked;

  const getBlockingReason = (): string => {
    if (!hasReachedEnd) {
      return "يجب قراءة العقد كاملاً والوصول لنهايته";
    }
    if (!hasMinimumReadingTime) {
      const remaining = MINIMUM_READING_TIME_SECONDS - readingTimeSeconds;
      return `يرجى الانتظار ${remaining} ثانية أخرى لإتمام القراءة`;
    }
    if (!acceptTermsChecked) {
      return "يجب الموافقة على الشروط والأحكام";
    }
    return "";
  };

  // ════════════════ Handlers ════════════════
  const handleAcceptContract = async () => {
    if (!canAcceptContract) {
      toast.error(getBlockingReason());
      return;
    }

    const acceptanceRecord: ContractAcceptanceRecord = {
      contract_id: `CNT-${applicationId}`,
      application_id: applicationId,
      user_id: userId,
      accepted_at: new Date().toISOString(),
      reading_time_seconds: readingTimeSeconds,
      scroll_completed: hasReachedEnd,
      checkbox_accepted: acceptTermsChecked,
      button_clicked: true,
      contract_version: CONTRACT_VERSION_INFO.version,
      pdf_hash: pdfHash || undefined,
      user_agent: navigator.userAgent,
      device_info: {
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        platform: navigator.platform,
        language: navigator.language,
      },
    };

    onContractAccepted(acceptanceRecord);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // ════════════════ Render ════════════════
  return (
    <div className="space-y-4" dir="rtl">
      {/* ═══════════ Contract Header ═══════════ */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-xl">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  {FORMAL_UI_MESSAGES.contractTitle}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  إصدار {CONTRACT_VERSION_INFO.version} • {CONTRACT_VERSION_INFO.lastUpdated}
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-xs px-3 py-1">
              <Lock className="w-3 h-3 ml-1" />
              عقد ملزم قانونياً
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* ═══════════ Legal Warning ═══════════ */}
      <Alert variant="destructive" className="border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-bold text-base">
          {LEGAL_WARNINGS.bindingContract}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-1">
          <p>{LEGAL_WARNINGS.readCarefully}</p>
          <p className="font-semibold">{LEGAL_WARNINGS.noWithdrawal}</p>
        </AlertDescription>
      </Alert>

      {/* ═══════════ Reading Progress Indicators ═══════════ */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Scroll Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <ScrollText className="w-4 h-4 text-muted-foreground" />
                  تقدم القراءة
                </span>
                <span className={hasReachedEnd ? "text-green-600 font-medium" : ""}>
                  {Math.round(scrollProgress)}%
                </span>
              </div>
              <Progress value={scrollProgress} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {hasReachedEnd ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">تم الوصول لنهاية العقد</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span>يجب التمرير للوصول لنهاية العقد</span>
                  </>
                )}
              </div>
            </div>

            {/* Reading Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  وقت القراءة
                </span>
                <span className={hasMinimumReadingTime ? "text-green-600 font-medium" : ""}>
                  {formatTime(readingTimeSeconds)}
                </span>
              </div>
              <Progress 
                value={Math.min((readingTimeSeconds / MINIMUM_READING_TIME_SECONDS) * 100, 100)} 
                className="h-2" 
              />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {hasMinimumReadingTime ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">تم استيفاء الحد الأدنى للقراءة</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span>الحد الأدنى: {formatTime(MINIMUM_READING_TIME_SECONDS)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Acceptance Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-muted-foreground" />
                  الموافقة
                </span>
                <span className={acceptTermsChecked ? "text-green-600 font-medium" : ""}>
                  {acceptTermsChecked ? "تمت" : "بانتظار"}
                </span>
              </div>
              <Progress value={acceptTermsChecked ? 100 : 0} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {acceptTermsChecked ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">تمت الموافقة على الشروط</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span>يجب الموافقة على الشروط</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ Parties Information ═══════════ */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Party */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-primary">الطرف الأول (الممول / مزود الخدمة)</h4>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-base">{LEGAL_COMPANY_INFO.name}</p>
                <p className="text-muted-foreground">سجل تجاري: {LEGAL_COMPANY_INFO.commercialRegister}</p>
                <p className="text-muted-foreground">{LEGAL_COMPANY_INFO.address}</p>
              </div>
            </div>

            {/* Second Party */}
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-foreground" />
                <h4 className="font-bold">الطرف الثاني (العميل / المستفيد)</h4>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-base">{contractData.applicant_full_name}</p>
                <p className="text-muted-foreground">رقم الهوية: {contractData.applicant_national_id}</p>
                <p className="text-muted-foreground">الجوال: {contractData.applicant_phone}</p>
                <p className="text-muted-foreground">البريد: {contractData.applicant_email}</p>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg flex flex-wrap gap-4 justify-center text-sm">
            <div>
              <span className="text-muted-foreground">رقم العقد: </span>
              <span className="font-mono font-bold">{contractData.contract_number}</span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <span className="text-muted-foreground">رقم الطلب: </span>
              <span className="font-mono font-bold">{contractData.application_number}</span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <span className="text-muted-foreground">التاريخ: </span>
              <span className="font-bold">{contractData.contract_date}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ Non-Cash Financing Warning ═══════════ */}
      <Alert className="border-2 border-amber-500 bg-amber-500/10">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <AlertTitle className="font-bold text-amber-700 dark:text-amber-400">
          {LEGAL_WARNINGS.nonCashFinancing}
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          هذا العقد لتمويل شراء خدمات فقط. لن يتم صرف أي مبلغ نقدي للعميل. 
          الدفع يتم مباشرة لمزود الخدمة ({LEGAL_COMPANY_INFO.name}).
        </AlertDescription>
      </Alert>

      {/* ═══════════ Contract Body - Scrollable ═══════════ */}
      <Card className="border-2">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            بنود العقد والشروط والأحكام
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea
            ref={scrollRef as any}
            className="h-[500px] p-6"
          >
            {/* Bismillah */}
            <div className="text-center mb-8 py-4 border-b-2 border-primary/20">
              <p className="text-xl font-bold text-primary mb-3">بسم الله الرحمن الرحيم</p>
              <h2 className="text-2xl font-bold">عقد تمويل خدمات</h2>
              <p className="text-sm text-muted-foreground mt-2">
                مُبرم بين الطرفين المذكورين أعلاه بموجب الشروط والأحكام التالية
              </p>
            </div>

            {/* Contract Articles */}
            <div className="space-y-8">
              {LEGAL_CONTRACT_ARTICLES.map((article) => (
                <div key={article.number} className="space-y-3">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-r-4 border-primary pr-3">
                    {article.title}
                  </h3>
                  <div className="space-y-2 pr-4">
                    {article.clauses.map((clause, idx) => (
                      <p
                        key={idx}
                        className="text-sm leading-relaxed text-muted-foreground pr-4 border-r-2 border-muted py-1"
                      >
                        {clause}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-8" />

            {/* ═══════════ Financial Summary ═══════════ */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-r-4 border-primary pr-3">
                <FileText className="w-5 h-5" />
                ملخص الطلب والتفاصيل المالية
              </h3>

              {/* Services Table - Responsive */}
              <div className="rounded-xl border-2 border-primary/20 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-l from-primary/10 to-primary/5 px-4 py-3 border-b border-primary/20">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <ScrollText className="w-4 h-4" />
                    الخدمات المُموّلة
                  </h4>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-right font-bold w-12 text-foreground">#</TableHead>
                        <TableHead className="text-right font-bold text-foreground">وصف الخدمة</TableHead>
                        <TableHead className="text-center font-bold text-foreground w-20">الكمية</TableHead>
                        <TableHead className="text-left font-bold text-foreground w-32">سعر الوحدة</TableHead>
                        <TableHead className="text-left font-bold text-foreground w-36">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractData.services_list.map((service, i) => (
                        <TableRow key={i} className="hover:bg-muted/30">
                          <TableCell className="font-bold text-primary">{i + 1}</TableCell>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="font-mono">
                              {service.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-left font-mono text-muted-foreground">
                            {formatCurrency(service.unit_price)} ر.س
                          </TableCell>
                          <TableCell className="text-left font-mono font-bold text-primary">
                            {formatCurrency(service.total_price)} ر.س
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y">
                  {contractData.services_list.map((service, i) => (
                    <div key={i} className="p-4 space-y-3 hover:bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="font-bold">{service.name}</span>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                          الكمية: {service.quantity}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">سعر الوحدة</span>
                          <span className="font-mono">{formatCurrency(service.unit_price)} ر.س</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">الإجمالي</span>
                          <span className="font-mono font-bold text-primary">{formatCurrency(service.total_price)} ر.س</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Details Table - Responsive */}
              <div className="rounded-xl border-2 border-amber-500/30 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-l from-amber-500/10 to-amber-500/5 px-4 py-3 border-b border-amber-500/20">
                  <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    التفاصيل المالية
                  </h4>
                </div>

                <div className="p-4">
                  {/* Cost Breakdown */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Services Value */}
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">قيمة الخدمات</span>
                        <span className="font-mono font-medium">{formatCurrency(contractData.total_services_value)} ر.س</span>
                      </div>
                      {/* Admin Fees */}
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">الرسوم الإدارية</span>
                        <span className="font-mono font-medium">{formatCurrency(contractData.admin_fees)} ر.س</span>
                      </div>
                    </div>

                    {/* VAT */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">ضريبة القيمة المضافة (15%)</span>
                      <span className="font-mono font-medium">{formatCurrency(contractData.vat_amount)} ر.س</span>
                    </div>

                    {/* Grand Total */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-l from-primary/20 to-primary/10 rounded-lg border-2 border-primary/30">
                      <span className="font-bold text-lg">الإجمالي الكلي</span>
                      <span className="font-mono font-bold text-xl text-primary">{formatCurrency(contractData.grand_total)} ر.س</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Installment Details */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      تفاصيل الأقساط
                    </h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Financed Amount */}
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">المبلغ الممول</p>
                        <p className="font-mono font-bold text-primary text-lg">{formatCurrency(contractData.financed_amount)} ر.س</p>
                      </div>
                      
                      {/* Number of Installments */}
                      <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">عدد الأقساط</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">{contractData.installments_count} قسط</p>
                      </div>
                      
                      {/* Installment Amount */}
                      <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">قيمة القسط</p>
                        <p className="font-mono font-bold text-green-600 dark:text-green-400 text-lg">{formatCurrency(contractData.installment_amount)} ر.س</p>
                      </div>
                      
                      {/* Payment Period */}
                      <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">مدة السداد</p>
                        <p className="font-bold text-purple-600 dark:text-purple-400 text-lg">{contractData.installments_count} شهر</p>
                      </div>
                    </div>

                    {/* Payment Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          تاريخ أول قسط
                        </span>
                        <span className="font-bold">{contractData.first_installment_date}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          تاريخ آخر قسط
                        </span>
                        <span className="font-bold">{contractData.last_installment_date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* ═══════════ Client Acknowledgments ═══════════ */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-r-4 border-primary pr-3">
                إقرارات العميل
              </h3>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                {CLIENT_LEGAL_ACKNOWLEDGMENTS.map((ack, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{ack}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-8" />

            {/* ═══════════ Executive Bond Notice ═══════════ */}
            <Alert className="border-2 border-purple-500 bg-purple-500/10">
              <FileSignature className="h-5 w-5 text-purple-600" />
              <AlertTitle className="font-bold text-purple-700 dark:text-purple-400">
                {LEGAL_WARNINGS.executiveBond}
              </AlertTitle>
              <AlertDescription className="text-purple-800 dark:text-purple-300 space-y-2">
                <p>
                  بعد اعتماد هذا العقد، سيتم إصدار سند تنفيذي عبر منصة نافذ الرسمية.
                  يجب عليك توقيعه عبر المنصة لإتمام عملية التمويل.
                </p>
                <p className="font-semibold">
                  السند التنفيذي قابل للتنفيذ الجبري وفقاً لنظام التنفيذ السعودي.
                </p>
              </AlertDescription>
            </Alert>

            {/* End of Contract Marker */}
            <div className="mt-8 p-4 text-center bg-muted/50 rounded-lg border-2 border-dashed">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-green-600">نهاية العقد</p>
              <p className="text-sm text-muted-foreground">
                تم عرض جميع بنود وشروط العقد
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ═══════════ Acceptance Section ═══════════ */}
      <Card className={`border-2 transition-colors ${canAcceptContract ? "border-green-500" : "border-muted"}`}>
        <CardContent className="p-6 space-y-4">
          {/* Blocking Message */}
          {!canAcceptContract && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{getBlockingReason()}</AlertDescription>
            </Alert>
          )}

          {/* Acceptance Checkbox */}
          <div className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
            acceptTermsChecked ? "border-green-500 bg-green-500/10" : "border-muted bg-muted/30"
          }`}>
            <Checkbox
              id="accept-terms"
              checked={acceptTermsChecked}
              onCheckedChange={(checked) => setAcceptTermsChecked(checked === true)}
              disabled={!hasReachedEnd || !hasMinimumReadingTime}
              className="mt-0.5"
            />
            <Label
              htmlFor="accept-terms"
              className={`text-sm leading-relaxed cursor-pointer ${
                !hasReachedEnd || !hasMinimumReadingTime ? "opacity-50" : ""
              }`}
            >
              <span className="font-bold block mb-1">
                {FORMAL_UI_MESSAGES.confirmReading}
              </span>
              <span className="text-muted-foreground">
                بالموافقة على هذا العقد، أُقر بأنني قرأت وفهمت جميع البنود والشروط والأحكام الواردة أعلاه، 
                وأوافق عليها جميعاً، وألتزم بتنفيذ جميع الالتزامات المترتبة عليّ.
              </span>
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleAcceptContract}
              disabled={!canAcceptContract || isSubmitting}
              className="flex-1 h-12 text-base bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري الاعتماد...
                </>
              ) : (
                <>
                  <FileSignature className="w-5 h-5 ml-2" />
                  {FORMAL_UI_MESSAGES.approveContract}
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-12"
              >
                إلغاء
              </Button>
            )}
          </div>

          {/* Legal Notice */}
          <p className="text-xs text-muted-foreground text-center">
            بالضغط على "اعتماد العقد والموافقة"، أنت توافق على جميع الشروط والأحكام المذكورة أعلاه.
            هذه الموافقة الإلكترونية لها الحجية القانونية ذاتها للتوقيع الخطي.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default OfficialContractViewer;
