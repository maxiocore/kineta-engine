import { motion } from "framer-motion";
import { Code2, Copy, CheckCircle2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const CodeExamples = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "تم النسخ!", description: "تم نسخ الكود بنجاح" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const examples = [
    {
      title: "الحصول على الخدمات",
      description: "جلب قائمة بجميع الخدمات المتاحة",
      languages: {
        javascript: `const response = await fetch('https://api.ashholding.com/api/v1/services', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const services = await response.json();
console.log(services.data);`,
        python: `import requests

response = requests.get(
    'https://api.ashholding.com/api/v1/services',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
)

services = response.json()
print(services['data'])`,
        php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.ashholding.com/api/v1/services',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
$services = json_decode($response, true);
print_r($services['data']);
?>`,
        curl: `curl -X GET "https://api.ashholding.com/api/v1/services" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
      },
    },
    {
      title: "إنشاء طلب جديد",
      description: "إنشاء طلب لخدمة محددة",
      languages: {
        javascript: `const response = await fetch('https://api.ashholding.com/api/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    service_id: 'srv_123',
    link: 'https://instagram.com/username',
    quantity: 1000
  })
});

const order = await response.json();
console.log('Order ID:', order.data.order_id);`,
        python: `import requests

response = requests.post(
    'https://api.ashholding.com/api/v1/orders',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'service_id': 'srv_123',
        'link': 'https://instagram.com/username',
        'quantity': 1000
    }
)

order = response.json()
print(f"Order ID: {order['data']['order_id']}")`,
        php: `<?php
$ch = curl_init();

$data = json_encode([
    'service_id' => 'srv_123',
    'link' => 'https://instagram.com/username',
    'quantity' => 1000
]);

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.ashholding.com/api/v1/orders',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $data,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
$order = json_decode($response, true);
echo "Order ID: " . $order['data']['order_id'];
?>`,
        curl: `curl -X POST "https://api.ashholding.com/api/v1/orders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service_id": "srv_123",
    "link": "https://instagram.com/username",
    "quantity": 1000
  }'`,
      },
    },
    {
      title: "تتبع حالة الطلب",
      description: "الحصول على حالة طلب محدد",
      languages: {
        javascript: `const orderId = 'ord_456';

const response = await fetch(\`https://api.ashholding.com/api/v1/orders/\${orderId}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const status = await response.json();
console.log('Status:', status.data.status);
console.log('Remaining:', status.data.remains);`,
        python: `import requests

order_id = 'ord_456'

response = requests.get(
    f'https://api.ashholding.com/api/v1/orders/{order_id}',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
)

status = response.json()
print(f"Status: {status['data']['status']}")
print(f"Remaining: {status['data']['remains']}")`,
        php: `<?php
$orderId = 'ord_456';
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.ashholding.com/api/v1/orders/{$orderId}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
$status = json_decode($response, true);
echo "Status: " . $status['data']['status'];
echo "Remaining: " . $status['data']['remains'];
?>`,
        curl: `curl -X GET "https://api.ashholding.com/api/v1/orders/ord_456" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
      },
    },
    {
      title: "إعداد Webhook",
      description: "إنشاء webhook لتلقي إشعارات تلقائية",
      languages: {
        javascript: `const response = await fetch('https://api.ashholding.com/api/v1/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://yoursite.com/webhook',
    events: ['order.completed', 'order.failed', 'balance.low']
  })
});

const webhook = await response.json();
console.log('Webhook Secret:', webhook.data.secret);
// احفظ هذا السر للتحقق من الطلبات`,
        python: `import requests

response = requests.post(
    'https://api.ashholding.com/api/v1/webhooks',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'url': 'https://yoursite.com/webhook',
        'events': ['order.completed', 'order.failed', 'balance.low']
    }
)

webhook = response.json()
print(f"Webhook Secret: {webhook['data']['secret']}")
# احفظ هذا السر للتحقق من الطلبات`,
        php: `<?php
$ch = curl_init();

$data = json_encode([
    'url' => 'https://yoursite.com/webhook',
    'events' => ['order.completed', 'order.failed', 'balance.low']
]);

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.ashholding.com/api/v1/webhooks',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $data,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
$webhook = json_decode($response, true);
echo "Webhook Secret: " . $webhook['data']['secret'];
// احفظ هذا السر للتحقق من الطلبات
?>`,
        curl: `curl -X POST "https://api.ashholding.com/api/v1/webhooks" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yoursite.com/webhook",
    "events": ["order.completed", "order.failed", "balance.low"]
  }'`,
      },
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
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">أمثلة الكود</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              أمثلة{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">
                جاهزة للاستخدام
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              أمثلة كود بلغات برمجة مختلفة لتسهيل التكامل مع API
            </p>
          </motion.div>
        </section>

        {/* Examples */}
        <section className="container px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {examples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden"
              >
                <div className="p-4 sm:p-6 border-b border-border/50">
                  <h2 className="text-xl font-bold mb-2">{example.title}</h2>
                  <p className="text-muted-foreground">{example.description}</p>
                </div>

                <Tabs defaultValue="javascript" className="w-full">
                  <div className="px-4 pt-4 overflow-x-auto">
                    <TabsList className="w-full justify-start gap-2 bg-transparent">
                      <TabsTrigger value="javascript" className="data-[state=active]:bg-primary/20">
                        JavaScript
                      </TabsTrigger>
                      <TabsTrigger value="python" className="data-[state=active]:bg-primary/20">
                        Python
                      </TabsTrigger>
                      <TabsTrigger value="php" className="data-[state=active]:bg-primary/20">
                        PHP
                      </TabsTrigger>
                      <TabsTrigger value="curl" className="data-[state=active]:bg-primary/20">
                        cURL
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {Object.entries(example.languages).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang} className="p-4 pt-0 mt-0">
                      <div className="relative bg-secondary/50 rounded-xl p-4 overflow-x-auto">
                        <pre className="text-sm font-mono" dir="ltr">
                          <code>{code}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 left-2"
                          onClick={() => copyToClipboard(code, `${example.title}-${lang}`)}
                        >
                          {copiedCode === `${example.title}-${lang}` ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CodeExamples;
