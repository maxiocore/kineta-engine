/**
 * Step 1: Introduction & Terms
 * Premium Fintech · RTL · iOS-first
 * Business Logic: UNCHANGED
 */

import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Wrench,
  Sparkles,
} from "lucide-react";
import { ServiceFinancingNotice } from "../../common/ServiceFinancingNotice";
import { INTRO_MICROCOPY, COMPANY_INFO } from "@/lib/financing/serviceFinancingPolicy";
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
    title: INTRO_MICROCOPY.features[0].title,
    description: INTRO_MICROCOPY.features[0].description,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: INTRO_MICROCOPY.features[1].title,
    description: INTRO_MICROCOPY.features[1].description,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Wrench,
    title: INTRO_MICROCOPY.features[2].title,
    description: INTRO_MICROCOPY.features[2].description,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

const CONDITIONS = INTRO_MICROCOPY.conditions;

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function IntroStep({ data, updateData, goNext, validationErrors }: IntroStepProps) {
  const canProceed = data.acceptedTerms && data.acceptedConditions;

  return (
    <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
      {/* Service Financing Notice */}
      <motion.div variants={fadeUp}>
        <ServiceFinancingNotice variant="full" />
      </motion.div>

      {/* Hero */}
      <motion.div variants={fadeUp} className="text-center space-y-3">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <Building2 className="w-3.5 h-3.5" />
          {INTRO_MICROCOPY.badge}
        </Badge>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {INTRO_MICROCOPY.title}
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          {INTRO_MICROCOPY.subtitle}
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.08 }}
          >
            <Card className="bg-card/60 border-border/40 hover:border-primary/20 transition-colors h-full">
              <CardContent className="p-4 text-center space-y-2.5">
                <div className={`inline-flex p-2.5 rounded-xl ${feature.bgColor}`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Conditions */}
      <motion.div variants={fadeUp}>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-600 dark:text-amber-400 text-sm mb-2">
                  شروط التقديم الأساسية
                </h3>
                <ul className="space-y-1.5">
                  {CONDITIONS.map((condition, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
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
      <motion.div variants={fadeUp}>
        <Card className={`transition-all duration-300 ${
          canProceed 
            ? "border-primary/30 bg-primary/5" 
            : "border-border/40 bg-card/60"
        }`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3" role="button" tabIndex={0}>
              <Checkbox
                id="terms"
                checked={data.acceptedTerms}
                onCheckedChange={(checked) => updateData({ acceptedTerms: checked as boolean })}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed select-none">
                {INTRO_MICROCOPY.termsLabel.split("الشروط والأحكام")[0]}
                <a href="/terms-of-service" target="_blank" className="text-primary underline hover:no-underline">
                  الشروط والأحكام
                </a>
                {" "}وسياسة الخصوصية.
              </label>
            </div>

            <div className="flex items-start gap-3" role="button" tabIndex={0}>
              <Checkbox
                id="conditions"
                checked={data.acceptedConditions}
                onCheckedChange={(checked) => updateData({ acceptedConditions: checked as boolean })}
                className="mt-0.5"
              />
              <label htmlFor="conditions" className="text-sm cursor-pointer leading-relaxed select-none">
                {INTRO_MICROCOPY.conditionsLabel}
              </label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Errors */}
      {validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-sm text-destructive space-y-1 bg-destructive/5 p-3 rounded-lg border border-destructive/20"
        >
          {validationErrors.map((error, index) => (
            <p key={index} className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              {error}
            </p>
          ))}
        </motion.div>
      )}

      {/* CTA */}
      <motion.div variants={fadeUp}>
        <Button
          onClick={goNext}
          disabled={!canProceed}
          className="w-full h-13 text-base font-semibold gap-2 bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 disabled:shadow-none"
          size="lg"
        >
          <Sparkles className="w-4 h-4" />
          <span>{INTRO_MICROCOPY.ctaButton}</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {INTRO_MICROCOPY.footerNote}
        </p>
      </motion.div>
    </motion.div>
  );
}
