import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { generateCompanyProfilePDF } from "@/utils/generateCompanyProfilePDF";
import bannerImg from "@/assets/company-profile-banner.jpg";

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
      <div className="relative min-h-[340px] md:min-h-[420px] flex items-center justify-center">
        {/* Background image */}
        <img
          src={bannerImg}
          alt="ASH Holding - الملف التعريفي"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 py-16 md:py-24 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            الملف التعريفي لشركة{" "}
            <span className="text-primary">ASH Holding</span>
          </h2>
          <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed">
            تعرّف على خدماتنا، تقنياتنا، ورؤيتنا في ملف واحد شامل
          </p>
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={loading}
            className="gap-3 text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
          >
            <Download className="w-5 h-5" />
            {loading ? "جاري التحميل..." : "تحميل الملف التعريفي"}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CompanyProfileSection;
