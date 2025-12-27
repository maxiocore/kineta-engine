import { useState, useMemo } from "react";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Layers, Plus, Pencil, Trash2, GripVertical,
  Instagram, Facebook, Youtube, Twitter, Linkedin, Music2, Send, Globe,
  Search, ChevronDown, ChevronRight, FolderTree, Camera,
  ArrowUpDown, Package, RefreshCw, Languages, Settings2,
  Headphones, Twitch, Hash, MessageSquare, Eye, EyeOff,
  Shield, Check, X, AlertCircle, TrendingUp, Zap, Users,
  Activity, BarChart3, Target, Sparkles, Crown, Heart, Star
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface ServiceSummary {
  total: number;
  active: number;
  inactive: number;
  avgPrice: number;
}

const socialMediaIcons = [
  { value: "Instagram", label: "انستقرام", icon: Instagram, color: "from-pink-500 to-purple-500", bg: "bg-gradient-to-br from-pink-500 to-purple-500" },
  { value: "Facebook", label: "فيسبوك", icon: Facebook, color: "from-blue-600 to-blue-500", bg: "bg-gradient-to-br from-blue-600 to-blue-500" },
  { value: "Youtube", label: "يوتيوب", icon: Youtube, color: "from-red-600 to-red-500", bg: "bg-gradient-to-br from-red-600 to-red-500" },
  { value: "Twitter", label: "تويتر / X", icon: Twitter, color: "from-sky-500 to-sky-400", bg: "bg-gradient-to-br from-sky-500 to-sky-400" },
  { value: "Music2", label: "تيك توك", icon: Music2, color: "from-slate-900 to-slate-700", bg: "bg-gradient-to-br from-slate-900 to-slate-700" },
  { value: "Send", label: "تيليجرام", icon: Send, color: "from-blue-500 to-cyan-400", bg: "bg-gradient-to-br from-blue-500 to-cyan-400" },
  { value: "Camera", label: "سناب شات", icon: Camera, color: "from-yellow-400 to-yellow-500", bg: "bg-gradient-to-br from-yellow-400 to-yellow-500" },
  { value: "Linkedin", label: "لينكد إن", icon: Linkedin, color: "from-blue-700 to-blue-600", bg: "bg-gradient-to-br from-blue-700 to-blue-600" },
  { value: "Headphones", label: "سبوتيفاي", icon: Headphones, color: "from-green-500 to-green-400", bg: "bg-gradient-to-br from-green-500 to-green-400" },
  { value: "Twitch", label: "تويتش", icon: Twitch, color: "from-purple-600 to-purple-500", bg: "bg-gradient-to-br from-purple-600 to-purple-500" },
  { value: "Hash", label: "ثريدز", icon: Hash, color: "from-gray-800 to-gray-600", bg: "bg-gradient-to-br from-gray-800 to-gray-600" },
  { value: "MessageSquare", label: "واتساب", icon: MessageSquare, color: "from-green-500 to-green-600", bg: "bg-gradient-to-br from-green-500 to-green-600" },
  { value: "Globe", label: "زيارات مواقع", icon: Globe, color: "from-emerald-500 to-teal-500", bg: "bg-gradient-to-br from-emerald-500 to-teal-500" },
  { value: "Layers", label: "أخرى", icon: Layers, color: "from-primary to-accent", bg: "bg-gradient-to-br from-primary to-accent" },
];

const iconMap: Record<string, React.ComponentType<any>> = {
  Instagram, Facebook, Youtube, Twitter, Linkedin, Music2, Send, Globe,
  Camera, Headphones, Twitch, Hash, MessageSquare, Layers, FolderTree,
  Heart, Star, Crown, Sparkles, Target, Activity, BarChart3
};

