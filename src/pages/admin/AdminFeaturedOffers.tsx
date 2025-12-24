import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Plus, Pencil, Trash2, Sparkles, Gift, Star, Zap, 
  Clock, Percent, Eye, EyeOff, GripVertical, ArrowUpDown,
  Link as LinkIcon, Package, Search
} from "lucide-react";
import { format } from "date-fns";

interface FeaturedOffer {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  discount_percentage: number | null;
  original_price: number | null;
  offer_price: number | null;
  image_url: string | null;
  badge_text: string | null;
  badge_text_ar: string | null;
  badge_color: string | null;
  category: string;
  service_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  service?: {
    id: string;
    name: string;
    price: number;
  } | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

const emptyOffer = {
  title: "",
  title_ar: "",
  description: "",
  description_ar: "",
  discount_percentage: 0,
  original_price: 0,
  offer_price: 0,
  image_url: "",
  badge_text: "",
  badge_text_ar: "",
  badge_color: "from-primary to-accent",
  category: "design",
  service_id: "",
  is_active: true,
  is_featured: false,
  display_order: 0,
  start_date: "",
  end_date: "",
};

const AdminFeaturedOffers = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<FeaturedOffer | null>(null);
  const [formData, setFormData] = useState(emptyOffer);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [serviceSearch, setServiceSearch] = useState("");

