/**
 * Step 1: Introduction & Terms
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  },
  {
    icon: Shield,
    title: "آمن ومحمي",
    description: "بياناتك مشفرة ومحمية بالكامل",
    color: "text-emerald-500",
  },
  {
    icon: FileText,
    title: "بدون ضامن",
    description: "لا نطلب ضامن أو كفيل",
    color: "text-purple-500",
  },
];

const CONDITIONS = [
  "أن يكون عمرك 21 سنة فأكثر",
  "أن تكون سعودي الجنسية أو مقيم",
  "أن يكون لديك دخل شهري ثابت",
  "عدم وجود تعثرات مالية سابقة",
];

export function IntroStep({ data, updateData, goNext, validationErrors }: IntroStepProps) {
  const canProceed = data.acceptedTerms && data.acceptedConditions;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm">
          <Sparkles className="w-4 h-4" />
          <span>تمويل سريع وميسر</span>
        </div>
        
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
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full bg-card/50 border-border/50">
              <CardContent className="p-4 text-center space-y-2">
                <div className={`inline-flex p-2 rounded-full bg-background ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-500 mb-3">
                  شروط التقديم الأساسية
                </h3>
                <ul className="space-y-2">
                  {CONDITIONS.map((condition, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agreements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={data.acceptedTerms}
                onCheckedChange={(checked) => 
                  updateData({ acceptedTerms: checked as boolean })
                }
                className="mt-1"
              />
              <label 
                htmlFor="terms" 
                className="text-sm cursor-pointer leading-relaxed"
              >
                أقر بأنني قرأت وفهمت{" "}
                <a href="/terms-of-service" target="_blank" className="text-primary underline">
                  الشروط والأحكام
                </a>{" "}
                و{" "}
                <a href="/privacy-policy" target="_blank" className="text-primary underline">
                  سياسة الخصوصية
                </a>{" "}
                وأوافق عليها.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="conditions"
                checked={data.acceptedConditions}
                onCheckedChange={(checked) => 
                  updateData({ acceptedConditions: checked as boolean })
                }
                className="mt-1"
              />
              <label 
                htmlFor="conditions" 
                className="text-sm cursor-pointer leading-relaxed"
              >
                أقر بأنني أستوفي جميع شروط التقديم المذكورة أعلاه، وأن جميع المعلومات التي سأقدمها صحيحة ودقيقة.
              </label>
            </div>
          </CardContent>
        </Card>

        {validationErrors.length > 0 && (
          <div className="text-sm text-destructive space-y-1">
            {validationErrors.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </div>
        )}
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={goNext}
          disabled={!canProceed}
          className="w-full h-14 text-lg font-semibold gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <span>بدء التقديم</span>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <p className="text-center text-xs text-muted-foreground mt-3">
          يمكنك حفظ طلبك والعودة لإكماله لاحقاً
        </p>
      </motion.div>
    </div>
  );
}
