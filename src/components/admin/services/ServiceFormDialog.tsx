import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Plus, 
  X, 
  Image as ImageIcon, 
  Sparkles, 
  Search,
  Settings,
  Palette,
  FileText,
  Tag,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Clock,
  Shield,
  RefreshCw,
  BarChart3,
  Users,
  Star,
  Hash,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Wand2
} from "lucide-react";
import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Dynamic icon component
interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const iconName = name.toLowerCase().replace(/\s+/g, '-') as keyof typeof dynamicIconImports;
  
  if (!dynamicIconImports[iconName]) {
    return <div className="w-4 h-4 rounded bg-muted" />;
  }
  
  const LucideIcon = lazy(dynamicIconImports[iconName]);
  
  return (
    <Suspense fallback={<div className="w-4 h-4 rounded bg-muted animate-pulse" />}>
      <LucideIcon {...props} />
    </Suspense>
  );
};

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
  icon: string | null;
  color: string | null;
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

// Step indicator component
const StepIndicator = ({ 
  icon: Icon, 
  title, 
  isActive, 
  isCompleted,
  onClick 
}: { 
  icon: React.ElementType; 
  title: string; 
  isActive: boolean; 
  isCompleted: boolean;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
      isActive 
        ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30" 
        : isCompleted
          ? "bg-success/10 text-success border border-success/30"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
    )}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {isCompleted ? (
      <CheckCircle2 className="w-4 h-4" />
    ) : (
      <Icon className="w-4 h-4" />
    )}
    <span className="text-sm font-medium">{title}</span>
  </motion.button>
);

// Input field with RTL support
const RTLInput = ({ 
  label, 
  icon: Icon, 
  required, 
  hint,
  error,
  ...props 
}: { 
  label: string; 
  icon?: React.ElementType; 
  required?: boolean;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-2 text-right" dir="rtl">
    <Label className="flex items-center gap-2 justify-end text-sm font-medium">
      {required && <span className="text-destructive">*</span>}
      <span>{label}</span>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
    </Label>
    <Input
      {...props}
      className={cn(
        "bg-secondary/50 text-right transition-all duration-300",
        "focus:ring-2 focus:ring-primary/20 focus:border-primary",
        error && "border-destructive focus:ring-destructive/20",
        props.className
      )}
      dir={props.type === "number" || props.type === "url" ? "ltr" : "rtl"}
    />
    {hint && !error && (
      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
        <span>{hint}</span>
        <Info className="w-3 h-3" />
      </p>
    )}
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1 justify-end">
        <span>{error}</span>
        <AlertCircle className="w-3 h-3" />
      </p>
    )}
  </div>
);

