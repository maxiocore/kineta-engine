import { motion } from "framer-motion";
import { CreditCard, Shield, Clock, CheckCircle2, ArrowLeft, Sparkles, Percent, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FinancingSection = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Percent, text: "بدون فوائد" },
    { icon: Clock, text: "أقساط مرنة" },
    { icon: Shield, text: "موافقة سريعة" },
    { icon: BadgeCheck, text: "بدون كفيل" },
  ];

  return (
    <section className="relative py-16 md:py-20 overflow-hidden" dir="rtl">
      {/* Simple Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Card Container */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 shadow-xl">
            {/* Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-primary via-primary to-accent" />

            <div className="p-6 md:p-10">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">تمويل ميسر</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    موّل مشروعك معنا
                  </h2>
                  
                  <p className="text-muted-foreground text-sm md:text-base">
                    من <span className="text-primary font-bold">1,500</span> إلى{" "}
                    <span className="text-primary font-bold">50,000</span> ريال
                  </p>
                </div>

                {/* Amount Display */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">50,000</div>
                    <div className="text-xs text-muted-foreground">ريال سعودي</div>
                  </div>
                </div>
              </div>

              {/* Features Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Section */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/30">
                {/* Benefits List */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {["تمويل إسلامي", "إجراءات سهلة", "سداد مرن"].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                  onClick={() => navigate('/auth')}
                >
                  قدّم طلبك الآن
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinancingSection;
