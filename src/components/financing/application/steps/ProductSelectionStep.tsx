/**
 * Step 2: Product/Financing Type Selection
 * With Animation System & Mobile Bottom Sheet
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Building2, 
  Wrench,
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
import { useIsMobile } from "@/hooks/use-mobile";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface ProductSelectionStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
  validationErrors: string[];
}

const PRODUCT_TYPES = [
  {
    id: "personal" as const,
    title: "تمويل شخصي",
    description: "تمويل لاحتياجاتك الشخصية والعائلية",
    icon: User,
    color: "from-blue-500 to-indigo-500",
    features: ["بدون ضامن", "موافقة سريعة", "أقساط مرنة"],
  },
  {
    id: "business" as const,
    title: "تمويل تجاري",
    description: "تمويل لتطوير أعمالك ومشاريعك",
    icon: Building2,
    color: "from-purple-500 to-pink-500",
    features: ["للشركات الصغيرة", "رأس مال عامل", "توسع الأعمال"],
  },
  {
    id: "service" as const,
    title: "تمويل الخدمات",
    description: "تمويل لشراء خدمات من MaxioCore",
    icon: Wrench,
    color: "from-emerald-500 to-teal-500",
    features: ["تصميم وتطوير", "تسويق رقمي", "استضافة"],
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

  const selectedProduct = PRODUCT_TYPES.find(p => p.id === data.productType);

  const handleProductSelect = (productId: typeof data.productType) => {
    updateData({ productType: productId });
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
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <h2 className="text-2xl font-bold">اختر نوع التمويل</h2>
        <p className="text-muted-foreground">
          حدد نوع التمويل المناسب لاحتياجاتك
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
              {selectedProduct ? (
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedProduct.color}`}>
                    <selectedProduct.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{selectedProduct.title}</div>
                    <div className="text-sm text-muted-foreground">{selectedProduct.description}</div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              ) : (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">اختر نوع التمويل</span>
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
          {PRODUCT_TYPES.map((product, index) => {
            const isSelected = data.productType === product.id;
            
            return (
              <AnimatedCard
                key={product.id}
                index={index}
                isSelected={isSelected}
                onClick={() => handleProductSelect(product.id)}
                hoverEffect="lift"
                showCheckmark={false}
              >
                <div className="flex items-stretch">
                  {/* Icon Section */}
                  <motion.div 
                    className={`w-20 flex items-center justify-center bg-gradient-to-br ${product.color}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <product.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{product.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.description}
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
                      {product.features.map((feature) => (
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
        title="اختر نوع التمويل"
      >
        <div className="space-y-3">
          {PRODUCT_TYPES.map((product) => (
            <BottomSheetOption
              key={product.id}
              icon={<product.icon className="w-6 h-6" />}
              label={product.title}
              description={product.description}
              isSelected={data.productType === product.id}
              onClick={() => handleProductSelect(product.id)}
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
          disabled={!data.productType}
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
