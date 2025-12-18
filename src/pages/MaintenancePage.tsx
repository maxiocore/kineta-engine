import { motion } from "framer-motion";
import { Wrench, Clock, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const MaintenancePage = () => {
  const { maintenanceMessage, scheduledEnd } = useMaintenanceMode();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-destructive/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-destructive/20 flex items-center justify-center mb-8 border border-primary/30"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Wrench className="w-12 h-12 text-primary" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-display text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-l from-primary to-destructive bg-clip-text text-transparent"
        >
          الموقع تحت الصيانة
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground mb-8 leading-relaxed"
        >
          {maintenanceMessage || 'نعمل حالياً على تحسين الموقع وإضافة ميزات جديدة.'}
          <br />
          سنعود قريباً بتجربة أفضل!
        </motion.p>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-secondary/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-500 font-medium">جاري العمل</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {scheduledEnd ? (
              <span>الوقت المتوقع للانتهاء: {format(scheduledEnd, 'dd MMMM yyyy الساعة HH:mm', { locale: ar })}</span>
            ) : (
              <span>الوقت المتوقع: قريباً جداً</span>
            )}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            للاستفسارات العاجلة، تواصل معنا:
          </p>
          <Button variant="outline" className="gap-2" asChild>
            <a href="mailto:hello@marketpro.com">
              <Mail className="w-4 h-4" />
              hello@marketpro.com
            </a>
          </Button>
        </motion.div>

        {/* Admin Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 pt-8 border-t border-border/50"
        >
          <a 
            href="/admin/auth" 
            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            دخول المشرفين
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
