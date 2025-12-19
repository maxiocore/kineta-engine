import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Gift, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MonthlyGoalCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  completedOrders: number;
  monthlyGoal: number;
}

const Confetti = () => {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "#FFD700",
    "#FF69B4",
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 720 - 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 1,
            ease: "easeOut",
          }}
        />
      ))}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1, scale: 1 }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 360,
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.8],
          }}
          transition={{
            duration: Math.random() * 2 + 2.5,
            delay: Math.random() * 0.8,
            ease: "easeOut",
          }}
        >
          <Star
            className="w-4 h-4"
            style={{
              color: colors[Math.floor(Math.random() * colors.length)],
              fill: colors[Math.floor(Math.random() * colors.length)],
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

const MonthlyGoalCelebration = ({
  isOpen,
  onClose,
  completedOrders,
  monthlyGoal,
}: MonthlyGoalCelebrationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const exceededBy = completedOrders - monthlyGoal;

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md border-primary/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-success/10 pointer-events-none" />
          
          <DialogHeader className="relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="mx-auto mb-4"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-warning via-yellow-400 to-orange-400 flex items-center justify-center shadow-2xl">
                  <Trophy className="w-12 h-12 text-primary-foreground" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2"
                >
                  {[...Array(8)].map((_, i) => (
                    <Sparkles
                      key={i}
                      className="w-4 h-4 text-warning absolute"
                      style={{
                        top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 8)}%`,
                        left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 8)}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>

            <DialogTitle className="text-center text-2xl font-bold">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-l from-primary via-accent to-success bg-clip-text text-transparent"
              >
                🎉 تهانينا! حققت هدفك الشهري 🎉
              </motion.span>
            </DialogTitle>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative space-y-4 py-4"
          >
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                لقد أكملت{" "}
                <span className="font-bold text-primary text-lg">
                  {completedOrders}
                </span>{" "}
                طلب هذا الشهر
              </p>

              {exceededBy > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/30 text-success"
                >
                  <Star className="w-4 h-4 fill-success" />
                  <span className="font-semibold">
                    تجاوزت الهدف بـ {exceededBy} طلب!
                  </span>
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-l from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">مكافأتك</h4>
                  <p className="text-xs text-muted-foreground">
                    لتحقيقك هدف الشهر
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                  <span className="text-sm">نقاط إضافية</span>
                  <span className="font-bold text-primary">+50 نقطة</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                  <span className="text-sm">شارة الإنجاز</span>
                  <span className="text-lg">🏆</span>
                </div>
                {exceededBy >= 5 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-success/10 border border-success/20">
                    <span className="text-sm text-success">مكافأة التفوق</span>
                    <span className="font-bold text-success">+25 نقطة</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="relative flex justify-center"
          >
            <Button
              onClick={onClose}
              className="bg-gradient-to-l from-primary to-accent text-primary-foreground px-8"
            >
              رائع! 🎊
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MonthlyGoalCelebration;
