/**
 * Welcome Screen - Entry point of the financing journey
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Percent, 
  Clock, 
  Shield, 
  CreditCard,
  ArrowLeft,
  Landmark,
  CheckCircle2
} from "lucide-react";
import { MICROCOPY } from "@/lib/financing/journeyConfig";
import type { JourneyFormData } from "../FinancingJourneyWizard";

interface WelcomeScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Percent,
  Clock,
  Shield,
  CreditCard,
};

export function WelcomeScreen({ goNext }: WelcomeScreenProps) {
  const { welcome } = MICROCOPY;
  
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-8">
      {/* Hero Section */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated Logo */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-6"
          animate={{ 
            boxShadow: [
              "0 0 30px rgba(16, 185, 129, 0.2)",
              "0 0 60px rgba(16, 185, 129, 0.4)",
              "0 0 30px rgba(16, 185, 129, 0.2)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Landmark className="h-12 w-12 text-white" />
          </div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4">
            <Shield className="h-3 w-3 ml-1" />
            {welcome.trust_badge}
          </Badge>
        </motion.div>

        {/* Main Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-l from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
          {welcome.hero_title}
        </h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
          {welcome.hero_subtitle}
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {welcome.features.map((feature, index) => {
          const Icon = iconMap[feature.icon] || Sparkles;
          return (
            <motion.div
              key={feature.icon}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="bg-card/50 border-border/50 hover:border-emerald-500/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Time Estimate */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {welcome.time_estimate}
        </div>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Button
          onClick={goNext}
          className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
        >
          <Sparkles className="h-5 w-5 ml-2" />
          {welcome.cta_primary}
          <ArrowLeft className="h-5 w-5 mr-2" />
        </Button>

        <Button
          variant="outline"
          asChild
          className="w-full h-12"
        >
          <Link to="/financing-info">
            {welcome.cta_secondary}
          </Link>
        </Button>
      </motion.div>

      {/* Bottom Note */}
      <motion.p
        className="text-center text-xs text-muted-foreground mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        بالمتابعة، أنت توافق على{" "}
        <Link to="/terms" className="text-emerald-400 hover:underline">
          الشروط والأحكام
        </Link>
        {" "}و{" "}
        <Link to="/privacy" className="text-emerald-400 hover:underline">
          سياسة الخصوصية
        </Link>
      </motion.p>
    </div>
  );
}
