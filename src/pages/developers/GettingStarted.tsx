import { motion } from "framer-motion";
import { ArrowLeft, Rocket, Key, Code2, CheckCircle2, Copy, ExternalLink, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const GettingStarted = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "تم النسخ!", description: "تم نسخ الكود بنجاح" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const steps = [
    {
      icon: Key,
      title: "1. الحصول على مفتاح API",
      description: "سجل دخولك إلى لوحة التحكم واحصل على مفتاح API الخاص بك من صفحة الإعدادات.",
      code: `// مفتاح API الخاص بك
const API_KEY = "your_api_key_here";`,
    },
    {
      icon: Code2,
      title: "2. تثبيت المكتبة",
      description: "قم بتثبيت مكتبة MaxioCore SDK في مشروعك.",
      code: `npm install @maxiocore/sdk
# أو
yarn add @maxiocore/sdk`,
    },
    {
      icon: Rocket,
      title: "3. إرسال أول طلب",
      description: "استخدم الكود التالي لإرسال أول طلب إلى API.",
      code: `import { MaxioCore } from '@maxiocore/sdk';

const client = new MaxioCore({
  apiKey: 'your_api_key_here'
});

// الحصول على قائمة الخدمات
const services = await client.services.list();
console.log(services);`,
    },
  ];

  const features = [
    { icon: Zap, title: "استجابة سريعة", description: "أقل من 100ms متوسط وقت الاستجابة" },
    { icon: Shield, title: "آمن 100%", description: "تشفير كامل لجميع البيانات" },
    { icon: Globe, title: "متاح عالمياً", description: "خوادم في أكثر من 10 مناطق" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">البدء السريع</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              ابدأ التكامل مع{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">
                MaxioCore API
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              دليل سريع لربط موقعك أو تطبيقك بمنصة MaxioCore خلال دقائق معدودة
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/developers/api-reference">
                <Button size="lg" className="gap-2">
                  مرجع API
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/dashboard/api">
                <Button size="lg" variant="outline" className="gap-2">
                  <Key className="w-4 h-4" />
                  الحصول على مفتاح API
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="container px-4 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="container px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="relative mt-4">
                    <div className="bg-secondary/50 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-sm" dir="ltr">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 left-2"
                      onClick={() => copyToClipboard(step.code, `step-${index}`)}
                    >
                      {copiedCode === `step-${index}` ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="absolute right-6 top-full h-8 w-px bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Next Steps */}
        <section className="container px-4 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">الخطوات التالية</h2>
            <p className="text-muted-foreground mb-6">
              الآن بعد أن أكملت الإعداد الأساسي، استكشف المزيد من إمكانيات API
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/developers/api-reference">
                <Button variant="outline" className="gap-2">
                  <Code2 className="w-4 h-4" />
                  مرجع API الكامل
                </Button>
              </Link>
              <Link to="/developers/examples">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  أمثلة الكود
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GettingStarted;