// Sortable Category Card Component - Modern Design
const SortableCategoryCard = ({
  category,
  serviceCount,
  subCategories,
  onEdit,
  onDelete,
  onToggleActive,
  isExpanded,
  onToggleExpand,
}: {
  category: Category;
  serviceCount: number;
  subCategories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onToggleActive: (id: string, active: boolean) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const IconComponent = iconMap[category.icon] || Layers;
  const iconConfig = socialMediaIcons.find(i => i.value === category.icon);
  const gradientColor = iconConfig?.color || category.color || "from-primary to-accent";

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isExpanded}>
        <motion.div
          layout
          className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
            !category.is_active 
              ? "opacity-60 border-muted bg-muted/20" 
              : "border-border/50 bg-card hover:border-primary/40 hover:shadow-lg"
          } ${isDragging ? "shadow-2xl ring-2 ring-primary scale-[1.02]" : ""}`}
        >
          {/* Gradient Background Decoration */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradientColor} opacity-5 blur-2xl pointer-events-none`} />
          
          <CardContent className="p-0">
            {/* Main Row */}
            <div className="flex items-center gap-3 p-4 md:p-5">
              {/* Drag Handle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      {...attributes}
                      {...listeners}
                      className="cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-muted/50 transition-colors touch-none shrink-0"
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground/50" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>اسحب لإعادة الترتيب</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Icon */}
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg shrink-0`}
              >
                <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-lg md:text-xl">{category.name_ar}</h3>
                  <Badge variant="outline" className="text-xs font-mono">
                    {category.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {serviceCount} خدمة
                  </span>
                  {subCategories.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FolderTree className="w-3.5 h-3.5" />
                      {subCategories.length} فرعي
                    </span>
                  )}
                  <span className="hidden md:flex items-center gap-1 font-mono text-xs">
                    /{category.slug}
                  </span>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                {/* Status Badge */}
                <Badge 
                  variant={category.is_active ? "default" : "secondary"} 
                  className={`gap-1 hidden sm:flex ${category.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}
                >
                  {category.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {category.is_active ? "نشط" : "معطل"}
                </Badge>

                {/* Toggle Switch */}
                <Switch
                  checked={category.is_active}
                  onCheckedChange={(checked) => onToggleActive(category.id, checked)}
                  className="shrink-0"
                />

                {/* Edit Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-9 w-9 rounded-xl">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>تعديل</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Delete Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" 
                        onClick={() => onDelete(category)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>حذف</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Expand Button */}
                {subCategories.length > 0 && (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onToggleExpand} className="h-9 w-9 rounded-xl">
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>
            </div>

            {/* Sub-categories */}
            <CollapsibleContent>
              {subCategories.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-border/50 bg-muted/30 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <FolderTree className="w-4 h-4" />
                    <span>الأقسام الفرعية ({subCategories.length})</span>
                  </div>
                  {subCategories.map((sub, index) => {
                    const SubIcon = iconMap[sub.icon] || Layers;
                    const subIconConfig = socialMediaIcons.find(i => i.value === sub.icon);
                    return (
                      <motion.div 
                        key={sub.id} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50 hover:border-primary/30 transition-all"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${subIconConfig?.color || "from-muted to-muted-foreground/20"} flex items-center justify-center`}>
                          <SubIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{sub.name_ar}</span>
                          <span className="text-xs text-muted-foreground mr-2">({sub.name})</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${sub.is_active ? "border-emerald-500/30 text-emerald-600" : ""}`}
                        >
                          {sub.is_active ? "نشط" : "معطل"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onEdit(sub)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" 
                          onClick={() => onDelete(sub)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </CollapsibleContent>
          </CardContent>
        </motion.div>
      </Collapsible>
    </div>
  );
};

const AdminSocialCategories = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "", name_ar: "", slug: "", icon: "Instagram",
    color: "from-pink-500 to-purple-500", description: "",
    description_ar: "", display_order: 0, is_active: true, parent_id: null as string | null,
  });

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-social-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch service counts per category
  const { data: serviceCounts } = useQuery({
    queryKey: ["category-service-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("category_id, status");
      if (error) throw error;
      
      const counts: Record<string, ServiceSummary> = {};
      data?.forEach((s) => {
        if (s.category_id) {
          if (!counts[s.category_id]) {
            counts[s.category_id] = { total: 0, active: 0, inactive: 0, avgPrice: 0 };
          }
          counts[s.category_id].total++;
          if (s.status === 'active') counts[s.category_id].active++;
          else counts[s.category_id].inactive++;
        }
      });
      return counts;
    },
  });

  // Sync services mutation
  const handleSyncServices = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-services-advanced', {
        body: { 
          update_prices: true, 
          update_descriptions: true,
          translate_names: true,
          delete_removed: false 
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(data.message || 'تم تحديث الخدمات بنجاح');
        queryClient.invalidateQueries({ queryKey: ["category-service-counts"] });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('خطأ في مزامنة الخدمات');
    } finally {
      setIsSyncing(false);
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const iconConfig = socialMediaIcons.find(i => i.value === data.icon);
      const { error } = await supabase.from("categories").insert([{
        ...data,
        color: iconConfig?.color || data.color,
        description: data.description || null,
        description_ar: data.description_ar || null,
        parent_id: data.parent_id || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social-categories"] });
      toast.success("تم إضافة القسم بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message?.includes("duplicate") ? "الرابط مستخدم بالفعل" : "حدث خطأ أثناء الإضافة");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const iconConfig = socialMediaIcons.find(i => i.value === data.icon);
      const { error } = await supabase
        .from("categories")
        .update({
          ...data,
          color: iconConfig?.color || data.color,
          description: data.description || null,
          description_ar: data.description_ar || null,
          parent_id: data.parent_id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social-categories"] });
      toast.success("تم تحديث القسم بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social-categories"] });
      toast.success("تم حذف القسم بنجاح");
      setDeleteDialogOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["admin-social-categories"] });
      toast.success("تم تحديث الحالة");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      for (const update of updates) {
        await supabase
          .from("categories")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social-categories"] });
      toast.success("تم تحديث الترتيب");
    },
  });

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && categories) {
      const parentCategories = categories.filter(c => !c.parent_id);
      const oldIndex = parentCategories.findIndex((cat) => cat.id === active.id);
      const newIndex = parentCategories.findIndex((cat) => cat.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(parentCategories, oldIndex, newIndex);
        const updates = newOrder.map((cat, index) => ({ id: cat.id, display_order: index + 1 }));
        reorderMutation.mutate(updates);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", name_ar: "", slug: "", icon: "Instagram",
      color: "from-pink-500 to-purple-500", description: "",
      description_ar: "", display_order: (categories?.filter(c => !c.parent_id).length || 0) + 1,
      is_active: true, parent_id: null,
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name, name_ar: category.name_ar, slug: category.slug,
        icon: category.icon, color: category.color, description: category.description || "",
        description_ar: category.description_ar || "", display_order: category.display_order,
        is_active: category.is_active, parent_id: category.parent_id,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.name_ar || !formData.slug) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  // Computed values
  const parentCategories = useMemo(() => 
    categories?.filter(c => !c.parent_id).sort((a, b) => a.display_order - b.display_order) || [], 
    [categories]
  );

  const getSubCategories = (parentId: string) =>
    categories?.filter(c => c.parent_id === parentId) || [];

  const filteredCategories = useMemo(() =>
    parentCategories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.name_ar.includes(searchQuery) ||
      cat.slug.includes(searchQuery.toLowerCase())
    ), [parentCategories, searchQuery]
  );

  const stats = useMemo(() => ({
    total: categories?.length || 0,
    parents: parentCategories.length,
    subs: (categories?.length || 0) - parentCategories.length,
    active: categories?.filter(c => c.is_active).length || 0,
    totalServices: Object.values(serviceCounts || {}).reduce((sum, s) => sum + s.total, 0),
  }), [categories, parentCategories, serviceCounts]);

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-accent/5 to-transparent p-5 md:p-6 border border-border/50"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-xl shadow-primary/25"
              >
                <Layers className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">أقسام خدمات التواصل الاجتماعي</h1>
                <p className="text-muted-foreground text-sm mt-1">إدارة أقسام وتصنيفات خدمات السوشيال ميديا</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={handleSyncServices} 
                disabled={isSyncing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                مزامنة الخدمات
              </Button>
              <Button onClick={() => handleOpenDialog()} className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                قسم جديد
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4"
        >
          {[
            { label: "إجمالي الأقسام", value: stats.total, icon: Layers, color: "text-primary", bg: "bg-primary/10" },
            { label: "أقسام رئيسية", value: stats.parents, icon: FolderTree, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "أقسام فرعية", value: stats.subs, icon: ChevronRight, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "أقسام نشطة", value: stats.active, icon: Check, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "خدمات مرتبطة", value: stats.totalServices, icon: Package, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all duration-200 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-md"
        >
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن قسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 rounded-xl"
          />
        </motion.div>

        {/* Categories List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-5 flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={parentCategories.map(c => c.id)} strategy={rectSortingStrategy}>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredCategories.map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <SortableCategoryCard
                          category={category}
                          serviceCount={serviceCounts?.[category.id]?.total || 0}
                          subCategories={getSubCategories(category.id)}
                          onEdit={handleOpenDialog}
                          onDelete={(cat) => { setCategoryToDelete(cat); setDeleteDialogOpen(true); }}
                          onToggleActive={(id, active) => toggleActiveMutation.mutate({ id, is_active: active })}
                          isExpanded={expandedCategories.has(category.id)}
                          onToggleExpand={() => toggleExpand(category.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}

          {filteredCategories.length === 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 rounded-2xl border-2 border-dashed border-border/50"
            >
              <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Layers className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد أقسام</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">ابدأ بإضافة قسم جديد لخدمات التواصل الاجتماعي لتنظيم خدماتك</p>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة قسم
              </Button>
            </motion.div>
          )}

          {!isLoading && parentCategories.length > 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>اسحب وأفلت لإعادة ترتيب الأقسام</span>
            </motion.div>
          )}
        </motion.div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingCategory ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingCategory ? "تعديل القسم" : "إضافة قسم جديد"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? "تعديل بيانات القسم الحالي" : "إضافة قسم جديد لخدمات التواصل الاجتماعي"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Icon Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">المنصة / الأيقونة *</Label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {socialMediaIcons.map((icon) => {
                    const IconComp = icon.icon;
                    return (
                      <motion.button
                        key={icon.value}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.value, color: icon.color }))}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                          formData.icon === icon.value
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border/50 hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${icon.color} flex items-center justify-center`}>
                          <IconComp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate w-full text-center">{icon.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم بالعربية *</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="مثال: انستقرام"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        name,
                        slug: prev.slug || generateSlug(name)
                      }));
                    }}
                    placeholder="e.g. Instagram"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label>الرابط المختصر *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="instagram"
                  className="font-mono text-sm rounded-xl"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">سيظهر كـ: /services/{formData.slug || "..."}</p>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الوصف بالعربية</Label>
                  <Textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                    placeholder="وصف مختصر للقسم..."
                    className="rounded-xl resize-none"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف بالإنجليزية</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description..."
                    className="rounded-xl resize-none"
                    rows={2}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Parent Category */}
              <div className="space-y-2">
                <Label>القسم الأب (اختياري)</Label>
                <Select
                  value={formData.parent_id || "none"}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, parent_id: val === "none" ? null : val }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="اختر القسم الأب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون (قسم رئيسي)</SelectItem>
                    {parentCategories
                      .filter(c => c.id !== editingCategory?.id)
                      .map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name_ar}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
                <div>
                  <Label className="font-medium">حالة القسم</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">القسم النشط يظهر للعملاء</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl">
                {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
                {editingCategory ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="حذف القسم"
          description={`هل أنت متأكد من حذف قسم "${categoryToDelete?.name_ar}"؟ سيتم إلغاء ربط جميع الخدمات المرتبطة به.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          onConfirm={() => categoryToDelete && deleteMutation.mutate(categoryToDelete.id)}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSocialCategories;
