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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden" dir="rtl">
        <CardContent className="p-4 space-y-4">
          {/* Main Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <motion.div 
              className="relative flex-1 group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="البحث برقم الطلب أو اسم الخدمة..." 
                className="h-12 pr-12 pl-10 bg-muted/30 border-border/50 rounded-xl transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 text-right"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Status Filter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-52 h-12 rounded-xl bg-muted/30 border-border/50 flex-row-reverse">
                  <SelectValue placeholder="فلترة الحالة" />
                  <Filter className="w-4 h-4 mr-2" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        {option.label}
                        <div className={cn("w-2 h-2 rounded-full", option.color)} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Date Range Filter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "h-12 px-4 rounded-xl border-border/50 bg-muted/30 flex-row-reverse gap-2",
                      (dateRange.from || dateRange.to) && "border-primary/50 bg-primary/5"
                    )}
                  >
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
                    <Calendar className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
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
            </motion.div>

            {/* Advanced Filters Toggle */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Button
                variant="outline"
                className={cn(
                  "h-12 px-4 rounded-xl border-border/50 flex-row-reverse gap-2 transition-all duration-300",
                  showAdvanced && "bg-primary/10 border-primary/50"
                )}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <motion.div
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
                متقدم
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-row-reverse">
              <motion.div 
                whileHover={{ scale: 1.08, rotate: 5 }} 
                whileTap={{ scale: 0.92 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={onRefresh} 
                  disabled={isRefreshing}
                  className="h-12 w-12 rounded-xl border-border/50 hover:bg-primary/10 hover:border-primary/50"
                >
                  <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                </Button>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.08, rotate: -5 }} 
                whileTap={{ scale: 0.92 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
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
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div 
                className="flex items-center justify-start gap-2 flex-wrap"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Badge variant="secondary" className="gap-1 text-sm px-3 py-1">
                    {filteredCount} من {totalCount} طلب
                  </Badge>
                </motion.div>
                
                {statusFilter !== "all" && (
                  <motion.div
                    initial={{ scale: 0, x: 20 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: 20 }}
                  >
                    <Badge variant="outline" className="gap-1.5 flex-row-reverse px-3 py-1">
                      <button onClick={() => setStatusFilter("all")} className="hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                      {statusOptions.find(s => s.value === statusFilter)?.label}
                    </Badge>
                  </motion.div>
                )}
                
                {(dateRange.from || dateRange.to) && (
                  <motion.div
                    initial={{ scale: 0, x: 20 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: 20 }}
                  >
                    <Badge variant="outline" className="gap-1.5 flex-row-reverse px-3 py-1">
                      <button onClick={() => setDateRange({ from: undefined, to: undefined })} className="hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                      {dateRange.from && format(dateRange.from, "d/M", { locale: ar })}
                      {dateRange.to && ` - ${format(dateRange.to, "d/M", { locale: ar })}`}
                      <Calendar className="w-3 h-3" />
                    </Badge>
                  </motion.div>
                )}
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-3 rounded-lg"
                  >
                    مسح الكل
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Quick date filters */}
                  {[
                    { label: "اليوم", days: 0 },
                    { label: "آخر 7 أيام", days: 7 },
                    { label: "آخر 30 يوم", days: 30 },
                    { label: "آخر 3 أشهر", days: 90 },
                  ].map((filter, index) => (
                    <motion.div
                      key={filter.days}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg w-full hover:bg-primary/10 hover:border-primary/50 transition-all"
                        onClick={() => {
                          const now = new Date();
                          const from = new Date();
                          from.setDate(now.getDate() - filter.days);
                          setDateRange({ from: filter.days === 0 ? now : from, to: now });
                        }}
                      >
                        {filter.label}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrdersAdvancedFilters;
