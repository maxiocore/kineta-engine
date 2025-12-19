import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, RefreshCw, Calendar, Download, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface OrdersAdvancedFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (value: { from: Date | undefined; to: Date | undefined }) => void;
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing: boolean;
  filteredCount: number;
  totalCount: number;
}

export const OrdersAdvancedFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  onRefresh,
  onExport,
  isRefreshing,
  filteredCount,
  totalCount,
}: OrdersAdvancedFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const hasActiveFilters = statusFilter !== "all" || dateRange.from || dateRange.to || searchQuery;

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const statusOptions = [
    { value: "all", label: "كل الطلبات", color: "bg-muted" },
    { value: "pending", label: "قيد الانتظار", color: "bg-warning" },
    { value: "processing", label: "قيد المعالجة", color: "bg-primary" },
    { value: "in_progress", label: "قيد التنفيذ", color: "bg-accent" },
    { value: "completed", label: "مكتمل", color: "bg-success" },
    { value: "partial", label: "مكتمل جزئي", color: "bg-orange-500" },
    { value: "cancelled", label: "ملغي", color: "bg-destructive" },
  ];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Main Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="البحث برقم الطلب أو اسم الخدمة..." 
              className="h-12 pr-12 bg-muted/30 border-border/50 rounded-xl transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52 h-12 rounded-xl bg-muted/30 border-border/50">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="فلترة الحالة" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", option.color)} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "h-12 px-4 rounded-xl border-border/50 bg-muted/30",
                  (dateRange.from || dateRange.to) && "border-primary/50"
                )}
              >
                <Calendar className="w-4 h-4 ml-2" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <span className="text-sm">
                      {format(dateRange.from, "d MMM", { locale: ar })} - {format(dateRange.to, "d MMM", { locale: ar })}
                    </span>
                  ) : (
                    format(dateRange.from, "d MMM yyyy", { locale: ar })
                  )
                ) : (
                  "نطاق التاريخ"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  if (range?.to) setCalendarOpen(false);
                }}
                numberOfMonths={1}
                locale={ar}
              />
              {(dateRange.from || dateRange.to) && (
                <div className="p-3 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                      setCalendarOpen(false);
                    }}
                  >
                    مسح التاريخ
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            className={cn(
              "h-12 px-4 rounded-xl border-border/50",
              showAdvanced && "bg-primary/10 border-primary/50"
            )}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal className="w-4 h-4 ml-2" />
            متقدم
            <ChevronDown className={cn(
              "w-4 h-4 mr-2 transition-transform",
              showAdvanced && "rotate-180"
            )} />
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onRefresh} 
                disabled={isRefreshing}
                className="h-12 w-12 rounded-xl border-border/50"
              >
                <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onExport}
                className="h-12 w-12 rounded-xl border-border/50 hover:bg-success/10 hover:border-success/50 hover:text-success"
              >
                <Download className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Active Filters & Results Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveFilters && (
              <>
                <Badge variant="secondary" className="gap-1">
                  {filteredCount} من {totalCount} طلب
                </Badge>
                
                {statusFilter !== "all" && (
                  <Badge variant="outline" className="gap-1">
                    {statusOptions.find(s => s.value === statusFilter)?.label}
                    <button onClick={() => setStatusFilter("all")}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                
                {(dateRange.from || dateRange.to) && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    {dateRange.from && format(dateRange.from, "d/M", { locale: ar })}
                    {dateRange.to && ` - ${format(dateRange.to, "d/M", { locale: ar })}`}
                    <button onClick={() => setDateRange({ from: undefined, to: undefined })}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-destructive hover:text-destructive h-6 px-2"
                >
                  مسح الكل
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Quick date filters */}
                {[
                  { label: "اليوم", days: 0 },
                  { label: "آخر 7 أيام", days: 7 },
                  { label: "آخر 30 يوم", days: 30 },
                  { label: "آخر 3 أشهر", days: 90 },
                ].map(filter => (
                  <Button
                    key={filter.days}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      const now = new Date();
                      const from = new Date();
                      from.setDate(now.getDate() - filter.days);
                      setDateRange({ from: filter.days === 0 ? now : from, to: now });
                    }}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default OrdersAdvancedFilters;
