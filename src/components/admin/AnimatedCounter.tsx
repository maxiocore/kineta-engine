import { useState, useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

const AnimatedCounter = ({ 
  value, 
  duration = 1.5, 
  prefix = "", 
  suffix = "",
  decimals = 0,
  className = ""
}: AnimatedCounterProps) => {
  const springValue = useSpring(0, { 
    duration: duration * 1000,
    bounce: 0.1 
  });
  
  const displayValue = useTransform(springValue, (latest) => {
    return prefix + latest.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
  });

  const [display, setDisplay] = useState(prefix + "0" + suffix);

  useEffect(() => {
    springValue.set(value);
    
    const unsubscribe = displayValue.on("change", (latest) => {
      setDisplay(latest);
    });

    return () => unsubscribe();
  }, [value, springValue, displayValue]);

  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {display}
    </motion.span>
  );
};

export default AnimatedCounter;
