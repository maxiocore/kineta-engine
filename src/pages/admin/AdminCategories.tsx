import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  MoreHorizontal,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  description_ar: string | null;
  display_order: number;
  is_active: boolean;
  parent_id: string | null;
  created_at: string;
}

const iconOptions = [
  { value: "Instagram", label: "Instagram", icon: Instagram },
  { value: "Facebook", label: "Facebook", icon: Facebook },
  { value: "Youtube", label: "Youtube", icon: Youtube },
  { value: "Twitter", label: "Twitter", icon: Twitter },
  { value: "Linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "Music2", label: "Music", icon: Music2 },
  { value: "Send", label: "Send", icon: Send },
  { value: "Globe", label: "Globe", icon: Globe },
  { value: "Layers", label: "Layers", icon: Layers },
  { value: "MoreHorizontal", label: "More", icon: MoreHorizontal },
];

const colorOptions = [
  { value: "from-pink-500 to-purple-500", label: "Pink → Purple" },
  { value: "from-blue-600 to-blue-500", label: "Blue" },
  { value: "from-red-600 to-red-500", label: "Red" },
  { value: "from-sky-500 to-sky-400", label: "Sky" },
  { value: "from-green-500 to-green-400", label: "Green" },
  { value: "from-slate-900 to-slate-700", label: "Slate" },
  { value: "from-blue-700 to-blue-600", label: "Dark Blue" },
  { value: "from-orange-500 to-orange-400", label: "Orange" },
  { value: "from-emerald-500 to-teal-500", label: "Emerald → Teal" },
  { value: "from-gray-500 to-gray-400", label: "Gray" },
  { value: "from-primary to-accent", label: "Primary → Accent" },
];

const iconMap: Record<string, React.ComponentType<any>> = {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  Layers,
  MoreHorizontal,
};

// Sortable Category Card Component
interface SortableCategoryCardProps {
  category: Category;
  serviceCount: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
}

const SortableCategoryCard = ({
  category,
  serviceCount,
  onEdit,
  onDelete,
  onToggleActive,
}: SortableCategoryCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const IconComponent = iconMap[category.icon] || Layers;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`group hover:shadow-lg transition-all ${
          !category.is_active && "opacity-60"
        } ${isDragging && "shadow-2xl ring-2 ring-primary scale-105"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Drag Handle */}
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-muted/50 touch-none"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </button>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">{category.name_ar}</h3>
                <p className="text-sm text-muted-foreground">{category.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(category)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {serviceCount} خدمة
              </Badge>
              <span className="text-muted-foreground">#{category.display_order}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {category.is_active ? "نشط" : "غير نشط"}
              </span>
              <Switch
                checked={category.is_active}
                onCheckedChange={(checked) => onToggleActive(category.id, checked)}
              />
            </div>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">/{category.slug}</div>
        </CardContent>
      </Card>
    </div>
  );
};

const categorySchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(50, "الاسم طويل جداً"),
  name_ar: z.string().min(1, "الاسم بالعربية مطلوب").max(50, "الاسم طويل جداً"),
  slug: z.string().min(1, "الرابط مطلوب").max(50, "الرابط طويل جداً").regex(/^[a-z0-9-]+$/, "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  icon: z.string().min(1, "الأيقونة مطلوبة"),
  color: z.string().min(1, "اللون مطلوب"),
  display_order: z.number().int().min(0),
});

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    slug: "",
    icon: "Layers",
    color: "from-primary to-accent",
    description: "",
    description_ar: "",
    display_order: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: serviceCounts } = useQuery({
    queryKey: ["category-service-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("category_id");

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((s) => {
        if (s.category_id) {
          counts[s.category_id] = (counts[s.category_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("categories").insert([{
        name: data.name,
        name_ar: data.name_ar,
        slug: data.slug,
        icon: data.icon,
        color: data.color,
        description: data.description || null,
        description_ar: data.description_ar || null,
        display_order: data.display_order,
        is_active: data.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("تم إضافة القسم بنجاح");
      handleCloseDialog();
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("الرابط مستخدم بالفعل");
      } else {
        toast.error("حدث خطأ أثناء الإضافة");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("categories")
        .update({
          name: data.name,
          name_ar: data.name_ar,
          slug: data.slug,
          icon: data.icon,
          color: data.color,
          description: data.description || null,
          description_ar: data.description_ar || null,
          display_order: data.display_order,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("تم تحديث القسم بنجاح");
      handleCloseDialog();
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("الرابط مستخدم بالفعل");
      } else {
        toast.error("حدث خطأ أثناء التحديث");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("تم حذف القسم بنجاح");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحذف");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("categories")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("تم تحديث الحالة بنجاح");
    },
  });

  // Reorder mutation for drag and drop
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      // Update all categories in a single transaction
      for (const update of updates) {
        const { error } = await supabase
          .from("categories")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("تم تحديث ترتيب الأقسام بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الترتيب");
    },
  });

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && categories) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);

      const newOrder = arrayMove(categories, oldIndex, newIndex);
      
      // Create updates array with new display_order values
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        display_order: index + 1,
      }));

      reorderMutation.mutate(updates);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        name_ar: category.name_ar,
        slug: category.slug,
        icon: category.icon,
        color: category.color,
        description: category.description || "",
        description_ar: category.description_ar || "",
        display_order: category.display_order,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        name_ar: "",
        slug: "",
        icon: "Layers",
        color: "from-primary to-accent",
        description: "",
        description_ar: "",
        display_order: (categories?.length || 0) + 1,
        is_active: true,
      });
    }
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormErrors({});
  };

  const handleSubmit = () => {
    try {
      categorySchema.parse({
        ...formData,
        display_order: Number(formData.display_order),
      });
      setFormErrors({});

      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((e) => {
          if (e.path[0]) {
            errors[e.path[0] as string] = e.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const filteredCategories = categories?.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.name_ar.includes(searchQuery) ||
      cat.slug.includes(searchQuery.toLowerCase())
  );

  const activeCount = categories?.filter((c) => c.is_active).length || 0;
  const totalServices = Object.values(serviceCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <AdminDashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
              إدارة الأقسام
            </h1>
            <p className="text-muted-foreground mt-1">
              إضافة وتعديل أقسام الخدمات
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة قسم
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{categories?.length || 0}</div>
              <div className="text-sm text-muted-foreground">إجمالي الأقسام</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{activeCount}</div>
              <div className="text-sm text-muted-foreground">أقسام نشطة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{(categories?.length || 0) - activeCount}</div>
              <div className="text-sm text-muted-foreground">أقسام غير نشطة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{totalServices}</div>
              <div className="text-sm text-muted-foreground">خدمات مرتبطة</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن قسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery ? (
          // When searching, show without drag and drop
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories?.map((category) => {
              const serviceCount = serviceCounts?.[category.id] || 0;
              return (
                <SortableCategoryCard
                  key={category.id}
                  category={category}
                  serviceCount={serviceCount}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                  onToggleActive={(id, is_active) =>
                    toggleActiveMutation.mutate({ id, is_active })
                  }
                />
              );
            })}
          </div>
        ) : (
          // With drag and drop when not searching
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories?.map((c) => c.id) || []}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories?.map((category) => {
                  const serviceCount = serviceCounts?.[category.id] || 0;
                  return (
                    <SortableCategoryCard
                      key={category.id}
                      category={category}
                      serviceCount={serviceCount}
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                      onToggleActive={(id, is_active) =>
                        toggleActiveMutation.mutate({ id, is_active })
                      }
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Drag hint */}
        {!isLoading && !searchQuery && categories && categories.length > 1 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <ArrowUpDown className="w-4 h-4" />
            <span>اسحب وأفلت لإعادة ترتيب الأقسام</span>
          </div>
        )}

        {filteredCategories?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Layers className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد أقسام</h3>
            <p className="text-muted-foreground">ابدأ بإضافة قسم جديد</p>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "تعديل القسم" : "إضافة قسم جديد"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "قم بتعديل بيانات القسم"
                  : "أضف قسم جديد لتصنيف الخدمات"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم (English)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: formData.slug || generateSlug(e.target.value),
                      });
                    }}
                    placeholder="Instagram"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="انستقرام"
                  />
                  {formErrors.name_ar && (
                    <p className="text-xs text-destructive">{formErrors.name_ar}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>الرابط (Slug)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="instagram"
                  dir="ltr"
                />
                {formErrors.slug && (
                  <p className="text-xs text-destructive">{formErrors.slug}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الأيقونة</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>اللون</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded bg-gradient-to-r ${opt.value}`} />
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>نشط</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground mb-2 block">معاينة</Label>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${formData.color} flex items-center justify-center`}>
                    {(() => {
                      const Icon = iconMap[formData.icon] || Layers;
                      return <Icon className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium">{formData.name_ar || "الاسم بالعربي"}</p>
                    <p className="text-sm text-muted-foreground">{formData.name || "Name"}</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "جاري الحفظ..."
                  : editingCategory
                  ? "تحديث"
                  : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="حذف القسم"
          description={`هل أنت متأكد من حذف القسم "${categoryToDelete?.name_ar}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          onConfirm={() => categoryToDelete && deleteMutation.mutate(categoryToDelete.id)}
          loading={deleteMutation.isPending}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCategories;