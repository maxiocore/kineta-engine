import { motion } from "framer-motion";
import { Book, Code2, Copy, CheckCircle2, ChevronDown, Globe, Users, ShoppingCart, CreditCard, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ApiReference = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "تم النسخ!", description: "تم نسخ الكود بنجاح" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const endpoints = [
    {
      category: "الخدمات",
      icon: Globe,
      color: "text-blue-500",
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/services",
          description: "الحصول على قائمة جميع الخدمات المتاحة",
          response: `{
  "success": true,
  "data": [
    {
      "id": "srv_123",
      "name": "زيادة متابعين انستقرام",
      "price": 0.05,
      "min_quantity": 100,
      "max_quantity": 10000,
      "category": "instagram"
    }
  ]
}`,
        },
        {
          method: "GET",
          path: "/api/v1/services/:id",
          description: "الحصول على تفاصيل خدمة محددة",
          response: `{
  "success": true,
  "data": {
    "id": "srv_123",
    "name": "زيادة متابعين انستقرام",
    "description": "متابعين حقيقيين...",
    "price": 0.05,
    "min_quantity": 100,
    "max_quantity": 10000
  }
}`,
        },
      ],
    },
    {
      category: "الطلبات",
      icon: ShoppingCart,
      color: "text-green-500",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/orders",
          description: "إنشاء طلب جديد",
          body: `{
  "service_id": "srv_123",
  "link": "https://instagram.com/username",
  "quantity": 1000
}`,
          response: `{
  "success": true,
  "data": {
    "order_id": "ord_456",
    "status": "pending",
    "charge": 50.00
  }
}`,
        },
        {
          method: "GET",
          path: "/api/v1/orders/:id",
          description: "الحصول على حالة طلب",
          response: `{
  "success": true,
  "data": {
    "order_id": "ord_456",
    "status": "in_progress",
    "start_count": 1000,
    "remains": 500
  }
}`,
        },
      ],
    },
    {
      category: "الرصيد",
      icon: CreditCard,
      color: "text-amber-500",
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/balance",
          description: "الحصول على رصيدك الحالي",
          response: `{
  "success": true,
  "data": {
    "balance": 150.50,
    "currency": "SAR"
  }
}`,
        },
      ],
    },
    {
      category: "Webhooks",
      icon: Bell,
      color: "text-purple-500",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/webhooks",
          description: "إنشاء webhook جديد",
          body: `{
  "url": "https://yoursite.com/webhook",
  "events": ["order.completed", "order.failed"]
}`,
          response: `{
  "success": true,
  "data": {
    "webhook_id": "whk_789",
    "secret": "whsec_..."
  }
}`,
        },
      ],
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-blue-500/20 text-blue-500";
      case "POST": return "bg-green-500/20 text-green-500";
      case "PUT": return "bg-amber-500/20 text-amber-500";
      case "DELETE": return "bg-red-500/20 text-red-500";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

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
              <Book className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">مرجع API</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              توثيق{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">
                API الكامل
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              جميع نقاط النهاية والمعلمات والاستجابات المتوقعة
            </p>
          </motion.div>
        </section>

        {/* Base URL */}
        <section className="container px-4 mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Base URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-primary font-mono" dir="ltr">
                  https://api.ashholding.com
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard("https://api.ashholding.com", "base-url")}
                >
                  {copiedCode === "base-url" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="container px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {endpoints.map((category, catIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 }}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden"
              >
                <div className="p-4 border-b border-border/50 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${category.color}`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold">{category.category}</h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {category.endpoints.map((endpoint, endIndex) => (
                    <AccordionItem key={endIndex} value={`${catIndex}-${endIndex}`} className="border-b border-border/30 last:border-0">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono" dir="ltr">{endpoint.path}</code>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <p className="text-muted-foreground mb-4">{endpoint.description}</p>
                        
                        {endpoint.body && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">Request Body:</p>
                            <div className="relative bg-secondary/50 rounded-lg p-4 overflow-x-auto">
                              <pre className="text-sm font-mono" dir="ltr">
                                <code>{endpoint.body}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 left-2"
                                onClick={() => copyToClipboard(endpoint.body!, `body-${catIndex}-${endIndex}`)}
                              >
                                {copiedCode === `body-${catIndex}-${endIndex}` ? (
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Response:</p>
                          <div className="relative bg-secondary/50 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm font-mono" dir="ltr">
                              <code>{endpoint.response}</code>
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 left-2"
                              onClick={() => copyToClipboard(endpoint.response, `response-${catIndex}-${endIndex}`)}
                            >
                              {copiedCode === `response-${catIndex}-${endIndex}` ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ApiReference;
