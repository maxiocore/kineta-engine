import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Landmark, 
  Plus, 
  Calculator, 
  Sparkles,
  Shield,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FinancingEmptyStateProps {
  canApply?: boolean;
  reason?: string;
}

export default function FinancingEmptyState({ 
  canApply = true,
  reason
}: FinancingEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
      dir="rtl"
    >
      <Card className="overflow-hidden border-dashed border-2 bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="p-6 sm:p-10 lg:p-16">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6 relative"
            >
              <Landmark className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-500" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
              />
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl font-bold mb-3"
            >
              لا يوجد تمويل نشط حالياً
            </motion.h3>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed"
            >
              ابدأ رحلتك مع التمويل المرن واحصل على خدماتنا الآن وادفع لاحقاً بأقساط مريحة بدون فوائد
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3 mb-8 w-full"
            >
              {[
                { icon: Sparkles, text: "بدون فوائد", color: "text-emerald-500" },
                { icon: Clock, text: "موافقة سريعة", color: "text-amber-500" },
                { icon: Shield, text: "آمن ومضمون", color: "text-blue-500" },
                { icon: CheckCircle2, text: "أقساط مريحة", color: "text-purple-500" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50"
                >
                  <feature.icon className={`h-4 w-4 ${feature.color} flex-shrink-0`} />
                  <span className="text-xs sm:text-sm">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
            >
              {canApply ? (
                <>
                  <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg">
                    <Link to="/dashboard/financing/apply">
                      <Plus className="h-5 w-5 ml-2" />
                      ابدأ طلب تمويل خدمات
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/dashboard/financing/calculator">
                      <Calculator className="h-5 w-5 ml-2" />
                      حاسبة الأقساط
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4">
                    <p className="text-amber-500 text-sm font-medium">
                      {reason || "لا يمكن التقديم حالياً"}
                    </p>
                  </div>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/dashboard/financing/guide">
                      معرفة المزيد عن التمويل
                    </Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
