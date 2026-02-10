import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Shield, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

const generateApiKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "mk_";
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

const hashKey = async (key: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const ClientAPI = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["api-keys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, prefix, is_active, created_at, last_used_at, expires_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const rawKey = generateApiKey();
      const keyHash = await hashKey(rawKey);
      const prefix = rawKey.substring(0, 7);

      const { error } = await supabase.from("api_keys").insert({
        user_id: user!.id,
        name,
        key_hash: keyHash,
        prefix,
      });
      if (error) throw error;
      return rawKey;
    },
    onSuccess: (rawKey) => {
      setGeneratedKey(rawKey);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("تم إنشاء مفتاح API بنجاح");
    },
    onError: () => toast.error("فشل إنشاء مفتاح API"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("تم حذف المفتاح");
    },
    onError: () => toast.error("فشل حذف المفتاح"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("api_keys").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("تم تحديث حالة المفتاح");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const activeKeys = apiKeys.filter((k) => k.is_active).length;

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              مفاتيح API
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              إدارة مفاتيح الوصول للاتصال بالمنصة برمجياً
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) setGeneratedKey(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إنشاء مفتاح جديد
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              {generatedKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      تم إنشاء المفتاح
                    </DialogTitle>
                    <DialogDescription>
                      انسخ المفتاح الآن. لن تتمكن من رؤيته مرة أخرى.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border font-mono text-sm break-all select-all">
                      {generatedKey}
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                      <span className="text-xs text-destructive">
                        احفظ هذا المفتاح في مكان آمن. لا يمكن استرجاعه بعد إغلاق هذه النافذة.
                      </span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => copyToClipboard(generatedKey)} className="gap-2">
                      <Copy className="w-4 h-4" />
                      نسخ المفتاح
                    </Button>
                    <Button onClick={() => { setShowCreateDialog(false); setGeneratedKey(null); }}>
                      تم
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>إنشاء مفتاح API جديد</DialogTitle>
                    <DialogDescription>
                      أدخل اسماً وصفياً للمفتاح لتتعرف عليه لاحقاً
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم المفتاح</Label>
                      <Input
                        placeholder="مثال: تطبيق الجوال، موقع الويب..."
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createMutation.mutate(newKeyName || "مفتاح API")}
                      disabled={createMutation.isPending}
                      className="gap-2"
                    >
                      {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المفتاح"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{apiKeys.length}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المفاتيح</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeKeys}</p>
                  <p className="text-xs text-muted-foreground">مفاتيح نشطة</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{apiKeys.length - activeKeys}</p>
                  <p className="text-xs text-muted-foreground">مفاتيح معطلة</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Keys List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">المفاتيح</CardTitle>
            <CardDescription>جميع مفاتيح API المرتبطة بحسابك</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />
                ))}
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد مفاتيح API بعد</p>
                <p className="text-xs text-muted-foreground mt-1">أنشئ مفتاحاً جديداً للبدء</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {apiKeys.map((key, index) => (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${key.is_active ? "bg-green-500/10" : "bg-muted"}`}>
                          <Key className={`w-4 h-4 ${key.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{key.name}</p>
                            <Badge variant={key.is_active ? "default" : "secondary"} className="text-[10px]">
                              {key.is_active ? "نشط" : "معطل"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {key.prefix}••••••••••••
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span>أُنشئ: {format(new Date(key.created_at), "d MMM yyyy", { locale: ar })}</span>
                            {key.last_used_at && (
                              <span>آخر استخدام: {format(new Date(key.last_used_at), "d MMM yyyy", { locale: ar })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMutation.mutate({ id: key.id, is_active: !key.is_active })}
                          className="text-xs gap-1"
                        >
                          {key.is_active ? (
                            <><EyeOff className="w-3.5 h-3.5" /> تعطيل</>
                          ) : (
                            <><Eye className="w-3.5 h-3.5" /> تفعيل</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(key.id)}
                          className="text-xs text-destructive hover:text-destructive gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Guide */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">كيفية الاستخدام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm overflow-x-auto" dir="ltr">
              <pre className="text-muted-foreground">
{`curl -X GET "https://api.example.com/v1/services" \\
  -H "Authorization: Bearer mk_xxxxxxx..." \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              أضف المفتاح في ترويسة Authorization كـ Bearer token في كل طلب.
            </p>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientAPI;
