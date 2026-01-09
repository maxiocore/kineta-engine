/**
 * Completion Screen - Success & Next Steps
 * شاشة الإتمام - رصيد الخدمات (غير نقدي)
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { 
  CheckCircle2,
  FileText,
  Calendar,
  ArrowLeft,
  Download,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Ban,
  Info,
  Store
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
            تمت الموافقة بنجاح
          </Badge>
        </motion.div>

        <motion.h1
          className="text-3xl font-bold mb-3 bg-gradient-to-l from-emerald-400 to-teal-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          مبروك! تم اعتماد تمويل الخدمات
        </motion.h1>

        <motion.p
          className="text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          تم إضافة رصيد خدمات لحسابك، ويمكنك استخدامه الآن لشراء الخدمات المتاحة داخل المنصة
        </motion.p>
      </motion.div>

      {/* Service Credit Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30 mb-6 overflow-hidden">
          <CardContent className="p-6 text-center relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4">
                <ShoppingBag className="h-20 w-20" />
              </div>
              <div className="absolute bottom-4 right-4">
                <Store className="h-16 w-16" />
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                <span className="text-lg font-medium text-emerald-300">رصيد الخدمات</span>
              </div>
              
              <div className="text-5xl font-bold text-emerald-400 mb-3">
                {approvedAmount.toLocaleString()}
                <span className="text-xl mr-2">ر.س</span>
              </div>
              
              <Badge className="bg-emerald-500 text-white text-sm px-4 py-1">
                <ShoppingBag className="h-3 w-3 ml-1" />
                متاح للاستخدام داخل المنصة
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Important Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
      >
        <Alert className="bg-blue-500/10 border-blue-500/30 mb-6">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200 text-sm">
            رصيد الخدمات مخصص لشراء الخدمات داخل منصة MaxioCore 
            وخدمات شركة علي صالح الشهري القابضة والجهات التابعة لها.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Credit Restrictions */}
      <motion.div
        className="grid grid-cols-3 gap-2 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-500/10 flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-xs text-muted-foreground">لا يمكن سحبه</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-500/10 flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-xs text-muted-foreground">لا يمكن تحويله</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-xs text-emerald-300">للخدمات فقط</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Info */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
      >
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">رقم الطلب</p>
            <p className="font-mono font-bold text-sm">{applicationId?.slice(0, 8) || "FIN-XXXXX"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">تاريخ الاعتماد</p>
            <p className="font-bold text-sm">{new Date().toLocaleDateString('ar-SA')}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Primary Action - Use Credit */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Button
          asChild
          size="lg"
          className="w-full h-16 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
        >
          <Link to="/dashboard/services">
            <ShoppingBag className="h-6 w-6 ml-3" />
            استخدم الرصيد لشراء الخدمات
            <ArrowLeft className="h-6 w-6 mr-3" />
          </Link>
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          تصفح الخدمات المتاحة واستخدم رصيدك في شراء ما تحتاجه
        </p>

        <div className="pt-2">
          <Button variant="outline" className="w-full h-12">
            <Download className="h-4 w-4 ml-2" />
            تحميل العقد والمستندات
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