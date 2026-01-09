/**
 * Step 2: Service Category Selection
 * Updated: Service Financing (Non-Cash)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wrench, 
  TrendingUp, 
  Server,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown
} from "lucide-react";
import { 
  AnimatedButton, 
  AnimatedCard, 
  BottomSheet, 
  BottomSheetOption 
} from "../animations";
import { ServiceFinancingNotice } from "../../common/ServiceFinancingNotice";
import { PRODUCT_SELECTION_MICROCOPY } from "@/lib/financing/serviceFinancingPolicy";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface ProductSelectionStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
  validationErrors: string[];
}

// Updated to service categories instead of loan types
const SERVICE_CATEGORIES = [
  {
    id: "development" as const,
    title: "خدمات التطوير",
    description: "تصميم وتطوير المواقع والتطبيقات",
    icon: Wrench,
    color: "from-blue-500 to-indigo-500",
    features: ["مواقع إلكترونية", "تطبيقات جوال", "أنظمة متكاملة"],
  },
  {
    id: "marketing" as const,
    title: "خدمات التسويق",
    description: "حملات تسويقية وإدارة منصات",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-500",
    features: ["إعلانات مدفوعة", "إدارة حسابات", "SEO"],
  },
  {
    id: "hosting" as const,
    title: "خدمات الاستضافة",
    description: "استضافة وسيرفرات وخدمات سحابية",
    icon: Server,
    color: "from-emerald-500 to-teal-500",
    features: ["استضافة مواقع", "سيرفرات VPS", "خدمات سحابية"],
  },
];

const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function ProductSelectionStep({ 
  data, 
  updateData, 
  goNext, 
  goBack,
  validationErrors 
}: ProductSelectionStepProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const selectedCategory = SERVICE_CATEGORIES.find(p => p.id === data.serviceCategory);

  const handleCategorySelect = (categoryId: string) => {
    updateData({ serviceCategory: categoryId, productType: "service" });
    if (isMobile) {
      setIsBottomSheetOpen(false);
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Service Financing Notice */}
      <motion.div variants={itemVariants}>
        <ServiceFinancingNotice variant="compact" />
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{PRODUCT_SELECTION_MICROCOPY.title}</h2>
        <p className="text-muted-foreground">
          {PRODUCT_SELECTION_MICROCOPY.subtitle}
        </p>
      </motion.div>

      {/* Mobile: Collapsible Selector */}
      {isMobile && (
        <motion.div variants={itemVariants}>
          <Card 
            className="cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => setIsBottomSheetOpen(true)}
          >
            <CardContent className="p-4">
              {selectedCategory ? (
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedCategory.color}`}>
                    <selectedCategory.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{selectedCategory.title}</div>
                    <div className="text-sm text-muted-foreground">{selectedCategory.description}</div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              ) : (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">{PRODUCT_SELECTION_MICROCOPY.selectPrompt}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Desktop: Full Cards */}
      {!isMobile && (
        <div className="space-y-4">
          {SERVICE_CATEGORIES.map((category, index) => {
            const isSelected = data.serviceCategory === category.id;
            
            return (
              <AnimatedCard
                key={category.id}
                index={index}
                isSelected={isSelected}
                onClick={() => handleCategorySelect(category.id)}
                hoverEffect="lift"
                showCheckmark={false}
              >
                <div className="flex items-stretch">
                  {/* Icon Section */}
                  <motion.div 
                    className={`w-20 flex items-center justify-center bg-gradient-to-br ${category.color}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <category.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{category.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      </div>
                      
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {category.features.map((feature) => (
                        <motion.span
                          key={feature}
                          className="text-xs px-2.5 py-1 bg-muted rounded-full text-muted-foreground"
                          whileHover={{ scale: 1.05 }}
                        >
                          {feature}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedCard>
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
        <div className="space-y-3">
          {SERVICE_CATEGORIES.map((category) => (
            <BottomSheetOption
              key={category.id}
              icon={<category.icon className="w-6 h-6" />}
              label={category.title}
              description={category.description}
              isSelected={data.serviceCategory === category.id}
              onClick={() => handleCategorySelect(category.id)}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Validation Errors */}
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

      {/* Navigation */}
      <motion.div variants={itemVariants} className="flex gap-3">
        <AnimatedButton
          variant="outline"
          onClick={goBack}
          className="flex-1 h-12 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </AnimatedButton>
        
        <AnimatedButton
          onClick={goNext}
          disabled={!data.serviceCategory}
          pulseOnHover
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <span>التالي</span>
          <ArrowLeft className="w-4 h-4" />
        </AnimatedButton>
      </motion.div>
    </motion.div>
  );
}
