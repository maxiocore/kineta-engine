/**
 * Journey Header Component
 * RTL-optimized header for Arabic banking interface
 */

import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { Link } from "react-router-dom";
import { type JourneyScreen, JOURNEY_SCREENS } from "@/lib/financing/journeyConfig";

interface JourneyHeaderProps {
  currentScreen: JourneyScreen;
  onBack: () => void;
  canGoBack: boolean;
}

export function JourneyHeader({ currentScreen, onBack, canGoBack }: JourneyHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Back Button - RTL: يظهر في اليمين */}
        <div className="w-24">
          {canGoBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4 rtl-flip" />
              رجوع
            </Button>
          ) : (
            <div />
          )}
        </div>

        {/* Logo/Title - Center */}
        <div className="text-center">
          <h1 className="font-bold text-lg bg-gradient-to-l from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            تمويل ASH HOLDING
          </h1>
        </div>

        {/* Close/Exit - RTL: يظهر في اليسار */}
        <div className="w-24 flex justify-start">
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link to="/dashboard/financing">
              <X className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
