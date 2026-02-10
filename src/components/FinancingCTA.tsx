import { motion } from "framer-motion";
import { Banknote, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FinancingCTAProps {
  serviceId?: string;
  variant?: "default" | "compact" | "banner";
  className?: string;
}

const FINANCING_URL = "https://ash.holdings";

const FinancingCTA = ({ serviceId, variant = "default", className }: FinancingCTAProps) => {
  const handleClick = () => {
    const url = serviceId ? `${FINANCING_URL}?service=${serviceId}` : FINANCING_URL;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground",
          className
        )}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-foreground/20 p-3">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">هل تحتاج تمويل؟</h3>
              <p className="text-sm opacity-90">احصل على تمويل فوري لخدماتك بخطوة واحدة</p>
            </div>
          </div>
          <Button
            onClick={handleClick}
            variant="secondary"
            className="shrink-0 gap-2 font-bold"
          >
            <ExternalLink className="h-4 w-4" />
            اطلب تمويل الآن
          </Button>
        </div>
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        onClick={handleClick}
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all",
          className
        )}
      >
        <Banknote className="h-3.5 w-3.5" />
        اطلب تمويل الآن
      </Button>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={handleClick}
        className={cn(
          "gap-2 bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-bold shadow-lg",
          className
        )}
      >
        <Banknote className="h-4 w-4" />
        اطلب تمويل الآن
      </Button>
    </motion.div>
  );
};

export default FinancingCTA;
