/**
 * Journey Header Component
 */

import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { type JourneyScreen, JOURNEY_SCREENS } from "@/lib/financing/journeyConfig";

interface JourneyHeaderProps {
  currentScreen: JourneyScreen;
  onBack: () => void;
  canGoBack: boolean;
}

export function JourneyHeader({ currentScreen, onBack, canGoBack }: JourneyHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Back Button */}
        <div className="w-24">
          {canGoBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1"
            >
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Button>
          ) : (
            <div />
          )}
        </div>

        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="font-bold text-lg bg-gradient-to-l from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            تمويل MaxioCore
          </h1>
        </div>

        {/* Close/Exit */}
        <div className="w-24 flex justify-end">
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
