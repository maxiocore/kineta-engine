/**
 * Journey Progress Indicator
 */

import { motion } from "framer-motion";
import { JOURNEY_SCREENS, type JourneyScreen } from "@/lib/financing/journeyConfig";
import { 
  Sparkles, UserCheck, Fingerprint, Briefcase, 
  CreditCard, FileText, Eye, ShieldCheck 
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  UserCheck,
  Fingerprint,
  Briefcase,
  CreditCard,
  FileText,
  Eye,
  ShieldCheck,
};

interface JourneyProgressProps {
  currentStep: number;
  totalSteps: number;
  currentScreen: JourneyScreen;
}

export function JourneyProgress({ currentStep, totalSteps, currentScreen }: JourneyProgressProps) {
  const progress = Math.min(((currentStep) / totalSteps) * 100, 100);
  const screenConfig = JOURNEY_SCREENS[currentScreen];
  
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Screen Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{currentStep}</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm">{screenConfig.title_ar}</h2>
              <p className="text-xs text-muted-foreground">{screenConfig.subtitle_ar}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            ~{screenConfig.estimatedTime} دقيقة
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
