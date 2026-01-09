/**
 * Decision Screen - Application Result
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileUp,
  ArrowLeft,
  RefreshCw,
  MessageCircle,
  Award,
  TrendingDown
} from "lucide-react";
import { DECISION_STATES, type DecisionState } from "@/lib/financing/journeyConfig";
import { Link } from "react-router-dom";

interface DecisionScreenProps {
  decisionState: DecisionState | null;
  approvedAmount: number;
  requestedAmount: number;
  declineReasons: string[];
  onProceed: () => void;
  onRestart: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileUp,
};

export function DecisionScreen({ 
  decisionState,
  approvedAmount,
  requestedAmount,
  declineReasons,
  onProceed,
  onRestart
}: DecisionScreenProps) {
  if (!decisionState) return null;

  const config = DECISION_STATES[decisionState];
  const Icon = iconMap[config.icon] || CheckCircle2;
  const isApproved = decisionState === "approved" || decisionState === "approved_limited";

  return (
    <div className="min-h-[70vh] flex flex-col justify-center py-8">
      {/* Result Icon */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <motion.div
          className={`
            relative w-32 h-32 mx-auto mb-6 rounded-full
            ${config.bgColor}
          `}
          animate={{ 
            boxShadow: isApproved
              ? ["0 0 30px rgba(16, 185, 129, 0.3)", "0 0 60px rgba(16, 185, 129, 0.5)", "0 0 30px rgba(16, 185, 129, 0.3)"]
              : undefined
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className={`
              absolute inset-4 rounded-full flex items-center justify-center
              ${isApproved ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-gray-500 to-gray-600"}
            `}
            initial={{ rotate: 0 }}
            animate={isApproved ? { rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Icon className="h-12 w-12 text-white" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className={`text-2xl md:text-3xl font-bold mb-3 ${config.color}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {config.title_ar}
        </motion.h2>

        <motion.p
          className="text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {config.description_ar}
        </motion.p>
      </motion.div>

      {/* Amount Card - For approved states */}
      {config.showAmount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className={`${config.bgColor} ${config.borderColor} border-2 mb-6`}>
            <CardContent className="p-6 text-center">
              {decisionState === "approved_limited" && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-muted-foreground line-through">
                    {requestedAmount.toLocaleString()} ر.س
                  </span>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground mb-2">
                {decisionState === "approved_limited" ? "المبلغ المعتمد" : "مبلغ التمويل"}
              </p>
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
                {approvedAmount.toLocaleString()}
                <span className="text-xl mr-2">ر.س</span>
              </div>
              
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Award className="h-3 w-3 ml-1" />
                بدون فوائد
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Decline Reasons */}
      {decisionState === "declined" && declineReasons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-red-500/10 border-red-500/30 mb-6">
            <CardContent className="p-4">
              <h4 className="font-semibold text-red-400 mb-3">أسباب عدم الموافقة:</h4>
              <ul className="space-y-2">
                {declineReasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-red-400">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="mb-6">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">الخطوات التالية:</h4>
            <ul className="space-y-2">
              {config.nextSteps_ar.map((step, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {isApproved && (
          <Button
            onClick={onProceed}
            className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <ArrowLeft className="h-5 w-5 ml-2" />
            المتابعة لتوقيع العقد
          </Button>
        )}

        {decisionState === "pending_review" && (
          <>
            <Button
              asChild
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-blue-600"
            >
              <Link to="/dashboard/financing">
                <Clock className="h-5 w-5 ml-2" />
                تتبع حالة الطلب
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full"
            >
              <Link to="/dashboard/support">
                <MessageCircle className="h-5 w-5 ml-2" />
                تواصل مع الدعم
              </Link>
            </Button>
          </>
        )}

        {decisionState === "declined" && (
          <>
            <Button
              variant="outline"
              onClick={onRestart}
              className="w-full h-12"
            >
              <RefreshCw className="h-5 w-5 ml-2" />
              إعادة المحاولة لاحقاً
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full"
            >
              <Link to="/dashboard/financing">
                العودة للتمويل
              </Link>
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
