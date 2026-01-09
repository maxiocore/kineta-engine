/**
 * عارض عقد تمويل الخدمات
 * Service Financing Contract Viewer
 * 
 * يعرض العقد الكامل ويتطلب موافقة صريحة قبل الإرسال
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
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Shield,
  Lock,
  Clock,
  Building2,
  FileSignature,
  Loader2,
  ScrollText,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  CONTRACT_CLAUSES,
  CLIENT_ACKNOWLEDGMENTS,
  CONTRACT_INFO,
  generateOrderSummarySection,
  type ContractPlaceholders,
  type ContractApprovalRecord,
  validateContractApproval,
} from "@/lib/financing/serviceFinancingContract";
import { COMPANY_INFO } from "@/lib/financing/serviceFinancingPolicy";

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

  const handleApproveContract = () => {
    if (!acceptContract) {
      toast.error("يجب الموافقة على العقد والشروط أولاً");
      return;
    }

    const approvalRecord: ContractApprovalRecord = {
      contract_id: `CNT-${applicationId}`,
      application_id: applicationId,
      user_id: userId,
      approved_at: new Date().toISOString(),
      checkbox_accepted: true,
      button_clicked: true,
      contract_version: CONTRACT_INFO.version,
    };

    const validation = validateContractApproval(approvalRecord);
    if (!validation.isValid) {
      toast.error(validation.errors.join("، "));
      return;
    }

    onApprove(approvalRecord);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const articles = Object.entries(CONTRACT_CLAUSES);

  return (
    <div className="space-y-4">
      {/* Contract Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ScrollText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">عقد تمويل خدمات</CardTitle>
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
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">الطرف الأول (الممول)</p>
              <p className="font-medium">{COMPANY_INFO.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">الطرف الثاني (العميل)</p>
              <p className="font-medium">{contractData.customer_name}</p>
              <p className="text-xs text-muted-foreground">هوية: {contractData.customer_national_id}</p>
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
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                تنبيه مهم: تمويل خدمات فقط
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                هذا العقد لتمويل شراء خدمات وليس تمويلاً نقدياً. لن يتم صرف أي مبلغ للعميل.
                يُدفع المبلغ مباشرة لمزود الخدمة ({COMPANY_INFO.shortName}).
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
            className="h-[400px] p-4"
          >
            {/* Preamble */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {CONTRACT_CLAUSES.preamble.title}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {CONTRACT_CLAUSES.preamble.content}
              </p>
            </div>

            <Separator className="my-4" />

            {/* Contract Articles */}
            {articles.slice(1).map(([key, article]) => (
              <div key={key} className="mb-4">
                <button
                  onClick={() => toggleArticle(key)}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="font-semibold text-sm">{article.title}</span>
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
                      <div className="p-3 space-y-2">
                        {article.clauses.map((clause, i) => (
                          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                            {clause}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <Separator className="my-4" />

            {/* Order Summary Section */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                ملخص الطلب
              </h3>

              <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                {/* Services */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">الخدمات المختارة:</h4>
                  <div className="space-y-2">
                    {contractData.services_table.map((service, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-background rounded-lg">
                        <span className="text-sm">{service.name}</span>
                        <span className="font-medium">{formatCurrency(service.total)} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">قيمة الخدمات:</span>
                    <span className="font-medium">{formatCurrency(contractData.total_services_value)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرسوم الإدارية:</span>
                    <span className="font-medium">{formatCurrency(contractData.admin_fees)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ضريبة القيمة المضافة:</span>
                    <span className="font-medium">{formatCurrency(contractData.vat_amount)} ر.س</span>
                  </div>
                  {contractData.down_payment && contractData.down_payment > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الدفعة المقدمة:</span>
                      <span className="font-medium">{formatCurrency(contractData.down_payment)} ر.س</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Installments */}
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">تفاصيل الأقساط:</span>
                    <Badge variant="secondary">{contractData.installments_count} قسط</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">قيمة القسط:</span>
                      <p className="font-bold text-lg text-primary">{formatCurrency(contractData.installment_amount)} ر.س</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                      <p className="font-medium">{contractData.first_due_date}</p>
                    </div>
                  </div>
                </div>

                {/* Service Provider */}
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg text-sm">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>جهة تقديم الخدمة: <strong>{contractData.service_provider}</strong></span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Client Acknowledgments */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                إقرارات العميل
              </h3>
              <div className="space-y-2">
                {CLIENT_ACKNOWLEDGMENTS.map((ack, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                    <div className="w-5 h-5 rounded-full border-2 border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ack}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* End of Contract Notice */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                — نهاية بنود العقد —
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                يصبح هذا العقد نافذاً بعد الموافقة الإلكترونية أدناه
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
                  className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg text-sm"
                >
                  <Info className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">
                    يرجى قراءة العقد بالكامل قبل الموافقة (مرر للأسفل)
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Agreement Checkbox */}
            <div className="flex items-start gap-3">
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
                <span className="font-semibold">أوافق على العقد والشروط</span>
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
                  className="flex-1"
                >
                  إلغاء
                </Button>
              )}
              
              <Button
                onClick={handleApproveContract}
                disabled={!acceptContract || isSubmitting}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جارٍ الاعتماد...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4 ml-2" />
                    اعتماد العقد
                  </>
                )}
              </Button>
            </div>

            {/* Legal Notice */}
            <p className="text-xs text-center text-muted-foreground">
              بالضغط على "اعتماد العقد"، سيتم تسجيل موافقتك مع التاريخ والوقت ورقم الطلب
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview Only Mode - Download Button */}
      {showPreviewOnly && (
        <div className="flex justify-center">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            تحميل العقد PDF
          </Button>
        </div>
      )}
    </div>
  );
}
