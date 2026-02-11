import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit, Save, Loader2, Search, FileText, Eye, Variable } from "lucide-react";

const categoryLabels: Record<string, string> = {
  financial: "مالية",
  orders: "طلبات",
  auth: "مصادقة",
  rewards: "مكافآت",
  general: "عامة",
};

const categoryColors: Record<string, string> = {
  financial: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  orders: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  auth: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  rewards: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const SMSTemplatesTab = () => {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (template: any) => {
      const { error } = await supabase
        .from("sms_templates")
        .update({
          name_ar: template.name_ar,
          message_template: template.message_template,
          is_active: template.is_active,
          description: template.description,
        })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("تم حفظ القالب بنجاح");
      setEditingTemplate(null);
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  const filtered = templates?.filter((t) => {
    const matchesSearch = !search || t.name_ar.includes(search) || t.template_key.includes(search);
    const matchesCategory = !filterCategory || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(templates?.map((t) => t.category) || [])];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في القوالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(null)}
          >
            الكل
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filterCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(cat)}
            >
              {categoryLabels[cat] || cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered?.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm">{template.name_ar}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={categoryColors[template.category] || ""} variant="secondary">
                    {categoryLabels[template.category] || template.category}
                  </Badge>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "مفعّل" : "معطّل"}
                  </Badge>
                </div>
              </div>
              {template.description && (
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" dir="rtl">
                  {template.message_template}
                </pre>
              </div>
              {template.variables && template.variables.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Variable className="w-3 h-3 text-muted-foreground" />
                  {template.variables.map((v: string) => (
                    <Badge key={v} variant="outline" className="text-[10px] font-mono">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => setPreviewTemplate(template)}>
                  <Eye className="w-3 h-3" />
                  معاينة
                </Button>
                <Button size="sm" className="gap-1 flex-1" onClick={() => setEditingTemplate({ ...template })}>
                  <Edit className="w-3 h-3" />
                  تعديل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل القالب</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label>اسم القالب</Label>
                <Input
                  value={editingTemplate.name_ar}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name_ar: e.target.value })}
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Input
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                />
              </div>
              <div>
                <Label>نص الرسالة</Label>
                <Textarea
                  value={editingTemplate.message_template}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, message_template: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                  dir="rtl"
                />
                {editingTemplate.variables?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    المتغيرات المتاحة: {editingTemplate.variables.map((v: string) => `{{${v}}}`).join("، ")}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingTemplate.is_active}
                    onCheckedChange={(c) => setEditingTemplate({ ...editingTemplate, is_active: c })}
                  />
                  <Label>مفعّل</Label>
                </div>
                <Button
                  onClick={() => updateMutation.mutate(editingTemplate)}
                  disabled={updateMutation.isPending}
                  className="gap-2"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>معاينة الرسالة</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="bg-muted rounded-xl p-4 border">
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" dir="rtl">
                  {previewTemplate.message_template}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                المرسل: ASHHOLDING
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SMSTemplatesTab;
