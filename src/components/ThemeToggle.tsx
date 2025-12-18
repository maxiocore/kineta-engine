import { Moon, Sun, Stars } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <div className="relative p-2.5 rounded-xl bg-secondary/50 w-10 h-10" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary overflow-hidden group"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      aria-label="تبديل الوضع"
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: isDark 
            ? "radial-gradient(circle at center, hsl(199 89% 55% / 0.2), transparent 70%)"
            : "radial-gradient(circle at center, hsl(45 93% 47% / 0.2), transparent 70%)"
        }}
      />
      
      {/* Stars decoration for dark mode */}
      <AnimatePresence>
        {isDark && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute top-1 right-1"
            >
              <Stars className="w-2 h-2 text-primary/60" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-1.5 left-1.5"
            >
              <Stars className="w-1.5 h-1.5 text-primary/40" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0, y: 10 }}
            animate={{ rotate: 0, opacity: 1, scale: 1, y: 0 }}
            exit={{ rotate: 90, opacity: 0, scale: 0, y: -10 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="relative z-10"
          >
            <Sun className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0, y: -10 }}
            animate={{ rotate: 0, opacity: 1, scale: 1, y: 0 }}
            exit={{ rotate: -90, opacity: 0, scale: 0, y: 10 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="relative z-10"
          >
            <Moon className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(199_89%_48%/0.5)]" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        initial={false}
        whileTap={{
          boxShadow: isDark 
            ? "inset 0 0 20px hsl(199 89% 55% / 0.3)"
            : "inset 0 0 20px hsl(45 93% 47% / 0.3)"
        }}
      />
    </motion.button>
  );
};

export default ThemeToggle;