  // Fetch offers with linked services
  const { data: offers, isLoading } = useQuery({
    queryKey: ['admin-featured-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_offers')
        .select(`
          *,
          service:services(id, name, price)
        `)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as FeaturedOffer[];
    }
  });

  // Fetch services based on category
  const { data: services } = useQuery({
    queryKey: ['services-for-offers', formData.category],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('id, name, price, category')
        .eq('status', 'active')
        .order('name', { ascending: true });

      // Filter by category keywords
      if (formData.category === 'design') {
        query = query.or('category.ilike.%design%,category.ilike.%تصميم%,category.ilike.%creative%');
      } else if (formData.category === 'dev') {
        query = query.or('category.ilike.%dev%,category.ilike.%برمجة%,category.ilike.%web%,category.ilike.%mobile%,category.ilike.%تطبيق%');
      } else if (formData.category === 'smm') {
        query = query.or('category.ilike.%social%,category.ilike.%smm%,category.ilike.%instagram%,category.ilike.%facebook%,category.ilike.%tiktok%,category.ilike.%twitter%,category.ilike.%youtube%');
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: isDialogOpen
  });

  // Filter services based on search
  const filteredServices = services?.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  ) || [];

  // Auto-fill price from selected service
  useEffect(() => {
    if (formData.service_id && services) {
      const selectedService = services.find(s => s.id === formData.service_id);
      if (selectedService) {
        setFormData(prev => ({
          ...prev,
          original_price: selectedService.price,
          offer_price: prev.offer_price || selectedService.price
        }));
      }
    }
  }, [formData.service_id, services]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('featured_offers')
        .insert([{
          ...data,
          service_id: data.service_id || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-featured-offers'] });
      toast.success("تم إضافة العرض بنجاح");
      setIsDialogOpen(false);
      setFormData(emptyOffer);
      setServiceSearch("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة العرض");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('featured_offers')
        .update({
          ...data,
          service_id: data.service_id || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-featured-offers'] });
      toast.success("تم تحديث العرض بنجاح");
      setIsDialogOpen(false);
      setEditingOffer(null);
      setFormData(emptyOffer);
      setServiceSearch("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث العرض");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('featured_offers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-featured-offers'] });
      toast.success("تم حذف العرض بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف العرض");
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('featured_offers')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-featured-offers'] });
      toast.success("تم تحديث حالة العرض");
    }
  });

  const handleSubmit = () => {
    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (offer: FeaturedOffer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      title_ar: offer.title_ar,
      description: offer.description || "",
      description_ar: offer.description_ar || "",
      discount_percentage: offer.discount_percentage || 0,
      original_price: offer.original_price || 0,
      offer_price: offer.offer_price || 0,
      image_url: offer.image_url || "",
      badge_text: offer.badge_text || "",
      badge_text_ar: offer.badge_text_ar || "",
      badge_color: offer.badge_color || "from-primary to-accent",
      category: offer.category,
      service_id: offer.service_id || "",
      is_active: offer.is_active,
      is_featured: offer.is_featured,
      display_order: offer.display_order,
      start_date: offer.start_date ? offer.start_date.split('T')[0] : "",
      end_date: offer.end_date ? offer.end_date.split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  const filteredOffers = offers?.filter(o => 
    selectedCategory === "all" || o.category === selectedCategory
  );

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'design': return 'التصميم الإبداعي';
      case 'dev': return 'البرمجة والتطوير';
      case 'smm': return 'السوشيال ميديا';
      default: return cat;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'design': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'dev': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'smm': return 'bg-pink-500/10 text-pink-600 border-pink-200';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">العروض والخدمات المميزة</h1>
              <p className="text-muted-foreground">إدارة العروض الخاصة لكل قسم</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingOffer(null);
              setFormData(emptyOffer);
              setServiceSearch("");
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="h-4 w-4" />
                إضافة عرض جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>العنوان (English)</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Offer Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان (عربي)</Label>
                    <Input
                      value={formData.title_ar}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      placeholder="عنوان العرض"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الوصف (English)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف (عربي)</Label>
                    <Textarea
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      placeholder="وصف العرض"
                      dir="rtl"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>القسم</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => {
                        setFormData({ ...formData, category: v, service_id: "" });
                        setServiceSearch("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="design">التصميم الإبداعي</SelectItem>
                        <SelectItem value="dev">البرمجة والتطوير</SelectItem>
                        <SelectItem value="smm">السوشيال ميديا</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ترتيب العرض</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                </div>

                {/* Service Linking */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    ربط بخدمة (اختياري)
                  </Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ابحث عن خدمة..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="pr-10"
                        dir="rtl"
                      />
                    </div>
                    
                    {formData.service_id && (
                      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1 truncate">
                          {services?.find(s => s.id === formData.service_id)?.name || "خدمة محددة"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, service_id: "" })}
                          className="h-6 px-2 text-destructive hover:text-destructive"
                        >
                          إزالة
                        </Button>
                      </div>
                    )}

                    <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                      {filteredServices.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {serviceSearch ? "لا توجد نتائج" : "اختر قسماً لعرض الخدمات"}
                        </div>
                      ) : (
                        filteredServices.slice(0, 20).map((service) => (
                          <div
                            key={service.id}
                            onClick={() => setFormData({ ...formData, service_id: service.id })}
                            className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                              formData.service_id === service.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate flex-1">{service.name}</span>
                              <Badge variant="secondary" className="text-xs ml-2">
                                ${service.price}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>نسبة الخصم %</Label>
                    <Input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر الأصلي</Label>
                    <Input
                      type="number"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>سعر العرض</Label>
                    <Input
                      type="number"
                      value={formData.offer_price}
                      onChange={(e) => setFormData({ ...formData, offer_price: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                </div>

                {/* Badge */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نص الشارة (English)</Label>
                    <Input
                      value={formData.badge_text}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                      placeholder="Hot Deal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نص الشارة (عربي)</Label>
                    <Input
                      value={formData.badge_text_ar}
                      onChange={(e) => setFormData({ ...formData, badge_text_ar: e.target.value })}
                      placeholder="عرض حصري"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>لون الشارة</Label>
                  <Select value={formData.badge_color} onValueChange={(v) => setFormData({ ...formData, badge_color: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="from-primary to-accent">أزرق متدرج</SelectItem>
                      <SelectItem value="from-red-500 to-orange-500">أحمر برتقالي</SelectItem>
                      <SelectItem value="from-green-500 to-emerald-500">أخضر</SelectItem>
                      <SelectItem value="from-purple-500 to-pink-500">بنفسجي وردي</SelectItem>
                      <SelectItem value="from-amber-500 to-yellow-500">ذهبي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ البداية</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ النهاية</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>مفعّل</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label>عرض مميز</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  {editingOffer ? "تحديث" : "إضافة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {['all', 'design', 'dev', 'smm'].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? "bg-gradient-to-r from-primary to-accent" : ""}
            >
              {cat === 'all' ? 'الكل' : getCategoryLabel(cat)}
            </Button>
          ))}
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : filteredOffers?.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد عروض</h3>
                <p className="text-muted-foreground mb-4">قم بإضافة عرض جديد للبدء</p>
              </CardContent>
            </Card>
          ) : (
            filteredOffers?.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${!offer.is_active ? 'opacity-60' : ''}`}>
                  {offer.is_featured && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {offer.is_featured && (
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        )}
                        <CardTitle className="text-base line-clamp-1">{offer.title_ar}</CardTitle>
                      </div>
                      <Badge variant="outline" className={getCategoryColor(offer.category)}>
                        {getCategoryLabel(offer.category)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {offer.description_ar && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{offer.description_ar}</p>
                    )}

                    {/* Linked Service */}
                    {offer.service && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs">
                        <LinkIcon className="h-3 w-3 text-primary" />
                        <span className="truncate flex-1">{offer.service.name}</span>
                        <Badge variant="secondary" className="text-[10px]">${offer.service.price}</Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {offer.discount_percentage && offer.discount_percentage > 0 && (
                          <Badge className="bg-red-500/10 text-red-600 border-red-200">
                            <Percent className="h-3 w-3 mr-1" />
                            {offer.discount_percentage}%
                          </Badge>
                        )}
                        {offer.offer_price && (
                          <span className="font-bold text-primary">${offer.offer_price}</span>
                        )}
                        {offer.original_price && (
                          <span className="text-sm text-muted-foreground line-through">${offer.original_price}</span>
                        )}
                      </div>
                    </div>

                    {offer.end_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>ينتهي: {format(new Date(offer.end_date), 'yyyy-MM-dd')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <Switch
                        checked={offer.is_active}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: offer.id, is_active: checked })}
                      />
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(offer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
                              deleteMutation.mutate(offer.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminFeaturedOffers;
