/**
 * Step 2: Service Category Selection
 * Premium Fintech · RTL · iOS-first
 * Business Logic: UNCHANGED
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  TrendingUp,
  Server,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { ServiceFinancingNotice } from "../../common/ServiceFinancingNotice";
import { PRODUCT_SELECTION_MICROCOPY } from "@/lib/financing/serviceFinancingPolicy";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomSheet, BottomSheetOption } from "../animations";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface ProductSelectionStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
  validationErrors: string[];
}

const SERVICE_CATEGORIES = [
  {
    id: "development" as const,
    title: "خدمات التطوير",
    description: "تصميم وتطوير المواقع والتطبيقات",
    icon: Wrench,
    gradient: "from-blue-500 to-indigo-600",
    features: ["مواقع إلكترونية", "تطبيقات جوال", "أنظمة متكاملة"],
  },
  {
    id: "marketing" as const,
    title: "خدمات التسويق",
    description: "حملات تسويقية وإدارة منصات",
    icon: TrendingUp,
    gradient: "from-purple-500 to-pink-600",
    features: ["إعلانات مدفوعة", "إدارة حسابات", "SEO"],
  },
  {
    id: "hosting" as const,
    title: "خدمات الاستضافة",
    description: "استضافة وسيرفرات وخدمات سحابية",
    icon: Server,
    gradient: "from-emerald-500 to-teal-600",
    features: ["استضافة مواقع", "سيرفرات VPS", "خدمات سحابية"],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function ProductSelectionStep({
  data,
  updateData,
  goNext,
  goBack,
  validationErrors,
}: ProductSelectionStepProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const selectedCategory = SERVICE_CATEGORIES.find(p => p.id === data.serviceCategory);

  const handleCategorySelect = (categoryId: string) => {
    updateData({ serviceCategory: categoryId, productType: "service" });
    if (isMobile) setIsBottomSheetOpen(false);
  };

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate">
      {/* Notice */}
      <motion.div variants={fadeUp}>
        <ServiceFinancingNotice variant="compact" />
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{PRODUCT_SELECTION_MICROCOPY.title}</h2>
        <p className="text-muted-foreground text-sm">
          {PRODUCT_SELECTION_MICROCOPY.subtitle}
        </p>
      </motion.div>

      {/* Mobile: Selector Card */}
      {isMobile && (
        <motion.div variants={fadeUp}>
          <Card
            className="cursor-pointer active:scale-[0.99] transition-all border-border/40"
            onClick={() => setIsBottomSheetOpen(true)}
          >
            <CardContent className="p-4">
              {selectedCategory ? (
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedCategory.gradient}`}>
                    <selectedCategory.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{selectedCategory.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{selectedCategory.description}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              ) : (
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground text-sm">{PRODUCT_SELECTION_MICROCOPY.selectPrompt}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Desktop: Full Cards */}
      {!isMobile && (
        <div className="space-y-3">
          {SERVICE_CATEGORIES.map((category, index) => {
            const isSelected = data.serviceCategory === category.id;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border/40 hover:border-primary/20 bg-card/60"
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="flex items-stretch">
                    <div className={`w-16 flex items-center justify-center bg-gradient-to-br ${category.gradient}`}>
                      <category.icon className="w-7 h-7 text-white" />
                    </div>

                    <CardContent className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{category.title}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{category.description}</p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {category.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-[11px] px-2 py-0.5 bg-muted/60 rounded-full text-muted-foreground"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom Sheet for Mobile */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title={PRODUCT_SELECTION_MICROCOPY.selectPrompt}
      >
        <div className="space-y-2">
          {SERVICE_CATEGORIES.map((category) => (
            <BottomSheetOption
              key={category.id}
              icon={<category.icon className="w-5 h-5" />}
              label={category.title}
              description={category.description}
              isSelected={data.serviceCategory === category.id}
              onClick={() => handleCategorySelect(category.id)}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Errors */}
      {validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-destructive space-y-1 bg-destructive/5 p-3 rounded-lg border border-destructive/20"
        >
          {validationErrors.map((error, index) => (
            <p key={index}>• {error}</p>
          ))}
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div variants={fadeUp} className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="flex-1 h-12 gap-2">
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </Button>

        <Button
          onClick={goNext}
          disabled={!data.serviceCategory}
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-primary to-primary/90 shadow-lg shadow-primary/15 disabled:shadow-none"
        >
          <span>التالي</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
