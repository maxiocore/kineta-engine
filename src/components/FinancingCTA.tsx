import { useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FinancingCTAProps {
  serviceId?: string;
  variant?: "default" | "compact" | "banner";
  className?: string;
}

const FinancingCTA = ({ serviceId, variant = "default", className }: FinancingCTAProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!user || !session) {
      toast.error("يرجى تسجيل الدخول أولاً");
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sso-token", {
        body: { service_id: serviceId || null },
      });

      if (error) throw error;

      if (data?.redirect_url) {
        window.open(data.redirect_url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("لم يتم استلام رابط التوجيه");
      }
    } catch (err: any) {
      console.error("SSO error:", err);
      toast.error("حدث خطأ أثناء طلب التمويل، يرجى المحاولة لاحقاً");
    } finally {
      setIsLoading(false);
    }
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
            disabled={isLoading}
            variant="secondary"
            className="shrink-0 gap-2 font-bold"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
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
        disabled={isLoading}
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Banknote className="h-3.5 w-3.5" />
        )}
        اطلب تمويل الآن
      </Button>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "gap-2 bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-bold shadow-lg",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Banknote className="h-4 w-4" />
        )}
        اطلب تمويل الآن
      </Button>
    </motion.div>
  );
};

export default FinancingCTA;
