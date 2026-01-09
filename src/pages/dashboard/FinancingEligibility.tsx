// ============================================
// Financing Application Page - MaxioCore
// Complete Loan Application Flow
// ============================================

import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { LoanApplicationWizard } from "@/components/financing/application/LoanApplicationWizard";
import { motion } from "framer-motion";

// Floating Background Orbs
const FloatingOrb = ({ 
  delay, 
  size, 
  color, 
  x, 
  y 
}: { 
  delay: number; 
  size: number; 
  color: string; 
  x: string; 
  y: string;
}) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20 ${color}`}
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.1, 0.3, 0.1],
      x: [0, 30, 0],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

export default function FinancingEligibility() {
  return (
    <ClientDashboardLayout>
      <motion.div
        className="relative min-h-screen"
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Floating Background Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <FloatingOrb delay={0} size={300} color="bg-emerald-500" x="10%" y="20%" />
          <FloatingOrb delay={2} size={200} color="bg-teal-500" x="70%" y="60%" />
          <FloatingOrb delay={4} size={250} color="bg-cyan-500" x="80%" y="10%" />
        </div>
        
        <div className="relative z-10">
          <LoanApplicationWizard />
        </div>
      </motion.div>
    </ClientDashboardLayout>
  );
}
