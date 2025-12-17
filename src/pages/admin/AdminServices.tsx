import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Search, Filter, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  status: string;
  features: string[];
  image_url: string | null;
}

const serviceSchema = z.object({
  name: z.string().min(3, "اسم الخدمة مطلوب (3 أحرف على الأقل)"),
  category: z.string().min(1, "التصنيف مطلوب"),
  price: z.number().min(0, "السعر يجب أن يكون رقماً موجباً"),
  description: z.string().optional(),
});

const categories = ["التصميم", "التسويق", "الإعلانات", "التطوير", "الاستشارات"];
const statusOptions = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "archived", label: "مؤرشف" },
];

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    status: "active",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب الخدمات");
    } else {
      setServices(data as Service[]);
    }
    setLoading(false);
  };

  const openNewDialog = () => {
    setEditingService(null);
    setFormData({ name: "", description: "", category: "", price: "", status: "active" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category,
      price: service.price.toString(),
      status: service.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const validation = serviceSchema.safeParse({
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      description: formData.description,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    const serviceData = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      price: parseFloat(formData.price),
      status: formData.status as "active" | "inactive" | "archived",
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingService.id);

      if (error) {
        toast.error("خطأ في تحديث الخدمة");
      } else {
        toast.success("تم تحديث الخدمة بنجاح");
        setIsDialogOpen(false);
        fetchServices();
      }
    } else {
      const { error } = await supabase.from("services").insert(serviceData);

      if (error) {
        toast.error("خطأ في إضافة الخدمة");
      } else {
        toast.success("تم إضافة الخدمة بنجاح");
        setIsDialogOpen(false);
        fetchServices();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast.error("خطأ في حذف الخدمة. قد تكون مرتبطة بطلبات.");
    } else {
      toast.success("تم حذف الخدمة بنجاح");
      fetchServices();
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="default">نشط</Badge>;
      case "inactive": return <Badge variant="secondary">غير نشط</Badge>;
      case "archived": return <Badge variant="outline">مؤرشف</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold mb-2"
            >
              إدارة الخدمات
            </motion.h1>
            <p className="text-muted-foreground">إضافة وتعديل الخدمات المقدمة</p>
          </div>
          <Button onClick={openNewDialog} className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground">
            <Plus className="w-4 h-4 ms-2" />
            إضافة خدمة
          </Button>
        </div>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="البحث في الخدمات..." 
                  className="pr-10 bg-secondary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                تصفية
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              لا توجد خدمات. ابدأ بإضافة خدمة جديدة.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass border-border/50 hover:border-primary/30 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-400 p-3">
                        <Package className="w-full h-full text-primary-foreground" />
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{service.category}</p>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-primary">{service.price.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(service)}>
                        <Edit className="w-4 h-4 ms-1" />
                        تعديل
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اسم الخدمة</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: تصميم هوية بصرية"
                />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السعر (ر.س)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الوصف (اختياري)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للخدمة..."
                />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-primary">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingService ? "حفظ التغييرات" : "إضافة الخدمة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminServices;
