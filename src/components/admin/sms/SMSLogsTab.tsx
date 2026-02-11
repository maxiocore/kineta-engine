import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, RefreshCw, CheckCircle, XCircle, Clock, Phone } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const SMSLogsTab = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["sms-logs", search, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("sms_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) {
        query = query.or(`phone.ilike.%${search}%,message.ilike.%${search}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data || [], total: count || 0 };
    },
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "sent": return "تم الإرسال";
      case "failed": return "فشل";
      case "pending": return "معلّق";
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الهاتف أو المحتوى..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="sent">تم الإرسال</SelectItem>
            <SelectItem value="failed">فشل</SelectItem>
            <SelectItem value="pending">معلّق</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Logs */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : data?.logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            لا توجد رسائل مطابقة
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data?.logs.map((log) => (
            <Card key={log.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{statusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3" />
                        {log.phone}
                      </span>
                      <Badge variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"}>
                        {statusLabel(log.status)}
                      </Badge>
                      {log.type && (
                        <Badge variant="outline" className="text-xs">
                          {log.type}
                        </Badge>
                      )}
                      {log.provider && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.provider}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{log.message}</p>
                    {log.error_message && (
                      <p className="text-xs text-destructive">{log.error_message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd MMM yyyy - HH:mm:ss", { locale: ar })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {data && data.total > pageSize && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                عرض {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data.total)} من {data.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * pageSize >= data.total}
                  onClick={() => setPage(page + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SMSLogsTab;
