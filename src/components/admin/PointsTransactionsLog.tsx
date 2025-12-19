import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  History,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Gift,
  RefreshCw,
  User,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  type: string;
  description: string | null;
  description_ar: string | null;
  created_at: string;
  order_id: string | null;
  user_email?: string;
  user_name?: string;
}

const ITEMS_PER_PAGE = 10;

const PointsTransactionsLog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ["points-transactions-admin", typeFilter, dateFrom, dateTo, searchQuery, currentPage],
    queryFn: async () => {
      let query = supabase
        .from("points_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      // Type filter
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      // Date filters
      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user details for all transactions
      const userIds = [...new Set(data?.map(t => t.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const transactionsWithUsers = data?.map(t => ({
        ...t,
        user_email: profilesMap.get(t.user_id)?.email || "غير معروف",
        user_name: profilesMap.get(t.user_id)?.full_name || null,
      })) || [];

      // Client-side search filter
      if (searchQuery) {
        return transactionsWithUsers.filter(t =>
          t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description_ar?.includes(searchQuery)
        );
      }

      return transactionsWithUsers;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["points-transactions-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("points_transactions")
        .select("points, type");

      const totalGranted = data?.filter(t => t.type === "bonus" || t.type === "manual")
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;
      
      const totalDeducted = data?.filter(t => t.type === "deducted")
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      const totalEarned = data?.filter(t => t.type === "earned")
        .reduce((sum, t) => sum + t.points, 0) || 0;

      const totalRedeemed = data?.filter(t => t.type === "redeemed")
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      return { totalGranted, totalDeducted, totalEarned, totalRedeemed };
    },
  });

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "earned":
        return {
          label: "مكتسبة",
          color: "bg-success/10 text-success border-success/20",
          icon: TrendingUp,
        };
      case "bonus":
      case "manual":
        return {
          label: "منحة",
          color: "bg-primary/10 text-primary border-primary/20",
          icon: Gift,
        };
      case "deducted":
        return {
          label: "خصم",
          color: "bg-destructive/10 text-destructive border-destructive/20",
          icon: TrendingDown,
        };
      case "redeemed":
        return {
          label: "استبدال",
          color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          icon: RefreshCw,
        };
      default:
        return {
          label: type,
          color: "bg-muted text-muted-foreground",
          icon: History,
        };
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || typeFilter !== "all" || dateFrom || dateTo;

  // Pagination
  const totalItems = transactions?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedTransactions = transactions?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            سجل عمليات النقاط
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">نقاط مكتسبة</p>
            <p className="text-lg font-bold text-success">
              +{stats?.totalEarned.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">نقاط ممنوحة</p>
            <p className="text-lg font-bold text-primary">
              +{stats?.totalGranted.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-muted-foreground">نقاط مستبدلة</p>
            <p className="text-lg font-bold text-amber-600">
              -{stats?.totalRedeemed.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground">نقاط مخصومة</p>
            <p className="text-lg font-bold text-destructive">
              -{stats?.totalDeducted.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث بالبريد أو الاسم أو الوصف..."
              className="pr-10"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="earned">مكتسبة</SelectItem>
              <SelectItem value="bonus">منحة</SelectItem>
              <SelectItem value="manual">منحة يدوية</SelectItem>
              <SelectItem value="deducted">خصم</SelectItem>
              <SelectItem value="redeemed">استبدال</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {dateFrom ? format(dateFrom, "dd/MM", { locale: ar }) : "من"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={(date) => {
                  setDateFrom(date);
                  setCurrentPage(1);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {dateTo ? format(dateTo, "dd/MM", { locale: ar }) : "إلى"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={(date) => {
                  setDateTo(date);
                  setCurrentPage(1);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !paginatedTransactions?.length ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد عمليات</p>
            {hasActiveFilters && (
              <Button
                variant="link"
                onClick={clearFilters}
                className="mt-2"
              >
                إزالة الفلاتر
              </Button>
            )}
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {paginatedTransactions.map((transaction, index) => {
                  const config = getTypeConfig(transaction.type);
                  const IconComponent = config.icon;
                  const isPositive = transaction.points > 0;

                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${config.color}`}>
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(transaction.created_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium truncate">
                              {transaction.user_name || transaction.user_email}
                            </span>
                          </div>

                          {(transaction.description_ar || transaction.description) && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {transaction.description_ar || transaction.description}
                            </p>
                          )}
                        </div>

                        <div className={`text-lg font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                          {isPositive ? "+" : ""}{transaction.points.toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} من {totalItems}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsTransactionsLog;