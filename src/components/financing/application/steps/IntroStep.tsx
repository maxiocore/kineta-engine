/**
 * Step 1: Introduction & Terms
 * With Professional Micro-interactions
 */

import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  FileText,
  AlertTriangle,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { AnimatedButton, AnimatedCard } from "../animations";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface IntroStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  validationErrors: string[];
}

const FEATURES = [
  {
    icon: Clock,
    title: "موافقة سريعة",
    description: "نتيجة فورية أو خلال 24 ساعة",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "آمن ومحمي",
    description: "بياناتك مشفرة ومحمية بالكامل",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: FileText,
    title: "بدون ضامن",
    description: "لا نطلب ضامن أو كفيل",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

const CONDITIONS = [
  "أن يكون عمرك 21 سنة فأكثر",
  "أن تكون سعودي الجنسية أو مقيم",
  "أن يكون لديك دخل شهري ثابت",
  "عدم وجود تعثرات مالية سابقة",
];

// Stagger animation for children
const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export function IntroStep({ data, updateData, goNext, validationErrors }: IntroStepProps) {
  const canProceed = data.acceptedTerms && data.acceptedConditions;

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="w-4 h-4" />
          <span>تمويل سريع وميسر</span>
        </motion.div>
        
        <h1 className="text-3xl font-bold">
          تقديم طلب تمويل جديد
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          احصل على تمويل فوري بخطوات بسيطة وسريعة. املأ النموذج واحصل على النتيجة خلال دقائق.
        </p>
      </motion.div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map((feature, index) => (
          <AnimatedCard
            key={feature.title}
            index={index}
            hoverEffect="lift"
            showCheckmark={false}
            className="h-full"
          >
            <div className="p-4 text-center space-y-3">
              <motion.div 
                className={`inline-flex p-3 rounded-xl ${feature.bgColor} ${feature.color}`}
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
              >
                <feature.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Conditions */}
      <motion.div variants={itemVariants}>
        <Card className="bg-amber-500/5 border-amber-500/20 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-amber-500 mb-3">
                  شروط التقديم الأساسية
                </h3>
                <ul className="space-y-2">
                  {CONDITIONS.map((condition, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{condition}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agreements */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <motion.div 
              className="flex items-start gap-3"
              whileTap={{ scale: 0.99 }}
            >
              <Checkbox
                id="terms"
                checked={data.acceptedTerms}
                onCheckedChange={(checked) => 
                  updateData({ acceptedTerms: checked as boolean })
                }
                className="mt-1 transition-all data-[state=checked]:scale-110"
              />
              <label 
                htmlFor="terms" 
                className="text-sm cursor-pointer leading-relaxed select-none"
              >
                أقر بأنني قرأت وفهمت{" "}
                <a href="/terms-of-service" target="_blank" className="text-primary underline hover:no-underline">
                  الشروط والأحكام
                </a>{" "}
                و{" "}
                <a href="/privacy-policy" target="_blank" className="text-primary underline hover:no-underline">
                  سياسة الخصوصية
                </a>{" "}
                وأوافق عليها.
              </label>
            </motion.div>

            <motion.div 
              className="flex items-start gap-3"
              whileTap={{ scale: 0.99 }}
            >
              <Checkbox
                id="conditions"
                checked={data.acceptedConditions}
                onCheckedChange={(checked) => 
                  updateData({ acceptedConditions: checked as boolean })
                }
                className="mt-1 transition-all data-[state=checked]:scale-110"
              />
              <label 
                htmlFor="conditions" 
                className="text-sm cursor-pointer leading-relaxed select-none"
              >
                أقر بأنني أستوفي جميع شروط التقديم المذكورة أعلاه، وأن جميع المعلومات التي سأقدمها صحيحة ودقيقة.
              </label>
            </motion.div>
          </CardContent>
        </Card>

        {validationErrors.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-destructive space-y-1"
          >
            {validationErrors.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* CTA Button */}
      <motion.div variants={itemVariants}>
        <AnimatedButton
          onClick={goNext}
          disabled={!canProceed}
          pulseOnHover
          className="w-full h-14 text-lg font-semibold gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <span>بدء التقديم</span>
          <ArrowLeft className="w-5 h-5" />
        </AnimatedButton>
        
        <p className="text-center text-xs text-muted-foreground mt-3">
          يمكنك حفظ طلبك والعودة لإكماله لاحقاً
        </p>
      </motion.div>
    </motion.div>
  );
}
