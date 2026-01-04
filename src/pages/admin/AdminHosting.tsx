import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Server, 
  Globe, 
  Shield, 
  Cpu, 
  HardDrive,
  Cloud,
  Zap,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { cn } from "@/lib/utils";

// Static hosting packages data
const hostingPackages = [
  {
    id: "1",
    name: "استضافة أساسية",
    name_en: "Basic Hosting",
    type: "shared",
    price: 99,
    features: ["10GB SSD", "1 موقع", "SSL مجاني", "نسخ احتياطي أسبوعي"],
    is_active: true,
    orders_count: 45,
  },
  {
    id: "2",
    name: "استضافة متقدمة",
    name_en: "Pro Hosting",
    type: "shared",
    price: 199,
    features: ["50GB SSD", "5 مواقع", "SSL مجاني", "نسخ احتياطي يومي", "CDN"],
    is_active: true,
    orders_count: 32,
  },
  {
    id: "3",
    name: "استضافة احترافية",
    name_en: "Business Hosting",
    type: "shared",
    price: 399,
    features: ["100GB SSD", "مواقع غير محدودة", "SSL مجاني", "نسخ احتياطي فوري", "CDN", "دعم أولوية"],
    is_active: true,
    orders_count: 18,
  },
];

const vpsPackages = [
  {
    id: "v1",
    name: "VPS Start",
    type: "vps",
    specs: { cpu: "2 vCPU", ram: "4GB", storage: "80GB SSD" },
    price: 299,
    is_active: true,
    orders_count: 12,
  },
  {
    id: "v2",
    name: "VPS Pro",
    type: "vps",
    specs: { cpu: "4 vCPU", ram: "8GB", storage: "160GB SSD" },
    price: 599,
    is_active: true,
    orders_count: 8,
  },
  {
    id: "v3",
    name: "VPS Business",
    type: "vps",
    specs: { cpu: "8 vCPU", ram: "16GB", storage: "320GB SSD" },
    price: 999,
    is_active: true,
    orders_count: 5,
  },
];

const recentDomainSearches = [
  { domain: "example.sa", user: "أحمد محمد", date: "2024-01-15", available: true },
  { domain: "mystore.com", user: "سارة علي", date: "2024-01-14", available: false },
  { domain: "tech-solutions.net", user: "خالد عمر", date: "2024-01-14", available: true },
];

const stats = [
  { 
    title: "باقات الإستضافة", 
    value: hostingPackages.length + vpsPackages.length, 
    icon: Server, 
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10"
  },
  { 
    title: "طلبات الإستضافة", 
    value: hostingPackages.reduce((sum, p) => sum + p.orders_count, 0) + vpsPackages.reduce((sum, p) => sum + p.orders_count, 0), 
    icon: Package, 
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-500/10"
  },
  { 
    title: "عمليات البحث", 
    value: recentDomainSearches.length, 
    icon: Globe, 
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/10"
  },
  { 
    title: "سيرفرات VPS", 
    value: vpsPackages.reduce((sum, p) => sum + p.orders_count, 0), 
    icon: Cpu, 
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10"
  },
];

const AdminHosting = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("packages");

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Server className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">الدومين والإستضافة</h1>
              <p className="text-muted-foreground">إدارة باقات الإستضافة والدومينات</p>
            </div>
          </div>

          <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <Plus className="w-4 h-4" />
            إضافة باقة جديدة
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn("border-border/50", stat.bgColor)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", stat.color)}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="packages" className="gap-2">
              <Server className="w-4 h-4" />
              باقات الإستضافة
            </TabsTrigger>
            <TabsTrigger value="vps" className="gap-2">
              <Cpu className="w-4 h-4" />
              سيرفرات VPS
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-2">
              <Globe className="w-4 h-4" />
              عمليات البحث
            </TabsTrigger>
          </TabsList>

          {/* Hosting Packages */}
          <TabsContent value="packages">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">باقات الإستضافة المشتركة</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث..."
                      className="pr-9 w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الباقة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المميزات</TableHead>
                      <TableHead>الطلبات</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostingPackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">{pkg.name_en}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-primary">{pkg.price} ر.س</span>
                          <span className="text-xs text-muted-foreground">/شهرياً</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {pkg.features.slice(0, 3).map((feature, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {pkg.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{pkg.features.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pkg.orders_count} طلب</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={pkg.is_active ? "bg-success" : "bg-destructive"}>
                            {pkg.is_active ? "نشط" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VPS Packages */}
          <TabsContent value="vps">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">سيرفرات VPS</CardTitle>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة سيرفر
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {vpsPackages.map((vps) => (
                    <motion.div
                      key={vps.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-xl border border-border bg-card/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold">{vps.name}</h3>
                            <Badge variant={vps.is_active ? "default" : "secondary"}>
                              {vps.is_active ? "متاح" : "غير متاح"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Cpu className="w-4 h-4 text-muted-foreground" />
                          <span>{vps.specs.cpu}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <HardDrive className="w-4 h-4 text-muted-foreground" />
                          <span>{vps.specs.ram} RAM</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Cloud className="w-4 h-4 text-muted-foreground" />
                          <span>{vps.specs.storage}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-primary">{vps.price}</span>
                          <span className="text-sm text-muted-foreground"> ر.س/شهرياً</span>
                        </div>
                        <Badge variant="outline">{vps.orders_count} طلب</Badge>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1 gap-2">
                          <Edit className="w-4 h-4" />
                          تعديل
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain Searches */}
          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">آخر عمليات البحث عن الدومينات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الدومين</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDomainSearches.map((search, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono">{search.domain}</span>
                          </div>
                        </TableCell>
                        <TableCell>{search.user}</TableCell>
                        <TableCell>{search.date}</TableCell>
                        <TableCell>
                          <Badge className={search.available ? "bg-success" : "bg-destructive"}>
                            {search.available ? "متاح" : "غير متاح"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminHosting;
