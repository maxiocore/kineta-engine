import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Tip {
  id: string;
  title: string;
  description: string;
  type: "tip" | "promo" | "achievement";
}

interface PersonalizedTipsProps {
  tips: Tip[];
  onDismiss?: (id: string) => void;
}

const PersonalizedTips = ({ tips, onDismiss }: PersonalizedTipsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (tips.length === 0) return null;

  const currentTip = tips[currentIndex];

  const nextTip = () => {
    setCurrentIndex((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "promo":
        return "from-primary to-accent";
      case "achievement":
        return "from-success to-emerald-500";
      default:
        return "from-primary to-cyan-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "promo":
        return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "achievement":
        return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className={`card-elevated border-border/30 overflow-hidden bg-gradient-to-l ${getTypeStyle(currentTip.type)}`}>
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 text-white">
              {getTypeIcon(currentTip.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-bold text-white text-xs sm:text-base mb-0.5 sm:mb-1">{currentTip.title}</h3>
                  <p className="text-white/80 text-[11px] sm:text-sm line-clamp-2">{currentTip.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 text-white/60 hover:text-white hover:bg-white/10 shrink-0"
                onClick={() => onDismiss(currentTip.id)}
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>

          {tips.length > 1 && (
            <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/20">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={prevTip}
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={nextTip}
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-1">
                {tips.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentIndex ? "bg-white w-3 sm:w-4" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PersonalizedTips;
