import { Download, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { generateCompanyProfilePDF } from "@/utils/generateCompanyProfilePDF";
import bannerImg from "@/assets/company-profile-banner.jpg";
import { motion } from "framer-motion";

const CompanyProfileSection = () => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await generateCompanyProfilePDF();
    } catch (error) {
      console.error('خطأ في إنشاء الملف التعريفي:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="company-profile" dir="rtl" className="relative overflow-hidden">
      <div className="relative min-h-[400px] md:min-h-[480px] flex items-center justify-center">
        {/* Background image */}
        <img
          src={bannerImg}
          alt="ASH Holding - الملف التعريفي"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        {/* Animated particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/40"
              style={{
                top: `${20 + i * 12}%`,
                right: `${10 + i * 15}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 py-20 md:py-28 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-primary text-sm font-medium tracking-wide">
              Company Profile
            </span>
            <Sparkles className="w-4 h-4 text-primary/70" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
          >
            الملف التعريفي لشركة{" "}
            <span className="text-primary bg-gradient-to-l from-primary to-cyan-400 bg-clip-text text-transparent">
              ASH Holding
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-white/60 text-base md:text-lg mb-10 leading-relaxed max-w-xl mx-auto"
          >
            تعرّف على خدماتنا، تقنياتنا، ورؤيتنا في ملف واحد شامل واحترافي
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Button
              size="lg"
              onClick={handleDownload}
              disabled={loading}
              className="gap-3 text-base px-10 py-7 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 bg-gradient-to-l from-primary to-cyan-500 border-0"
            >
              <Download className="w-5 h-5" />
              {loading ? "جاري التحميل..." : "تحميل الملف التعريفي الكامل"}
            </Button>
          </motion.div>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 mx-auto w-24 h-px bg-gradient-to-l from-transparent via-primary/50 to-transparent"
          />
        </div>
      </div>
    </section>
  );
};

export default CompanyProfileSection;