// Feature badge with animation
const FeatureBadge = ({ 
  feature, 
  index, 
  onRemove 
}: { 
  feature: string; 
  index: number; 
  onRemove: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, x: -20 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.8, x: 20 }}
    transition={{ delay: index * 0.05 }}
    className="group flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-secondary/60 to-muted/40 border border-border/50 hover:border-primary/30 transition-all duration-300"
    dir="rtl"
  >
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={onRemove}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
    <div className="flex-1 flex items-center gap-2 justify-end">
      <span className="text-sm font-medium">{feature}</span>
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Star className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
  </motion.div>
);

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    active: { color: "bg-success/10 text-success border-success/30", icon: CheckCircle2, label: "نشط" },
    inactive: { color: "bg-muted text-muted-foreground border-border", icon: EyeOff, label: "غير نشط" },
    archived: { color: "bg-destructive/10 text-destructive border-destructive/30", icon: Trash2, label: "مؤرشف" },
  };
  const config = configs[status] || configs.active;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn("gap-1.5 px-3 py-1.5", config.color)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};

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
  const [activeTab, setActiveTab] = useState("basic");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewImage, setPreviewImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    status: "active",
    features: [] as string[],
    image_url: "",
  });

  const [advancedSettings, setAdvancedSettings] = useState({
    minQuantity: 10,
    maxQuantity: 100000,
    deliverySpeed: "normal" as "slow" | "normal" | "fast" | "instant",
    hasRefill: false,
    refillDays: 30,
    priority: 0,
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "اسم الخدمة مطلوب";
    }
    if (!formData.category) {
      newErrors.category = "يرجى اختيار التصنيف";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "يرجى إدخال سعر صحيح";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, name_ar, icon, color")
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
    setErrors({});
    setActiveTab("basic");
  }, [editingService, isOpen]);

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      if (formData.features.includes(newFeature.trim())) {
        toast.error("هذه الميزة موجودة بالفعل");
        return;
      }
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
      toast.success("تمت إضافة الميزة");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
    toast.success("تم حذف الميزة");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success(editingService ? "تم تحديث الخدمة بنجاح" : "تمت إضافة الخدمة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الخدمة");
    } finally {
      setSubmitting(false);
    }
  };

  const isBasicComplete = formData.name && formData.category && formData.price;
  const isFeaturesComplete = formData.features.length > 0;
  const isMediaComplete = !!formData.image_url;

  const quickFeatures = [
    "توصيل سريع ⚡",
    "ضمان 30 يوم 🛡️",
    "دعم فني 24/7 💬",
    "جودة عالية ⭐",
    "بدون كلمة مرور 🔒",
    "تفاعل حقيقي 👥",
    "تعويض النقص 🔄",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[95vh] overflow-hidden p-0 gap-0 rounded-2xl border border-border/50 bg-background/98 backdrop-blur-xl"
        dir="rtl"
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-border/50 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <motion.button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-all duration-300"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
            
            <DialogHeader className="p-0 m-0 space-y-0">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <span>{editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</span>
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </motion.div>
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-2">
            <StepIndicator 
              icon={FileText} 
              title="الأساسية" 
              isActive={activeTab === "basic"} 
              isCompleted={isBasicComplete && activeTab !== "basic"}
              onClick={() => setActiveTab("basic")}
            />
            <div className="w-8 h-px bg-gradient-to-l from-border to-transparent" />
            <StepIndicator 
              icon={Star} 
              title="المميزات" 
              isActive={activeTab === "features"} 
              isCompleted={isFeaturesComplete && activeTab !== "features"}
              onClick={() => setActiveTab("features")}
            />
            <div className="w-8 h-px bg-gradient-to-l from-border to-transparent" />
            <StepIndicator 
              icon={ImageIcon} 
              title="الوسائط" 
              isActive={activeTab === "media"} 
              isCompleted={isMediaComplete && activeTab !== "media"}
              onClick={() => setActiveTab("media")}
            />
            <div className="w-8 h-px bg-gradient-to-l from-border to-transparent" />
            <StepIndicator 
              icon={Settings} 
              title="متقدم" 
              isActive={activeTab === "advanced"} 
              isCompleted={false}
              onClick={() => setActiveTab("advanced")}
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[calc(95vh-220px)]">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
              <TabsList className="hidden">
                <TabsTrigger value="basic">الأساسية</TabsTrigger>
                <TabsTrigger value="features">المميزات</TabsTrigger>
                <TabsTrigger value="media">الوسائط</TabsTrigger>
                <TabsTrigger value="advanced">متقدم</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-5 mt-0 text-right" dir="rtl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Service Name */}
                  <RTLInput
                    label="اسم الخدمة"
                    icon={Tag}
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: متابعين انستقرام حقيقيين"
                    error={errors.name}
                  />

                  {/* Category & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                      <Label className="flex items-center gap-2 justify-end text-sm font-medium">
                        <span className="text-destructive">*</span>
                        <span>التصنيف</span>
                        <Layers className="w-4 h-4 text-muted-foreground" />
                      </Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(v) => {
                          setFormData({ ...formData, category: v });
                          setErrors({ ...errors, category: "" });
                        }}
                        dir="rtl"
                      >
                        <SelectTrigger className={cn(
                          "bg-secondary/50 text-right flex-row-reverse",
                          errors.category && "border-destructive"
                        )}>
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="max-h-[300px]">
                          <div className="p-2 sticky top-0 bg-popover border-b z-10">
                            <div className="relative">
                              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="ابحث عن تصنيف..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="pr-8 h-9 text-sm text-right"
                                dir="rtl"
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
                                <SelectItem key={cat.id} value={cat.name} className="flex-row-reverse">
                                  <div className="flex items-center gap-2 flex-row-reverse w-full">
                                    <div 
                                      className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm",
                                        cat.color || "bg-gradient-to-br from-primary to-accent"
                                      )}
                                    >
                                      {cat.icon ? (
                                        <DynamicIcon name={cat.icon} className="w-4 h-4" />
                                      ) : (
                                        <Layers className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div className="flex-1 text-right">
                                      <p className="font-medium">{cat.name_ar}</p>
                                      <p className="text-xs text-muted-foreground">{cat.name}</p>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            }
                            {dbCategories.filter(cat => 
                              cat.name_ar.toLowerCase().includes(categorySearch.toLowerCase()) ||
                              cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                            ).length === 0 && (
                              <div className="text-center py-6 text-muted-foreground">
                                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">لا توجد نتائج</p>
                              </div>
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-xs text-destructive flex items-center gap-1 justify-end">
                          <span>{errors.category}</span>
                          <AlertCircle className="w-3 h-3" />
                        </p>
                      )}
                    </div>

                    <RTLInput
                      label="السعر (ر.س / 1000)"
                      icon={DollarSign}
                      required
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        setErrors({ ...errors, price: "" });
                      }}
                      placeholder="0.00"
                      error={errors.price}
                      hint="السعر لكل 1000 وحدة"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2 text-right">
                    <Label className="flex items-center gap-2 justify-end text-sm font-medium">
                      <span>حالة الخدمة</span>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Label>
                    <div className="flex gap-2 justify-end flex-wrap">
                      {statusOptions.map(opt => (
                        <motion.button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: opt.value })}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border",
                            formData.status === opt.value
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                              : "bg-secondary/50 border-border/50 hover:border-primary/50"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2 text-right">
                    <Label className="flex items-center gap-2 justify-end text-sm font-medium">
                      <span>وصف الخدمة</span>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف تفصيلي للخدمة يوضح مميزاتها وطريقة تنفيذها..."
                      className="bg-secondary/50 min-h-28 text-right resize-none"
                      dir="rtl"
                    />
                    <p className="text-xs text-muted-foreground text-left">
                      {formData.description.length}/500 حرف
                    </p>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-5 mt-0" dir="rtl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Add Feature */}
                  <div className="space-y-3 text-right">
                    <Label className="flex items-center gap-2 justify-end text-sm font-medium">
                      <span>إضافة ميزة</span>
                      <Plus className="w-4 h-4 text-primary" />
                    </Label>
                    <div className="flex gap-2 flex-row-reverse">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="اكتب ميزة جديدة..."
                        className="bg-secondary/50 flex-1 text-right"
                        dir="rtl"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddFeature}
                        className="shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        disabled={!newFeature.trim()}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة
                      </Button>
                    </div>
                  </div>

                  {/* Quick Features */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 justify-end text-sm font-medium text-muted-foreground">
                      <span>إضافة سريعة</span>
                      <Wand2 className="w-4 h-4" />
                    </Label>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {quickFeatures.map((feature) => (
                        <motion.button
                          key={feature}
                          type="button"
                          onClick={() => {
                            if (!formData.features.includes(feature)) {
                              setFormData(prev => ({
                                ...prev,
                                features: [...prev.features, feature],
                              }));
                              toast.success("تمت إضافة الميزة");
                            } else {
                              toast.error("هذه الميزة موجودة بالفعل");
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border",
                            formData.features.includes(feature)
                              ? "bg-success/10 text-success border-success/30 cursor-not-allowed"
                              : "bg-secondary/50 border-border/50 hover:border-primary/50 hover:bg-primary/10"
                          )}
                          whileHover={{ scale: formData.features.includes(feature) ? 1 : 1.05 }}
                          whileTap={{ scale: formData.features.includes(feature) ? 1 : 0.95 }}
                          disabled={formData.features.includes(feature)}
                        >
                          {feature}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Features List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="gap-1">
                        <Hash className="w-3 h-3" />
                        {formData.features.length} ميزة
                      </Badge>
                      <Label className="text-sm font-medium">المميزات المضافة</Label>
                    </div>
                    
                    <AnimatePresence mode="popLayout">
                      {formData.features.length > 0 ? (
                        <div className="space-y-2">
                          {formData.features.map((feature, index) => (
                            <FeatureBadge
                              key={`${feature}-${index}`}
                              feature={feature}
                              index={index}
                              onRemove={() => handleRemoveFeature(index)}
                            />
                          ))}
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border/50"
                        >
                          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">لم تتم إضافة أي مميزات بعد</p>
                          <p className="text-xs mt-1">أضف مميزات لجعل خدمتك أكثر جاذبية</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-5 mt-0" dir="rtl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <RTLInput
                    label="رابط صورة الخدمة"
                    icon={LinkIcon}
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    hint="أدخل رابط صورة بصيغة JPG أو PNG"
                  />

                  {/* Image Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewImage(!previewImage)}
                        className="gap-2"
                      >
                        {previewImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {previewImage ? "إخفاء المعاينة" : "إظهار المعاينة"}
                      </Button>
                      <Label className="text-sm font-medium">معاينة الصورة</Label>
                    </div>
                    
                    <AnimatePresence>
                      {(previewImage || formData.image_url) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {formData.image_url ? (
                            <div className="aspect-video rounded-2xl overflow-hidden bg-secondary/50 border border-border/50 relative group">
                              <img
                                src={formData.image_url}
                                alt="معاينة الخدمة"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  صورة صالحة
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video rounded-2xl bg-secondary/30 border border-dashed border-border/50 flex items-center justify-center">
                              <div className="text-center text-muted-foreground">
                                <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-medium">أضف رابط صورة للمعاينة</p>
                                <p className="text-xs mt-1">الأبعاد الموصى بها: 1200×675 بكسل</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-5 mt-0" dir="rtl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Quantity Limits */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-4">
                    <div className="flex items-center gap-2 justify-end">
                      <h4 className="font-medium">حدود الكمية</h4>
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 text-right">
                        <Label className="text-sm text-muted-foreground">الحد الأدنى</Label>
                        <Input
                          type="number"
                          value={advancedSettings.minQuantity}
                          onChange={(e) => setAdvancedSettings({ 
                            ...advancedSettings, 
                            minQuantity: parseInt(e.target.value) || 10 
                          })}
                          className="bg-background text-center"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2 text-right">
                        <Label className="text-sm text-muted-foreground">الحد الأقصى</Label>
                        <Input
                          type="number"
                          value={advancedSettings.maxQuantity}
                          onChange={(e) => setAdvancedSettings({ 
                            ...advancedSettings, 
                            maxQuantity: parseInt(e.target.value) || 100000 
                          })}
                          className="bg-background text-center"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Speed */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-4">
                    <div className="flex items-center gap-2 justify-end">
                      <h4 className="font-medium">سرعة التوصيل</h4>
                      <Zap className="w-5 h-5 text-yellow-500" />
                    </div>
                    
                    <div className="flex gap-2 justify-end flex-wrap">
                      {[
                        { value: "slow", label: "بطيء", icon: Clock },
                        { value: "normal", label: "عادي", icon: RefreshCw },
                        { value: "fast", label: "سريع", icon: Zap },
                        { value: "instant", label: "فوري", icon: Sparkles },
                      ].map((speed) => (
                        <motion.button
                          key={speed.value}
                          type="button"
                          onClick={() => setAdvancedSettings({ 
                            ...advancedSettings, 
                            deliverySpeed: speed.value as typeof advancedSettings.deliverySpeed 
                          })}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border",
                            advancedSettings.deliverySpeed === speed.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border/50 hover:border-primary/50"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <speed.icon className="w-4 h-4" />
                          {speed.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Refill Settings */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <Switch
                        checked={advancedSettings.hasRefill}
                        onCheckedChange={(checked) => setAdvancedSettings({ 
                          ...advancedSettings, 
                          hasRefill: checked 
                        })}
                      />
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">ضمان التعويض</h4>
                        <Shield className="w-5 h-5 text-success" />
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {advancedSettings.hasRefill && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <Label className="text-sm text-muted-foreground text-right block">
                            مدة الضمان (بالأيام)
                          </Label>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold w-12 text-center">
                              {advancedSettings.refillDays}
                            </span>
                            <Slider
                              value={[advancedSettings.refillDays]}
                              onValueChange={([value]) => setAdvancedSettings({ 
                                ...advancedSettings, 
                                refillDays: value 
                              })}
                              min={7}
                              max={365}
                              step={1}
                              className="flex-1"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Priority */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-4">
                    <div className="flex items-center gap-2 justify-end">
                      <h4 className="font-medium">ترتيب العرض</h4>
                      <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold w-12 text-center">
                          {advancedSettings.priority}
                        </span>
                        <Slider
                          value={[advancedSettings.priority]}
                          onValueChange={([value]) => setAdvancedSettings({ 
                            ...advancedSettings, 
                            priority: value 
                          })}
                          min={0}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        الخدمات ذات الأولوية الأعلى تظهر أولاً
                      </p>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 bg-gradient-to-l from-muted/30 to-transparent">
          <div className="flex gap-3 flex-row-reverse">
            <Button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-base font-medium rounded-xl shadow-lg shadow-primary/30"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : editingService ? (
                <>
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                  حفظ التغييرات
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة الخدمة
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="h-12 px-6 rounded-xl"
              disabled={submitting}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFormDialog;
