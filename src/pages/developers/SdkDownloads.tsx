import { motion } from "framer-motion";
import { Download, Package, ExternalLink, CheckCircle2, Star, GitBranch, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const SdkDownloads = () => {
  const sdks = [
    {
      name: "JavaScript / Node.js",
      description: "مكتبة رسمية لـ Node.js والمتصفح",
      version: "2.1.0",
      installCommand: "npm install @ashholding/sdk",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
      docs: "/developers/getting-started",
      github: "https://github.com/ashholding/sdk-js",
      features: ["TypeScript support", "Promise-based", "Browser & Node.js"],
    },
    {
      name: "Python",
      description: "مكتبة Python رسمية مع دعم async",
      version: "1.5.0",
      installCommand: "pip install ashholding",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
      docs: "/developers/getting-started",
      github: "https://github.com/ashholding/sdk-python",
      features: ["Async support", "Type hints", "Python 3.8+"],
    },
    {
      name: "PHP",
      description: "مكتبة PHP مع دعم Composer",
      version: "1.3.0",
      installCommand: "composer require ashholding/sdk",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
      docs: "/developers/getting-started",
      github: "https://github.com/ashholding/sdk-php",
      features: ["PSR-4 autoloading", "PHP 8.0+", "Laravel support"],
    },
    {
      name: "Ruby",
      description: "Ruby gem رسمي للتكامل السريع",
      version: "1.0.0",
      installCommand: "gem install ashholding",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg",
      docs: "/developers/getting-started",
      github: "https://github.com/ashholding/sdk-ruby",
      features: ["Rails integration", "Ruby 3.0+", "Thread-safe"],
    },
    {
      name: "Go",
      description: "مكتبة Go خفيفة وسريعة",
      version: "0.9.0",
      installCommand: "go get github.com/ashholding/sdk-go",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
      docs: "/developers/getting-started",
      github: "https://github.com/ashholding/sdk-go",
      features: ["Zero dependencies", "Context support", "Go 1.18+"],
    },
    {
      name: "REST API",
      description: "استخدم API مباشرة مع أي لغة",
      version: "v1",
      installCommand: "curl https://api.ashholding.com/api/v1/...",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg",
      docs: "/developers/api-reference",
      github: null,
      features: ["Universal", "JSON responses", "OpenAPI spec"],
    },
  ];

  const widgets = [
    {
      name: "Order Widget",
      description: "نموذج طلب جاهز يمكن تضمينه في أي موقع",
      code: `<script src="https://cdn.ashholding.com/widget.js"></script>
<div id="ashholding-order" data-api-key="YOUR_KEY"></div>`,
    },
    {
      name: "Services Catalog",
      description: "عرض كتالوج الخدمات مع البحث والفلترة",
      code: `<script src="https://cdn.ashholding.com/catalog.js"></script>
<div id="ashholding-catalog" data-api-key="YOUR_KEY"></div>`,
    },
    {
      name: "Order Tracker",
      description: "تتبع حالة الطلب للعملاء",
      code: `<script src="https://cdn.ashholding.com/tracker.js"></script>
<div id="ashholding-tracker" data-api-key="YOUR_KEY"></div>`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container px-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">SDK & Tools</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              مكتبات و{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">
                أدوات التكامل
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              مكتبات SDK رسمية وأدوات لتسهيل التكامل مع منصة ASH HOLDING
            </p>
          </motion.div>
        </section>

        {/* SDKs Grid */}
        <section className="container px-4 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">مكتبات SDK</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {sdks.map((sdk, index) => (
              <motion.div
                key={sdk.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <img src={sdk.icon} alt={sdk.name} className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold group-hover:text-primary transition-colors">{sdk.name}</h3>
                    <span className="text-xs text-muted-foreground">v{sdk.version}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{sdk.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {sdk.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 text-xs rounded-full bg-secondary text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="bg-secondary/50 rounded-lg p-3 mb-4 overflow-x-auto">
                  <code className="text-xs font-mono" dir="ltr">{sdk.installCommand}</code>
                </div>

                <div className="flex gap-2">
                  <Link to={sdk.docs} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <FileCode className="w-4 h-4" />
                      التوثيق
                    </Button>
                  </Link>
                  {sdk.github && (
                    <a href={sdk.github} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <GitBranch className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Widgets */}
        <section className="container px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Widgets جاهزة</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {widgets.map((widget, index) => (
              <motion.div
                key={widget.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50"
              >
                <h3 className="text-lg font-bold mb-2">{widget.name}</h3>
                <p className="text-muted-foreground mb-4">{widget.description}</p>
                <div className="bg-secondary/50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono" dir="ltr">
                    <code>{widget.code}</code>
                  </pre>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container px-4 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">هل تحتاج مساعدة؟</h2>
            <p className="text-muted-foreground mb-6">
              فريق الدعم الفني متاح لمساعدتك في التكامل
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button className="gap-2">
                  تواصل معنا
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/developers/getting-started">
                <Button variant="outline" className="gap-2">
                  البدء السريع
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

export default SdkDownloads;
