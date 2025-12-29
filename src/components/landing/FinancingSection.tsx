import { motion } from "framer-motion";
import { CreditCard, Calculator, Shield, Clock, CheckCircle2, ArrowLeft, Sparkles, Banknote, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FinancingSection = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Percent,
      title: "بدون فوائد",
      description: "تمويل إسلامي متوافق مع الشريعة"
    },
    {
      icon: Clock,
      title: "أقساط ميسرة",
      description: "دفعات شهرية مرنة تناسب ميزانيتك"
    },
    {
      icon: Shield,
      title: "موافقة سريعة",
      description: "احصل على الموافقة خلال 24 ساعة"
    },
    {
      icon: CheckCircle2,
      title: "بدون كفيل",
      description: "إجراءات سهلة وبسيطة"
    }
  ];

  const plans = [
    { amount: "1,500", months: 3, monthly: "500" },
    { amount: "5,000", months: 6, monthly: "833" },
    { amount: "15,000", months: 12, monthly: "1,250" },
    { amount: "50,000", months: 24, monthly: "2,083" }
  ];

  return (
    <section className="relative py-24 overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Floating Money Icons */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            rotate: [-10, 10, -10],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <Banknote className="w-8 h-8" />
        </motion.div>
      ))}

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">تمويل بدون فوائد</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">موّل مشروعك مع </span>
            <span className="bg-gradient-to-l from-primary via-primary to-accent bg-clip-text text-transparent">
              ماكسيوكور
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            احصل على تمويل فوري من{" "}
            <span className="text-primary font-bold">1,500</span> إلى{" "}
            <span className="text-primary font-bold">50,000</span> ريال
            بأقساط شهرية ميسرة وبدون أي فوائد
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl text-center h-full">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Plans Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50 group-hover:border-primary/50 transition-all duration-500">
                {/* Top Pattern */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary/10 to-accent/10" />
                
                <div className="relative p-6">
                  {/* Amount */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                      <CreditCard className="w-4 h-4" />
                      <span>خطة التمويل</span>
                    </div>
                    <div className="text-4xl font-bold text-foreground mb-1">
                      {plan.amount}
                      <span className="text-lg text-muted-foreground mr-1">ر.س</span>
                    </div>
                    <p className="text-sm text-muted-foreground">إجمالي التمويل</p>
                  </div>

                  {/* Details */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground">عدد الأشهر</span>
                      <span className="font-bold text-foreground">{plan.months} شهر</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-muted-foreground">القسط الشهري</span>
                      <span className="font-bold text-primary">{plan.monthly} ر.س</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {["بدون فوائد", "موافقة سريعة", "بدون كفيل"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                    onClick={() => navigate('/auth')}
                  >
                    قدّم الآن
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-3xl bg-gradient-to-l from-primary/10 via-card to-accent/10 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-foreground">احسب قسطك الشهري</h3>
                <p className="text-sm text-muted-foreground">استخدم حاسبة التمويل المجانية</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => navigate('/dashboard/financing/calculator')}
            >
              حاسبة التمويل
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinancingSection;
