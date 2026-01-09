/**
 * عارض عقد تمويل الخدمات
 * Service Financing Contract Viewer
 * 
 * يعرض العقد الكامل ويتطلب موافقة صريحة قبل الإرسال
 * RTL كامل مع جداول احترافية
 * مع دعم توليد PDF بخط عربي مضمن
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  CheckCircle2,
  AlertTriangle,
  Download,
  Shield,
  Lock,
  Building2,
  FileSignature,
  Loader2,
  ScrollText,
  Info,
  ChevronDown,
  ChevronUp,
  Calendar,
  Receipt,
  Package,
  Eye,
  Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import {
  CONTRACT_CLAUSES,
  CLIENT_ACKNOWLEDGMENTS,
  CONTRACT_INFO,
  type ContractPlaceholders,
  type ContractApprovalRecord,
  type ServiceItem,
  type InstallmentItem,
  validateContractApproval,
} from "@/lib/financing/serviceFinancingContract";
import { COMPANY_INFO } from "@/lib/financing/serviceFinancingPolicy";
import { 
  downloadContractPdf, 
  previewContractPdf 
} from "@/lib/financing/contractPdfGenerator";

interface ServiceFinancingContractViewerProps {
  contractData: ContractPlaceholders;
  applicationId: string;
  userId: string;
  onApprove: (record: ContractApprovalRecord) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  showPreviewOnly?: boolean;
}

export function ServiceFinancingContractViewer({
  contractData,
  applicationId,
  userId,
  onApprove,
  onCancel,
  isSubmitting = false,
  showPreviewOnly = false,
}: ServiceFinancingContractViewerProps) {
  const [hasReadContract, setHasReadContract] = useState(false);
  const [acceptContract, setAcceptContract] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<string[]>(["preamble"]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfHash, setPdfHash] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track scroll progress
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
      
      // Consider contract read if scrolled > 80%
      if (progress > 80) {
        setHasReadContract(true);
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleArticle = (key: string) => {
    setExpandedArticles((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleApproveContract = async () => {
    if (!acceptContract) {
      toast.error("يجب الموافقة على العقد والشروط أولاً");
      return;
    }

    const now = new Date();
    const approvalRecord: ContractApprovalRecord = {
      contract_id: `CNT-${applicationId}`,
      application_id: applicationId,
      user_id: userId,
      approved_at: now.toISOString(),
      checkbox_accepted: true,
      button_clicked: true,
      contract_version: CONTRACT_INFO.version,
      contract_hash: pdfHash || undefined,
    };

    const validation = validateContractApproval(approvalRecord);
    if (!validation.isValid) {
      toast.error(validation.errors.join("، "));
      return;
    }

    onApprove(approvalRecord);
  };

  /**
   * تحميل العقد كـ PDF
   */
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await downloadContractPdf(contractData, undefined, {
        includeHash: true,
        approvalRecord: pdfHash ? { approved_at: new Date().toISOString(), user_id: userId } : undefined,
      });
      
      if (result.success) {
        setPdfHash(result.hash);
        toast.success("تم تحميل العقد بنجاح", {
          description: `بصمة العقد: ${result.hash.substring(0, 16)}...`,
        });
      } else {
        toast.error(result.error || "فشل تحميل الملف");
      }
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("حدث خطأ أثناء توليد ملف PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * معاينة العقد كـ PDF
   */
  const handlePreviewPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await previewContractPdf(contractData, {
        includeHash: true,
      });
      
      if (result.success) {
        setPdfHash(result.hash);
        toast.success("تم فتح العقد في نافذة جديدة");
      } else {
        toast.error(result.error || "فشل عرض الملف");
      }
    } catch (error) {
      console.error("PDF preview error:", error);
      toast.error("حدث خطأ أثناء عرض ملف PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // حساب الضريبة لكل خدمة (15% من سعر الخدمة)
  const calculateServiceVAT = (price: number) => {
    return price * 0.15;
  };

  // حالة القسط
  const getInstallmentStatusBadge = (status: InstallmentItem["status"]) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">مدفوع</Badge>;
      case "overdue":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">متأخر</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">متوقع</Badge>;
    }
  };

  const articles = Object.entries(CONTRACT_CLAUSES);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Contract Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ScrollText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">عقد تمويل خدمات</CardTitle>
                <p className="text-sm text-muted-foreground">
                  إصدار {CONTRACT_INFO.version} • {CONTRACT_INFO.lastUpdated}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              <Lock className="w-3 h-3 ml-1" />
              مستند قانوني
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Scroll Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>تقدم القراءة</span>
              <span>{Math.round(scrollProgress)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${scrollProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Parties Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">الطرف الأول (الممول / مزود الخدمة)</p>
              <p className="font-bold text-base">{COMPANY_INFO.name}</p>
              <p className="text-xs text-muted-foreground">المملكة العربية السعودية</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">الطرف الثاني (العميل / المستفيد)</p>
              <p className="font-bold text-base">{contractData.customer_name}</p>
              <p className="text-xs text-muted-foreground">رقم الهوية: {contractData.customer_national_id}</p>
              <p className="text-xs text-muted-foreground">الجوال: {contractData.customer_phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Non-Cash Financing Notice */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-bold text-amber-600 dark:text-amber-400">
                ⚠️ تنبيه مهم: تمويل خدمات فقط
              </h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                هذا العقد لتمويل شراء خدمات وليس تمويلاً نقدياً. 
                <strong className="text-foreground"> لن يتم صرف أي مبلغ للعميل.</strong>
                {" "}يُدفع المبلغ مباشرة لمزود الخدمة ({COMPANY_INFO.shortName}).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Body - Scrollable */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea 
            ref={scrollRef as any}
            className="h-[450px] p-4"
          >
            {/* ═══════════ بسم الله الرحمن الرحيم ═══════════ */}
            <div className="text-center mb-6 py-4 border-b-2 border-primary/20">
              <p className="text-lg font-bold text-primary mb-2">بسم الله الرحمن الرحيم</p>
              <h2 className="text-xl font-bold">عقد تمويل خدمات</h2>
              <p className="text-sm text-muted-foreground mt-1">
                رقم العقد: <span className="font-mono font-bold">{contractData.application_number}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                تاريخ التحرير: {contractData.application_date}
              </p>
            </div>

            {/* Preamble */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                {CONTRACT_CLAUSES.preamble.title}
              </h3>
              <div className="p-4 bg-muted/30 rounded-lg border-r-4 border-primary/50">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {CONTRACT_CLAUSES.preamble.content}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Contract Articles */}
            {articles.slice(1).map(([key, article]) => (
              <div key={key} className="mb-4">
                <button
                  onClick={() => toggleArticle(key)}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                >
                  <span className="font-bold text-sm">{article.title}</span>
                  {expandedArticles.includes(key) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedArticles.includes(key) && "clauses" in article && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3 bg-background border border-muted rounded-b-lg">
                        {article.clauses.map((clause, i) => (
                          <p key={i} className="text-sm text-muted-foreground leading-relaxed pr-4 border-r-2 border-muted">
                            {clause}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <Separator className="my-6" />

            {/* ═══════════ ملخص الطلب ═══════════ */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                <Receipt className="w-5 h-5" />
                ملخص الطلب
              </h3>

              <div className="space-y-6 p-4 bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl border border-muted">
                
                {/* ═══════════ جدول الخدمات ═══════════ */}
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    جدول الخدمات الممولة
                  </h4>
                  
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/80">
                          <TableHead className="text-right font-bold w-8">#</TableHead>
                          <TableHead className="text-right font-bold">اسم الخدمة</TableHead>
                          <TableHead className="text-center font-bold">الكمية</TableHead>
                          <TableHead className="text-left font-bold">السعر</TableHead>
                          <TableHead className="text-left font-bold">الضريبة (15%)</TableHead>
                          <TableHead className="text-left font-bold">الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contractData.services_table.map((service, i) => {
                          const vat = calculateServiceVAT(service.total);
                          const totalWithVat = service.total + vat;
                          return (
                            <TableRow key={i} className="hover:bg-muted/30">
                              <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-medium">{service.name}</TableCell>
                              <TableCell className="text-center">{service.quantity}</TableCell>
                              <TableCell className="text-left font-mono">{formatCurrency(service.price)} ر.س</TableCell>
                              <TableCell className="text-left font-mono text-muted-foreground">{formatCurrency(vat)} ر.س</TableCell>
                              <TableCell className="text-left font-mono font-bold">{formatCurrency(totalWithVat)} ر.س</TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Totals Row */}
                        <TableRow className="bg-primary/5 border-t-2 border-primary/20">
                          <TableCell colSpan={3} className="text-left font-bold">الإجمالي</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {formatCurrency(contractData.total_services_value)} ر.س
                          </TableCell>
                          <TableCell className="text-left font-mono font-bold text-muted-foreground">
                            {formatCurrency(contractData.vat_amount)} ر.س
                          </TableCell>
                          <TableCell className="text-left font-mono font-bold text-primary">
                            {formatCurrency(contractData.total_services_value + contractData.vat_amount)} ر.س
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                {/* ═══════════ التفاصيل المالية ═══════════ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-background rounded-lg border text-center">
                    <p className="text-xs text-muted-foreground mb-1">قيمة الخدمات</p>
                    <p className="font-bold text-lg">{formatCurrency(contractData.total_services_value)}</p>
                    <p className="text-xs text-muted-foreground">ر.س</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border text-center">
                    <p className="text-xs text-muted-foreground mb-1">الرسوم الإدارية</p>
                    <p className="font-bold text-lg">{formatCurrency(contractData.admin_fees)}</p>
                    <p className="text-xs text-muted-foreground">ر.س</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border text-center">
                    <p className="text-xs text-muted-foreground mb-1">ضريبة القيمة المضافة</p>
                    <p className="font-bold text-lg">{formatCurrency(contractData.vat_amount)}</p>
                    <p className="text-xs text-muted-foreground">ر.س</p>
                  </div>
                  {contractData.down_payment && contractData.down_payment > 0 && (
                    <div className="p-3 bg-background rounded-lg border text-center">
                      <p className="text-xs text-muted-foreground mb-1">الدفعة المقدمة</p>
                      <p className="font-bold text-lg">{formatCurrency(contractData.down_payment)}</p>
                      <p className="text-xs text-muted-foreground">ر.س</p>
                    </div>
                  )}
                </div>

                {/* Total Amount Box */}
                <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30 text-center">
                  <p className="text-sm text-muted-foreground mb-1">إجمالي المبلغ المستحق</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(contractData.total_amount)} ر.س</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (المبلغ الممول: {formatCurrency(contractData.financed_amount)} ر.س)
                  </p>
                </div>

                <Separator />

                {/* ═══════════ جدول الأقساط ═══════════ */}
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    جدول السداد (الأقساط)
                  </h4>
                  
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/80">
                          <TableHead className="text-right font-bold w-20">رقم القسط</TableHead>
                          <TableHead className="text-right font-bold">تاريخ الاستحقاق</TableHead>
                          <TableHead className="text-left font-bold">قيمة القسط</TableHead>
                          <TableHead className="text-center font-bold">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contractData.installments_schedule.length > 0 ? (
                          contractData.installments_schedule.map((installment) => (
                            <TableRow key={installment.number} className="hover:bg-muted/30">
                              <TableCell className="font-bold text-primary">
                                القسط {installment.number}
                              </TableCell>
                              <TableCell className="font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  {installment.dueDate}
                                </span>
                              </TableCell>
                              <TableCell className="text-left font-mono font-bold">
                                {formatCurrency(installment.amount)} ر.س
                              </TableCell>
                              <TableCell className="text-center">
                                {getInstallmentStatusBadge(installment.status)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          // Generate schedule from data if not provided
                          Array.from({ length: Math.min(contractData.installments_count, 12) }, (_, i) => {
                            const dueDate = new Date();
                            dueDate.setMonth(dueDate.getMonth() + i + 1);
                            return (
                              <TableRow key={i} className="hover:bg-muted/30">
                                <TableCell className="font-bold text-primary">
                                  القسط {i + 1}
                                </TableCell>
                                <TableCell className="font-medium">
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    {dueDate.toLocaleDateString("ar-SA")}
                                  </span>
                                </TableCell>
                                <TableCell className="text-left font-mono font-bold">
                                  {formatCurrency(contractData.installment_amount)} ر.س
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="text-muted-foreground">متوقع</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                        {/* Summary Row */}
                        <TableRow className="bg-emerald-500/10 border-t-2 border-emerald-500/30">
                          <TableCell colSpan={2} className="text-left font-bold text-emerald-600">
                            إجمالي الأقساط: {contractData.installments_count} قسط
                          </TableCell>
                          <TableCell className="text-left font-mono font-bold text-emerald-600">
                            {formatCurrency(contractData.installment_amount * contractData.installments_count)} ر.س
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                              جدول السداد
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Schedule Summary */}
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm flex flex-wrap gap-4 justify-between">
                    <div>
                      <span className="text-muted-foreground">تاريخ أول قسط: </span>
                      <span className="font-medium">{contractData.first_due_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تاريخ آخر قسط: </span>
                      <span className="font-medium">{contractData.last_due_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">القسط الشهري: </span>
                      <span className="font-bold text-primary">{formatCurrency(contractData.installment_amount)} ر.س</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Service Provider */}
                <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">جهة تقديم الخدمة (المستفيد من التحويل)</p>
                      <p className="font-bold text-lg">{contractData.service_provider}</p>
                      <p className="text-xs text-emerald-600 mt-1">
                        سيتم تحويل قيمة الخدمات مباشرة إلى مزود الخدمة
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Client Acknowledgments */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                إقرارات العميل
              </h3>
              <div className="space-y-2">
                {CLIENT_ACKNOWLEDGMENTS.map((ack, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-muted">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ack}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* End of Contract Notice */}
            <div className="text-center p-6 bg-gradient-to-b from-muted/50 to-muted/20 rounded-xl border-2 border-dashed border-muted">
              <div className="mb-2">
                <span className="text-2xl">📄</span>
              </div>
              <p className="font-bold text-lg mb-1">— نهاية بنود العقد —</p>
              <p className="text-sm text-muted-foreground">
                يصبح هذا العقد نافذاً ومُلزماً بعد الموافقة الإلكترونية أدناه
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                الموافقة الإلكترونية لها نفس الحجية القانونية للتوقيع الخطي
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Approval Section */}
      {!showPreviewOnly && (
        <Card className={`border-2 transition-all ${
          acceptContract 
            ? "border-emerald-500/50 bg-emerald-500/5" 
            : "border-border"
        }`}>
          <CardContent className="p-4 space-y-4">
            {/* Read Progress Warning */}
            <AnimatePresence>
              {!hasReadContract && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg text-sm border border-amber-500/20"
                >
                  <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-amber-600 dark:text-amber-400">
                    يرجى قراءة العقد بالكامل قبل الموافقة (مرر للأسفل لإكمال القراءة)
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Agreement Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-muted">
              <Checkbox
                id="accept_contract"
                checked={acceptContract}
                onCheckedChange={(checked) => setAcceptContract(checked === true)}
                disabled={!hasReadContract}
                className="mt-1"
              />
              <Label 
                htmlFor="accept_contract" 
                className={`text-sm leading-relaxed cursor-pointer ${
                  !hasReadContract ? "text-muted-foreground" : ""
                }`}
              >
                <span className="font-bold text-base">✓ أوافق على العقد والشروط</span>
                <br />
                <span className="text-muted-foreground">
                  أقر بأنني قرأت جميع بنود عقد تمويل الخدمات وفهمتها بالكامل، 
                  وأعلم أن هذا تمويل لشراء خدمات وليس تمويلاً نقدياً، 
                  وأن المبلغ سيُدفع مباشرة لمزود الخدمة وليس لي شخصياً.
                </span>
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex-1 h-12"
                >
                  إلغاء
                </Button>
              )}
              
              <Button
                onClick={handleApproveContract}
                disabled={!acceptContract || isSubmitting}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-base font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جارٍ الاعتماد...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-5 h-5 ml-2" />
                    اعتماد العقد
                  </>
                )}
              </Button>
            </div>

            {/* Legal Notice */}
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                🔒 بالضغط على "اعتماد العقد"، سيتم تسجيل موافقتك الإلكترونية مع:
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                التاريخ والوقت • رقم الطلب: {contractData.application_number} • معرف المستخدم
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Download Section - Always visible */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">تحميل نسخة PDF من العقد</p>
                <p className="text-xs text-muted-foreground">
                  ملف PDF بخط عربي مضمن يعمل على جميع الأجهزة
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePreviewPdf}
                disabled={isGeneratingPdf}
                className="gap-2"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                معاينة
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="gap-2"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                تحميل PDF
              </Button>
            </div>
          </div>
          
          {/* Hash Display */}
          {pdfHash && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-2 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center gap-2 text-xs">
                <Fingerprint className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">بصمة العقد (SHA-256):</span>
                <code className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {pdfHash.substring(0, 32)}...
                </code>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Preview Only Mode - Extra Download Button */}
      {showPreviewOnly && (
        <div className="flex justify-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            تحميل العقد PDF
          </Button>
        </div>
      )}
    </div>
  );
}
