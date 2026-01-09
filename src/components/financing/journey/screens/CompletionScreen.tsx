/**
 * Completion Screen - Success & Next Steps
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  CheckCircle2,
  Wallet,
  CreditCard,
  Calendar,
  ArrowLeft,
  Download,
  Share2,
  Sparkles
} from "lucide-react";

interface CompletionScreenProps {
  applicationId: string | null;
  approvedAmount: number;
}

export function CompletionScreen({ 
  applicationId,
  approvedAmount
}: CompletionScreenProps) {

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-8">
      {/* Success Animation */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <motion.div
          className="relative w-32 h-32 mx-auto mb-6"
          animate={{ 
            boxShadow: [
              "0 0 30px rgba(16, 185, 129, 0.3)",
              "0 0 60px rgba(16, 185, 129, 0.5)",
              "0 0 30px rgba(16, 185, 129, 0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <CheckCircle2 className="h-16 w-16 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
            <Sparkles className="h-3 w-3 ml-1" />
            تمت العملية بنجاح
          </Badge>
        </motion.div>

        <motion.h1
          className="text-3xl font-bold mb-3 bg-gradient-to-l from-emerald-400 to-teal-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          مبروك! تم تفعيل تمويلك
        </motion.h1>

        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          تم إضافة المبلغ لرصيدك ويمكنك استخدامه الآن
        </motion.p>
      </motion.div>

      {/* Amount Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30 mb-6">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-emerald-400" />
              <span className="text-muted-foreground">تم إضافة المبلغ لرصيدك</span>
            </div>
            <div className="text-5xl font-bold text-emerald-400 mb-2">
              {approvedAmount.toLocaleString()}
              <span className="text-xl mr-2">ر.س</span>
            </div>
            <Badge className="bg-emerald-500 text-white">
              متاح للاستخدام الآن
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Info */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">رقم الطلب</p>
            <p className="font-mono font-bold text-sm">{applicationId?.slice(0, 8) || "FIN-XXXXX"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">تاريخ التفعيل</p>
            <p className="font-bold text-sm">{new Date().toLocaleDateString('ar-SA')}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Button
          asChild
          className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          <Link to="/dashboard/services">
            <Sparkles className="h-5 w-5 ml-2" />
            تصفح الخدمات واستخدم رصيدك
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Link>
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12">
            <Download className="h-4 w-4 ml-2" />
            تحميل العقود
          </Button>
          <Button variant="outline" className="h-12">
            <Share2 className="h-4 w-4 ml-2" />
            مشاركة
          </Button>
        </div>

        <Button
          variant="ghost"
          asChild
          className="w-full"
        >
          <Link to="/dashboard/financing">
            العودة لصفحة التمويل
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
