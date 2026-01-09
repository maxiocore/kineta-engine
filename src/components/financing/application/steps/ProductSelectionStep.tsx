/**
 * Step 2: Product/Financing Type Selection
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Building2, 
  Wrench,
  ArrowLeft,
  ArrowRight,
  Check
} from "lucide-react";
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

export function ProductSelectionStep({ 
  data, 
  updateData, 
  goNext, 
  goBack,
  validationErrors 
}: ProductSelectionStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">اختر نوع التمويل</h2>
        <p className="text-muted-foreground">
          حدد نوع التمويل المناسب لاحتياجاتك
        </p>
      </div>

      {/* Product Cards */}
      <div className="space-y-4">
        {PRODUCT_TYPES.map((product, index) => {
          const isSelected = data.productType === product.id;
          
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`
                  cursor-pointer transition-all duration-300 overflow-hidden
                  ${isSelected 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:bg-accent/50 border-border/50"
                  }
                `}
                onClick={() => updateData({ productType: product.id })}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Icon Section */}
                    <div className={`
                      w-20 flex items-center justify-center bg-gradient-to-br ${product.color}
                    `}>
                      <product.icon className="w-8 h-8 text-white" />
                    </div>
                    
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
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {product.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="text-sm text-destructive space-y-1">
          {validationErrors.map((error, index) => (
            <p key={index}>• {error}</p>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={goBack}
          className="flex-1 h-12 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </Button>
        
        <Button
          onClick={goNext}
          disabled={!data.productType}
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <span>التالي</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
