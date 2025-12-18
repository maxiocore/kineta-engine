import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Rocket,
  PartyPopper,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderProgressIndicatorProps {
  orderNumber: string;
  onClose: () => void;
  onViewOrders?: () => void;
}

const steps = [
  { id: 1, label: "استلام الطلب", icon: Package, duration: 800 },
  { id: 2, label: "معالجة الطلب", icon: Clock, duration: 1200 },
  { id: 3, label: "إرسال للتنفيذ", icon: Rocket, duration: 1000 },
  { id: 4, label: "تم بنجاح!", icon: PartyPopper, duration: 0 },
];

export default function OrderProgressIndicator({
  orderNumber,
  onClose,
  onViewOrders
}: OrderProgressIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let totalDelay = 0;
    
    steps.forEach((step, index) => {
      if (index === 0) {
        setTimeout(() => setCurrentStep(1), 300);
        totalDelay = 300;
      } else {
        totalDelay += steps[index - 1].duration;
        setTimeout(() => setCurrentStep(index + 1), totalDelay);
      }
    });

    // Mark as complete after all steps
    const completeDelay = totalDelay + 500;
    setTimeout(() => setIsComplete(true), completeDelay);
  }, []);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    toast.success("تم نسخ رقم الطلب");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-card border-2 border-primary/20 rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden"
      >
        {/* Header with animated gradient */}
        <div className="relative overflow-hidden p-6 pb-8">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-success/20"
            animate={{
              background: isComplete
                ? "linear-gradient(135deg, hsl(var(--success) / 0.2), hsl(var(--primary) / 0.1), hsl(var(--success) / 0.2))"
                : [
                    "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1), hsl(var(--primary) / 0.2))",
                    "linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.2))",
                    "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1), hsl(var(--primary) / 0.2))",
                  ],
            }}
            transition={{ duration: 2, repeat: isComplete ? 0 : Infinity }}
          />
          
          {/* Floating particles */}
          {isComplete && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-success/60"
                  initial={{ 
                    x: "50%", 
                    y: "50%",
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}

          <div className="relative text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
              className={cn(
                "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
                isComplete
                  ? "bg-gradient-to-br from-success to-emerald-400 shadow-lg shadow-success/40"
                  : "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40"
              )}
            >
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="loading"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-10 h-10 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-2"
            >
              {isComplete ? "تم تقديم طلبك!" : "جاري معالجة طلبك..."}
            </motion.h2>

            {/* Order Number */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50"
            >
              <span className="text-sm text-muted-foreground">رقم الطلب:</span>
              <code className="font-mono font-bold text-primary">{orderNumber}</code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={copyOrderNumber}
                className="p-1 hover:bg-primary/10 rounded-md transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pb-4">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 right-5 left-5 h-0.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-l from-success via-primary to-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isActive = currentStep > index;
                const isCurrent = currentStep === index + 1;
                const StepIcon = step.icon;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                        isActive
                          ? "bg-gradient-to-br from-success to-emerald-400 border-success text-white shadow-lg shadow-success/30"
                          : isCurrent
                          ? "bg-gradient-to-br from-primary to-accent border-primary text-white shadow-lg shadow-primary/30"
                          : "bg-muted border-border text-muted-foreground"
                      )}
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
                    >
                      {isActive ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </motion.div>
                    <motion.span
                      className={cn(
                        "mt-2 text-xs font-medium text-center max-w-[70px]",
                        isActive || isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}
                      animate={{ opacity: isActive || isCurrent ? 1 : 0.6 }}
                    >
                      {step.label}
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 pt-2 space-y-3"
            >
              <Button
                onClick={onViewOrders}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-xl shadow-lg shadow-primary/30"
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                عرض الطلبات
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full h-12 rounded-xl border-2 hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                طلب جديد
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing message */}
        {!isComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground pb-6"
          >
            يرجى الانتظار لحظات...
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}