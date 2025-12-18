import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, X, Image as ImageIcon, Sparkles, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface Category {
  id: string;
  name: string;
  name_ar: string;
}

interface ServiceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingService: Service | null;
  onSubmit: (data: {
    name: string;
    description: string;
    category: string;
    price: string;
    status: string;
    features: string[];
    image_url: string;
  }) => Promise<void>;
  categories?: string[];
  statusOptions: { value: string; label: string }[];
}

const ServiceFormDialog = ({
  isOpen,
  onClose,
  editingService,
  onSubmit,
  statusOptions,
}: ServiceFormDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    status: "active",
    features: [] as string[],
    image_url: "",
  });

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, name_ar")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (!error && data) {
        setDbCategories(data);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        description: editingService.description || "",
        category: editingService.category,
        price: editingService.price.toString(),
        status: editingService.status,
        features: editingService.features || [],
        image_url: editingService.image_url || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        status: "active",
        features: [],
        image_url: "",
      });
    }
  }, [editingService, isOpen]);

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="basic">الأساسية</TabsTrigger>
            <TabsTrigger value="features">المميزات</TabsTrigger>
            <TabsTrigger value="media">الوسائط</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>اسم الخدمة</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: تصميم هوية بصرية"
                className="bg-secondary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 sticky top-0 bg-popover border-b">
                      <div className="relative">
                        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ابحث عن تصنيف..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="pr-8 h-8 text-sm"
                        />
                      </div>
                    </div>
                    <ScrollArea className="max-h-[200px]">
                      {dbCategories
                        .filter(cat => 
                          cat.name_ar.toLowerCase().includes(categorySearch.toLowerCase()) ||
                          cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                        )
                        .map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name_ar} ({cat.name})</SelectItem>
                        ))
                      }
                      {dbCategories.filter(cat => 
                        cat.name_ar.toLowerCase().includes(categorySearch.toLowerCase()) ||
                        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          لا توجد نتائج
                        </div>
                      )}
                    </ScrollArea>
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
                  className="bg-secondary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-secondary/50">
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
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للخدمة..."
                className="bg-secondary/50 min-h-24"
              />
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>مميزات الخدمة</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="أضف ميزة جديدة..."
                  className="bg-secondary/50"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                />
                <Button type="button" onClick={handleAddFeature} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <motion.div
                    key={`${feature}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                  >
                    <Badge variant="outline" className="flex-1 justify-start py-1.5">
                      {feature}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {formData.features.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لم تتم إضافة أي مميزات بعد
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>رابط صورة الخدمة</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="bg-secondary/50"
              />
            </div>

            {formData.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-video rounded-lg overflow-hidden bg-secondary/50"
              >
                <img
                  src={formData.image_url}
                  alt="معاينة"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </motion.div>
            )}

            {!formData.image_url && (
              <div className="aspect-video rounded-lg bg-secondary/50 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">أضف رابط صورة للمعاينة</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-gradient-primary">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editingService ? (
              "حفظ التغييرات"
            ) : (
              "إضافة الخدمة"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFormDialog;
