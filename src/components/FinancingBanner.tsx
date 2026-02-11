import { motion } from "framer-motion";
import { Banknote, ArrowLeft, Shield, Clock, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinancingBannerProps {
  variant?: "landing" | "dashboard";
}

const FinancingBanner = ({ variant = "landing" }: FinancingBannerProps) => {
  const isLanding = variant === "landing";

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden ${isLanding ? "py-16 md:py-24" : ""}`}
    >
      <div
        className={`relative rounded-2xl ${isLanding ? "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" : ""}`}
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-900">
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-300 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-emerald-300 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className={`relative z-10 ${isLanding ? "p-8 md:p-14" : "p-5 sm:p-6"}`}>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              {/* Content */}
              <div className="flex-1 text-center md:text-right space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>خدمات التمويل</span>
                </div>

                <h2 className={`font-bold text-white leading-tight ${isLanding ? "text-2xl sm:text-3xl md:text-4xl" : "text-lg sm:text-xl"}`}>
                  حلول تمويلية مرنة
                  <br />
                  <span className="text-emerald-200">لنمو أعمالك</span>
                </h2>

                <p className={`text-emerald-100/80 max-w-lg ${isLanding ? "text-sm md:text-base mx-auto md:mx-0 md:me-0" : "text-xs sm:text-sm"}`}>
                  احصل على تمويل سريع وموثوق لدعم مشاريعك وتطوير أعمالك مع خطط سداد مريحة تناسب احتياجاتك
                </p>

                {/* Features */}
                <div className={`flex flex-wrap justify-center md:justify-start gap-3 ${isLanding ? "mt-4" : "mt-2"}`}>
                  {[
                    { icon: Clock, label: "موافقة سريعة" },
                    { icon: Percent, label: "أرباح تنافسية" },
                    { icon: Shield, label: "متوافق مع الشريعة" },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-1.5 text-white/80 text-[11px] sm:text-xs"
                    >
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                        <feature.icon className="w-3 h-3" />
                      </div>
                      {feature.label}
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className={isLanding ? "pt-2" : "pt-1"}
                >
                  <a href="https://ash.holdings" target="_blank" rel="noopener noreferrer">
                    <Button
                      size={isLanding ? "lg" : "default"}
                      className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl shadow-emerald-900/20 font-bold gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>تقدّم بطلب تمويل</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </a>
                </motion.div>
              </div>

              {/* Icon illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: "spring" }}
                className={`shrink-0 ${isLanding ? "w-40 h-40 md:w-56 md:h-56" : "w-24 h-24 sm:w-32 sm:h-32 hidden sm:flex"}`}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-500/20 flex items-center justify-center">
                    <Banknote className={`text-white/90 ${isLanding ? "w-16 h-16 md:w-20 md:h-20" : "w-10 h-10"}`} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default FinancingBanner;
