import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Shield, Clock, Trash2, Eye, EyeOff, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ApiKeyWithUser {
  id: string;
  user_id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

const AdminAPIKeys = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, user_id, name, prefix, is_active, created_at, last_used_at, expires_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ApiKeyWithUser[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      if (error) throw error;
      return data || [];
    },
  });

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("api_keys").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast.success("تم تحديث حالة المفتاح");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast.success("تم حذف المفتاح");
    },
  });

  const filtered = apiKeys.filter((key) => {
    if (!searchQuery) return true;
    const profile = profileMap.get(key.user_id);
    const userName = profile?.full_name || "";
    const userEmail = profile?.email || "";
    return (
      key.name.includes(searchQuery) ||
      key.prefix.includes(searchQuery) ||
      userName.includes(searchQuery) ||
      userEmail.includes(searchQuery)
    );
  });

  const activeKeys = apiKeys.filter((k) => k.is_active).length;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6" dir="rtl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" />
            إدارة مفاتيح API
          </h1>
          <p className="text-muted-foreground text-sm mt-1">عرض وإدارة جميع مفاتيح API للمستخدمين</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Key, label: "إجمالي المفاتيح", value: apiKeys.length, color: "text-primary", bg: "bg-primary/10" },
            { icon: Shield, label: "مفاتيح نشطة", value: activeKeys, color: "text-green-500", bg: "bg-green-500/10" },
            { icon: Clock, label: "مفاتيح معطلة", value: apiKeys.length - activeKeys, color: "text-orange-500", bg: "bg-orange-500/10" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو المستخدم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Keys List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">جميع المفاتيح ({filtered.length})</CardTitle>
            <CardDescription>مفاتيح API لجميع المستخدمين</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد مفاتيح API</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filtered.map((key, index) => {
                    const profile = profileMap.get(key.user_id);
                    return (
                      <motion.div
                        key={key.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ delay: index * 0.03 }}
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
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {profile?.full_name || profile?.email || key.user_id.slice(0, 8)}
                              </span>
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
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAPIKeys;
